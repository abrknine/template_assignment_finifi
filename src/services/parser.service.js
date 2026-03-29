const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Parse document with Gemini AI and return structured JSON
async function parseDocumentWithGemini(documentText, documentType) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt = '';

    // Customize prompt based on document type
    if (documentType === 'po') {
      prompt = `
        You are an expert document parser. This is a Purchase Order (PO) document.
        
        IMPORTANT: Only extract line items that have ALL of these required fields:
        - skuCode (product code/SKU number - MANDATORY)
        - description
        - quantity (MUST be a number > 0)
        - unitPrice (MUST be a number > 0)
        
        DO NOT include:
        - Header/footer rows without skuCode
        - Total/subtotal rows
        - Shipping, handling, or tax rows without skuCode
        - Any row missing skuCode or quantity
        
        Extract and return ONLY valid JSON:
        
        {
          "poNumber": "string - the PO number",
          "poDate": "string - date in YYYY-MM-DD format",
          "vendorName": "string",
          "vendorAddress": "string",
          "vendorGSTIN": "string",
          "buyerName": "string",
          "buyerGSTIN": "string",
          "items": [
            {
              "skuCode": "string - REQUIRED product SKU/code",
              "description": "string",
              "hsnCode": "string",
              "quantity": number,
              "unitPrice": number,
              "taxableValue": number,
              "cgstRate": number,
              "cgstAmount": number,
              "sgstRate": number,
              "sgstAmount": number,
              "igstRate": number,
              "igstAmount": number,
              "totalAmount": number,
              "brand": "string",
              "uom": "string - unit of measure"
            }
          ],
          "totals": {
            "totalQuantity": number,
            "totalTaxableValue": number,
            "totalCGST": number,
            "totalSGST": number,
            "totalIGST": number,
            "totalAmount": number
          }
        }
        
        Document text:
        ${documentText}
        
        Return ONLY valid JSON, no explanations or extra text.
      `;
    } else if (documentType === 'grn') {
      prompt = `
        You are an expert document parser. This is a Goods Receipt Note (GRN) document.
        
        IMPORTANT: Only extract line items that have ALL of these required fields:
        - skuCode (product SKU - MANDATORY, must match PO)
        - receivedQuantity (MUST be a number >= 0)
        - expectedQuantity (MUST be a number > 0)
        
        DO NOT include:
        - Header/footer rows without skuCode
        - Total/subtotal rows
        - Any row missing skuCode or quantities
        
        Extract and return ONLY valid JSON:
        
        {
          "grnNumber": "string - GRN number",
          "grnDate": "string - date in YYYY-MM-DD format",
          "poNumber": "string - reference to PO",
          "poDate": "string - PO date in YYYY-MM-DD format",
          "invoiceNumber": "string or null",
          "invoiceDate": "string or null",
          "inboundNumber": "string",
          "challanNumber": "string",
          "vendorName": "string",
          "vendorAddress": "string",
          "receivedAt": "string - location",
          "warehouseLocation": "string",
          "items": [
            {
              "skuCode": "string - REQUIRED product SKU (must match PO)",
              "skuDescription": "string",
              "vendorSku": "string",
              "expectedQuantity": number,
              "receivedQuantity": number,
              "unitPrice": number,
              "taxableValue": number,
              "cgstRate": number,
              "cgstAmount": number,
              "sgstRate": number,
              "sgstAmount": number,
              "igstRate": number,
              "igstAmount": number,
              "cessRate": number,
              "cessAmount": number,
              "totalAmount": number,
              "binLocation": "string",
              "lotNumber": "string",
              "lotMRP": number,
              "uom": "string"
            }
          ],
          "totals": {
            "totalExpectedQuantity": number,
            "totalReceivedQuantity": number,
            "totalTaxableValue": number,
            "totalCGST": number,
            "totalSGST": number,
            "totalAmount": number
          }
        }
        
        Document text:
        ${documentText}
        
        Return ONLY valid JSON, no explanations or extra text.
      `;
    } else if (documentType === 'invoice') {
      prompt = `
        You are an expert document parser. This is an Invoice document.
        
        IMPORTANT: Only extract line items that have ALL of these required fields:
        - skuCode (product SKU - MANDATORY, must match PO)
        - quantity (MUST be a number > 0)
        - unitPrice (MUST be a number > 0)
        
        DO NOT include:
        - Header/footer rows without skuCode
        - Total/subtotal rows
        - Shipping, handling, or tax rows without skuCode
        - Any row missing skuCode or quantity
        
        Extract and return ONLY valid JSON:
        
        {
          "invoiceNumber": "string - invoice number",
          "invoiceDate": "string - date in YYYY-MM-DD format",
          "poNumber": "string - reference to PO",
          "poDate": "string - PO date in YYYY-MM-DD format",
          "supplierName": "string",
          "supplierGSTIN": "string",
          "supplierAddress": "string",
          "bankDetails": {
            "bankName": "string",
            "accountNumber": "string",
            "ifscCode": "string",
            "branch": "string"
          },
          "buyerName": "string",
          "buyerCode": "string",
          "buyerGSTIN": "string",
          "salesOrder": "string",
          "deliveryId": "string",
          "items": [
            {
              "itemCode": "string",
              "skuCode": "string - REQUIRED product SKU (must match PO)",
              "description": "string",
              "hsnSacCode": "string",
              "quantity": number,
              "unitPrice": number,
              "taxableValue": number,
              "cgstRate": number,
              "cgstAmount": number,
              "sgstRate": number,
              "sgstAmount": number,
              "igstRate": number,
              "igstAmount": number,
              "totalAmount": number,
              "uom": "string",
              "discountOrPromoType": "string"
            }
          ],
          "totals": {
            "totalTaxableValue": number,
            "totalCGST": number,
            "totalSGST": number,
            "totalIGST": number,
            "totalAmount": number,
            "amountInWords": "string"
          },
          "dueDate": "string - date in YYYY-MM-DD format",
          "currency": "string - default INR",
          "termsAndConditions": {
            "discrepancyReportingWindow": "string",
            "interestOnOverdue": number,
            "jurisdiction": "string"
          }
        }
        
        Document text:
        ${documentText}
        
        Return ONLY valid JSON, no explanations or extra text.
      `;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Add document type
    parsedData.documentType = documentType.toUpperCase();

    return parsedData;
  } catch (error) {
    console.error('Error parsing document with Gemini:', error);
    throw new Error(`Gemini parsing failed: ${error.message}`);
  }
}

module.exports = {
  parseDocumentWithGemini,
};
