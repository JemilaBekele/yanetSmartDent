"use client";
import { useState, useEffect , useMemo} from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';

type PatientDetailsProps = {
  params: {
    id: string;
  };
};

const CreateCardPage: React.FC<PatientDetailsProps> = ({ params }) => {
  const patientId = params.id;
  const { data: session } = useSession();  // Patient ID from URL
  const [cardprice, setCardPrice] = useState<string>("600"); // Default value set to 300
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const role = useMemo(() => session?.user?.role || '', [session]); 
  // Fetch patient details when the component mounts or ID changes
  useEffect(() => {
    // This could be a fetch call if you need to load initial data
    // fetchPatientData();
  }, [patientId]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/Invoice/card/${patientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardprice }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Card created successfully!");
        setCardPrice("0");
        {role === 'admin' && ( // Reset to default
        router.push(`/admin/card/all/${patientId}`))}
        {role === 'reception' && ( // Reset to default
          router.push(`/reception/card/all/${patientId}`))}
      } else {
        setError(data.error || "Error creating card");
      }
    } catch (err) {
      setError("An error occurred");
    }
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          {/* Patient Details */}
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Card</h1>
            </div>
            {/* Success and Error Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <strong>Error:</strong> {error}
              </div>
            )}
            {message && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                <strong>Success:</strong> {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Card Price:
                </label>
                <input
                  type="number"
                  value={cardprice}
                  onChange={(e) => setCardPrice(e.target.value)}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCardPage;
