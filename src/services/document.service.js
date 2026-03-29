const PO = require('../models/po.model');
const GRN = require('../models/grn.model');
const Invoice = require('../models/invoice.model');
const Match = require('../models/match.model');
const matchService = require('./match.service');

async function savePO(parsedData) {
  try {
    // Check if PO already exists (prevent duplicates)
    const existingPO = await PO.findOne({ poNumber: parsedData.poNumber });
    if (existingPO) {
      throw new Error(`PO with number ${parsedData.poNumber} already exists`);
    }

    const po = new PO({
      poNumber: parsedData.poNumber,
      poDate: parsedData.poDate,
      vendorName: parsedData.vendorName,
      vendorAddress: parsedData.vendorAddress,
      vendorGSTIN: parsedData.vendorGSTIN,
      buyerName: parsedData.buyerName,
      buyerGSTIN: parsedData.buyerGSTIN,
      items: parsedData.items,
      totals: parsedData.totals,
      isProcessed: true,
      rawGeminiOutput: parsedData,
    });

    const savedPO = await po.save();
    console.log(`PO ${parsedData.poNumber} saved successfully`);
    return savedPO;
  } catch (error) {
    console.error('Error saving PO:', error.message);
    throw error;
  }
}

async function saveGRN(parsedData) {
  try {
    // Check if GRN already exists
    const existingGRN = await GRN.findOne({ grnNumber: parsedData.grnNumber });
    if (existingGRN) {
      throw new Error(`GRN with number ${parsedData.grnNumber} already exists`);
    }

    const grn = new GRN({
      grnNumber: parsedData.grnNumber,
      grnDate: parsedData.grnDate,
      poNumber: parsedData.poNumber,
      poDate: parsedData.poDate,
      invoiceNumber: parsedData.invoiceNumber || null,
      invoiceDate: parsedData.invoiceDate || null,
      inboundNumber: parsedData.inboundNumber,
      challanNumber: parsedData.challanNumber,
      vendorName: parsedData.vendorName,
      vendorAddress: parsedData.vendorAddress,
      receivedAt: parsedData.receivedAt,
      warehouseLocation: parsedData.warehouseLocation,
      items: parsedData.items,
      totals: parsedData.totals,
      isProcessed: true,
      rawGeminiOutput: parsedData,
    });

    const savedGRN = await grn.save();
    console.log(`GRN ${parsedData.grnNumber} saved successfully`);
    return savedGRN;
  } catch (error) {
    console.error('Error saving GRN:', error.message);
    throw error;
  }
}

/**
 * Save parsed Invoice to database
 */
async function saveInvoice(parsedData) {
  try {
    // Check if Invoice already exists
    const existingInvoice = await Invoice.findOne({
      invoiceNumber: parsedData.invoiceNumber,
    });
    if (existingInvoice) {
      throw new Error(`Invoice with number ${parsedData.invoiceNumber} already exists`);
    }

    const invoice = new Invoice({
      invoiceNumber: parsedData.invoiceNumber,
      invoiceDate: parsedData.invoiceDate,
      poNumber: parsedData.poNumber,
      poDate: parsedData.poDate,
      supplierName: parsedData.supplierName,
      supplierGSTIN: parsedData.supplierGSTIN,
      supplierAddress: parsedData.supplierAddress,
      bankDetails: parsedData.bankDetails || {},
      buyerName: parsedData.buyerName,
      buyerCode: parsedData.buyerCode,
      buyerGSTIN: parsedData.buyerGSTIN,
      salesOrder: parsedData.salesOrder,
      deliveryId: parsedData.deliveryId,
      items: parsedData.items,
      totals: parsedData.totals,
      dueDate: parsedData.dueDate,
      currency: parsedData.currency || 'INR',
      termsAndConditions: parsedData.termsAndConditions || {},
      isProcessed: true,
      rawGeminiOutput: parsedData,
    });

    const savedInvoice = await invoice.save();
    console.log(`Invoice ${parsedData.invoiceNumber} saved successfully`);
    return savedInvoice;
  } catch (error) {
    console.error('Error saving Invoice:', error.message);
    throw error;
  }
}

async function saveDocument(parsedData, documentType) {
  try {
    let savedDoc;
    const poNumber = parsedData.poNumber;

    if (documentType === 'po') {
      savedDoc = await savePO(parsedData);
    } else if (documentType === 'grn') {
      savedDoc = await saveGRN(parsedData);
    } else if (documentType === 'invoice') {
      savedDoc = await saveInvoice(parsedData);
    } else {
      throw new Error(`Unknown document type: ${documentType}`);
    }

    console.log(`Triggering match logic for poNumber: ${poNumber}`);
    const matchResult = await matchService.updateMatchStatus(poNumber);

    return {
      success: true,
      document: {
        id: savedDoc._id,
        type: documentType,
        number:
          documentType === 'po'
            ? savedDoc.poNumber
            : documentType === 'grn'
            ? savedDoc.grnNumber
            : savedDoc.invoiceNumber,
      },
      matchResult: {
        poNumber: matchResult.poNumber,
        matchStatus: matchResult.matchStatus,
        reason: matchResult.reason,
        summary: matchResult.summary,
      },
    };
  } catch (error) {
    console.error('Error in saveDocument:', error.message);
    throw error;
  }
}

async function getDocumentById(id, documentType) {
  try {
    let doc;
    if (documentType === 'po') {
      doc = await PO.findById(id);
    } else if (documentType === 'grn') {
      doc = await GRN.findById(id);
    } else if (documentType === 'invoice') {
      doc = await Invoice.findById(id);
    } else {
      throw new Error(`Unknown document type: ${documentType}`);
    }

    if (!doc) {
      throw new Error(`Document not found`);
    }

    return doc;
  } catch (error) {
    console.error('Error retrieving document:', error.message);
    throw error;
  }
}

/**
 * Get all documents for a PO number
 */
async function getDocumentsByPoNumber(poNumber) {
  try {
    const po = await PO.findOne({ poNumber });
    const grns = await GRN.find({ poNumber });
    const invoices = await Invoice.find({ poNumber });

    return {
      poNumber,
      po: po || null,
      grns: grns || [],
      invoices: invoices || [],
    };
  } catch (error) {
    console.error('Error retrieving documents:', error.message);
    throw error;
  }
}

module.exports = {
  savePO,
  saveGRN,
  saveInvoice,
  saveDocument,
  getDocumentById,
  getDocumentsByPoNumber,
};
