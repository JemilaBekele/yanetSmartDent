"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DeleteOutlined, EditOutlined, EyeOutlined, ExclamationCircleOutlined, PlusOutlined, UserOutlined, NotificationOutlined } from "@ant-design/icons";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import UpdateAnnouncementModal from "./UpdateAnnouncementModal";
import Image from "next/image";

type AnnouncementData = {
  _id: string;
  title: string;
  description: string;
  isCritical: boolean;
  criticalExpiry?: string;
  createdBy: { username: string };
  createdAt: string;
};

type CompanyProfileData = {
  _id: string;
  companyName: string;
  address: string;
  phone: string;
  title: string;
  description: string;
  announcements: AnnouncementData[];
  createdBy: { username: string };
  createdAt: string;
  updatedAt: string;
};

type TabType = 'announcements' | 'company-profile';

export default function CompanyProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfileData[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('announcements');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementData | null>(null);

  const role = useMemo(() => session?.user?.role || "", [session]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [companyResponse, announcementsResponse] = await Promise.all([
          axios.get("/api/CompanyProfile"),
          axios.get("/api/CompanyProfile/Announcement")
        ]);

        if (companyResponse.status === 200) {
          setCompanyProfiles(companyResponse.data);
        } else {
          toast.error("Failed to fetch company profiles.");
        }

        if (announcementsResponse.status === 200) {
          setAnnouncements(announcementsResponse.data);
        } else {
          toast.error("Failed to fetch announcements.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const refreshAnnouncements = async () => {
    try {
      const response = await axios.get("/api/CompanyProfile/Announcement");
      if (response.status === 200) {
        setAnnouncements(response.data);
      }
    } catch (error) {
      console.error("Error refreshing announcements:", error);
      toast.error("Failed to refresh announcements.");
    }
  };

  // Separate critical and normal announcements
  const getSortedAnnouncements = () => {
    const critical = announcements.filter(ann => ann.isCritical && new Date(ann.criticalExpiry!) > new Date());
    const normal = announcements.filter(ann => !ann.isCritical || new Date(ann.criticalExpiry!) <= new Date());
    return { critical, normal };
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this announcement?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/CompanyProfile/Announcement/${announcementId}`);
      
      if (response.status === 200) {
        setAnnouncements(prev => prev.filter(ann => ann._id !== announcementId));
        toast.success("Announcement deleted successfully!");
      }
    } catch (error: any) {
      console.error("Error deleting announcement:", error);
      toast.error(error.response?.data?.message || "Failed to delete announcement");
    }
  };

  const startEditAnnouncement = (announcement: AnnouncementData) => {
    setEditingAnnouncement(announcement);
    setShowUpdateModal(true);
  };

  const handleEdit = (company: CompanyProfileData) => {
    router.push(`/admin/CompanyProfile/${company._id}`);
  };

  const handleDelete = async (companyId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this company profile?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/CompanyProfile/${companyId}`);
      if (response.status === 200) {
        setCompanyProfiles((prev) => prev.filter((company) => company._id !== companyId));
        toast.success("Company profile deleted successfully!");
      } else {
        toast.error(response.data.message || "Failed to delete company profile.");
      }
    } catch (error) {
      console.error("Error deleting company profile:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  // Small Announcement Card Component
  const SmallAnnouncementCard = ({ announcement, isCritical = false }: { announcement: AnnouncementData; isCritical?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <div 
        className={`rounded-xl p-4 transition-all duration-200 border ${
          isCritical 
            ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:shadow-md" 
            : "bg-white border-gray-200 hover:shadow-sm"
        }`}
      >
        {/* Header with avatar and title */}
        <div className="flex items-start space-x-3">
          {/* Profile Avatar */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isCritical ? "bg-red-500" : "bg-blue-500"
          }`}>
            <UserOutlined className="text-white text-sm" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and critical badge */}
            <div className="flex items-center justify-between mb-1">
              <h3 className={`font-semibold text-sm truncate ${
                isCritical ? "text-red-800" : "text-gray-800"
              }`}>
                {announcement.title}
              </h3>
              {isCritical && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2">
                  CRITICAL
                </span>
              )}
            </div>
            
            {/* Description with expand/collapse */}
            {announcement.description && (
              <div className="mb-2">
                <p className={`text-xs leading-relaxed ${
                  isCritical ? "text-red-700" : "text-gray-600"
                } ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {announcement.description}
                </p>
                {announcement.description.length > 100 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`text-xs font-medium mt-1 ${
                      isCritical ? "text-red-600 hover:text-red-800" : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
            
            {/* Meta information */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-3 text-xs">
                <span className={`${isCritical ? "text-red-600" : "text-gray-500"}`}>
                  {announcement.createdBy.username}
                </span>
                <span className={`${isCritical ? "text-red-500" : "text-gray-400"}`}>•</span>
                <span className={`${isCritical ? "text-red-600" : "text-gray-500"}`}>
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {/* Admin actions */}
              {(role === 'admin') && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => startEditAnnouncement(announcement)}
                    className={`p-1 rounded-full transition-colors ${
                      isCritical 
                        ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                        : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    }`}
                    title="Edit announcement"
                  >
                    <EditOutlined className="text-xs" />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                    className={`p-1 rounded-full transition-colors ${
                      isCritical 
                        ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                        : "text-red-600 hover:text-red-800 hover:bg-red-50"
                    }`}
                    title="Delete announcement"
                  >
                    <DeleteOutlined className="text-xs" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Critical expiry */}
            {isCritical && announcement.criticalExpiry && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <span className="text-xs font-medium text-red-600">
                  ⏰ Expires: {new Date(announcement.criticalExpiry).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AnnouncementsTab = () => {
    const { critical, normal } = getSortedAnnouncements();

    return (
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Announcements</h2>
            <p className="text-gray-600 text-sm">Important updates and company news</p>
          </div>
          {(role === 'admin') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center shadow-md hover:shadow-lg text-sm"
            >
              <PlusOutlined className="mr-1" />
              Add Announcement
            </button>
          )}
        </div>

        {/* Critical Announcements */}
        {critical.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <ExclamationCircleOutlined className="text-red-500 text-lg mr-2" />
              <h3 className="text-lg font-semibold text-red-700">Critical Announcements</h3>
            </div>
            <div className="space-y-3">
              {critical.map((announcement) => (
                <SmallAnnouncementCard 
                  key={announcement._id} 
                  announcement={announcement} 
                  isCritical={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Normal Announcements */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {critical.length > 0 ? 'Other Announcements' : 'All Announcements'}
          </h3>
          {normal.length > 0 ? (
            <div className="space-y-3">
              {normal.map((announcement) => (
                <SmallAnnouncementCard 
                  key={announcement._id} 
                  announcement={announcement} 
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gray-400 text-2xl">📢</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-1">
                No Announcements Yet
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm">
                {role === 'admin' 
                  ? "Get started by creating your first announcement to share important information with your team."
                  : "Check back later for important updates and announcements."
                }
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const ViewCompanyDetails = ({ company }: { company: CompanyProfileData }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
      <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">
                {company.companyName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{company.companyName}</h3>
              <p className="text-gray-500 text-sm">{company.title || "Company Profile"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {isExpanded ? 'Collapse' : 'Expand'}
            </span>
            <span className={`transform transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-6 space-y-4">
            {/* Company Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block mb-1 text-sm">Company Title</label>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                  {company.title || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block mb-1 text-sm">Phone Number</label>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                  {company.phone}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 block mb-1 text-sm">Company Address</label>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                {company.address}
              </p>
            </div>

            {company.description && (
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block mb-1 text-sm">Description</label>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed text-sm">
                  {company.description}
                </p>
              </div>
            )}

            {company.announcements && company.announcements.length > 0 && (
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 block mb-1 text-sm">Related Information</label>
                <div className="space-y-2">
                  {company.announcements.map((announcement) => (
                    <div key={announcement._id} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <h4 className="font-semibold text-blue-800 text-base mb-1">{announcement.title}</h4>
                      {announcement.description && (
                        <p className="text-blue-600 leading-relaxed text-sm">{announcement.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Created by {company.createdBy.username} • {new Date(company.createdAt).toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                {(role === 'admin') && (
                  <>
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium flex items-center shadow-sm hover:shadow-md text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(company);
                      }}
                    >
                      <EditOutlined className="mr-1" />
                      Edit Profile
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 font-medium flex items-center shadow-sm hover:shadow-md text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(company._id);
                      }}
                    >
                      <DeleteOutlined className="mr-1" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const CompanyProfileTab = () => {
    const hasExistingProfile = companyProfiles.length > 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Company Profile</h2>
            <p className="text-gray-600 text-sm">Manage your company information and details</p>
          </div>
          
          {(role === 'admin') && (
            <div className="flex space-x-3">
              {!hasExistingProfile ? (
                <Link
                  href="/admin/CompanyProfile/add"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center shadow-md hover:shadow-lg text-sm"
                >
                  <PlusOutlined className="mr-1" />
                  Create Company Profile
                </Link>
              ) : (
                <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-700 font-medium text-sm">Company Profile Active</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Company Profiles List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-500">Loading company profile...</p>
          </div>
        ) : !companyProfiles || companyProfiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-xl p-8 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-600 text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                No Company Profile Found
              </h3>
              <p className="text-yellow-600 mb-6 leading-relaxed text-sm">
                Get started by creating your company profile to manage company information and establish your presence.
              </p>
              {(role === 'admin') && (
                <Link
                  href="/admin/CompanyProfile/add"
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                >
                  Create Company Profile
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {companyProfiles.map((company) => (
              <ViewCompanyDetails key={company._id} company={company} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
       <div className="flex ml-9 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex flex-col justify-center items-center mb-6">
            <div className="relative">
              {/* <Image
                src="/assets/file.png"
                alt="Company Logo"
                width={80}
                height={80}
                priority
                className="drop-shadow-lg"
              /> */}
            </div>
            <h2 className="mt-3 text-2xl font-bold text-teal-700">Yanet Special Dental Clinic</h2>
            <p className="mt-1 text-base text-teal-600 font-medium">Your Smile is Our Priority</p>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Company Profile & Announcements
          </h2>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('announcements')}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <NotificationOutlined className="mr-2" />
                Announcements
                {announcements.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {announcements.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('company-profile')}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'company-profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserOutlined className="mr-2" />
                Company Profile
                {companyProfiles.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                    {companyProfiles.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'announcements' && <AnnouncementsTab />}
            {activeTab === 'company-profile' && <CompanyProfileTab />}
          </div>
        </div>

        {/* Modals */}
        <CreateAnnouncementModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={refreshAnnouncements}
        />

        <UpdateAnnouncementModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setEditingAnnouncement(null);
          }}
          onSuccess={refreshAnnouncements}
          announcement={editingAnnouncement}
        />

        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
}