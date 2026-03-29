

THIS README contains ans of all the question asked

1) My approach and parsing flow-- 

  a)i takes pdf file along with caption and with proper validation i
 b)Extract text from PDF using pdfparser(pacakge to prase pdf) then  c)give that data to gemini with custom prompt for each type of pdf (that prompt is designed analysing the schema of my pdf ) 
   to make data structured in clear json format 
  d) then store structured data to mongodb 
  e) and run  matching algo 
  f) one each uplaod i run that matching algo and update my matches table


2) How Out-of-Order Uploads are Handled

Each document (PO, GRN, Invoice) is independent. The system uses a central "Match" collection indexed on poNumber to track what documents exist and their validation state.

a) Trigger on Every Upload:
   - When any document uploads (PO/GRN/Invoice), the controller immediately calls matchService.updateMatchStatus(poNumber)
   - This function queries all 3 collections (PO, GRN, Invoice) for that poNumber
   - Recomputes and updates the Match record with latest validation results

b) MongoDB Schema (Match Collection):
   {
     "_id": ObjectId,
     "poNumber": String (indexed, unique),
     "matchStatus": Enum ["matched", "partially_matched", "mismatch", "insufficient_documents"],
     "documents": {
       "po": { exists: Boolean, uploadedAt: Date },
       "grn": { exists: Boolean, uploadedAt: Date },
       "invoice": { exists: Boolean, uploadedAt: Date }
     },
     "itemMatches": [
       {
         "skuCode": String,
         "poQuantity": Number,
         "totalGrnQuantity": Number,
         "totalInvoiceQuantity": Number,
         "isMatched": Boolean,
         "mismatchReasons": [String] // e.g., ["grn_qty_exceeds_po_qty"]
       }
     ],
     "validations": {
       "poExists": Boolean,
       "allGrnsPresent": Boolean,
       "allInvoicesPresent": Boolean,
       "quantityMatches": {
         "grnNotExceedingPo": Boolean,
         "invoiceNotExceedingPo": Boolean,
         "invoiceNotExceedingGrn": Boolean
       }
     },
     "allMismatchReasons": [String], // All reasons across all items
     "lastUpdatedAt": Date,
     "updateHistory": [
       { timestamp: Date, action: String, changes: Object }
     ]
   }

c) Upload Order Examples (All Work):
   
   Scenario 1: GRN → PO → Invoice
   - Upload GRN: Creates Match record with {grn: exists, po: false, invoice: false}, status = insufficient_documents
   - Upload PO: Updates Match, revalidates, status = insufficient_documents (waiting for invoice)
   - Upload Invoice: Validates all 3 rules, status = matched or partially_matched
   
   Scenario 2: Invoice → Invoice → PO → GRN
   - Upload Invoice (1st): Creates Match, status = insufficient_documents
   - Upload Invoice (2nd): Matches on poNumber, combines invoice data, status unchanged
   - Upload PO: Revalidates, status = insufficient_documents (waiting for GRN)
   - Upload GRN: All 3 exist now, runs full 6-rule validation, status determined
   
   Scenario 3: PO only (never upload GRN/Invoice)
   - Upload PO: Creates Match, documents.grn = false, documents.invoice = false
   - Query endpoint returns status = insufficient_documents indefinitely

d) Technical Implementation (match.service.js):
   - updateMatchStatus(poNumber) function:
     1. Fetch PO: const po = await PO.findOne({poNumber})
     2. Fetch GRNs: const grns = await GRN.find({poNumber})
     3. Fetch Invoices: const invoices = await Invoice.find({poNumber})
     4. Call validateDocuments(po, grns, invoices)
     5. Update or create Match record with results
     6. Record update in updateHistory array
   
   - validateDocuments() function:
     1. Create itemMap from PO items keyed by skuCode
     2. Iterate GRN items, sum totalGrnQuantity per skuCode
     3. Iterate Invoice items, sum totalInvoiceQuantity per skuCode
     4. For each item, check 6 validation rules:
        - Rule 1: grn_qty <= po_qty
        - Rule 2: invoice_qty <= po_qty  
        - Rule 3: invoice_qty <= grn_qty
        - Rule 4: item exists in PO (skuCode must match)
        - Rule 5: invoice_date >= po_date
        - Rule 6: no duplicate PO (checked at save time)
     5. Set matchStatus based on validation results
     6. Return itemMatches[] with individual item status

e) Linking Mechanism:
   - All documents (PO, GRN, Invoice) have "poNumber" field
   - Match collection uses poNumber as primary key (indexed)
   - When new document uploads with poNumber="CI4PO05788", system automatically finds and updates the Match record for that poNumber
   - No explicit join or FK needed - document linking is implicit via poNumber string matching

