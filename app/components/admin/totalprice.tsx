import { useEffect, useState } from "react";

interface InvoiceCardData {
  totalHistoryAmount: number;
  totalCardPrice: number;
  grandTotal: number;
  totalExpenseAmount: number;
}

const TotalCountDisplay = () => {
  const [data, setData] = useState<InvoiceCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch totals from the API
    const fetchTotals = async () => {
      try {
        const response = await fetch("/api/count"); // Adjust to the correct API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch totals");
        }
        const result = await response.json();
        setData(result.data); // Assuming the structure includes data
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
    <div className="mt-6 flex flex-wrap justify-center gap-4 p-4">
      <div className="shadow-md rounded-lg p-6 w-full sm:w-60 text-center">
        <h2 className="text-lg font-semibold text-gray-700">Total Amount Invoice</h2>
        <p className="text-xl font-bold text-gray-600">{data?.totalHistoryAmount}</p>
      </div>
      <div className="shadow-md rounded-lg p-6 w-full sm:w-60 text-center">
        <h2 className="text-lg font-semibold text-gray-700">Total Card Price</h2>
        <p className="text-xl font-bold text-gray-600">{data?.totalCardPrice}</p>
      </div>
      <div className="shadow-md rounded-lg p-6 w-full sm:w-60 text-center">
        <h2 className="text-lg font-semibold text-gray-700">Expense</h2>
        <p className="text-xl font-bold text-gray-600">{data?.totalExpenseAmount}</p>
      </div>
      <div className="shadow-md rounded-lg p-6 w-full sm:w-60 text-center">
        <h2 className="text-lg font-semibold text-gray-700">Total</h2>
        <p className="text-xl font-bold text-gray-600">{data?.grandTotal}</p>
      </div>
    </div>
  );
};

export default TotalCountDisplay;
