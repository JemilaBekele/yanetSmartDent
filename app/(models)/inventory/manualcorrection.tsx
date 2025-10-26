import mongoose from "mongoose";
import { LocationItemStock } from "./locationstock";
import { PersonalStock } from "./personal";

// ======================= ENUMS ======================= //
const CorrectionStatus = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});
const Stock = Object.freeze({
  MainStock: "MainStock",
  LocationStock: "LocationStock",
  PersonalStock: "PersonalStock",
});

// ======================= ManualStockCorrectionItem Schema ======================= //
const ManualStockCorrectionItemSchema = new mongoose.Schema(
  {
    correctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManualStockCorrection",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductUnit",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductBatch",
      required: true,
    },
    Quantity: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ======================= ManualStockCorrection Schema ======================= //
const ManualStockCorrectionSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CorrectionStatus),
      default: CorrectionStatus.PENDING,
    },
    stock: {
      type: String,
      enum: Object.values(Stock),
      default: Stock.MainStock,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ======================= Virtual Relations ======================= //

// ManualStockCorrection → Items
ManualStockCorrectionSchema.virtual("items", {
  ref: "ManualStockCorrectionItem",
  localField: "_id",
  foreignField: "correctionId",
});

// ======================= Models ======================= //
const ManualStockCorrection =
  mongoose.models.ManualStockCorrection ||
  mongoose.model("ManualStockCorrection", ManualStockCorrectionSchema);

const ManualStockCorrectionItem =
  mongoose.models.ManualStockCorrectionItem ||
  mongoose.model("ManualStockCorrectionItem", ManualStockCorrectionItemSchema);

export {
  ManualStockCorrection,
  ManualStockCorrectionItem,
  CorrectionStatus,
};
