const PO = require('../models/po.model');
const GRN = require('../models/grn.model');
const Invoice = require('../models/invoice.model');
const Match = require('../models/match.model');

// Update match status for a PO whenever a document is uploaded
async function updateMatchStatus(poNumber) {
  try {
    console.log(`Updating match status for PO: ${poNumber}`);

    // Fetch all documents for this PO
    const po = await PO.findOne({ poNumber });
    const grns = await GRN.find({ poNumber });
    const invoices = await Invoice.find({ poNumber });

    // Check if PO exists
    if (!po) {
      console.log(`PO not found yet for ${poNumber}`);
      
      let match = await Match.findOne({ poNumber });
      if (!match) {
        match = new Match({
          poNumber,
          matchStatus: 'insufficient_documents',
          documents: {
            po: { exists: false },
            grn: [],
            invoice: [],
          },
        });
        await match.save();
      }
      return {
        poNumber,
        matchStatus: 'insufficient_documents',
        reason: 'PO not uploaded yet',
      };
    }

    // Now we have PO, try to match
    console.log(`PO found`);
    console.log(`GRNs found: ${grns.length}`);
    console.log(`Invoices found: ${invoices.length}`);

    // Run validation logic
    const validationResult = validateDocuments(po, grns, invoices);

    // Create or update Match record
    let match = await Match.findOne({ poNumber });
    if (!match) {
      match = new Match({ poNumber });
    }

    // Update documents struct
    match.documents = {
      po: {
        _id: po._id,
        exists: true,
        uploadedAt: po.uploadedAt,
      },
      grn: grns.map((grn) => ({
        _id: grn._id,
        grnNumber: grn.grnNumber,
        exists: true,
        uploadedAt: grn.uploadedAt,
      })),
      invoice: invoices.map((inv) => ({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        exists: true,
        uploadedAt: inv.uploadedAt,
      })),
    };

    // Set match status and details
    match.matchStatus = validationResult.matchStatus;
    match.itemMatches = validationResult.itemMatches;
    match.dateValidation = validationResult.dateValidation;
    match.validations = validationResult.validations;
    match.allMismatchReasons = validationResult.allMismatchReasons;
    match.summary = validationResult.summary;
    match.lastUpdatedAt = new Date();

    // Add to update history
    match.updateHistory.push({
      action: `${po ? 'PO' : grns.length > 0 ? 'GRN' : 'Invoice'} uploaded`,
      timestamp: new Date(),
      matchStatus: match.matchStatus,
    });

    await match.save();

    console.log(`Match Status: ${match.matchStatus}`);
    console.log(`Reasons: ${validationResult.allMismatchReasons.join(', ') || 'None'}`);

    return {
      poNumber,
      matchStatus: match.matchStatus,
      reason: validationResult.allMismatchReasons.length > 0 ? validationResult.allMismatchReasons.join('; ') : 'All documents match',
      summary: validationResult.summary,
    };
  } catch (error) {
    console.error('Error updating match status:', error.message);
    throw error;
  }
}



function validateDocuments(po, grns, invoices) {
  const validationResult = {
    matchStatus: 'matched', // Default to matched, downgrade if issues found
    itemMatches: [],
    dateValidation: {},
    validations: {
      poExists: true,
      allGrnsPresent: grns.length > 0,
      allInvoicesPresent: invoices.length > 0,
      noDuplicatePo: true, // Already checked in savePO
      allItemsInPo: true,
      quantityMatches: {
        grnNotExceedingPo: true,
        invoiceNotExceedingPo: true,
        invoiceNotExceedingGrn: true,
      },
      dateMatches: {
        invoiceDateNotAfterPo: true,
      },
    },
    allMismatchReasons: [],
    summary: {
      totalItemsInPo: po.items.length,
      matchedItems: 0,
      unmatchedItems: 0,
      matchPercentage: 0,
    },
  };

  
  const poItemMap = new Map();
  po.items.forEach((item) => {
    poItemMap.set(item.skuCode, {
      ...item,
      totalGrnQty: 0,
      totalInvoiceQty: 0,
    });
  });

  // Sum GRN quantities by SKU
  grns.forEach((grn) => {
    grn.items.forEach((grnItem) => {
      const poItem = poItemMap.get(grnItem.skuCode);
      if (poItem) {
        poItem.totalGrnQty += grnItem.receivedQuantity;
      } else {
        // Item in GRN not in PO
        if (!validationResult.allMismatchReasons.includes('item_missing_in_po')) {
          validationResult.allMismatchReasons.push('item_missing_in_po');
        }
      }
    });
  });

  // Sum Invoice quantities by SKU
  invoices.forEach((invoice) => {
    invoice.items.forEach((invItem) => {
      const poItem = poItemMap.get(invItem.skuCode);
      if (poItem) {
        poItem.totalInvoiceQty += invItem.quantity;
      } else {
        // Item in Invoice not in PO
        if (!validationResult.allMismatchReasons.includes('item_missing_in_po')) {
          validationResult.allMismatchReasons.push('item_missing_in_po');
        }
      }
    });
  });

  // Check each item
  let matchedItems = 0;
  poItemMap.forEach((poItem, skuCode) => {
    const itemMatch = {
      skuCode,
      description: poItem.description,
      poQuantity: poItem.quantity,
      totalGrnQuantity: poItem.totalGrnQty,
      totalInvoiceQuantity: poItem.totalInvoiceQty,
      isMatched: true,
      mismatchReasons: [],
    };

    // Rule 1: GRN quantity not exceed PO (but less is OK - partial receipt)
    if (poItem.totalGrnQty > poItem.quantity) {
      itemMatch.isMatched = false;
      itemMatch.mismatchReasons.push('grn_qty_exceeds_po_qty');
      if (!validationResult.allMismatchReasons.includes('grn_qty_exceeds_po_qty')) {
        validationResult.allMismatchReasons.push('grn_qty_exceeds_po_qty');
      }
      validationResult.validations.quantityMatches.grnNotExceedingPo = false;
    }

    // Note: GRN less than PO is OK (partial receipt)
    if (poItem.totalGrnQty < poItem.quantity && poItem.totalGrnQty > 0) {
      itemMatch.mismatchReasons.push('grn_qty_less_than_po_qty');
      // Don't mark as mismatched, it's a partial receipt which is acceptable
    }

    // Rule 2: Invoice quantity not exceed PO
    if (poItem.totalInvoiceQty > poItem.quantity) {
      itemMatch.isMatched = false;
      itemMatch.mismatchReasons.push('invoice_qty_exceeds_po_qty');
      if (!validationResult.allMismatchReasons.includes('invoice_qty_exceeds_po_qty')) {
        validationResult.allMismatchReasons.push('invoice_qty_exceeds_po_qty');
      }
      validationResult.validations.quantityMatches.invoiceNotExceedingPo = false;
    }

    // Rule 3: Invoice quantity not exceed total GRN quantity
    if (grns.length > 0 && poItem.totalInvoiceQty > poItem.totalGrnQty && poItem.totalGrnQty > 0) {
      itemMatch.isMatched = false;
      itemMatch.mismatchReasons.push('invoice_qty_exceeds_grn_qty');
      if (!validationResult.allMismatchReasons.includes('invoice_qty_exceeds_grn_qty')) {
        validationResult.allMismatchReasons.push('invoice_qty_exceeds_grn_qty');
      }
      validationResult.validations.quantityMatches.invoiceNotExceedingGrn = false;
    }

    if (itemMatch.isMatched) {
      matchedItems++;
    }

    validationResult.itemMatches.push(itemMatch);
  });

  if (invoices.length > 0) {
    invoices.forEach((invoice) => {
      if (invoice.invoiceDate > po.poDate) {
        if (!validationResult.allMismatchReasons.includes('invoice_date_after_po_date')) {
          validationResult.allMismatchReasons.push('invoice_date_after_po_date');
        }
        validationResult.validations.dateMatches.invoiceDateNotAfterPo = false;
      }
    });

    validationResult.dateValidation = {
      invoiceDate: invoices[0].invoiceDate,
      poDate: po.poDate,
      isInvoiceDateAfterPo: invoices.some((inv) => inv.invoiceDate > po.poDate),
      mismatch: invoices.some((inv) => inv.invoiceDate > po.poDate),
    };
  }

  // ============================================
  // 3. Completeness Check
  // ============================================
  const allDocumentsPresent = grns.length > 0 && invoices.length > 0;
  if (!allDocumentsPresent) {
    validationResult.matchStatus = 'insufficient_documents';
  }

  // ============================================
  // 4. Final Match Status
  // ============================================
  validationResult.summary.matchedItems = matchedItems;
  validationResult.summary.unmatchedItems = po.items.length - matchedItems;
  validationResult.summary.matchPercentage =
    po.items.length > 0 ? ((matchedItems / po.items.length) * 100).toFixed(2) : 0;

  if (validationResult.matchStatus !== 'insufficient_documents') {
    if (validationResult.allMismatchReasons.length === 0) {
      validationResult.matchStatus = 'matched';
      validationResult.summary.recommendation = 'All documents match perfectly. Payment can be processed.';
    } else if (validationResult.allMismatchReasons.includes('grn_qty_less_than_po_qty')) {
      // Partial receipt is OK
      validationResult.matchStatus = 'partially_matched';
      validationResult.summary.recommendation =
        'Partial receipt detected. GRN quantity is less than PO. Verify with warehouse before payment.';
    } else {
      validationResult.matchStatus = 'mismatch';
      validationResult.summary.recommendation = 'Critical mismatch detected. Review mismatches before processing payment.';
    }
  } else {
    validationResult.summary.recommendation = 'Waiting for GRN and/or Invoice documents.';
  }

  return validationResult;
}




async function getMatchResult(poNumber) {
  try {
    const match = await Match.findOne({ poNumber });
    if (!match) {
      throw new Error(`No match record found for PO: ${poNumber}`);
    }
    return match;
  } catch (error) {
    console.error('Error retrieving match result:', error.message);
    throw error;
  }
}

module.exports = {
  updateMatchStatus,
  validateDocuments,
  getMatchResult,
};
