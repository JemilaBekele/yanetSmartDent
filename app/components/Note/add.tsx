"use client";

import React, { useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type NoteFormProps = {
  params: {
    id: string; // Patient ID
  };
};

export default function NoteForm({ params }: NoteFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    noteText: "", // ✅ updated field name
  });

  const role = useMemo(() => session?.user?.role || "", [session]);

  const [errors] = useState<{ [key: string]: string }>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormType(null);

    try {
      const response = await fetch(`/api/Note/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteText: formData.noteText, // ✅ match the backend field name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData);
        setFormMessage(errorData.error || "An error occurred.");
        setFormType("error");
        return;
      }

      setFormMessage("Note created successfully!");
      setFormType("success");

      // Redirect based on role
        router.push(`/${role}/Note/all/${patientId}`);

    } catch (error) {
      console.error("Error submitting form:", error);
      setFormMessage("An unexpected error occurred. Please try again.");
      setFormType("error");
    }
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          {/* Patient Details */}
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>

          {/* Note Form */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Create Note</h1>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Note Field */}
              <div className="mt-4">
                <label htmlFor="noteText" className="block font-bold mb-2">
                  Note
                </label>
                <textarea
                  id="noteText"
                  name="noteText"
                  value={formData.noteText}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.noteText ? "border-red-500" : ""}`}
                  placeholder="Describe the patient's note"
                ></textarea>
                {errors.noteText && <p className="text-red-500">{errors.noteText}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-4"
              >
                Submit
              </button>
            </form>

            {/* Form Message */}
            {formMessage && (
              <p
                className={`mt-4 ${
                  formType === "success"
                    ? "bg-green-300 text-green-600"
                    : "bg-red-300 text-red-600"
                } p-2 rounded-md`}
              >
                {formMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
