import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;

  // Resolve the file path in the uploads folder
  const filePath = path.join(process.cwd(), "uploads", filename as string);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Set the appropriate Content-Type header (e.g., image/jpeg or image/png)
    res.setHeader("Content-Type", "image/jpeg"); // Adjust as per your image type
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({ error: "Image not found" });
  }
}
