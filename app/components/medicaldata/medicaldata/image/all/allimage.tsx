"use client";

import React, { useEffect, useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import Image from "next/image";
import Link from "next/link";
import { DeleteOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import PopupImage from "../PopupImage";

// Define the types for the patient and images
type PatientImage = {
  _id: string;
  image: string; // Main image URL
};

type PatientData = {
  _id: string;
  name: string;
  Image: PatientImage[];
};

type PatientImagesProps = {
  params: {
    id: string;
  };
};

export default function PatientImages({ params }: PatientImagesProps) {
  const patientId = params.id;
  const { data: session } = useSession();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const role = useMemo(() => session?.user?.role || "", [session]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Fetch patient data and images
  const fetchImages = async (patientId: string) => {
    try {
      const response = await fetch(`/api/patient/image/${patientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching images:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const data = await fetchImages(patientId);
        if (data) {
          setPatientData({
            _id: patientId,
            name: "Patient Name",
            Image: data.data || [], // Use the fetched image data
          });
        } else {
          setError("Failed to fetch patient data.");
        }
      } catch (err) {
        console.error("Error fetching patient data:", err);
        setError("An error occurred while fetching patient data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const handleDeleteConfirmation = (imageId: string) => {
    toast.warn(
      <div>
        <span>Are you sure you want to delete this image?</span>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
          <button onClick={() => handleDelete(imageId)}>Yes</button>
          <button onClick={() => toast.dismiss()}>No</button>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleDelete = async (imageId: string) => {
    try {
      const response = await fetch(`/api/patient/image/detail/${imageId}`, { method: "DELETE" });

      if (response.ok) {
        setPatientData((prevData) => ({
          ...prevData!,
          Image: prevData!.Image.filter((image) => image._id !== imageId),
        }));
        toast.success("Image deleted successfully!");
      } else {
        toast.error("Error deleting image.");
      }
    } catch {
      toast.error("An unexpected error occurred while deleting the image.");
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedImage(null);
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!patientData) return <div className="text-center">No patient data found.</div>;

  return (
    <div className="flex m-7">
    <div className="flex-grow md:ml-60 container mx-auto p-4">
      <div className="flex space-x-8">
        <div className="w-1/3 p-4">
          <PatientComponent params={params} />
        </div>

        <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">
                Image
              </h1>
              {role === 'admin' && (
                <>
                <Link
                href={`/admin/medicaldata/image/add/${patientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                New Image +
              </Link>
                </>
              )}
              {role === 'doctor' && (
                <>
                <Link
                href={`/doctor/medicaldata/image/add/${patientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                New Image +
              </Link>
                </>
              )}
               {role === 'reception' && (
                <>
                <Link
                href={`/reception/image/add/${patientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                New Image +
              </Link>
                </>
              )}
        </div>

        {patientData.Image.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {patientData.Image.map((image) => (
              <div key={image._id} className="relative shadow-lg rounded-lg overflow-hidden">
         <Image
           src={`/api/uploads/${encodeURIComponent(image.image)}`}
      alt="Uploaded Image"
      width={300}
      height={200}
      className="object-cover"
    />
                <button
                  onClick={() => handleDeleteConfirmation(image._id)}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  <DeleteOutlined />
                </button>
                <button
                  onClick={() => handleImageClick(image.image)}
                  className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>No images found for this patient.</div>
        )}
  </div>  </div>
        <ToastContainer />
        {isPopupOpen && selectedImage && <PopupImage imageId={selectedImage} onClose={handleClosePopup} />}
      </div>
    </div>
  );
}

