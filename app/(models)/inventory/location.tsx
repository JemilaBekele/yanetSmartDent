import mongoose from "mongoose";

// ======================= Location Schema ======================= //
const LocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // e.g., "Main Warehouse", "Shelf A3"
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Index for uniqueness and fast lookup

const Location =
  mongoose.models.Location || mongoose.model("Location", LocationSchema);

export default Location;
