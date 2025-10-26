"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

type User = {
  _id: string;
  username: string;
  phone: string;
  role: string;
  image?: string; // Optional image field
};

type UserDetailsProps = {
  params: {
    id: string;
  };
};

const EditUser: React.FC<UserDetailsProps> = ({ params }) => {
  const userId = params.id;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    image: '' // Add image field
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        try {
          const response = await axios.get(`/api/see/${userId}`);
          setUser(response.data);
          setFormData({
            username: response.data.username,
            phone: response.data.phone,
            image: response.data.image || '', // Set image if it exists
          });
        } catch (err) {
          console.error("Error fetching user:", err);
          setError("Error fetching user details.");
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formDataToSubmit = new FormData();
    formDataToSubmit.append('username', formData.username);
    formDataToSubmit.append('phone', formData.phone);

    if (selectedImage) {
      formDataToSubmit.append('image', selectedImage); // Append image if selected
    }

    try {
      await axios.patch(`/api/see/userupdate/${userId}`, formDataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Determine the dynamic route based on the user's role
      const roleBasedRoute = user?.role === "admin"
        ? `/admin/profile`
        : user?.role === "doctor"
        ? `/doctor/profile`
        : `/reception/profile`;

      router.push(roleBasedRoute);
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Error updating user.");
    }
  };

  const handleCancel = () => {
    const roleBasedRoute = user?.role === "admin"
      ? `/admin/profile`
      : user?.role === "doctor"
      ? `/doctor/profile`
      : `/reception/profile`;

    router.push(roleBasedRoute);
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="max-w-md w-full bg-gradient-to-r from-white-200 via-blue-200 to-white-200 rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Edit Profile</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-lg font-semibold text-gray-600 mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block text-lg font-semibold text-gray-600 mb-2" htmlFor="phone">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block text-lg font-semibold text-gray-600 mb-2" htmlFor="image">
              Profile Image
            </label>
            <input
              type="file"
              name="image"
              id="image"
              onChange={handleImageChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
            />
          </div>

          <div className="flex justify-center gap-6 mt-8">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-full text-lg font-bold shadow-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Update
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-500 text-white rounded-full text-lg font-bold shadow-lg hover:bg-gray-600 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
