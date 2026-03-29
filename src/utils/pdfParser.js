const pdfParse = require('pdf-parse');
const fs = require('fs');

async function extractTextFromPDF(filePath) {
  try {
    // Read the PDF file
    const pdfFile = fs.readFileSync(filePath);

    // Parse PDF
    const pdfData = await pdfParse(pdfFile);

    // Extract text from all pages
    const fullText = pdfData.text;

    console.log(`Extracted text from PDF (${pdfData.numpages} pages, ${fullText.length} chars)`);

    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error.message);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

module.exports = {
  extractTextFromPDF,
};
