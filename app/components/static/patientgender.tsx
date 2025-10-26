"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { fetchPatientData } from "./api";


export default function PatientGenderPieChart() {
  const [chartData, setChartData] = useState<{ label: string; total: number; fill?: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchPatientData();
      if (data) {
        const colors = { Male: "#36A2EB", Female: "#FF6384" }; // Blue for Male, Red for Female
        const formattedData = data.genderDistribution.map((item: { label: string; total: number }) => ({
          ...item,
          fill: colors[item.label as keyof typeof colors] || "#CCCCCC", // Default gray if not found
        }));
        setChartData(formattedData);
      }
    }

    fetchData();
  }, []);

  const chartConfig: ChartConfig = {
    total: { label: "Patients" },
    ...chartData.reduce((acc, item) => {
      acc[item.label] = { label: item.label, color: item.fill };
      return acc;
    }, {} as ChartConfig),
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Patient Gender Distribution</CardTitle>
        <CardDescription>Male vs Female Patients</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="total" label nameKey="label" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Patient gender statistics <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Based on current patient records
        </div>
      </CardFooter>
    </Card>
  );
}