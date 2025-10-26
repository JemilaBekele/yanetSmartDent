"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { LabelList, Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { fetchPatientData } from "./api";

export default function PatientAgePieChart() {
  const [chartData, setChartData] = useState<{ label: string; total: number; fill?: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchPatientData();
      if (data) {
        // Different colors for each segment
        const colors = [
          "#FF6B6B", // Coral Red
          "#4ECDC4", // Teal
          "#45B7D1", // Sky Blue
          "#96CEB4", // Sage Green
          "#FFEAA7", // Light Yellow
          "#DDA0DD", // Plum
          "#98D8C8", // Mint Green
          "#F7DC6F", // Golden Yellow
          "#BB8FCE", // Light Purple
          "#85C1E9", // Light Blue
          "#F8C471", // Peach
          "#82E0AA"  // Light Green
        ];
        const formattedData = data.ageDistribution.map((item: any, index: number) => ({
          ...item,
          fill: colors[index % colors.length], // Assign a different color to each category
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
        <CardTitle>Patient Age Distribution</CardTitle>
        <CardDescription>Distribution of patients by age range</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="total" hideLabel />} />
            <Pie 
              data={chartData} 
              dataKey="total"
              nameKey="label"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList 
                dataKey="label" 
                fill="white" 
                stroke="none" 
                fontSize={12} 
                fontWeight="bold"
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm ">
        <div className="flex items-center gap-2 font-medium leading-none">
          Patient distribution overview <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Data based on the latest patient records
        </div>
      </CardFooter>
    </Card>
  );
}