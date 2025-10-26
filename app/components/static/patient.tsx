"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import axios from "axios";

export function PatientTrendChart() {
  const [chartData, setChartData] = useState<{ month: string; patients: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/statics/patient");
        if (response.data.success) {
          setChartData(response.data.data);
        } else {
          setError("Failed to fetch data.");
        }
      } catch (err) {
        setError("Error fetching patient trend data.");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Registration Trend</CardTitle>
        <CardDescription>Showing new patient registrations in the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ patients: { label: "Patients", color: "hsl(var(--chart-1))" } }}>
          <AreaChart
           height={600}
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)} // Show short month names
            />
            <Tooltip />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="patients"
              type="monotone"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
               <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Last 6 months
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
