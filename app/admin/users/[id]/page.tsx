"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { EditOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import Spinner from '@/app/components/ui/Spinner';
import Image from 'next/image';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Branch {
  _id: string;
  name: string;
  location: string;
  phone: string;
}

type User = {
  _id: string;
  username: string;
  phone: string;
  role: string;
  experience?: string;
  position?: string;
  image?: string;
  lead?: boolean;
  senior?: boolean;
  junior?: boolean;
  head?: boolean;
  labassistant?: boolean;
  labtechnician?: boolean;
  labhead?: boolean;
  receptionist?: boolean;
  customservice?: boolean;
  branch?: string;
  branchDetails?: Branch;
};

type UserDetailsProps = {
  params: {
    id: number;
  };
};

const UserDetails: React.FC<UserDetailsProps> = ({ params }) => {
  const userId = params.id;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get("/api/Branch");
        if (response.status === 200) {
          setBranches(response.data);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/see/${userId}`);
        const userData = response.data;
        
        // Find branch details if branch exists
        if (userData.branch && branches.length > 0) {
          const branchDetail = branches.find(branch => branch._id === userData.branch);
          userData.branchDetails = branchDetail;
        }
        
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Error fetching user details.");
      } finally {
        setLoading(false);
      }
    };

    if (branches.length > 0 || !user) {
      fetchUser();
    }
  }, [userId, branches]);

  const handleEdit = () => {
    router.push(`/admin/users/edit/${userId}`);
  };

  const handleDelete = async () => {
    const confirmDelete = async () => {
      try {
        await axios.delete(`/api/see/${userId}`);
        toast.success("User deleted successfully!");
        setTimeout(() => {
          router.push('/admin/users');
        }, 1500);
      } catch (err) {
        console.error("Error deleting user:", err);
        setError("Error deleting user.");
        toast.error("Error deleting user.");
      } finally {
        toast.dismiss();
      }
    }

    toast.warn(
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <DeleteOutlined className="text-red-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Confirm Deletion</h3>
            <p className="text-slate-600 text-sm">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-slate-700 mb-4">Are you sure you want to delete <strong>{user?.username}</strong>?</p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={() => toast.dismiss()}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete User
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        className: "custom-toast",
      }
    );
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await axios.post('/api/register/password/admin', { newPassword, userId });
      setMessage(`${response.data.message} password reset successfully!`);
      setNewPassword('');
      toast.success("Password reset successfully!");
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("Error resetting password.");
      toast.error("Error resetting password.");
    } finally {
      setResetLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Helper function to get role display name
  const getRoleDisplay = (role: string) => {
    if (role === 'reception') {
      return 'Front Desk Officer';
    }
    return role;
  };

  // Helper function to render role-specific badges
  const renderRoleBadges = () => {
    if (!user) return null;

    switch (user.role) {
      case 'doctor':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {user.lead && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Lead Doctor
              </span>
            )}
            {user.senior && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Senior Doctor
              </span>
            )}
            {user.junior && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Junior Doctor
              </span>
            )}
          </div>
        );
      case 'nurse':
        return user.head && (
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Head Nurse
            </span>
          </div>
        );
      case 'labratory':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {user.labassistant && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Lab Assistant
              </span>
            )}
            {user.labtechnician && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Lab Technician
              </span>
            )}
            {user.labhead && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Head Technician
              </span>
            )}
          </div>
        );
      case 'reception':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {user.receptionist && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Receptionist
              </span>
            )}
            {user.customservice && (
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
        <Spinner />
        <p className="mt-4 text-slate-600 font-light">Loading user details...</p>
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
        <button 
          onClick={() => router.push('/admin/users')}
          className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          Back to Users
        </button>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">User Not Found</h2>
        <p className="text-slate-600 mb-6">The requested user could not be found.</p>
        <button 
          onClick={() => router.push('/admin/users')}
          className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          Back to Users
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen mt-10 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => router.push('/admin/users')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Users
          </button>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">User Profile</h1>
          <p className="text-slate-600 font-light">View and manage user account details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="relative">
                  {user.image ? (
                    <Image 
                      src={user.image} 
                      alt={user.username}
                      width={120}
                      height={120}
                      className="rounded-2xl object-cover w-30 h-30 shadow-lg"
                    />
                  ) : (
                    <div className="w-30 h-30 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {getRoleDisplay(user.role)}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">{user.username}</h2>
                  <p className="text-slate-600 flex items-center gap-2 justify-center sm:justify-start">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {user.phone}
                  </p>
                  {renderRoleBadges()}
                </div>
              </div>

              {/* User Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Username</label>
                  <p className="text-lg text-slate-800 font-medium">{user.username}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Phone Number</label>
                  <p className="text-lg text-slate-800 font-medium">{user.phone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Role</label>
                  <p className="text-lg text-slate-800 font-medium capitalize">{getRoleDisplay(user.role)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Position</label>
                  <p className="text-lg text-slate-800 font-medium">
                    {user.position || <span className="text-slate-400">Not specified</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Experience</label>
                  <p className="text-lg text-slate-800 font-medium">
                    {user.experience ? `${user.experience} years` : <span className="text-slate-400">Not specified</span>}
                  </p>
                </div>
                
                {/* Branch Information */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Branch Assignment</label>
                  <p className="text-lg text-slate-800 font-medium">
                    {user.branchDetails ? (
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.branchDetails.name}</span>
                        <span className="text-sm text-slate-600">{user.branchDetails.location}</span>
                        <span className="text-sm text-slate-500">{user.branchDetails.phone}</span>
                      </div>
                    ) : user.branch ? (
                      <span className="text-slate-400">Branch details loading...</span>
                    ) : (
                      <span className="text-slate-400">Not assigned</span>
                    )}
                  </p>
                </div>
                
                {/* Role-specific details */}
                {user.role === 'doctor' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Doctor Level</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.lead && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Lead
                        </span>
                      )}
                      {user.senior && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Senior
                        </span>
                      )}
                      {user.junior && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Junior
                        </span>
                      )}
                      {!user.lead && !user.senior && !user.junior && (
                        <span className="text-slate-400 text-sm">No level specified</span>
                      )}
                    </div>
                  </div>
                )}
                
                {user.role === 'nurse' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Nurse Level</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.head && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Head Nurse
                        </span>
                      )}
                      {!user.head && (
                        <span className="text-slate-400 text-sm">No level specified</span>
                      )}
                    </div>
                  </div>
                )}
                
                {user.role === 'labratory' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Laboratory Role</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.labassistant && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Lab Assistant
                        </span>
                      )}
                      {user.labtechnician && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Lab Technician
                        </span>
                      )}
                      {user.labhead && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Head Technician
                        </span>
                      )}
                      {!user.labassistant && !user.labtechnician && !user.labhead && (
                        <span className="text-slate-400 text-sm">No role specified</span>
                      )}
                    </div>
                  </div>
                )}
                
                {user.role === 'reception' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Front Desk Role</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.receptionist && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Receptionist
                        </span>
                      )}
                      {user.customservice && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                          Customer Service
                        </span>
                      )}
                      {!user.receptionist && !user.customservice && (
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
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-3 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex-1"
                >
                  <DeleteOutlined />
                  Delete User
                </button>
              </div>
            </div>
          </div>

          {/* Reset Password Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 h-fit">
              <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Reset Password
              </h3>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-slate-700 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <>
                      <Spinner />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset Password
                    </>
                  )}
                </button>
              </form>

              {message && (
                <div className="mt-4 p-4 bg-green-50/80 border border-green-200 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-green-700">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">{message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
    </div>
  );
};

export default UserDetails;