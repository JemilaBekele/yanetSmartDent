"use client";

import { useEffect, useState } from "react";
import { Pie, PieChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, Line, LineChart } from "recharts";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Clock,
  Users,
  RefreshCw,
  Package,
  Truck,
  BarChart3,
  AlertCircle,
  UserCheck,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';

// Define types for the dashboard data
interface PendingApprovalData {
  requestId: string;
  requestNo: string;
  type: 'inventory' | 'withdrawal' | 'purchase';
  requestedBy: string;
  requestedAt: Date;
  totalItems: number;
  totalQuantity: number;
  status: string;
}

interface RequestTrendData {
  week: string;
  count: number;
}

interface TopRequesterData {
  userId: string;
  userName: string;
  requestCount: number;
}

interface RecentPurchaseData {
  purchaseId: string;
  invoiceNo: string;
  supplierName: string;
  totalAmount: number;
  purchaseDate: Date;
  approvalStatus: string;
}

interface SupplierSpendingData {
  supplierId: string;
  supplierName: string;
  totalSpent: number;
  purchaseCount: number;
}

interface FrequentProductData {
  productId: string;
  productName: string;
  usageCount: number;
}

interface BatchValueData {
  batchId: string;
  batchNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

interface ProductWithoutBatchesData {
  productId: string;
  productCode: string;
  productName: string;
}

interface LowStockAlertData {
  productId: string;
  productName: string;
  batchNumber: string;
  currentQuantity: number;
  warningQuantity: number;
  locationName: string;
}

interface ExpiredBatchData {
  batchId: string;
  batchNumber: string;
  productName: string;
  expiryDate: Date;
  quantity: number;
  locationName: string;
}

interface UnapprovedRequestData {
  requestId: string;
  requestNo: string;
  type: string;
  requestedBy: string;
  daysPending: number;
}

interface UserStockData {
  userId: string;
  userName: string;
  issuedQuantity: number;
  returnedQuantity: number;
  currentHolding: number;
}

interface LostDamagedItemData {
  itemId: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  userName: string;
  status: string;
  lastUpdated: Date;
}

interface DashboardData {
  // Section 3: Requests & Approvals
  pendingApprovals: PendingApprovalData[];
  requestTrends: RequestTrendData[];
  topRequesters: TopRequesterData[];
  
  // Section 4: Purchases & Suppliers
  recentPurchases: RecentPurchaseData[];
  supplierSpending: SupplierSpendingData[];
  pendingPurchaseApprovals: RecentPurchaseData[];
  
  // Section 5: Product & Batch Insights
  frequentProducts: FrequentProductData[];
  batchValues: BatchValueData[];
  productsWithoutBatches: ProductWithoutBatchesData[];
  
  // Section 6: Alerts & Notifications
  lowStockAlerts: LowStockAlertData[];
  expiredBatches: ExpiredBatchData[];
  unapprovedRequests: UnapprovedRequestData[];
  
  // Section 7: User / Personal Stock
  userStockStats: UserStockData[];
  topUsersHoldingStock: UserStockData[];
  lostDamagedItems: LostDamagedItemData[];
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

// Request Trends Chart
function RequestTrendsChart({ data }: { data: RequestTrendData[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Request Trends (Last 12 Weeks)
        </CardTitle>
        <CardDescription>Number of inventory requests over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Supplier Spending Chart
function SupplierSpendingChart({ data }: { data: SupplierSpendingData[] }) {
  const chartData = data.map(item => ({
    name: item.supplierName,
    total: item.totalSpent,
    count: item.purchaseCount
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Supplier Spending
        </CardTitle>
        <CardDescription>Top suppliers by total spending</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Total Spent']} />
            <Legend />
            <Bar dataKey="total" fill="#8884d8" name="Total Spent" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Batch Value Chart
function BatchValueChart({ data }: { data: BatchValueData[] }) {
  const chartData = data.map(item => ({
    name: `${item.batchNumber} - ${item.productName}`,
    value: item.totalValue
  }));

  const colorPalette = generateColorPalette(data.length);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Most Valuable Batches
        </CardTitle>
        <CardDescription>Batches with highest total value</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
                <Cell key={`cell-${index}`} fill={colorPalette[index]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Pending Approvals Table
function PendingApprovalsTable({ data }: { data: PendingApprovalData[] }) {
  const getStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    if (status === 'PENDING') variant = "outline";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'withdrawal': return <ShoppingCart className="h-4 w-4" />;
      case 'purchase': return <Truck className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Approvals
        </CardTitle>
        <CardDescription>Requests waiting for approval</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((request) => (
              <TableRow key={request.requestId}>
                <TableCell>{request.requestNo || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(request.type)}
                    <span className="capitalize">{request.type}</span>
                  </div>
                </TableCell>
                <TableCell>{request.requestedBy}</TableCell>
                <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                <TableCell>{request.totalItems}</TableCell>
                <TableCell>{request.totalQuantity}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">No pending approvals</p>
        )}
      </CardContent>
    </Card>
  );
}

// Recent Purchases Table
function RecentPurchasesTable({ data }: { data: RecentPurchaseData[] }) {
  const getStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    if (status === 'PENDING') variant = "outline";
    if (status === 'APPROVED') variant = "default";
    if (status === 'REJECTED') variant = "destructive";
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Recent Purchases
        </CardTitle>
        <CardDescription>Latest purchase orders</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((purchase) => (
              <TableRow key={purchase.purchaseId}>
                <TableCell>{purchase.invoiceNo}</TableCell>
                <TableCell>{purchase.supplierName}</TableCell>
                <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                <TableCell>${purchase.totalAmount.toLocaleString()}</TableCell>
                <TableCell>{getStatusBadge(purchase.approvalStatus)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">No recent purchases</p>
        )}
      </CardContent>
    </Card>
  );
}

// Low Stock Alerts Table
function LowStockAlertsTable({ data }: { data: LowStockAlertData[] }) {
  const getStockStatus = (current: number, warning: number) => {
    const percentage = (current / warning) * 100;
    if (percentage <= 25) return "text-red-600 font-bold";
    if (percentage <= 50) return "text-orange-600 font-semibold";
    return "text-yellow-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>Products below warning quantity</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Current Qty</TableHead>
              <TableHead>Warning Qty</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((alert) => (
              <TableRow key={`${alert.productId}-${alert.batchNumber}`}>
                <TableCell>{alert.productName}</TableCell>
                <TableCell>{alert.batchNumber}</TableCell>
                <TableCell>{alert.locationName}</TableCell>
                <TableCell className={getStockStatus(alert.currentQuantity, alert.warningQuantity)}>
                  {alert.currentQuantity}
                </TableCell>
                <TableCell>{alert.warningQuantity}</TableCell>
                <TableCell>
                  <Badge variant={alert.currentQuantity === 0 ? "destructive" : "outline"}>
                    {alert.currentQuantity === 0 ? "Out of Stock" : "Low Stock"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">No low stock alerts</p>
        )}
      </CardContent>
    </Card>
  );
}

// Expired Batches Table
function ExpiredBatchesTable({ data }: { data: ExpiredBatchData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Expired Batches
        </CardTitle>
        <CardDescription>Batches that have expired</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((batch) => (
              <TableRow key={batch.batchId}>
                <TableCell>{batch.batchNumber}</TableCell>
                <TableCell>{batch.productName}</TableCell>
                <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell>{batch.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">No expired batches</p>
        )}
      </CardContent>
    </Card>
  );
}

// User Stock Stats Table
function UserStockStatsTable({ data }: { data: UserStockData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          User Stock Statistics
        </CardTitle>
        <CardDescription>Stock issued to and returned by users</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Returned</TableHead>
              <TableHead>Current Holding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user) => (
              <TableRow key={user.userId}>
                <TableCell>{user.userName}</TableCell>
                <TableCell>{user.issuedQuantity}</TableCell>
                <TableCell>{user.returnedQuantity}</TableCell>
                <TableCell>
                  <Badge variant={user.currentHolding > 0 ? "default" : "outline"}>
                    {user.currentHolding}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">No user stock data</p>
        )}
      </CardContent>
    </Card>
  );
}

// Summary Cards
function SummaryCards({ data }: { data: DashboardData | null }) {
  if (!data) return null;

  const pendingApprovalsCount = data.pendingApprovals.length;
  const lowStockAlertsCount = data.lowStockAlerts.length;
  const expiredBatchesCount = data.expiredBatches.length;
  const unapprovedRequestsCount = data.unapprovedRequests.length;
  
  const totalSupplierSpending = data.supplierSpending.reduce((sum, supplier) => sum + supplier.totalSpent, 0);
  const totalBatchValue = data.batchValues.reduce((sum, batch) => sum + batch.totalValue, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingApprovalsCount}</div>
          <p className="text-xs text-muted-foreground">Requests waiting approval</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockAlertsCount}</div>
          <p className="text-xs text-muted-foreground">Items needing restock</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expired Batches</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiredBatchesCount}</div>
          <p className="text-xs text-muted-foreground">Batches that expired</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Supplier Spending</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(totalSupplierSpending/1000).toFixed(1)}K</div>
          <p className="text-xs text-muted-foreground">Total spent with suppliers</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Dashboard Component
export default function ComprehensiveInventoryDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/inventory/dashboard/comprehensive');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.message || "Failed to fetch dashboard data");
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
        <p>Loading comprehensive inventory dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={handleRefresh}
          className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container m-7 p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Comprehensive Inventory Dashboard</h1>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      <SummaryCards data={dashboardData} />
      
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="requests">Requests & Approvals</TabsTrigger>
          <TabsTrigger value="purchases">Purchases & Suppliers</TabsTrigger>
          <TabsTrigger value="products">Product Insights</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="userstock">User Stock</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <RequestTrendsChart data={dashboardData?.requestTrends || []} />
            <SupplierSpendingChart data={dashboardData?.supplierSpending || []} />
          </div>
          <PendingApprovalsTable data={dashboardData?.pendingApprovals || []} />
          <div className="grid gap-6 md:grid-cols-2">
            <LowStockAlertsTable data={dashboardData?.lowStockAlerts || []} />
            <ExpiredBatchesTable data={dashboardData?.expiredBatches || []} />
          </div>
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          <PendingApprovalsTable data={dashboardData?.pendingApprovals || []} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Requesters
              </CardTitle>
              <CardDescription>Users with the most inventory requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Request Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.topRequesters.map((requester) => (
                    <TableRow key={requester.userId}>
                      <TableCell>{requester.userName}</TableCell>
                      <TableCell>{requester.requestCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!dashboardData?.topRequesters || dashboardData.topRequesters.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">No requester data</p>
              )}
            </CardContent>
          </Card>
          <RequestTrendsChart data={dashboardData?.requestTrends || []} />
        </TabsContent>
        
        <TabsContent value="purchases" className="space-y-4">
          <RecentPurchasesTable data={dashboardData?.recentPurchases || []} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Purchase Approvals
              </CardTitle>
              <CardDescription>Purchase orders waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.pendingPurchaseApprovals.map((purchase) => (
                    <TableRow key={purchase.purchaseId}>
                      <TableCell>{purchase.invoiceNo}</TableCell>
                      <TableCell>{purchase.supplierName}</TableCell>
                      <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                      <TableCell>${purchase.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{purchase.approvalStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!dashboardData?.pendingPurchaseApprovals || dashboardData.pendingPurchaseApprovals.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">No pending purchase approvals</p>
              )}
            </CardContent>
          </Card>
          <SupplierSpendingChart data={dashboardData?.supplierSpending || []} />
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <BatchValueChart data={dashboardData?.batchValues || []} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Frequently Used Products
              </CardTitle>
              <CardDescription>Products with the most usage</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Usage Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.frequentProducts.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell>{product.usageCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!dashboardData?.frequentProducts || dashboardData.frequentProducts.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">No product usage data</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Products Without Batches
              </CardTitle>
              <CardDescription>Products that need batch information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Product Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.productsWithoutBatches.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell>{product.productCode}</TableCell>
                      <TableCell>{product.productName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!dashboardData?.productsWithoutBatches || dashboardData.productsWithoutBatches.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">All products have batches</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <LowStockAlertsTable data={dashboardData?.lowStockAlerts || []} />
          <ExpiredBatchesTable data={dashboardData?.expiredBatches || []} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Unapproved Requests (3+ Days)
              </CardTitle>
              <CardDescription>Requests pending for more than 3 days</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Days Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.unapprovedRequests.map((request) => (
                    <TableRow key={request.requestId}>
                      <TableCell>{request.requestNo || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{request.type}</TableCell>
                      <TableCell>{request.requestedBy}</TableCell>
                      <TableCell>
                        <Badge variant={request.daysPending > 7 ? "destructive" : "outline"}>
                          {request.daysPending} days
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!dashboardData?.unapprovedRequests || dashboardData.unapprovedRequests.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">No long-pending requests</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="userstock" className="space-y-4">
          <UserStockStatsTable data={dashboardData?.userStockStats || []} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Top Users Holding Stock
              </CardTitle>
              <CardDescription>Users with the most stock currently assigned</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Current Holding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.topUsersHoldingStock.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>{user.userName}</TableCell>
                      <TableCell>
                        <Badge variant={user.currentHolding > 0 ? "default" : "outline"}>
                          {user.currentHolding}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!dashboardData?.topUsersHoldingStock || dashboardData.topUsersHoldingStock.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">No user stock data</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Lost/Damaged Items
              </CardTitle>
              <CardDescription>Items marked as lost or damaged</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.lostDamagedItems.map((item) => (
                    <TableRow key={item.itemId}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.batchNumber}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.userName}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'LOST' ? "destructive" : "outline"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!dashboardData?.lostDamagedItems || dashboardData.lostDamagedItems.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">No lost or damaged items</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <RequestTrendsChart data={dashboardData?.requestTrends || []} />
            <SupplierSpendingChart data={dashboardData?.supplierSpending || []} />
            <BatchValueChart data={dashboardData?.batchValues || []} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}