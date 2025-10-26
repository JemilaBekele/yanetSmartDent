"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Spinner from "@/app/components/ui/Spinner";

interface Branch {
  _id: string;
  name: string;
  location: string;
  phone: string;
}

type UserDetailsProps = {
  params: {
    id: number;
  };
};

const EditUser: React.FC<UserDetailsProps> = ({ params }) => {
  const userId = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    role: "",
    experience: "",
    position: "",
    lead: false,
    senior: false,
    junior: false,
    head: false,
    labassistant: false,
    labtechnician: false,
    labhead: false,
    receptionist: false,
    customservice: false,
    branch: "",
  });

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
    if (userId) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/see/${userId}`);
          const userData = response.data;
          setFormData({
            username: userData.username || "",
            phone: userData.phone || "",
            role: userData.role || "",
            experience: userData.experience || "",
            position: userData.position || "",
            lead: userData.lead || false,
            senior: userData.senior || false,
            junior: userData.junior || false,
            head: userData.head || false,
            labassistant: userData.labassistant || false,
            labtechnician: userData.labtechnician || false,
            labhead: userData.labhead || false,
            receptionist: userData.receptionist || false,
            customservice: userData.customservice || false,
            branch: userData.branch || "",
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

  const handleDoctorLevelChange = (level: 'lead' | 'senior' | 'junior', checked: boolean) => {
    if (checked) {
      setFormData((prevState) => ({
        ...prevState,
        lead: level === 'lead',
        senior: level === 'senior',
        junior: level === 'junior',
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [level]: false,
      }));
    }
  };

  const handleLabRoleChange = (role: 'labassistant' | 'labtechnician' | 'labhead', checked: boolean) => {
    if (checked) {
      setFormData((prevState) => ({
        ...prevState,
        labassistant: role === 'labassistant',
        labtechnician: role === 'labtechnician',
        labhead: role === 'labhead',
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [role]: false,
      }));
    }
  };

  const handleReceptionRoleChange = (role: 'receptionist' | 'customservice', checked: boolean) => {
    if (checked) {
      setFormData((prevState) => ({
        ...prevState,
        receptionist: role === 'receptionist',
        customservice: role === 'customservice',
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [role]: false,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      
      // Handle doctor levels
      if (name === 'lead' || name === 'senior' || name === 'junior') {
        handleDoctorLevelChange(name as 'lead' | 'senior' | 'junior', checked);
      } 
      // Handle lab roles
      else if (name === 'labassistant' || name === 'labtechnician' || name === 'labhead') {
        handleLabRoleChange(name as 'labassistant' | 'labtechnician' | 'labhead', checked);
      }
      // Handle reception roles
      else if (name === 'receptionist' || name === 'customservice') {
        handleReceptionRoleChange(name as 'receptionist' | 'customservice', checked);
      }
      else {
        // For other checkboxes (head nurse), normal behavior
        setFormData((prevState) => ({
          ...prevState,
          [name]: checked,
        }));
      }
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    // Validate doctor level selection
    if (formData.role === "doctor") {
      const doctorLevels = [formData.lead, formData.senior, formData.junior];
      const selectedDoctorLevels = doctorLevels.filter(Boolean);
      if (selectedDoctorLevels.length > 1) {
        setError("Please select only one doctor level.");
        setUpdating(false);
        return;
      }
    }

    // Validate lab role selection
    if (formData.role === "labratory") {
      const labRoles = [formData.labassistant, formData.labtechnician, formData.labhead];
      const selectedLabRoles = labRoles.filter(Boolean);
      if (selectedLabRoles.length > 1) {
        setError("Please select only one laboratory role.");
        setUpdating(false);
        return;
      }
    }

    // Validate reception role selection
    if (formData.role === "reception") {
      const receptionRoles = [formData.receptionist, formData.customservice];
      const selectedReceptionRoles = receptionRoles.filter(Boolean);
      if (selectedReceptionRoles.length > 1) {
        setError("Please select only one reception role.");
        setUpdating(false);
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("role", formData.role);
      if (formData.experience) formDataToSend.append("experience", formData.experience);
      if (formData.position) formDataToSend.append("position", formData.position);
      formDataToSend.append("lead", formData.lead.toString());
      formDataToSend.append("senior", formData.senior.toString());
      formDataToSend.append("junior", formData.junior.toString());
      formDataToSend.append("head", formData.head.toString());
      formDataToSend.append("labassistant", formData.labassistant.toString());
      formDataToSend.append("labtechnician", formData.labtechnician.toString());
      formDataToSend.append("labhead", formData.labhead.toString());
      formDataToSend.append("receptionist", formData.receptionist.toString());
      formDataToSend.append("customservice", formData.customservice.toString());
      if (formData.branch) formDataToSend.append("branch", formData.branch);

      const response = await axios.patch(`/api/register/${userId}`, formDataToSend);

      if (response.status === 200) {
        router.push("/admin/users");
      } else {
        console.error("Failed to update user.");
        setError("Failed to update user.");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Error updating user details.");
    } finally {
      setUpdating(false);
    }
  };

  const isSubmitDisabled = () => {
    if (formData.role === "doctor") {
      const doctorLevels = [formData.lead, formData.senior, formData.junior];
      const selectedDoctorLevels = doctorLevels.filter(Boolean);
      return selectedDoctorLevels.length > 1;
    }
    
    if (formData.role === "labratory") {
      const labRoles = [formData.labassistant, formData.labtechnician, formData.labhead];
      const selectedLabRoles = labRoles.filter(Boolean);
      return selectedLabRoles.length > 1;
    }
    
    if (formData.role === "reception") {
      const receptionRoles = [formData.receptionist, formData.customservice];
      const selectedReceptionRoles = receptionRoles.filter(Boolean);
      return selectedReceptionRoles.length > 1;
    }
    
    return false;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-slate-600 font-light">Loading user details...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen mt-5 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">Edit User Profile</h1>
          <p className="text-slate-600 font-light">Update user information and professional details</p>
        </div>

        {/* Form Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="username">
                    Username
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-slate-700"
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-slate-700"
                    type="text"
                    id="phone"
                    name="phone"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Professional Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="role">
                    Role
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all duration-200 text-slate-700 appearance-none"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled className="text-slate-400">Select Role</option>
                    <option value="admin" className="text-slate-700">Admin</option>
                    <option value="reception" className="text-slate-700">Front Desk Officer</option>
                    <option value="doctor" className="text-slate-700">Doctor</option>
                    <option value="nurse" className="text-slate-700">Nurse</option>
                    <option value="User" className="text-slate-700">User</option>
                    <option value="labratory" className="text-slate-700">Laboratory</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="position">
                    Position
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-slate-700"
                    type="text"
                    id="position"
                    name="position"
                    placeholder="Job position"
                    value={formData.position}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="experience">
                    Experience (years)
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-slate-700"
                    type="number"
                    id="experience"
                    name="experience"
                    placeholder="Years of experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min={0}
                    max={50}
                  />
                </div>
                
                {/* Branch Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="branch">
                    Branch Assignment
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all duration-200 text-slate-700 appearance-none"
                    id="branch"
                    name="branch"
                    onChange={handleChange}
                    value={formData.branch}
                  >
                    <option value="" className="text-slate-400">Select Branch (Optional)</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id} className="text-slate-700">
                        {branch.name} - {branch.location}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Assign this user to a specific branch (optional)
                  </p>
                </div>
              </div>

              {/* Role-based Checkboxes */}
              {formData.role === "doctor" && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-md font-medium text-slate-700">Doctor Level</h3>
                  <p className="text-sm text-slate-500 mb-3">Select one level only</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="lead"
                        checked={formData.lead}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-800 bg-slate-100 border-slate-300 rounded focus:ring-slate-800 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Lead</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="senior"
                        checked={formData.senior}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-800 bg-slate-100 border-slate-300 rounded focus:ring-slate-800 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Senior</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="junior"
                        checked={formData.junior}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-800 bg-slate-100 border-slate-300 rounded focus:ring-slate-800 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Junior</span>
                    </label>
                  </div>
                  {(formData.lead && formData.senior) || (formData.lead && formData.junior) || (formData.senior && formData.junior) ? (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Please select only one doctor level
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {formData.role === "nurse" && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-md font-medium text-slate-700">Nurse Level</h3>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="head"
                        checked={formData.head}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-800 bg-slate-100 border-slate-300 rounded focus:ring-slate-800 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Head Nurse</span>
                    </label>
                  </div>
                </div>
              )}

              {formData.role === "labratory" && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-md font-medium text-slate-700">Laboratory Role</h3>
                  <p className="text-sm text-slate-500 mb-3">Select one role only</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="labassistant"
                        checked={formData.labassistant}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-800 bg-slate-100 border-slate-300 rounded focus:ring-slate-800 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Lab Assistant</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="labtechnician"
                        checked={formData.labtechnician}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-800 bg-slate-100 border-slate-300 rounded focus:ring-slate-800 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Lab Technician</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="labhead"
                        checked={formData.labhead}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-800 bg-slate-100 border-slate-300 rounded focus:ring-slate-800 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Head Technician</span>
                    </label>
                  </div>
                  {(formData.labassistant && formData.labtechnician) || 
                   (formData.labassistant && formData.labhead) || 
                   (formData.labtechnician && formData.labhead) ? (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Please select only one laboratory role
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {formData.role === "reception" && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-md font-medium text-slate-700">Reception Role</h3>
                  <p className="text-sm text-slate-500 mb-3">Select one role only</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="receptionist"
                        checked={formData.receptionist}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-800 bg-slate-100 border-slate-300 rounded focus:ring-slate-800 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Receptionist</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="customservice"
                        checked={formData.customservice}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-800 bg-slate-100 border-slate-300 rounded focus:ring-slate-800 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Customer Service</span>
                    </label>
                  </div>
                  {formData.receptionist && formData.customservice ? (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Please select only one reception role
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <button
                type="button"
                onClick={() => router.push("/admin/users")}
                className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating || isSubmitDisabled()}
                className="px-12 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <Spinner />
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update User
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-8 p-4 bg-red-50/80 border border-red-200 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 text-red-700">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditUser;