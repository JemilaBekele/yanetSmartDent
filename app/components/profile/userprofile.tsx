"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { EditOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Branch = {
  _id: string;
  name: string;
  location: string;
  phone: string;
};

type User = {
  _id: string;
  username: string;
  phone: string;
  role: string;
  image?: string;
  experience?: number | null;
  position?: string | null;
  lead?: boolean;
  senior?: boolean;
  junior?: boolean;
  head?: boolean;
  labassistant?: boolean;
  labtechnician?: boolean;
  labhead?: boolean;
  receptionist?: boolean;
  customservice?: boolean;
  branch?: Branch | null;
};

const Profile = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const userId = useMemo(() => {
    return session?.user?.id || null;
  }, [session]);

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false); 
  const [showNewPassword, setShowNewPassword] = useState(false); 
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        try {
          const response = await axios.get(`/api/see/${userId}`);
          setProfile(response.data);
        } catch (err) {
          console.error("Error fetching user:", err);
          setError("Error fetching user details.");
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setLoading(false);
      setError("User ID is not available.");
    }
  }, [userId]);

  const handleEdit = () => {
    if (userId && profile?.role) {
      let roleBasedRoute = '';
      
      if (profile.role === "admin") {
        roleBasedRoute = `/admin/profile/${userId}`;
      } else if (profile.role === "doctor") {
        roleBasedRoute = `/doctor/profile/${userId}`;
      } else if (profile.role === "reception" || profile.role === "frontdesk") {
        if (profile.username === "dctoror" && profile.lead === true) {
          roleBasedRoute = `/reception/profile/${userId}`;
        } else {
          roleBasedRoute = `/reception/profile/${userId}`;
        }
      } else {
        roleBasedRoute = `/reception/profile/${userId}`;
      }
      
      router.push(roleBasedRoute);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMessage(null);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return toast.error("Please fill in both fields.");
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await axios.post(`/api/see/password/${userId}`, {
        currentPassword,
        newPassword,
        userId,
      });

      if (response.status === 200) {
        setMessage("Password changed successfully!");
        toast.success("Password changed successfully!");
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        setMessage(response.data.message || "Error changing password.");
        toast.error(response.data.message || "Error changing password.");
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      const errorMessage = error.response?.data?.message || "Error changing password.";
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get role display name
  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'reception': 'Front Desk Officer',
      'frontdesk': 'Front Desk Officer',
      'doctor': 'Medical Doctor',
      'admin': 'Administrator',
      'nurse': 'Nurse',
      'labratory': 'Laboratory Staff'
    };
    return roleMap[role] || role;
  };

  // Helper function to render role-specific badges
  const renderRoleBadges = () => {
    if (!profile) return null;

    switch (profile.role) {
      case 'doctor':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.lead && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Lead Doctor
              </span>
            )}
            {profile.senior && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Senior Doctor
              </span>
            )}
            {profile.junior && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Junior Doctor
              </span>
            )}
          </div>
        );
      case 'nurse':
        return profile.head && (
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Head Nurse
            </span>
          </div>
        );
      case 'labratory':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.labassistant && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Lab Assistant
              </span>
            )}
            {profile.labtechnician && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Lab Technician
              </span>
            )}
            {profile.labhead && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Head Technician
              </span>
            )}
          </div>
        );
      case 'reception':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.receptionist && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Receptionist
              </span>
            )}
            {profile.customservice && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                Customer Service
              </span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600 font-light">Loading your profile...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Profile Not Found</h2>
        <p className="text-slate-600">Your profile could not be found.</p>
      </div>
    </div>
  );

  return (    <div className="flex ml-9 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
    <div className="min-h-screen  bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">My Profile</h1>
          <p className="text-slate-600 font-light">View and manage your account details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="relative">
                  {profile.image ? (
                    <Image 
                      src={profile.image} 
                      alt={profile.username}
                      width={120}
                      height={120}
                      className="rounded-2xl object-cover w-30 h-30 shadow-lg"
                    />
                  ) : (
                    <div className="w-30 h-30 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-white">
                        {profile.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {getRoleDisplay(profile.role)}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">{profile.username}</h2>
                  <p className="text-slate-600 flex items-center gap-2 justify-center sm:justify-start">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {profile.phone}
                  </p>
                  {renderRoleBadges()}
                </div>
              </div>

              {/* User Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Username</label>
                  <p className="text-lg text-slate-800 font-medium">{profile.username}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Phone Number</label>
                  <p className="text-lg text-slate-800 font-medium">{profile.phone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Role</label>
                  <p className="text-lg text-slate-800 font-medium capitalize">{getRoleDisplay(profile.role)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Position</label>
                  <p className="text-lg text-slate-800 font-medium">
                    {profile.position || <span className="text-slate-400">Not specified</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Experience</label>
                  <p className="text-lg text-slate-800 font-medium">
                    {profile.experience ? `${profile.experience} years` : <span className="text-slate-400">Not specified</span>}
                  </p>
                </div>
                
                {/* Branch Information */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Branch Assignment</label>
                  <p className="text-lg text-slate-800 font-medium">
                    {profile.branch ? (
                      <div className="flex flex-col">
                        <span className="font-semibold">{profile.branch.name}</span>
                        {profile.branch.location && (
                          <span className="text-sm text-slate-600">{profile.branch.location}</span>
                        )}
                        {profile.branch.phone && (
                          <span className="text-sm text-slate-500">{profile.branch.phone}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">Not assigned</span>
                    )}
                  </p>
                </div>
                
                {/* Role-specific details */}
                {profile.role === 'doctor' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Doctor Level</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.lead && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Lead
                        </span>
                      )}
                      {profile.senior && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Senior
                        </span>
                      )}
                      {profile.junior && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Junior
                        </span>
                      )}
                      {!profile.lead && !profile.senior && !profile.junior && (
                        <span className="text-slate-400 text-sm">No level specified</span>
                      )}
                    </div>
                  </div>
                )}
                
                {profile.role === 'nurse' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Nurse Level</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.head && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Head Nurse
                        </span>
                      )}
                      {!profile.head && (
                        <span className="text-slate-400 text-sm">No level specified</span>
                      )}
                    </div>
                  </div>
                )}
                
                {profile.role === 'labratory' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Laboratory Role</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.labassistant && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Lab Assistant
                        </span>
                      )}
                      {profile.labtechnician && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Lab Technician
                        </span>
                      )}
                      {profile.labhead && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Head Technician
                        </span>
                      )}
                      {!profile.labassistant && !profile.labtechnician && !profile.labhead && (
                        <span className="text-slate-400 text-sm">No role specified</span>
                      )}
                    </div>
                  </div>
                )}
                
                {profile.role === 'reception' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Front Desk Role</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.receptionist && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Receptionist
                        </span>
                      )}
                      {profile.customservice && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                          Customer Service
                        </span>
                      )}
                      {!profile.receptionist && !profile.customservice && (
                        <span className="text-slate-400 text-sm">No role specified</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                <button
                  onClick={handleEdit}
                  className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex-1"
                >
                  <EditOutlined />
                  Edit Profile
                </button>
                <button
                  onClick={openModal}
                  className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 h-fit">
              <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                Update your password to keep your account secure.
              </p>
              <button
                onClick={openModal}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Change Password</h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-slate-700 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrentPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-slate-700 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>

            {message && (
              <div className={`mt-4 p-4 rounded-xl backdrop-blur-sm ${
                message.includes('successfully') 
                  ? 'bg-green-50/80 border border-green-200' 
                  : 'bg-red-50/80 border border-red-200'
              }`}>
                <div className={`flex items-center gap-3 ${
                  message.includes('successfully') ? 'text-green-700' : 'text-red-700'
                }`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                      message.includes('successfully') 
                        ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    } />
                  </svg>
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div></div></div>
  );
};

export default Profile;