const express = require('express');
const router = express.Router();

// Document upload and management routes
router.get('/', (req, res) => {
  res.json({ message: 'Document routes' });
});

module.exports = router;
