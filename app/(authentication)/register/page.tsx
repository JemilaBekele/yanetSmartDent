"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

const UserForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "",
    phone: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const res = await fetch("/api/register", { // Adjust endpoint to match your API route
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const response = await res.json();
      setErrorMessage(response.message);
    } else {
      router.refresh();
      router.push("/");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        method="post"
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h1 className="text-2xl font-semibold mb-4">Create New User</h1>

        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          onChange={handleChange}
          required
          value={formData.username}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mt-4">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          onChange={handleChange}
          required
          value={formData.password}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mt-4">
          Role
        </label>
        <input
          id="role"
          name="role"
          type="text"
          onChange={handleChange}
          required
          value={formData.role}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mt-4">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          onChange={handleChange}
          required
          value={formData.phone}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm"
        >
          Create User
        </button>

        {errorMessage && (
          <p className="mt-4 text-red-500 text-sm">{errorMessage}</p>
        )}
      </form>
    </div>
  );
};

export default UserForm;
