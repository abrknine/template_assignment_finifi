const express = require('express');
const router = express.Router();

// Three-way match routes
router.get('/', (req, res) => {
  res.json({ message: 'Match routes' });
});

module.exports = router;
