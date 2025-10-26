import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Define the type for the data used in the chart
interface ChartData {
  date: string;  // The month name or date
  total: number;  // The total value for the "total" category
  expense: number;  // The total value for the "expense" category
}


// Define the type for the raw API data
interface RawData {
  month: string;  // Raw month data (string)
  totalcount: number;  // Raw total data
  expenseAmount: number;  // Raw expense data
}

const chartConfig = {
  total: {
    label: "Total",  // Changed label from "Desktop"
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Expense",  // Changed label from "Mobile"
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function Component() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("total")
  const [chartData, setChartData] = React.useState<ChartData[]>([])  // Data fetched from API
  const [loading, setLoading] = React.useState(true)  // Loading state

  // Fetch data from the backend API
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/statics/chart")
        const data = await response.json()

        if (data.success) {
          // Transform the data into the format needed for the chart
          const formattedData: ChartData[] = data.data.map((item: RawData) => ({
            date: item.month,  // This corresponds to `date` in the chart template
            total: item.totalcount,  // Changed from desktop to total
            expense: item.expenseAmount,  // Changed from mobile to expense
          }))
          setChartData(formattedData)
        } else {
          console.error("Failed to fetch data")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])  // Empty dependency array means this effect runs only once, on mount

  // Calculate total for each category only if chartData is available
  const total = React.useMemo(
    () => ({
      total: chartData.reduce((acc, curr) => acc + curr.total, 0),  // Changed from desktop to total
      expense: chartData.reduce((acc, curr) => acc + curr.expense, 0),  // Changed from mobile to expense
    }),
    [chartData] // Recompute total only when chartData changes
  )

  // If loading, show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Chart Data...</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Bar chart</CardTitle>
          <CardDescription>
            Showing total Invoice Credit and Expense  
          </CardDescription>
        </div>
        <div className="flex">
          {["total", "expense"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}  {/* Display "Total" or "Expense" */}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}  // Directly display the month name (e.g., "December")
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => value}  // Display the month name in tooltip
                />
              }
            />

            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
