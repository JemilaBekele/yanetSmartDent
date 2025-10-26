import { useEffect, useState } from "react";

// Define the structure of the data expected from the API
interface InvoiceData {
  totalHistoryAmountLastWeek: number;
  totalCardPriceLastWeek: number;
  totalExpenseAmountLastWeek: number;
  grandTotalLastWeek: number;
  totalHistoryAmountCurrentMonth: number;
  totalCardPriceCurrentMonth: number;
  totalExpenseCurrentMonth: number;
  grandTotalCurrentMonth: number;
}

const TotalMonthDisplay = () => {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch totals from the API
    const fetchTotals = async () => {
      try {
        const response = await fetch("/api/count/month"); // Adjust to the correct API endpoint
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
    <div className="mt-6 flex flex-col items-center gap-4 p-4">
      {/* Display totals in a single column */}
      <div className="grid gap-6 grid-cols-1 w-full">
        {/* Last week's totals */}
        <div className="shadow-md rounded-lg p-6 w-full max-w-xs text-center">
          <h2 className="text-lg font-semibold text-gray-700">Total Last Week</h2>
          <p className="text-md text-gray-600">
            Invoice: {data?.totalHistoryAmountLastWeek || 0}
          </p>
          <p className="text-md text-gray-600">
            Cards: {data?.totalCardPriceLastWeek || 0}
          </p>
          <p className="text-md text-gray-600">
            Expense: {data?.totalExpenseAmountLastWeek || 0}
          </p>
          <p className="text-md text-gray-600">
            Total: {data?.grandTotalLastWeek || 0}
          </p>
        </div>

        {/* Current month's totals */}
        <div className="shadow-md rounded-lg p-6 w-full max-w-xs text-center">
          <h2 className="text-lg font-semibold text-gray-700">Total This Month</h2>
          <p className="text-md text-gray-600">
          Invoice: {data?.totalHistoryAmountCurrentMonth || 0}
          </p>
          <p className="text-md text-gray-600">
            Cards: {data?.totalCardPriceCurrentMonth || 0}
          </p>
          <p className="text-md text-gray-600">
            Expense: {data?.totalExpenseCurrentMonth || 0}
          </p>
          <p className="text-md text-gray-600">
            Total: {data?.grandTotalCurrentMonth || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotalMonthDisplay;
