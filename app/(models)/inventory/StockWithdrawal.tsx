import mongoose from "mongoose";

// ======================= ENUMS ======================= //
const StockWithdrawalStatus = Object.freeze({
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  ISSUED: "ISSUED", // when stock is moved to the target location
});

// ======================= Stock Withdrawal Item Schema ======================= //
const StockWithdrawalItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductBatch",
      required: true,
    },
    productUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductUnit",
      required: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    fromLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // from where the stock is withdrawn
    },
    toLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // destination location
    },
  },
  { _id: false }
);

// ======================= Stock Withdrawal Request Schema ======================= //
const StockWithdrawalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // who is requesting
      required: true,
    },
    items: {
      type: [StockWithdrawalItemSchema],
      validate: [
        (arr) => arr.length > 0,
        "At least one withdrawal item is required",
      ],
    },
    status: {
      type: String,
      enum: Object.values(StockWithdrawalStatus),
      default: StockWithdrawalStatus.PENDING,
    },
    notes: String, // remarks (e.g., reason for withdrawal, transfer purpose)
    requestedAt: {
      type: Date,
      default: Date.now,
    },
       locToLoc: {
      type: Boolean,
      default: false,
    },
      locToMain: {
      type: Boolean,
      default: false, // withdrawal/transfer to main stock
    },
    approvedAt: Date,
    issuedAt: Date,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Index for faster queries
StockWithdrawalRequestSchema.index({ userId: 1, status: 1 });
StockWithdrawalRequestSchema.index({ "items.fromLocationId": 1, "items.toLocationId": 1 });

const StockWithdrawalRequest =
  mongoose.models.StockWithdrawalRequest ||
  mongoose.model("StockWithdrawalRequest", StockWithdrawalRequestSchema);

export { StockWithdrawalRequest, StockWithdrawalStatus };
