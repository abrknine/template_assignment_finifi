const mongoose = require('mongoose');

// Item schema for GRN
const grnItemSchema = new mongoose.Schema(
  {
    skuCode: {
      type: String,
      required: [true, 'SKU code is required'],
      trim: true,
    },
    skuDescription: {
      type: String,
      required: [true, 'Item description is required'],
    },
    vendorSku: {
      type: String,
      trim: true,
    },
    expectedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    receivedQuantity: {
      type: Number,
      required: [true, 'Received quantity is required'],
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
    cessRate: {
      type: Number,
      default: 0,
    },
    cessAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    binLocation: {
      type: String,
    },
    lotNumber: {
      type: String,
    },
    lotMRP: {
      type: Number,
    },
    uom: {
      type: String,
      default: 'pcs',
    },
  },
  { _id: false }
);

// Main GRN Schema
const grnSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      required: [true, 'GRN number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    grnDate: {
      type: Date,
      required: [true, 'GRN date is required'],
    },
    poNumber: {
      type: String,
      required: [true, 'PO number reference is required'],
      trim: true,
      index: true, // Index to link with PO
    },
    poDate: {
      type: Date,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    invoiceDate: {
      type: Date,
    },
    inboundNumber: {
      type: String,
    },
    challanNumber: {
      type: String,
    },
    vendorName: {
      type: String,
    },
    vendorAddress: {
      type: String,
    },
    receivedAt: {
      type: String,
    },
    warehouseLocation: {
      type: String,
    },
    items: {
      type: [grnItemSchema],
      required: [true, 'GRN must have at least one item'],
      validate: {
        validator: (v) => v && v.length > 0,
        message: 'GRN must have at least one item',
      },
    },
    totals: {
      totalExpectedQuantity: {
        type: Number,
        default: 0,
      },
      totalReceivedQuantity: {
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
    rawGeminiOutput: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GRN', grnSchema);
