import { ManualStockCorrection } from "@/app/(models)/inventory/manualcorrection";

export async function generateCorrectionReference(): Promise<string> {
  const prefix = "MSC";

  // ✅ Find the latest correction by created date
  const lastCorrection = await ManualStockCorrection.findOne({})
    .sort({ created_at: -1 })
    .select("reference");

  let nextNumber = 1;

  if (lastCorrection && lastCorrection.reference) {
    const match = lastCorrection.reference.match(/MSC-(\d+)/);
    if (match && match[1]) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // ✅ Format with leading zeros (MSC-00001)
  const reference = `${prefix}-${String(nextNumber).padStart(5, "0")}`;

  return reference;
}