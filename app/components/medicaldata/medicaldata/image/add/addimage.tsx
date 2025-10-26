"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PatientComponent from "@/app/components/patient/PatientComponent";
import Image from "next/image";
import { useSession } from "next-auth/react";

type ImageFormProps = {
  params: {
    id: string;
  };
};

export default function ImageForm({ params }: ImageFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const role = useMemo(() => session?.user?.role || "", [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    uploadedFiles.forEach((file, index) => {
      const inputName = index === 0 ? "image" : `image_${index}`;
      formData.append(inputName, file);
    });

    try {
      const response = await fetch(`/api/patient/image/${patientId}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Failed to submit form:", await response.text());
        return;
      }

      setFormSubmitted(true);

      // Redirect based on the role
      if (role === "doctor") {
        router.push(`/doctor/medicaldata/image/all/${patientId}`);
      } else if (role === "admin") {
        router.push(`/admin/medicaldata/image/all/${patientId}`);
      } else if (role === "reception") {
        router.push(`/reception/image/all/${patientId}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...fileArray]);

      const previewUrls = fileArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previewUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-8">
            <div className="w-1/3 p-4">
              <PatientComponent params={params} />
            </div>

            <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Upload Images</h2>
              <div className="mb-4">
                <label htmlFor="image" className="block mb-2">Select Images:</label>
                <input
                  type="file"
                  name="images"
                  id="images"
                  multiple
                  onChange={handleInputChange}
                  className="border p-2 rounded-lg shadow-md w-full"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
              >
                Submit
              </button>
              {formSubmitted && <p className="mt-4 text-green-500">Images uploaded successfully!</p>}

              {/* Image Previews with Remove Button */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      width={500}
                      height={500}
                      className="rounded-lg shadow-md object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      onClick={() => handleRemoveImage(index)}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
