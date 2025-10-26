'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

type FormData = {
  cardno: string;
  firstname: string;
  age: string;
  sex: string;
  Town: string;
  KK: string;
  HNo: string;
  phoneNumber: string;
  description: string;
  credit: boolean;
  Region: string;
  Woreda: string;
  disablity: boolean;
};

const initialFormData: FormData = {
  cardno: '',
  firstname: '',
  age: '',
  sex: '',
  Town: '',
  KK: '',
  HNo: '',
  phoneNumber: '',
  description: '',
  Region: '',
  Woreda: '',
  disablity: false,
  credit: false
};

// ... (FormData type and initialFormData stay unchanged)

const PatientForm = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchHighestCardNumber = async () => {
      try {
        const res = await fetch("/api/patcaardsec");
        const data = await res.json();
        if (res.ok && data.highestCardNumber) {
          const newCardNo = String(Number(data.highestCardNumber) + 1);
          setFormData((prev) => ({ ...prev, cardno: newCardNo }));
        }
      } catch {
        console.error("Failed to fetch the highest card number");
      }
    };

    fetchHighestCardNumber();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/patient/registerdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        const patientId = result.savedPatient._id;
        setSuccess('Patient created successfully');
        setError(null);
        setFormData(initialFormData);
        router.push(`/user/${patientId}`);
      } else {
        setError(result.error);
        setSuccess(null);
      }
    } catch {
      setError('An error occurred while creating the patient');
      setSuccess(null);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      await signOut({ redirect: false });
      router.push('/');
    }
  };

  const inputFields = [
    { id: 'cardno', label: 'Card Number', type: 'text', required: true, disabled: true },
    { id: 'firstname', label: 'Name', type: 'text', minLength: 3, maxLength: 50, required: true },
    { id: 'age', label: 'Age', type: 'number', required: true },
    { id: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
    { id: 'Town', label: 'Town (Optional)', type: 'text', maxLength: 50, required: false },
    { id: 'KK', label: 'KK (Optional)', type: 'text', maxLength: 50, required: false },
    { id: 'HNo', label: 'House No (Optional)', type: 'text', maxLength: 50, required: false },
    { id: 'Region', label: 'Region (Optional)', type: 'text', maxLength: 50, required: false },
    { id: 'Woreda', label: 'Woreda (Optional)', type: 'text', maxLength: 50, required: false },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Register Patient</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Log Out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inputFields.map(({ id, label, type, required, disabled, ...rest }) => (
              <div key={id} className="space-y-2">
                <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  id={id}
                  name={id}
                  type={type}
                  value={formData[id as keyof FormData] as string}
                  onChange={handleChange}
                  disabled={disabled}
                  className={`block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                    ${formData[id as keyof FormData] ? 'border-gray-300' : 'border-gray-200'}`}
                  required={required}
                  {...rest}
                />
              </div>
            ))}

            <div className="space-y-2">
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                Sex <span className="text-red-500">*</span>
              </label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select sex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
          </div>

       

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Register Patient
          </button>

          {error && (
            <p className="mt-4 text-center bg-red-100 text-red-700 p-3 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="mt-4 text-center bg-green-100 text-green-700 p-3 rounded-lg">{success}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
