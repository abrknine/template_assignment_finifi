const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/document.controller');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    cb(null, `${timestamp}_${randomStr}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * POST /api/documents/upload
 * Upload and process a document (PO, GRN, or Invoice)
 * Body: { file, documentType: 'po' | 'grn' | 'invoice' }
 */
router.post('/upload', upload.single('file'), documentController.uploadDocument);

// GET document by ID
router.get('/:id', documentController.getDocument);

// GET all documents for a PO number
router.get('/po/:poNumber', documentController.getDocumentsByPoNumber);

module.exports = router;
