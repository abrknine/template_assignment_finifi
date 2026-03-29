const mongoose = require('mongoose');

// Item schema for Invoice
const invoiceItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      trim: true,
    },
    skuCode: {
      type: String,
      required: [true, 'SKU code is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Item description is required'],
    },
    hsnSacCode: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Billing quantity is required'],
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
    uom: {
      type: String,
      default: 'pcs',
    },
    discountOrPromoType: {
      type: String,
    },
  },
  { _id: false }
);

// Main Invoice Schema
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      required: [true, 'Invoice date is required'],
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
    supplierName: {
      type: String,
      required: [true, 'Supplier name is required'],
    },
    supplierGSTIN: {
      type: String,
    },
    supplierAddress: {
      type: String,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      branch: String,
    },
    buyerName: {
      type: String,
    },
    buyerCode: {
      type: String,
    },
    buyerGSTIN: {
      type: String,
    },
    salesOrder: {
      type: String,
    },
    deliveryId: {
      type: String,
    },
    items: {
      type: [invoiceItemSchema],
      required: [true, 'Invoice must have at least one item'],
      validate: {
        validator: (v) => v && v.length > 0,
        message: 'Invoice must have at least one item',
      },
    },
    totals: {
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
      amountInWords: {
        type: String,
      },
    },
    dueDate: {
      type: Date,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    termsAndConditions: {
      discrepancyReportingWindow: String,
      interestOnOverdue: Number,
      jurisdiction: String,
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

module.exports = mongoose.model('Invoice', invoiceSchema);
