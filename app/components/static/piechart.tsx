"use client";

import { useEffect, useState } from "react"; 
import { Pie, PieChart, Legend } from "recharts"; 
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card"; 
import { ChartContainer } from "@/components/ui/chart";

// Define the type for the chart data items
interface ServiceData {
  name: string;
  totalRevenue: number;
  fill: string;
}

export function Piechart() { 
  const [chartData, setChartData] = useState<ServiceData[]>([]); // Explicit type for chart data
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  // Function to generate a dynamic color palette
  const generateColorPalette = (numColors: number): string[] => {
    const colors: string[] = [];
    for (let i = 0; i < numColors; i++) {
      const hue = (i * 360) / numColors; // Adjust hue to create different colors
      const color = `hsl(${hue}, 70%, 60%)`; // 70% saturation, 60% lightness for vibrant colors
      colors.push(color);
    }
    return colors;
  };

  useEffect(() => { 
    async function fetchData() { 
      try { 
        const response = await fetch('/api/statics/rankservice'); 
        const data = await response.json(); 
        if (data.success) { 
          const numServices = data.data.rankByRevenue.length;
          const colorPalette = generateColorPalette(numServices); // Generate colors based on number of services

          const formattedData = data.data.rankByRevenue.map((service, index) => ({ 
            name: `${service.serviceName} (${service.totalRevenue})`, 
            totalRevenue: service.totalRevenue, 
            fill: colorPalette[index],  // Assign color dynamically
          })); 
          
          console.log("Formatted Chart Data:", formattedData); 
          setChartData(formattedData); 
        } else { 
          setError(data.message || "Failed to fetch data"); 
        } 
      } catch (err) { 
        setError(err.message || "An error occurred"); 
      } finally { 
        setLoading(false); 
      } 
    } 

    fetchData(); 
  }, []);

  if (loading) return <p>Loading...</p>; 
  if (error) return <p>Error: {error}</p>;

  console.log("Chart Data:", chartData);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Service Revenue Breakdown</CardTitle>
        <CardDescription>Based on Total Revenue</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer className="mx-auto aspect-square max-h-[350px] w-full" config={{}}>
          <PieChart width={250} height={250}>
            <Pie data={chartData} dataKey="totalRevenue" nameKey="name" />
            <Legend /> {/* Default legend */}
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
