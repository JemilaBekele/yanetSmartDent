import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;

  if (!filename || Array.isArray(filename)) {
    return res.status(400).json({ error: "Invalid filename parameter" });
  }

  // Decode the filename to handle spaces and special characters
  const decodedFilename = decodeURIComponent(filename as string);

  // Resolve the file path in the `uploads` directory
  const filePath = path.join(process.cwd(), "uploads", decodedFilename);

  console.log("File Path:", filePath); // Debugging file path

  if (fs.existsSync(filePath)) {
    // Set the correct Content-Type based on the file extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeType =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".png"
        ? "image/png"
        : "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    console.error("File not found:", filePath); // Debugging missing file
    res.status(404).json({ error: "Image not found" });
  }
}
