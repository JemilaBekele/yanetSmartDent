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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the type for the data used in the chart
interface ChartData {
  date: string;  // The month name
  revenue: number;
  expenses: number;
  cards: number;
  netProfit: number;
  historyRevenue: number;
  creditRevenue: number;
}

// Define the type for the branch data from API
interface BranchReport {
  branchId: string;
  branchName: string;
  monthlyData: ChartData[];
  performanceMetrics: {
    bestMonth: ChartData | null;
    worstMonth: ChartData | null;
    averageMonthlyRevenue: number;
    averageMonthlyExpenses: number;
    averageMonthlyProfit: number;
    growthRate: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: {
    analysisType: string;
    branchReports?: BranchReport[];
    branchReport?: BranchReport;
    branchComparison?: any[];
    overallSummary?: any;
  };
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
  cards: {
    label: "Cards",
    color: "hsl(var(--chart-3))",
  },
  netProfit: {
    label: "Net Profit",
    color: "hsl(var(--chart-4))",
  },
  historyRevenue: {
    label: "History Revenue",
    color: "hsl(var(--chart-5))",
  },
  creditRevenue: {
    label: "Credit Revenue",
    color: "hsl(var(--chart-6))",
  },
} satisfies ChartConfig

export function Component() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("revenue")
  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedBranch, setSelectedBranch] = React.useState<string>("all")
  const [branches, setBranches] = React.useState<{id: string, name: string}[]>([])
  const [allBranchData, setAllBranchData] = React.useState<BranchReport[]>([])

  // Fetch data from the backend API
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/statics/branch")
        const data: ApiResponse = await response.json()
console.log(data)
        if (data.success) {
          if (data.data.analysisType === 'multi-branch-monthly' && data.data.branchReports) {
            setAllBranchData(data.data.branchReports)
            
            // Extract branch list for dropdown
            const branchList = data.data.branchReports.map(branch => ({
              id: branch.branchId,
              name: branch.branchName
            }))
            setBranches(branchList)
            
            // Default to first branch or combined view
            if (branchList.length > 0) {
              setSelectedBranch("all") // Start with combined view
              setChartData(combineAllBranchesData(data.data.branchReports))
            }
          } else if (data.data.analysisType === 'single-branch-monthly' && data.data.branchReport) {
            setChartData(data.data.branchReport.monthlyData)
            setBranches([{
              id: data.data.branchReport.branchId,
              name: data.data.branchReport.branchName
            }])
            setSelectedBranch(data.data.branchReport.branchId)
          }
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
  }, [])

  // Combine data from all branches for the "All Branches" view
  const combineAllBranchesData = (branchReports: BranchReport[]): ChartData[] => {
    const combinedData: { [key: string]: ChartData } = {}

    branchReports.forEach(branch => {
      branch.monthlyData.forEach(monthData => {
        if (!combinedData[monthData.date]) {
          combinedData[monthData.date] = {
            date: monthData.date,
            revenue: 0,
            expenses: 0,
            cards: 0,
            netProfit: 0,
            historyRevenue: 0,
            creditRevenue: 0
          }
        }

        combinedData[monthData.date].revenue += monthData.revenue
        combinedData[monthData.date].expenses += monthData.expenses
        combinedData[monthData.date].cards += monthData.cards
        combinedData[monthData.date].netProfit += monthData.netProfit
        combinedData[monthData.date].historyRevenue += monthData.historyRevenue
        combinedData[monthData.date].creditRevenue += monthData.creditRevenue
      })
    })

    return Object.values(combinedData).sort((a, b) => {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December']
      return monthNames.indexOf(a.date) - monthNames.indexOf(b.date)
    })
  }

  // Update chart data when branch selection changes
  React.useEffect(() => {
    if (selectedBranch === "all" && allBranchData.length > 0) {
      setChartData(combineAllBranchesData(allBranchData))
    } else {
      const selectedBranchData = allBranchData.find(branch => branch.branchId === selectedBranch)
      if (selectedBranchData) {
        setChartData(selectedBranchData.monthlyData)
      }
    }
  }, [selectedBranch, allBranchData])

  // Calculate total for each category
  const total = React.useMemo(
    () => ({
      revenue: chartData.reduce((acc, curr) => acc + curr.revenue, 0),
      expenses: chartData.reduce((acc, curr) => acc + curr.expenses, 0),
      cards: chartData.reduce((acc, curr) => acc + curr.cards, 0),
      netProfit: chartData.reduce((acc, curr) => acc + curr.netProfit, 0),
      historyRevenue: chartData.reduce((acc, curr) => acc + curr.historyRevenue, 0),
      creditRevenue: chartData.reduce((acc, curr) => acc + curr.creditRevenue, 0),
    }),
    [chartData]
  )

  // Get current branch name
  const getCurrentBranchName = () => {
    if (selectedBranch === "all") return "All Branches"
    const branch = branches.find(b => b.id === selectedBranch)
    return branch ? branch.name : "All Branches"
  }

  // If loading, show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Branch Data...</CardTitle>
        </CardHeader>
        <CardContent>Loading financial data for all branches...</CardContent>
      </Card>
    )
  }

  return (
        <div className="flex ml-9 mt-7">
                  <div className="flex-grow md:ml-60 container mx-auto">

    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-4 border-b p-0 sm:flex-row sm:space-y-0">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Branch Financial Analytics</CardTitle>
          <CardDescription>
            Monthly financial performance across branches
          </CardDescription>
          
          {/* Branch Selector */}
          <div className="mt-2 w-full max-w-xs">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-wrap">
          {["revenue", "expenses", "netProfit", "cards"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-6 sm:py-4 min-w-[120px]"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-sm font-bold leading-none sm:text-xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      
      <CardContent className="px-2 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{getCurrentBranchName()}</h3>
          <div className="text-sm text-muted-foreground">
            {chartData.length} months of data
          </div>
        </div>
        
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              tickFormatter={(value) => value}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  labelFormatter={(value) => {
                    const monthData = chartData.find(item => item.date === value)
                    return (
                      <div className="font-medium">
                        {value}
                        {monthData && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Net Profit: {monthData.netProfit.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
              }
            />

            <Bar 
              dataKey={activeChart} 
              fill={`var(--color-${activeChart})`}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
        
        {/* Additional Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Avg Monthly Revenue</div>
            <div className="text-lg font-bold">
              {Math.round(total.revenue / Math.max(chartData.length, 1)).toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Avg Monthly Profit</div>
            <div className="text-lg font-bold">
              {Math.round(total.netProfit / Math.max(chartData.length, 1)).toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Profit Margin</div>
            <div className="text-lg font-bold">
              {total.revenue > 0 ? Math.round((total.netProfit / total.revenue) * 100) : 0}%
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Total Branches</div>
            <div className="text-lg font-bold">
              {selectedBranch === "all" ? branches.length : 1}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>       
     </div>
     </div>

  )
}