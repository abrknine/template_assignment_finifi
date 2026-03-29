const matchService = require('../services/match.service');

exports.getMatchResult = async (req, res) => {
  try {
    const { poNumber } = req.params;

    if (!poNumber) {
      return res.status(400).json({
        success: false,
        message: 'PO number is required',
      });
    }

    console.log(`Retrieving match result for PO: ${poNumber}`);

    const match = await matchService.getMatchResult(poNumber);

    // Format response
    const response = {
      success: true,
      data: {
        poNumber: match.poNumber,
        matchStatus: match.matchStatus,
        documents: {
          po: match.documents.po.exists
            ? {
                exists: true,
                uploadedAt: match.documents.po.uploadedAt,
              }
            : { exists: false },
          grn: match.documents.grn,
          invoice: match.documents.invoice,
        },
        itemMatches: match.itemMatches,
        validations: match.validations,
        mismatchReasons: match.allMismatchReasons,
        summary: match.summary,
        lastUpdatedAt: match.lastUpdatedAt,
        updateHistory: match.updateHistory,
      },
    };

    return res.json(response);
  } catch (error) {
    console.error('Error in getMatchResult:', error.message);

    // Check if PO not found
    if (error.message.includes('No match record found')) {
      return res.status(404).json({
        success: false,
        message: `No documents found for this PO number`,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error retrieving match result',
      error: error.message,
    });
  }
};
