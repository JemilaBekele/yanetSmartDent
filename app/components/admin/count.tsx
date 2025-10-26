import { useEffect, useState } from "react";

interface RoleCount {
  role: string;
  count: number;
}

const RoleCountDisplay = () => {
  const [roleCounts, setRoleCounts] = useState<RoleCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch role counts from API
    const fetchRoleCounts = async () => {
      try {
        const response = await fetch("/api/register/count");
        if (!response.ok) {
          throw new Error("Failed to fetch role counts");
        }
        const data: RoleCount[] = await response.json();
        setRoleCounts(data);
      } catch (error) {
        setError("Error fetching user count.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoleCounts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-4 p-4">
      {roleCounts.map((roleCount) => (
        <div
          key={roleCount.role}
          className=" shadow-md rounded-lg p-6 w-full sm:w-48 md:w-56 lg:w-60 text-center"
        >
          <h2 className="text-lg font-semibold text-gray-700 capitalize">
            {roleCount.role}
          </h2>
          <p className="text-xl font-bold text-gray-600">{roleCount.count}</p>
        </div>
      ))}
    </div>
  );
};

export default RoleCountDisplay;
