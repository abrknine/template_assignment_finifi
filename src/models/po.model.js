const mongoose = require('mongoose');

// Item schema used in PO
const poItemSchema = new mongoose.Schema(
  {
    skuCode: {
      type: String,
      required: [true, 'SKU code is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Item description is required'],
    },
    hsnCode: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: 0,
    },
    taxableValue: {
      type: Number,
      default: 0,
    },
    cgstRate: {
      type: Number,
      default: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
    },
    sgstRate: {
      type: Number,
      default: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
    },
    igstRate: {
      type: Number,
      default: 0,
    },
    igstAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    brand: {
      type: String,
      trim: true,
    },
    uom: {
      type: String,
      default: 'pcs',
    },
  },
  { _id: false }
);

// Main PO Schema
const poSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: [true, 'PO number is required'],
      unique: true,
      trim: true,
      index: true, // Index for fast queries
    },
    poDate: {
      type: Date,
      required: [true, 'PO date is required'],
    },
    vendorName: {
      type: String,
      required: [true, 'Vendor name is required'],
    },
    vendorAddress: {
      type: String,
    },
    vendorGSTIN: {
      type: String,
    },
    buyerName: {
      type: String,
    },
    buyerGSTIN: {
      type: String,
    },
    items: {
      type: [poItemSchema],
      required: [true, 'PO must have at least one item'],
      validate: {
        validator: (v) => v && v.length > 0,
        message: 'PO must have at least one item',
      },
    },
    totals: {
      totalQuantity: {
        type: Number,
        default: 0,
      },
      totalTaxableValue: {
        type: Number,
        default: 0,
      },
      totalCGST: {
        type: Number,
        default: 0,
      },
      totalSGST: {
        type: Number,
        default: 0,
      },
      totalIGST: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: String,
    },
    isProcessed: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'duplicate'],
      default: 'active',
    },
    rawGeminiOutput: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PO', poSchema);
