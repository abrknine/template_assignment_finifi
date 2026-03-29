# Three-Way Match Engine

A backend service that processes Purchase Order (PO), Goods Receipt Note (GRN), and Invoice documents, extracts structured data using Gemini API, and performs intelligent three-way matching with support for out-of-order document uploads.

## 📋 Overview

This system enables organizations to:
- Upload PO, GRN, and Invoice documents (as PDF files)
- Automatically extract structured data using Google's Gemini API
- Store parsed data in MongoDB with proper relationships
- Perform intelligent three-way matching validations
- Handle documents arriving in ANY order
- Track match status and mismatch reasons in detail

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Atlas)
- **API Parsing**: Google Generative AI (Gemini)
- **File Handling**: Multer + PDF-Parse
- **ORM**: Mongoose

### File Structure
```
src/
├── models/                 # Mongoose schemas
│   ├── po.model.js       # Purchase Order schema
│   ├── grn.model.js      # Goods Receipt Note schema
│   ├── invoice.model.js  # Invoice schema
│   └── match.model.js    # Match Result schema
│
├── controllers/          # Route handlers
│   ├── document.controller.js
│   └── match.controller.js
│
├── services/            # Business logic
│   ├── parser.service.js      # Gemini API calls
│   ├── document.service.js    # DB operations
│   └── match.service.js       # Matching validation logic
│
├── routes/              # API endpoints
│   ├── document.routes.js     # Document upload/retrieval
│   └── match.routes.js        # Match result queries
│
├── utils/
│   └── pdfParser.js          # PDF text extraction
│
└── config/
    ├── db.js            # MongoDB connection
    └── gemini.js        # Gemini API config (optional)
```

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Gemini API key

### Installation

1. **Clone/Setup the project**
```bash
cd three-way-match-engine
npm install
```

2. **Configure Environment Variables**
Create/update `.env` file:
```
PORT=5003
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

3. **Start the Server**
```bash
npm run dev          # Development with nodemon
# OR
npm start            # Production
```

Server runs on `http://localhost:5003`

## 📡 API Endpoints

### 1. Upload Document
**POST** `/api/documents/upload`

Upload and process a document (PO, GRN, or Invoice).

**Request** (multipart/form-data):
```javascript
{
  file: PDF_FILE,                    // The PDF file
  documentType: "po"                 // "po" | "grn" | "invoice"
}
```

**Response**:
```json
{
  "success": true,
  "message": "PO uploaded and processed successfully",
  "data": {
    "document": {
      "id": "123abc...",
      "type": "po",
      "number": "CI4PO05788"
    },
    "match": {
      "poNumber": "CI4PO05788",
      "status": "insufficient_documents",
      "reason": "Waiting for GRN and Invoice documents",
      "summary": {
        "totalItemsInPo": 150,
        "matchedItems": 0,
        "unmatchedItems": 0,
        "matchPercentage": 0
      }
    }
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid input (missing documentType, invalid file type)
- `500`: Server error (Gemini parsing failed, DB error)

---

### 2. Get Three-Way Match Result
**GET** `/api/match/:poNumber`

Retrieve the current match status for a PO number.

**Parameters**:
```
:poNumber    - The PO number (e.g., "CI4PO05788")
```

**Response**:
```json
{
  "success": true,
  "data": {
    "poNumber": "CI4PO05788",
    "matchStatus": "partially_matched",
    "documents": {
      "po": {
        "exists": true,
        "uploadedAt": "2026-03-17T10:00:00Z"
      },
      "grn": [
        {
          "_id": "456def...",
          "grnNumber": "CI4000020234",
          "exists": true,
          "uploadedAt": "2026-03-24T08:30:00Z"
        }
      ],
      "invoice": [
        {
          "_id": "789ghi...",
          "invoiceNumber": "IN25MH2504251",
          "exists": true,
          "uploadedAt": "2026-03-24T14:00:00Z"
        }
      ]
    },
    "itemMatches": [
      {
        "skuCode": "11423",
        "description": "Meatigo RTC Everyday Fish Fillet 200g",
        "poQuantity": 7517.50,
        "totalGrnQuantity": 7500.00,
        "totalInvoiceQuantity": 7517.50,
        "isMatched": false,
        "mismatchReasons": [
          "grn_qty_less_than_po_qty"
        ]
      }
    ],
    "validations": {
      "poExists": true,
      "allGrnsPresent": true,
      "allInvoicesPresent": true,
      "noDuplicatePo": true,
      "allItemsInPo": true,
      "quantityMatches": {
        "grnNotExceedingPo": true,
        "invoiceNotExceedingPo": true,
        "invoiceNotExceedingGrn": true
      },
      "dateMatches": {
        "invoiceDateNotAfterPo": true
      }
    },
    "mismatchReasons": [
      "grn_qty_less_than_po_qty"
    ],
    "summary": {
      "totalItemsInPo": 150,
      "matchedItems": 149,
      "unmatchedItems": 1,
      "matchPercentage": 99.33,
      "recommendation": "⚠️ Partial receipt detected. GRN quantity is less than PO. Verify with warehouse before payment."
    },
    "lastUpdatedAt": "2026-03-24T14:00:00Z",
    "updateHistory": [
      {
        "action": "PO uploaded",
        "timestamp": "2026-03-17T10:00:00Z",
        "matchStatus": "insufficient_documents"
      },
      {
        "action": "Invoice uploaded",
        "timestamp": "2026-03-24T14:00:00Z",
        "matchStatus": "insufficient_documents"
      },
      {
        "action": "GRN uploaded",
        "timestamp": "2026-03-24T08:30:00Z",
        "matchStatus": "partially_matched"
      }
    ]
  }
}
```

**Status Codes**:
- `200`: Success (even if no documents found)
- `400`: Invalid PO number format
- `404`: PO number not found
- `500`: Server error

---

### 3. Get Document by ID
**GET** `/api/documents/:id?type=po`

Retrieve a specific parsed document.

**Parameters**:
```
:id        - Document MongoDB ID
?type      - Document type: "po" | "grn" | "invoice"
```

**Response**: Returns the full document object (PO/GRN/Invoice) with all parsed fields.

---

### 4. Get All Documents for PO
**GET** `/api/documents/po/:poNumber`

Retrieve all documents (PO, GRNs, Invoices) linked to a PO number.

**Parameters**:
```
:poNumber  - The PO number
```

---

## 🔄 Data Flow & Out-of-Order Upload Handling

### How It Works

1. **User uploads Document** (any order)
   - Frontend sends: File + documentType ("po", "grn", or "invoice")

2. **Backend Processing**
   - Extract text from PDF
   - Send to Gemini API for structured data extraction
   - Parse JSON response and save to MongoDB

3. **Automatic Relationship Linking**
   - Extract `poNumber` from parsed data
   - Query database for other documents with same `poNumber`
   - Create/update Match result record

4. **Status Determination**
   - If all 3 docs present: Run full validation, determine match status
   - If < 3 docs: Status = `insufficient_documents`, wait for more

5. **Continuous Updates**
   - Every upload triggers re-evaluation
   - Match status/reasons updated automatically
   - `updateHistory` tracks all changes

### Example Scenario: Out-of-Order Upload

**Day 1: Invoice arrives first**
```
Upload: Invoice (poNumber: CI4PO05788)
↓
Save to DB
↓
Query: Find PO + GRNs with same poNumber
Result: Not found
↓
Response: matchStatus = "insufficient_documents"
```

**Day 5: GRN arrives**
```
Upload: GRN (poNumber: CI4PO05788)
↓
Save to DB
↓
Query: Find PO + other GRNs + Invoices
Result: Found Invoice (Day 1), no PO yet
↓
Response: matchStatus = "insufficient_documents"
```

**Day 10: Finally PO arrives!**
```
Upload: PO (poNumber: CI4PO05788)
↓
Save to DB
↓
Query: Find all docs with same poNumber
Result: ✅ Found PO + GRN + Invoice (ALL THREE!)
↓
RUN FULL VALIDATION
↓
Response: matchStatus = "partially_matched" (with reasons)
```

## ✅ Matching Validation Rules

### Rule 1: GRN Quantity
```
GRN quantity must NOT exceed PO quantity (per item)
❌ If: grnQty > poQty → Mismatch
⚠️ If: grnQty < poQty → Partial receipt (acceptable, but noted)
```

### Rule 2: Invoice Quantity (vs PO)
```
Invoice quantity must NOT exceed PO quantity (per item)
❌ If: invoiceQty > poQty → Mismatch
```

### Rule 3: Invoice Quantity (vs GRN)
```
Invoice quantity must NOT exceed total GRN quantity (per item)
❌ If: invoiceQty > totalGrnQty → Mismatch
```

### Rule 4: Invoice Date
```
Invoice date must NOT be after PO date (document-level)
❌ If: invoiceDate > poDate → Mismatch
```

### Rule 5: Duplicate PO
```
Only ONE PO per poNumber allowed
❌ If: Second PO with same number uploaded → Reject with error
```

### Rule 6: Item Codes Must Match
```
Items matched by SKU code (not just total quantity)
❌ If: Invoice has SKU that PO doesn't have → item_missing_in_po
```

## 📊 Match Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| `matched` | All rules passed, all docs present | ✅ Safe to proceed with payment |
| `partially_matched` | Minor issues (e.g., partial receipt), documents present | ⚠️ Review warehouse notes before payment |
| `mismatch` | Critical rule violations | ❌ Do not process payment, investigate |
| `insufficient_documents` | Not all 3 docs present yet | ⏳ Wait for remaining documents |

## 🔍 Extracted Data Schema

### Purchase Order (PO)
```json
{
  "poNumber": "CI4PO05788",
  "poDate": "2026-03-17",
  "vendorName": "M/s AFP",
  "vendorGSTIN": "...",
  "items": [
    {
      "skuCode": "733387",
      "description": "Frozen Chicken Chilli Salami 200.0 g",
      "hsnCode": "16010000",
      "quantity": 7517.50,
      "unitPrice": 126.667,
      "taxableValue": 950025.00,
      "cgstRate": 2.50,
      "cgstAmount": 23750.62,
      "sgstRate": 2.50,
      "sgstAmount": 23750.62,
      "totalAmount": 997563.74
    }
  ],
  "totals": {
    "totalQuantity": 7517.50,
    "totalTaxableValue": 950025.00,
    "totalCGST": 23750.62,
    "totalSGST": 23750.62,
    "totalAmount": 997563.74
  }
}
```

### Goods Receipt Note (GRN)
```json
{
  "grnNumber": "CI4000020234",
  "grnDate": "2026-03-24",
  "poNumber": "CI4PO05788",
  "invoiceNumber": "IN25MH2504251",
  "items": [
    {
      "skuCode": "733387",
      "skuDescription": "Frozen Chicken Chilli Salami 200.0 g",
      "expectedQuantity": 7517.50,
      "receivedQuantity": 7500.00,
      "unitPrice": 126.667,
      "taxableValue": 950025.00,
      "binLocation": "A-101",
      "lotNumber": "CI4000022530"
    }
  ]
}
```

### Invoice
```json
{
  "invoiceNumber": "IN25MH2504251",
  "invoiceDate": "2026-03-24",
  "poNumber": "CI4PO05788",
  "supplierName": "Ample Foods Private Limited",
  "supplierGSTIN": "...",
  "items": [
    {
      "skuCode": "733387",
      "description": "Frozen Chicken Chilli Salami 200.0 g",
      "quantity": 7517.50,
      "unitPrice": 126.667,
      "taxableValue": 950025.00,
      "cgstRate": 2.50,
      "cgstAmount": 23750.62,
      "sgstRate": 2.50,
      "sgstAmount": 23750.62,
      "totalAmount": 997563.74
    }
  ],
  "totals": {
    "totalTaxableValue": 950025.00,
    "totalCGST": 23750.62,
    "totalSGST": 23750.62,
    "totalAmount": 997563.74
  }
}
```

## 🛠️ Key Design Decisions

### 1. **Item Matching Key: SKU Code**
- **Why**: SKU is the universal identifier across all documents
- **Benefit**: Matches items even if descriptions vary slightly
- **Example**: PO item "SKU-123" matches with GRN item "SKU-123"

### 2. **Separate Collections for Each Document Type**
- **Why**: Different schemas, independent lifecycle
- **Benefit**: Flexible querying, easy to manage updates
- **Tradeoff**: Requires maintaining relationships via `poNumber`

### 3. **Match Collection Stores Computed Results**
- **Why**: Avoids recomputing on every query
- **Benefit**: Fast lookups, historical tracking
- **Tradeoff**: Requires synchronization when documents change

### 4. **Automatic Matching on Upload**
- **Why**: Real-time feedback, no manual triggering needed
- **Benefit**: Users immediately see match status
- **Tradeoff**: Slight latency on upload (parsing + validation)

### 5. **Partial Receipts Accepted**
- **Why**: Real-world scenario: goods arrive in batches
- **Benefit**: Doesn't block entire PO for partial receipts
- **Note**: Flagged as `grn_qty_less_than_po_qty` for review

## 🚨 Error Handling

The system handles:
- ❌ Invalid PDF files
- ❌ Gemini API failures (with retry logic potential)
- ❌ MongoDB connection failures
- ❌ Duplicate document numbers
- ❌ Missing required fields
- ❌ Malformed JSON from Gemini

All errors return descriptive messages to help debugging.

## 📈 Future Improvements

With more time, could implement:
1. **Retry Logic**: Exponential backoff for Gemini API calls
2. **Pagination**: For large result sets
3. **Filtering**: Filter match results by status, date range
4. **Analytics**: Dashboard showing match percentages, trends
5. **Notifications**: Email alerts for mismatches
6. **Audit Trail**: Complete change history with user tracking
7. **Reconciliation**: Automatic matching suggestions
8. **Webhooks**: Notify external systems of match status
9. **Document Modification**: Allow re-uploading corrected docs
10. **Bulk Upload**: Process multiple documents at once

## 📝 Testing Tips

### Manual Testing with cURL

1. **Upload PO**:
```bash
curl -X POST http://localhost:5003/api/documents/upload \
  -F "file=@path/to/PO.pdf" \
  -F "documentType=po"
```

2. **Upload GRN**:
```bash
curl -X POST http://localhost:5003/api/documents/upload \
  -F "file=@path/to/GRN.pdf" \
  -F "documentType=grn"
```

3. **Upload Invoice**:
```bash
curl -X POST http://localhost:5003/api/documents/upload \
  -F "file=@path/to/Invoice.pdf" \
  -F "documentType=invoice"
```

4. **Get Match Status**:
```bash
curl http://localhost:5003/api/match/CI4PO05788
```

### Test Scenarios

- **Out-of-order upload**: Upload in different order than PO → GRN → Invoice
- **Partial receipt**: GRN with less quantity than PO
- **Multiple GRNs**: Multiple GRN documents for same PO
- **Multiple Invoices**: Multiple invoices for same PO
- **Date mismatch**: Invoice dated before PO
- **Quantity mismatch**: Invoice with more than GRN received

## 📚 Dependencies

- `express@^5.2.1` - Web framework
- `mongoose@^9.3.3` - MongoDB ORM
- `@google/generative-ai@^0.3.0` - Gemini API
- `pdf-parse@^1.1.1` - PDF text extraction
- `multer@^2.1.1` - File upload handling
- `cors@^2.8.6` - CORS middleware
- `dotenv@^17.3.1` - Environment config

## 📄 License

ISC

---

## 🤝 Support

For issues or questions:
1. Check the API examples above
2. Verify `.env` variables are set correctly
3. Ensure MongoDB is accessible
4. Check server logs for detailed error messages

## Assignment Completion

✅ **Core Requirements Met**:
- Single upload endpoint accepting all document types
- Automatic Gemini API parsing
- MongoDB storage with proper relationships
- Three-way matching with all validation rules
- Out-of-order upload support
- Item-level matching by SKU code
- Detailed mismatch reporting
- Match status tracking with history

✅ **API Endpoints**:
- POST `/api/documents/upload` - Upload document
- GET `/api/match/:poNumber` - Get match result
- GET `/api/documents/:id` - Get document
- GET `/api/documents/po/:poNumber` - Get all docs for PO

✅ **Documentation**:
- This README explaining approach and usage
- API examples and sample outputs
- Data models and validation rules
- Design decisions and reasoning
