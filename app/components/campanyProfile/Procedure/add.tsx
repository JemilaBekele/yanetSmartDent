"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProcedureForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set new height based on scrollHeight with a max limit
      const newHeight = Math.min(textarea.scrollHeight, 300); // Max 300px
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight >= 300 ? "auto" : "hidden";
    }
  };

  // Adjust textarea height when description changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [formData.description]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormType(null);

    if (!validateForm()) {
      setFormMessage("Please fill in all required fields");
      setFormType("error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/Procedure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setFormMessage(result.message || "Failed to create procedure.");
        setFormType("error");
        return;
      }

      setFormMessage("Procedure created successfully!");
      setFormType("success");

      // Redirect after success
      setTimeout(() => {
        if (role === "admin") {
          router.push("/admin/Procedure");
        } else {
          router.push("/procedure");
        }
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormMessage("An unexpected error occurred.");
      setFormType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen mt-9 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Procedure and Protocols
          </h1>
          <p className="text-gray-600">
            Add a new procedure with a title and description.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Procedure Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.title
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter procedure title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Description
                  <span className="text-gray-400 text-xs font-normal ml-2">
                    (Auto-expands as you type)
                  </span>
                </label>
                <textarea
                  ref={textareaRef}
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none min-h-[120px]"
                  placeholder="Enter description (optional)..."
                  style={{
                    minHeight: "120px",
                    maxHeight: "300px",
                  }}
                  rows={3}
                />
                <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                  <span>
                    {formData.description.length > 0 && (
                      <>
                        {formData.description.split('\n').length} line
                        {formData.description.split('\n').length !== 1 ? 's' : ''}
                      </>
                    )}
                  </span>
                  <span>
                    {formData.description.length}/5000 characters
                  </span>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Procedure"
                  )}
                </button>
              </div>
            </form>

            {/* Feedback Message */}
            {formMessage && (
              <div
                className={`mt-6 p-4 rounded-lg border ${
                  formType === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2 text-lg">
                    {formType === "success" ? "✅" : "❌"}
                  </span>
                  {formMessage}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}