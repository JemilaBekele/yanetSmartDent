"use client";

import React, { useState, useEffect } from "react";
import { EditOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-toastify";

type AnnouncementData = {
  _id: string;
  title: string;
  description: string;
  isCritical: boolean;
  criticalExpiry?: string;
  createdBy: { username: string };
  createdAt: string;
};

type UpdateAnnouncementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  announcement: AnnouncementData | null;
};

type AnnouncementFormData = {
  title: string;
  description: string;
  isCritical: boolean;
  criticalExpiry: string;
};

export default function UpdateAnnouncementModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  announcement 
}: UpdateAnnouncementModalProps) {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: "",
    description: "",
    isCritical: false,
    criticalExpiry: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        description: announcement.description,
        isCritical: announcement.isCritical,
        criticalExpiry: announcement.criticalExpiry 
          ? new Date(announcement.criticalExpiry).toISOString().split('T')[0] + 'T' + new Date(announcement.criticalExpiry).toTimeString().slice(0, 5)
          : ""
      });
    }
  }, [announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!announcement) return;

    if (!formData.title.trim()) {
      toast.error("Announcement title is required");
      return;
    }

    if (formData.isCritical && !formData.criticalExpiry) {
      toast.error("Critical expiry date is required for critical announcements");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.patch(`/api/CompanyProfile/Announcement/${announcement._id}`, formData);
      
      if (response.status === 200) {
        toast.success("Announcement updated successfully!");
        setFormData({
          title: "",
          description: "",
          isCritical: false,
          criticalExpiry: ""
        });
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("Error updating announcement:", error);
      toast.error(error.response?.data?.message || "Failed to update announcement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      isCritical: false,
      criticalExpiry: ""
    });
    onClose();
  };

  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Edit Announcement</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                placeholder="Enter announcement title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Announcement Description
              </label>
              <textarea
                placeholder="Enter announcement description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <input
                type="checkbox"
                id="isCritical"
                checked={formData.isCritical}
                onChange={(e) => setFormData(prev => ({ ...prev, isCritical: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isCritical" className="text-sm font-medium text-gray-700">
                Mark as Critical Announcement
              </label>
            </div>
            
            {formData.isCritical && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Critical Expiry Date and Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.criticalExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, criticalExpiry: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                  required={formData.isCritical}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Critical announcements will be displayed prominently until this date
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-semibold text-blue-800 text-sm mb-2">Announcement Details</h4>
              <div className="text-xs text-blue-600 space-y-1">
                <p>Created by: {announcement.createdBy.username}</p>
                <p>Created on: {new Date(announcement.createdAt).toLocaleDateString()}</p>
                {announcement.isCritical && announcement.criticalExpiry && (
                  <p>Original expiry: {new Date(announcement.criticalExpiry).toLocaleString()}</p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <EditOutlined className="mr-2" />
                    Update Announcement
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}