"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface PopupImageProps {
  imageId: string;
  onClose: () => void;
}

const PopupImage: React.FC<PopupImageProps> = ({ imageId, onClose }) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(`/api/patient/image/detail/${imageId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);
        // Adjust this line to extract the correct field from the response
        setImageData(data.data.image)
        console.log(data.image);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [imageId]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={onClose}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className=" p-4 rounded-lg shadow-lg relative max-w-4xl">
        {imageData && (
          <Image
            src={`/api/uploads/${encodeURIComponent(imageData)}`}
            alt="Patient Image"
            width={800}
            height={600}
            className="rounded-lg shadow-md object-contain"
          />
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
        >
          X
        </button>
      </div>
    </div>
  );
};

export default PopupImage;
