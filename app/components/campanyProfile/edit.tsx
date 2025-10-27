"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

type AnnouncementData = {
  _id?: string;
  title: string;
  description: string;
};

type CompanyProfileData = {
  _id: string;
  companyName: string;
  address: string;
  phone: string;
  title: string;
  description: string;
  announcements: AnnouncementData[];
};

export default function EditCompanyProfileForm() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  
  // Safe access to params with null check
  const companyId = params?.id as string;

  const [formData, setFormData] = useState<CompanyProfileData>({
    _id: "",
    companyName: "",
    address: "",
    phone: "",
    title: "",
    description: "",
    announcements: [],
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    description: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const role = useMemo(() => session?.user?.role || "", [session]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch company profile data on component mount
  useEffect(() => {
    async function fetchCompanyProfile() {
      if (!companyId) {
        setFormMessage("Company profile ID is missing");
        setFormType("error");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/CompanyProfile/${companyId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch company profile");
        }

        const companyData = await response.json();
        setFormData({
          _id: companyData._id,
          companyName: companyData.companyName || "",
          address: companyData.address || "",
          phone: companyData.phone || "",
          title: companyData.title || "",
          description: companyData.description || "",
          announcements: companyData.announcements?.map((ann: any) => ({
            _id: ann._id,
            title: ann.title || "",
            description: ann.description || "",
          })) || [],
        });
      } catch (error) {
        console.error("Error fetching company profile:", error);
        setFormMessage("Failed to load company profile data");
        setFormType("error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanyProfile();
  }, [companyId]);

  // Handle input changes for company profile
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle input changes for new announcement
  const handleAnnouncementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAnnouncement(prev => ({ ...prev, [name]: value }));
  };

  // Add announcement to the list
  const addAnnouncement = () => {
    if (!newAnnouncement.title.trim()) {
      setFormMessage("Announcement title is required");
      setFormType("error");
      return;
    }

    setFormData(prev => ({
      ...prev,
      announcements: [...prev.announcements, {
        title: newAnnouncement.title,
        description: newAnnouncement.description
      }]
    }));

    // Reset announcement form
    setNewAnnouncement({ title: "", description: "" });
    setFormMessage("Announcement added successfully!");
    setFormType("success");
    setTimeout(() => setFormMessage(null), 3000);
  };

  // Remove announcement from list
  const removeAnnouncement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      announcements: prev.announcements.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormType(null);

    if (!companyId) {
      setFormMessage("Company profile ID is missing");
      setFormType("error");
      return;
    }

    if (!validateForm()) {
      setFormMessage("Please fill in all required fields");
      setFormType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/CompanyProfile/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error updating company profile:", result);
        setFormMessage(result.message || "An error occurred while updating the company profile.");
        setFormType("error");
        return;
      }

      setFormMessage("Company profile updated successfully!");
      setFormType("success");

      // Redirect based on role after delay
      setTimeout(() => {
        if (role === "admin") {
          router.push("/admin/CompanyProfile");
        } else {
          router.push("/company-profiles");
        }
      }, 2000);

    } catch (error) {
      console.error("Error submitting form:", error);
      setFormMessage("An unexpected error occurred. Please try again.");
      setFormType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show error if companyId is missing
  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Company Profile</h2>
              <p className="text-gray-600 mb-6">Company profile ID is missing or invalid.</p>
              <button
                onClick={() => router.back()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading company profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-9 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Company Profile
          </h1>
          <p className="text-gray-600">
            Update your company details and announcements
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.companyName ? "border-red-500 ring-2 ring-red-200" : "border-gray-300"
                    }`}
                    placeholder="Enter company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠</span>
                      {errors.companyName}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.address ? "border-red-500 ring-2 ring-red-200" : "border-gray-300"
                    }`}
                    placeholder="Enter company address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠</span>
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.phone ? "border-red-500 ring-2 ring-red-200" : "border-gray-300"
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠</span>
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter company title"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Describe your company..."
                />
              </div>

              {/* Announcements Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">informations</h3>
                
                {/* Add Announcement Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                         Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={newAnnouncement.title}
                        onChange={handleAnnouncementChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter announcement title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={newAnnouncement.description}
                        onChange={handleAnnouncementChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addAnnouncement}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2">+</span>
                    Add 
                  </button>
                </div>

                {/* Announcements List */}
                {formData.announcements.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">
                      {formData.announcements.some(ann => ann._id) ? "Existing :" : "Added :"}
                    </h4>
                    {formData.announcements.map((announcement, index) => (
                      <div key={announcement._id || index} className="flex items-center justify-between bg-blue-50 p-4 rounded-md border border-blue-200">
                        <div className="flex-1">
                          <div className="font-medium text-blue-800">{announcement.title}</div>
                          {announcement.description && (
                            <div className="text-sm text-blue-600 mt-1">{announcement.description}</div>
                          )}
                          {announcement._id && (
                            <div className="text-xs text-gray-500 mt-1">Existing announcement</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAnnouncement(index)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200 ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Company Profile"
                  )}
                </button>
              </div>
            </form>

            {/* Form Message */}
            {formMessage && (
              <div className={`mt-6 p-4 rounded-lg border ${
                formType === "success" 
                  ? "bg-green-50 border-green-200 text-green-700" 
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
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