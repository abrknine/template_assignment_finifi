const mongoose = require('mongoose');

// Item match schema
const itemMatchSchema = new mongoose.Schema(
  {
    skuCode: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    poQuantity: {
      type: Number,
      default: 0,
    },
    totalGrnQuantity: {
      type: Number,
      default: 0,
    },
    totalInvoiceQuantity: {
      type: Number,
      default: 0,
    },
    isMatched: {
      type: Boolean,
      default: false,
    },
    mismatchReasons: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

// Document reference schema
const documentRefSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    exists: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
    },
  },
  { _id: false }
);

// Main Match Schema
const matchSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: [true, 'PO number is required'],
      unique: true,
      trim: true,
      index: true, // Primary key for queries
    },
    documents: {
      po: documentRefSchema,
      grn: [documentRefSchema],
      invoice: [documentRefSchema],
    },
    matchStatus: {
      type: String,
      enum: ['matched', 'partially_matched', 'mismatch', 'insufficient_documents'],
      default: 'insufficient_documents',
    },
    itemMatches: {
      type: [itemMatchSchema],
      default: [],
    },
    dateValidation: {
      invoiceDate: Date,
      poDate: Date,
      isInvoiceDateAfterPo: {
        type: Boolean,
        default: false,
      },
      mismatch: {
        type: Boolean,
        default: false,
      },
    },
    validations: {
      poExists: {
        type: Boolean,
        default: false,
      },
      allGrnsPresent: {
        type: Boolean,
        default: false,
      },
      allInvoicesPresent: {
        type: Boolean,
        default: false,
      },
      noDuplicatePo: {
        type: Boolean,
        default: true,
      },
      allItemsInPo: {
        type: Boolean,
        default: true,
      },
      quantityMatches: {
        grnNotExceedingPo: {
          type: Boolean,
          default: false,
        },
        invoiceNotExceedingPo: {
          type: Boolean,
          default: false,
        },
        invoiceNotExceedingGrn: {
          type: Boolean,
          default: false,
        },
      },
      dateMatches: {
        invoiceDateNotAfterPo: {
          type: Boolean,
          default: true,
        },
      },
    },
    allMismatchReasons: {
      type: [String],
      default: [],
      enum: [
        'grn_qty_exceeds_po_qty',
        'grn_qty_less_than_po_qty',
        'invoice_qty_exceeds_po_qty',
        'invoice_qty_exceeds_grn_qty',
        'invoice_date_after_po_date',
        'item_missing_in_po',
        'duplicate_po',
        'item_missing_in_grn',
      ],
    },
    summary: {
      totalItemsInPo: {
        type: Number,
        default: 0,
      },
      matchedItems: {
        type: Number,
        default: 0,
      },
      unmatchedItems: {
        type: Number,
        default: 0,
      },
      matchPercentage: {
        type: Number,
        default: 0,
      },
      recommendation: {
        type: String,
      },
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updateHistory: [
      {
        action: {
          type: String,
          enum: ['PO uploaded', 'GRN uploaded', 'Invoice uploaded'],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        matchStatus: {
          type: String,
          enum: ['matched', 'partially_matched', 'mismatch', 'insufficient_documents'],
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
