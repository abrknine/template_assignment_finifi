const documentService = require('../services/document.service');
const parserService = require('../services/parser.service');
const { extractTextFromPDF } = require('../utils/pdfParser');
const fs = require('fs').promises;

exports.uploadDocument = async (req, res) => {
  try {
    const { documentType } = req.body;

    // Validate documentType
    if (!documentType || !['po', 'grn', 'invoice'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid documentType. Must be: "po", "grn", or "invoice"',
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    console.log(`Processing ${documentType.toUpperCase()} upload: ${req.file.filename}`);

    // Step 1: Extract text from PDF
    console.log('Extracting text from PDF...');
    const pdfText = await extractTextFromPDF(req.file.path);

    // Step 2: Parse with Gemini
    console.log('Parsing with Gemini API...');
    const parsedData = await parserService.parseDocumentWithGemini(pdfText, documentType);

    // Step 3: Save to DB and trigger matching
    console.log('Saving to database and triggering match logic...');
    const result = await documentService.saveDocument(parsedData, documentType);

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.warn('Could not delete temporary file:', err.message);
    }

    // Return success response
    return res.json({
      success: true,
      message: `${documentType.toUpperCase()} uploaded and processed successfully`,
      data: {
        document: {
          id: result.document.id,
          type: result.document.type,
          number: result.document.number,
        },
        match: {
          poNumber: result.matchResult.poNumber,
          status: result.matchResult.matchStatus,
          reason: result.matchResult.reason,
          summary: result.matchResult.summary,
        },
      },
    });
  } catch (error) {
    console.error('Error in uploadDocument:', error.message);

    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.warn('Could not delete temporary file:', err.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Error processing document',
      error: error.message,
    });
  }
};

/**
 * Get parsed document by ID
 */
exports.getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'po', 'grn', or 'invoice'

    if (!type || !['po', 'grn', 'invoice'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "type" is required. Must be: "po", "grn", or "invoice"',
      });
    }

    const doc = await documentService.getDocumentById(id, type);

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error('Error in getDocument:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving document',
      error: error.message,
    });
  }
};

/**
 * Get all documents for a PO number
 */
exports.getDocumentsByPoNumber = async (req, res) => {
  try {
    const { poNumber } = req.params;

    const docs = await documentService.getDocumentsByPoNumber(poNumber);

    return res.json({
      success: true,
      data: docs,
    });
  } catch (error) {
    console.error('Error in getDocumentsByPoNumber:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving documents',
      error: error.message,
    });
  }
};
