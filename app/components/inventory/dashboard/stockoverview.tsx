"use client";

import { useEffect, useState } from "react";
import { Pie, PieChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Define types for the dashboard data
interface CategoryStockData {
  categoryId: string;
  categoryName: string;
  totalStockValue: number;
  productCount: number;
}

interface LocationStockData {
  locationId: string;
  locationName: string;
  totalQuantity: number;
  batchCount: number;
}

interface ExpiringBatchData {
  batchId: string;
  batchNumber: string;
  productName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: number;
  location: string;
}

interface DamagedReservedStockData {
  itemId: string;
  batchId: string;
  batchNumber: string;
  productName: string;
  quantity: number;
  status: string;
  locationName?: string;
  userName?: string;
  type: 'location' | 'personal' | 'main';
}

interface DashboardData {
  stockByCategory: CategoryStockData[];
  stockByLocation: LocationStockData[];
  expiringBatches: ExpiringBatchData[];
  damagedReservedStock: DamagedReservedStockData[];
}

// Function to generate colors for charts
const generateColorPalette = (numColors: number): string[] => {
  const colors: string[] = [];
  for (let i = 0; i < numColors; i++) {
    const hue = (i * 360) / numColors;
    const color = `hsl(${hue}, 70%, 60%)`;
    colors.push(color);
  }
  return colors;
};

// Pie Chart for Stock by Category
function StockByCategoryPieChart({ data }: { data: CategoryStockData[] }) {
  const colorPalette = generateColorPalette(data.length);
  
  const chartData = data.map((item, index) => ({
    name: item.categoryName,
    value: item.totalStockValue,
    fill: colorPalette[index],
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Stock Value by Category</CardTitle>
        <CardDescription>Total value of inventory by category</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer className="mx-auto aspect-square max-h-[350px] w-full" config={{}}>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Bar Chart for Stock by Location
function StockByLocationBarChart({ data }: { data: LocationStockData[] }) {
  const chartConfig = {
    quantity: {
      label: "Quantity",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Quantity by Location</CardTitle>
        <CardDescription>Total quantity of items at each location</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="locationName" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Quantity']} />
              <Legend />
              <Bar dataKey="totalQuantity" fill="var(--color-quantity)" name="Quantity" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Expiring Batches Table
function ExpiringBatchesTable({ data }: { data: ExpiringBatchData[] }) {
  const getExpiryStatus = (days: number) => {
    if (days <= 7) return "text-red-600 font-bold";
    if (days <= 14) return "text-orange-600 font-semibold";
    return "text-yellow-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiring Batches (Next 30 Days)</CardTitle>
        <CardDescription>Batches that will expire within the next month</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Days Until Expiry</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((batch) => (
              <TableRow key={batch.batchId}>
                <TableCell>{batch.batchNumber}</TableCell>
                <TableCell>{batch.productName}</TableCell>
                <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell className={getExpiryStatus(batch.daysUntilExpiry)}>
                  {batch.daysUntilExpiry} days
                </TableCell>
                <TableCell>{batch.quantity}</TableCell>
                <TableCell>{batch.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">No batches expiring soon</p>
        )}
      </CardContent>
    </Card>
  );
}

// Damaged/Reserved Stock Table
function DamagedReservedStockTable({ data }: { data: DamagedReservedStockData[] }) {
  const getStatusBadge = (status: string) => {
    const statusClass = status === 'DAMAGED' || status === 'Damaged' 
      ? "bg-red-100 text-red-800" 
      : "bg-yellow-100 text-yellow-800";
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
        {status}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Damaged & Reserved Stock</CardTitle>
        <CardDescription>Items that are damaged, reserved, or lost</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location/User</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.itemId}>
                <TableCell>{item.batchNumber}</TableCell>
                <TableCell>{item.productName}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  {item.type === 'location' ? item.locationName : item.userName}
                </TableCell>
                <TableCell className="capitalize">{item.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">No damaged or reserved stock</p>
        )}
      </CardContent>
    </Card>
  );
}

// Summary Cards
function SummaryCards({ data }: { data: DashboardData }) {
  const totalStockValue = data.stockByCategory.reduce((sum, category) => sum + category.totalStockValue, 0);
  const totalQuantity = data.stockByLocation.reduce((sum, location) => sum + location.totalQuantity, 0);
  const expiringCount = data.expiringBatches.length;
  const damagedReservedCount = data.damagedReservedStock.length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalStockValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Across all categories</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Across all locations</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiringCount}</div>
          <p className="text-xs text-muted-foreground">Within 30 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{damagedReservedCount}</div>
          <p className="text-xs text-muted-foreground">Damaged/Reserved items</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Dashboard Component
export default function StockInventoryDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/inventory/dashboard/stockoverview');
        const data = await response.json();
        
        if (data.success) {
          setDashboardData(data.data);
        } else {
          setError(data.message || "Failed to fetch dashboard data");
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading inventory dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
              <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
      
      <SummaryCards data={dashboardData} />
      
      <div className="grid gap-6 md:grid-cols-2">
        <StockByCategoryPieChart data={dashboardData.stockByCategory} />
        <StockByLocationBarChart data={dashboardData.stockByLocation} />
      </div>
      
      <ExpiringBatchesTable data={dashboardData.expiringBatches} />
      
      <DamagedReservedStockTable data={dashboardData.damagedReservedStock} />
    </div>
    </div>
  );
}