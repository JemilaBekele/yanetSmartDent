'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  Region:'',
  Woreda:'',
  disablity: false,
  credit: false
};

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
    const checked = (e.target as HTMLInputElement).checked; // Narrow to HTMLInputElement for checkbox
  
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value, // Use `checked` for checkboxes
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
        router.push(`/reception/card/add/${patientId}`);
      } else {
        setError(result.error);
        setSuccess(null);
      }
    } catch {
      setError('An error occurred while creating the patient');
      setSuccess(null);
    }
  };

  const inputFields = [
    { id: 'cardno', label: 'Card Number', type: 'text', required: true },
    { id: 'firstname', label: 'Name', type: 'text', minLength: 3, maxLength: 50, required: true },
    { id: 'age', label: 'Age', type: 'number', required: true },
    { id: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
    { id: 'Town', label: 'Town', type: 'text',maxLength: 50 },
    { id: 'KK', label: 'KK', type: 'text',  maxLength: 50 },
    { id: 'HNo', label: 'House No', type: 'text', maxLength: 50 },
    { id: 'Region', label: 'Region', type: 'text',  maxLength: 50 },
    { id: 'Woreda', label: 'Woreda', type: 'text', maxLength: 50 },
  ];

  return (
    <div className="flex ml-7 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="p-6 bg-white rounded shadow-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Register Patient</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inputFields.map(({ id, label, type, ...rest }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}:</label>
                  <input
                    id={id}
                    name={id}
                    type={type}
                    value={formData[id as keyof FormData] as string}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...rest}
                  />
                </div>
              ))}
              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Sex:</label>
                <select
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                id="credit"
                name="credit"
                type="checkbox"
                checked={formData.credit}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="credit" className="ml-2 block text-sm text-gray-700">Use Credit</label>
            </div>
            <div className="flex items-center">
              <input
                id="disablity"
                name="disablity"
                type="checkbox"
                checked={formData.disablity}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="disablity" className="ml-2 block text-sm text-gray-700"> Disability</label>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Register
            </button>
            {error && <p className="mt-4 text-center bg-red-200 text-red-600">{error}</p>}
            {success && <p className="mt-4 text-center bg-green-200 text-green-600">{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientForm;
