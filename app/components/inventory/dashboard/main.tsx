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
import {
  ShoppingOutlined,
  DollarOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  ShopOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

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

interface InventoryStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockAlerts: number;
  pendingRequests: number;
  activeSuppliers: number;
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
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <AppstoreOutlined />
          Stock Value by Category
        </CardTitle>
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShopOutlined />
          Stock Quantity by Location
        </CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <CalendarOutlined />
          Expiring Batches (Next 30 Days)
        </CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <ExclamationCircleOutlined />
          Damaged & Reserved Stock
        </CardTitle>
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
function SummaryCards({ stats, dashboardData }: { stats: InventoryStats | null, dashboardData: DashboardData | null }) {
  const totalStockValue = dashboardData?.stockByCategory.reduce((sum, category) => sum + category.totalStockValue, 0) || 0;
  const totalQuantity = dashboardData?.stockByLocation.reduce((sum, location) => sum + location.totalQuantity, 0) || 0;
  const expiringCount = dashboardData?.expiringBatches.length || 0;
  const damagedReservedCount = dashboardData?.damagedReservedStock.length || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <ShoppingOutlined className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats ? new Intl.NumberFormat('en-US').format(stats.totalProducts) : '--'}</div>
          <p className="text-xs text-muted-foreground">Across all categories</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
          <DollarOutlined className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats ? new Intl.NumberFormat("en-US").format(Number(stats.totalStockValue.toFixed(2))) : '--'}</div>
          <p className="text-xs text-muted-foreground">Total inventory value</p>
        </CardContent>
      </Card>
      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
          <WarningOutlined className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats ? new Intl.NumberFormat('en-US').format(stats.lowStockAlerts) : '--'}</div>
          <p className="text-xs text-muted-foreground">Items needing restock</p>
        </CardContent>
      </Card> */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <CalendarOutlined className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiringCount}</div>
          <p className="text-xs text-muted-foreground">Within 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Dashboard Component
export default function CombinedInventoryDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch both datasets in parallel
      const [stockOverviewResponse, statsResponse] = await Promise.all([
        fetch('/api/inventory/dashboard/stockoverview'),
        fetch('/api/inventory/dashboard')
      ]);
      
      const stockOverviewData = await stockOverviewResponse.json();
      const statsData = await statsResponse.json();
      
      if (stockOverviewData.success) {
        setDashboardData(stockOverviewData.data);
      } else {
        setError(stockOverviewData.message || "Failed to fetch stock overview data");
      }
      
      if (statsData.success) {
        setStats(statsData.data);
      } else {
        setError(statsData.message || "Failed to fetch inventory statistics");
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

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

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <ReloadOutlined className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        
        <SummaryCards stats={stats} dashboardData={dashboardData} />
        
        {/* Inventory Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TeamOutlined />
                Supplier Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? new Intl.NumberFormat('en-US').format(stats.activeSuppliers) : '--'} Active Suppliers
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Managing your supplier relationships is key to inventory success
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockCircleOutlined />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? new Intl.NumberFormat('en-US').format(stats.pendingRequests) : '--'} Pending
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Review and process pending requests to maintain inventory flow
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <StockByCategoryPieChart data={dashboardData?.stockByCategory || []} />
          <StockByLocationBarChart data={dashboardData?.stockByLocation || []} />
        </div>
        
        {/* Detailed Tables */}
        <ExpiringBatchesTable data={dashboardData?.expiringBatches || []} />
        <DamagedReservedStockTable data={dashboardData?.damagedReservedStock || []} />
      </div>
    </div>
  );
}