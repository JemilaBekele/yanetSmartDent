'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Calendar,
  User,
  Info,
  Receipt,
  Loader2,
  ArrowLeft,
  Box,
  ClipboardList
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { formatDate } from '@/app/lib/format';

// -------- Types --------
export interface User {
  _id: string;
  username: string;
  email?: string;
}

export interface Product {
  _id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
}

export interface ProductBatch {
  _id: string;
  batchNumber: string;
  expiryDate?: string;
  manufacturingDate?: string;
}

export interface ProductUnit {
  _id: string;
  conversionToBase: number;
  unitOfMeasureId?: {
    _id: string;
    name: string;
    symbol: string;
  };
}

export interface InventoryRequest {
  _id: string;
  requestNo: string;
  requestDate: string;
  approvalStatus: string;
}

export interface StockHoldingItem {
  _id: string;
  productId: Product;
  batchId?: ProductBatch;
  productUnitId: ProductUnit;
  requestItemId?: {
    _id: string;
    requestedQuantity: number;
    approvedQuantity: number;
  };
  quantity: number;
  baseQuantity: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockHolding {
  _id: string;
  requestId: InventoryRequest;
  holderId: User;
  issuedById: User;
  items: StockHoldingItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

type StockHoldingViewProps = {
  id?: string;
};

const StockHoldingDetailPage: React.FC<StockHoldingViewProps> = ({ id }) => {
  const [stockHolding, setStockHolding] = useState<StockHolding | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStockHolding = async () => {
      try {
        if (id) {
          const response = await fetch(`/api/inventory/Holder/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch stock holding');
          }
          const holdingData = await response.json();
          setStockHolding(holdingData);
        }
      } catch (error) {
        toast.error('Failed to fetch stock holding details');
      } finally {
        setLoading(false);
      }
    };

    fetchStockHolding();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>;
      case 'RETURNED':
        return <Badge className="bg-blue-100 text-blue-800">RETURNED</Badge>;
      case 'LOST':
        return <Badge className="bg-red-100 text-red-800">LOST</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTotalItems = () => {
    return stockHolding?.items?.length || 0;
  };

  const getTotalQuantity = () => {
    return stockHolding?.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-green-600" />
        <p className="text-green-600">Loading stock holding details...</p>
      </div>
    );
  }

  if (!stockHolding) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-red-600">Stock holding not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 bg-gray-50">
      {/* Stock Holding Details Card */}
      <Card className="shadow-lg border border-gray-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-green-800">
            <Box className="text-green-600" />
            Stock Holding Details
            <Badge className="ml-2 bg-green-100 text-green-800">
              {stockHolding.requestId?.requestNo}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Holding Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Info className="h-5 w-5 text-green-500" />
                Holding Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Request No:</span> {stockHolding.requestId?.requestNo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Holder:</span> {stockHolding.holderId?.username}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Issued By:</span> {stockHolding.issuedById?.username}
                  </p>
                </div>
                {stockHolding.notes && (
                  <div>
                    <p className="font-medium text-gray-700">Notes:</p>
                    <p className="text-gray-600">{stockHolding.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Date and Summary Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Calendar className="h-5 w-5 text-green-500" />
                Summary & Dates
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-700">Issued Date:</p>
                  <p className="text-gray-600">{formatDate(stockHolding.created_at)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Last Updated:</p>
                  <p className="text-gray-600">{formatDate(stockHolding.updated_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Total Items:</span> {getTotalItems()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Total Quantity:</span> {getTotalQuantity()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Request Status:</span> 
                    <Badge className="ml-2">
                      {stockHolding.requestId?.approvalStatus}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Holding Items Table Section */}
          {stockHolding.items?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-700">Held Items</h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-50">
                    <TableHead className="text-green-800">Product</TableHead>
                    <TableHead className="text-green-800">Batch</TableHead>
                    <TableHead className="text-green-800">Unit</TableHead>
                    <TableHead className="text-green-800">Quantity</TableHead>
                    <TableHead className="text-green-800">Base Quantity</TableHead>
                    <TableHead className="text-green-800">Status</TableHead>
                    <TableHead className="text-green-800">Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockHolding.items.map((item, index) => (
                    <TableRow key={item._id || index} className="hover:bg-gray-100">
                      <TableCell className="font-medium text-gray-800">
                        {item.productId?.name || 'Unknown Product'}
                        {item.productId?.code && (
                          <div className="text-sm text-gray-500">
                            Code: {item.productId.code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {item.batchId?.batchNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {item.productUnitId?.unitOfMeasureId?.symbol || 
                         item.productUnitId?.unitOfMeasureId?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-700">{item.quantity}</TableCell>
                      <TableCell className="text-gray-700">{item.baseQuantity}</TableCell>
                      <TableCell className="text-gray-700">
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {item.batchId?.expiryDate ? formatDate(item.batchId.expiryDate) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-green-50">
                    <TableCell colSpan={3} className="text-right font-medium text-green-800">
                      Totals
                    </TableCell>
                    <TableCell className="font-medium text-green-800">{getTotalQuantity()}</TableCell>
                    <TableCell className="font-medium text-green-800">
                      {stockHolding.items.reduce((total, item) => total + (item.baseQuantity || 0), 0)}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => router.push('/inventory/stock-holdings')}
          className="border-green-500 text-green-500 hover:bg-green-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stock Holdings
        </Button>
      </div>
    </div>
  );
};

export default StockHoldingDetailPage;