const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');

// GET three-way match result by PO number
router.get('/:poNumber', matchController.getMatchResult);

module.exports = router;
