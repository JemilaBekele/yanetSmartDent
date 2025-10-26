"use client"; // Mark this component as a client component

import { useEffect, useState } from 'react';
import useSessionData from '../hook/useSessionData'; // Adjust path as needed

const ClientSideRedirect: React.FC = () => {
  const { session, loading } = useSessionData();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return; // Wait for the session to load

    if (!session) {
      setRedirectUrl('/signIn');
    } else {
      const userRole = session.user?.role;
      switch (userRole) {
        case 'admin':
          setRedirectUrl('/admin');
          break;
        case 'doctor':
          setRedirectUrl('/doctor');
          break;
        case 'reception':
          setRedirectUrl('/reception');
          break;
        default:
          setRedirectUrl('/unauthorized');
      }
    }
  }, [session, loading]);

  // Use effect to redirect on the client side
  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  return null; // Render nothing while redirecting
};

export default ClientSideRedirect;
