"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { EditOutlined } from '@ant-design/icons';
import Image from 'next/image';

type User = {
  _id: string;
  username: string;
  phone: string;
  role: string;
  image?: string;
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
      const roleBasedRoute = profile.role === "admin"
        ? `/admin/profile/${userId}`
        : profile.role === "doctor"
        ? `/doctor/profile/${userId}`
        : `/reception/profile/${userId}`; 
      router.push(roleBasedRoute);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return alert("Please fill in both fields.");
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
        closeModal();
      } else {
        setMessage(response.data.message || "Error changing password.");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage("Error changing password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!profile) return <div>User not found</div>;

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword((prev) => !prev);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-gradient-to-r from-white-200 via-blue-200 to-white-200 rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Profile</h1>
        {profile.image && (
          <div className="mb-4 flex justify-center">
            <Image
              src={profile.image}
              alt={profile.username}
              width={100}
              height={200}
              className="rounded-full w-32 h-32 mx-auto object-cover"
            />
          </div>
        )}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Name</h2>
          <p className="text-gray-800 text-lg">{profile.username}</p>
        </div>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Phone</h2>
          <p className="text-gray-800 text-lg">{profile.phone}</p>
        </div>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-600">Role</h2>
          <p className="text-gray-800 text-lg">{profile.role}</p>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full text-lg font-bold hover:bg-indigo-700 transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105"
          >
            <EditOutlined className="mr-2" />
            Edit Profile
          </button>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={openModal}
            className="inline-flex items-center px-3 py-3 bg-gray-600 text-white rounded-full text-lg font-bold hover:bg-gray-700 transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Custom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="mb-4 relative"> {/* Added relative positioning for button */}
                <label className="block text-gray-700">Current Password</label>
                <input
                  type={showCurrentPassword ? 'text' : 'password'} 
                  className="w-full p-2 border border-gray-300 rounded"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={toggleCurrentPasswordVisibility}
                  className="absolute inset-y-0 right-0 pt-4 flex items-center pr-3 text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  {showCurrentPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="mb-4 relative"> {/* Added relative positioning for button */}
                <label className="block text-gray-700">New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'} 
                  className="w-full p-2 border border-gray-300 rounded"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={toggleNewPasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pt-4 pr-3 text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-1 py-2 bg-blue-600 text-white rounded"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
            {message && (
              <div className="p-2 bg-blue-100 border border-blue-400 text-green-blue rounded-md">
                <strong>Success:</strong> {message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
