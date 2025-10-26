import mongoose from "mongoose";

// ======================= ENUMS ======================= //
const LocationItemStatus = Object.freeze({
  ACTIVE: "ACTIVE",
  RESERVED: "RESERVED",
  FINISHED: "FINISHED",
  DAMAGED: "DAMAGED",
});

// ======================= LocationItemStock Schema ======================= //
const LocationItemStockSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductBatch",
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // stock belongs to a location now
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LocationItemStatus),
      default: LocationItemStatus.ACTIVE,
    },
    notes: {
      type: String,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// index for faster lookup per location and batch
LocationItemStockSchema.index({ batchId: 1, locationId: 1 });

// ======================= Model ======================= //
const LocationItemStock =
  mongoose.models.LocationItemStock ||
  mongoose.model("LocationItemStock", LocationItemStockSchema);

export { LocationItemStock, LocationItemStatus };
