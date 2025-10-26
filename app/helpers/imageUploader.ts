// app/helpers/imageUploader.ts

import fs from 'fs';
import path from 'path';

// Function to handle image upload
export const uploadImage = async (imageFile: File) => {
    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate a unique filename
    const filename = `${Date.now()}-${imageFile.name}`;
    const filePath = path.join(uploadsDir, filename);

    // Create a writable stream to save the file
    const writeStream = fs.createWriteStream(filePath);
    
    // Read the incoming file as a stream
    const reader = imageFile.stream();
    const readerStream = reader.getReader();
    
    // Write the data to the writable stream
    const pump = async () => {
        const { done, value } = await readerStream.read();
        if (done) {
            writeStream.end(); // Close the writable stream when done
            return;
        }
        writeStream.write(value); // Write chunk to file
        return pump(); // Continue to read next chunk
    };

    // Start pumping data
    await pump();

    // Return the path for the saved image
    return `${filename}`;
};
