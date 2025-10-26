// hooks/useSessionData.ts
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
const useSessionData = () => {
  const { data: session, status } = useSession();
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Wait for session data to load

    if (session) {
      setSessionData(session);
    } else {
      setSessionData(null); // Set session data to null if not authenticated
    }
    setLoading(false); // Set loading to false after session is set
  }, [status, session]);

  return { session: sessionData, loading };
};

export default useSessionData;
