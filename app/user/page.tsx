"use client";
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const LandingPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Handle card click and redirect based on selection
  const handleCardClick = (route: string) => {
    router.push(route);
  };

return (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-10">
        Welcome! Choose an Action
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2  gap-6">
        {/* Card 1: View Patients */}
        <div
          className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          onClick={() => handleCardClick('/user/chose')}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">View Patients</h2>
          <p className="text-gray-600">
            Search and view patient records by filtering with their first name and add data about patients.
          </p>
        </div>

        {/* Card 2: Self Registration */}
        <div
          className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          onClick={() => handleCardClick('/user/register')}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Self Registration</h2>
          <p className="text-gray-600">
            If the patient wants to register themselves, click this.
          </p>
        </div>
      </div>
    </div>
  </div>
);

};

export default LandingPage;