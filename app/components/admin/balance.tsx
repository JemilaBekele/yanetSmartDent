import { useEffect, useState } from "react";

// Define the structure of the data expected from the API
interface InvoiceData {
  
  totalBalance: number;
}

const TotalCountBalance = () => {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch totals from the API
    const fetchTotals = async () => {
      try {
        const response = await fetch("/api/count/totalprice"); // Adjust to the correct API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch totals");
        }
        const result = await response.json();
        setData(result.data); // Assuming the structure includes a 'data' key
      } catch (error) {
        setError("Error fetching totals.");
      } finally {
        setLoading(false);
      }
    };

    fetchTotals();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mt-3 flex flex-col items-center gap-4 p-4">
      
 
        
      <p className="text-xl font-bold text-gray-600">
  {new Intl.NumberFormat('en-US').format(data?.totalBalance ?? 0)}
</p>
      
    </div>
  );
};

export default TotalCountBalance;
