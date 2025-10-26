'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Calendar,
  User,
  Info,
  Check,
  X,
  Loader2,
  FileText,
  Truck,
  Box,
  ClipboardList,
  MapPin
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { formatDate } from '@/app/lib/format';

// Types
interface User {
  _id: string;
  username: string;
  email?: string;
}

interface Product {
  _id: string;
  name: string;
  productCode: string;
}

interface ProductBatch {
  _id: string;
  batchNumber: string;
}

interface ProductUnit {
  _id: string;
  name: string;
  abbreviation: string;
  isDefault: boolean;
  unitOfMeasureId?: {
    _id: string;
    name: string;
    symbol: string;
  };
}

interface Location {
  _id: string;
  name: string;
  code?: string;
}

interface StockWithdrawalItem {
  _id?: string;
  productId: Product;
  batchId: ProductBatch;
  productUnitId: ProductUnit;
  requestedQuantity: number;
  fromLocationId: Location;
  toLocationId: Location;
}

interface StockWithdrawalRequest {
  _id: string;
  userId: User;
  notes: string;
  status: string;
  items: StockWithdrawalItem[];
  requestedAt: string;
  approvedAt?: string;
  issuedAt?: string;
  createdBy?: {
    _id: string;
    username: string;
  };
  updatedBy?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

enum StockWithdrawalStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  ISSUED = 'ISSUED'
}

type StockWithdrawalViewProps = {
  id?: string;
};

const StockLocationWithdrawalDetailPage: React.FC<StockWithdrawalViewProps> = ({ id }) => {
  const [withdrawal, setWithdrawal] = useState<StockWithdrawalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StockWithdrawalStatus>();
  const router = useRouter();

  useEffect(() => {
    const fetchWithdrawal = async () => {
      try {
        if (id) {
          const response = await fetch(`/api/inventory/loctolocstockwithdrawal/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch withdrawal request');
          }
          const withdrawalData = await response.json();

          setWithdrawal(withdrawalData);
          setSelectedStatus(withdrawalData.status);
        }
      } catch (error) {
        toast.error('Failed to fetch withdrawal request details');
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawal();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!id || !selectedStatus) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/inventory/loctolocstockwithdrawal/approve/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update withdrawal status');
      }

      // Update local state
      setWithdrawal(prev => prev ? {
        ...prev,
        status: selectedStatus,
        updatedAt: new Date().toISOString(),
        // Update timestamps based on status
        ...(selectedStatus === StockWithdrawalStatus.ISSUED && { issuedAt: new Date().toISOString() })
      } : null);
      
      toast.success(`Withdrawal status updated to ${selectedStatus} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update withdrawal status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-green-600" />
        <p className="text-green-800">Loading withdrawal request details...</p>
      </div>
    );
  }

  if (!withdrawal) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-green-800">Withdrawal request not found</p>
      </div>
    );
  }

  // Calculate total quantity
  const totalQuantity = withdrawal.items?.reduce(
    (sum, item) => sum + (item.requestedQuantity || 0),
    0
  ) || 0;

  // Check if withdrawal is already in a final state
  const isImmutable = [StockWithdrawalStatus.ISSUED, StockWithdrawalStatus.REJECTED].includes(withdrawal.status as StockWithdrawalStatus);

  // Status badge variants
  const getStatusVariant = (status: string) => {
    switch (status) {
      case StockWithdrawalStatus.ISSUED:
        return 'default';
      case StockWithdrawalStatus.REJECTED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Withdrawal Status Update Section */}
      {!isImmutable && (
        <Card className="shadow-lg border-green-200">
          <CardHeader className="bg-green-50 rounded-t-lg">
            <CardTitle className="text-xl font-bold text-green-800">Update Withdrawal Status</CardTitle>
          </CardHeader>
          <CardContent className="bg-green-25">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Select
                value={selectedStatus}
                onValueChange={(value: StockWithdrawalStatus) => setSelectedStatus(value)}
              >
                <SelectTrigger className="w-full sm:w-[200px] border-green-300 focus:ring-green-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={StockWithdrawalStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={StockWithdrawalStatus.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={StockWithdrawalStatus.ISSUED} className="text-green-600 focus:text-green-700">
                    Issued
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === withdrawal.status}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
              
              {selectedStatus && selectedStatus !== withdrawal.status && (
                <Badge variant="outline" className="ml-2 border-green-300 text-green-700">
                  Changing from {withdrawal.status} to {selectedStatus}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Details Card */}
      <Card className="shadow-lg border-green-200">
        <CardHeader className="bg-green-50 rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-green-800">
            <FileText className="text-green-600" />
            Stock Withdrawal Request
            <Badge
              variant={getStatusVariant(withdrawal.status)}
              className="ml-2"
            >
              {withdrawal.status === StockWithdrawalStatus.ISSUED ? (
                <>
                  <Truck className="h-3 w-3 mr-1 text-green-600" /> {withdrawal.status}
                </>
              ) : withdrawal.status === StockWithdrawalStatus.REJECTED ? (
                <>
                  <X className="h-3 w-3 mr-1" /> {withdrawal.status}
                </>
              ) : (
                <>{withdrawal.status}</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 bg-green-25">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Withdrawal Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Info className="h-5 w-5 text-green-600" />
                Request Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <p>
                    <span className="font-medium text-green-800">Requested By:</span> {withdrawal.userId?.username || 'Unknown User'}
                  </p>
                </div>
                {withdrawal.userId?.email && (
                  <div className="flex items-center gap-2">
                    <p>
                      <span className="font-medium text-green-800">Email:</span> {withdrawal.userId.email}
                    </p>
                  </div>
                )}
                {withdrawal.createdBy && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <p>
                      <span className="font-medium text-green-800">Created By:</span> {withdrawal.userId.username}
                    </p>
                  </div>
                )}
                {withdrawal.updatedBy && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <p>
                      <span className="font-medium text-green-800">Updated By:</span> {withdrawal.updatedBy.username}
                    </p>
                  </div>
                )}
                {withdrawal.notes && (
                  <div>
                    <p className="font-medium text-green-800">Notes:</p>
                    <p className="text-green-700">{withdrawal.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Date Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Calendar className="h-5 w-5 text-green-600" />
                Date Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-green-800">Requested At:</p>
                  <p className="text-green-700">{formatDate(withdrawal.requestedAt)}</p>
                </div>
                {withdrawal.approvedAt && (
                  <div>
                    <p className="font-medium text-green-800">Approved At:</p>
                    <p className="text-green-700">{formatDate(withdrawal.approvedAt)}</p>
                  </div>
                )}
                {withdrawal.issuedAt && (
                  <div>
                    <p className="font-medium text-green-800">Issued At:</p>
                    <p className="text-green-700">{formatDate(withdrawal.issuedAt)}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-green-800">Created At:</p>
                  <p className="text-green-700">{formatDate(withdrawal.createdAt)}</p>
                </div>
                <div>
                  <p className="font-medium text-green-800">Updated At:</p>
                  <p className="text-green-700">{formatDate(withdrawal.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <p>
                    <span className="font-medium text-green-800">Total Items:</span> {withdrawal.items?.length || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-green-600" />
                  <p>
                    <span className="font-medium text-green-800">Total Quantity:</span> {totalQuantity}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal Items Table Section */}
          {withdrawal.items?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Requested Items
              </h3>
              <Table>
  <TableHeader>
    <TableRow className="bg-green-50 hover:bg-green-100">
      <TableHead className="text-green-800">Product</TableHead>
      <TableHead className="text-green-800">Batch</TableHead>
      <TableHead className="text-green-800">Unit</TableHead>
      <TableHead className="text-green-800">From Location</TableHead> {/* ✅ NEW */}
      <TableHead className="text-green-800">To Location</TableHead>
      <TableHead className="text-green-800">Requested Quantity</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {withdrawal.items.map((item, index) => (
      <TableRow
        key={item._id || index}
        className="border-green-100 hover:bg-green-50"
      >
        <TableCell className="font-medium">
          {item.productId?.name || "Unknown Product"}
          {item.productId?.productCode && (
            <div className="text-sm text-green-600">
              Code: {item.productId.productCode}
            </div>
          )}
        </TableCell>
        <TableCell>{item.batchId?.batchNumber || "N/A"}</TableCell>
        <TableCell>
          {item.productUnitId?.unitOfMeasureId?.name ||
            item.productUnitId?.name ||
            "N/A"}
          {item.productUnitId?.abbreviation && (
            <div className="text-sm text-green-600">
              ({item.productUnitId.abbreviation})
            </div>
          )}
        </TableCell>

        {/* ✅ From Location */}
        <TableCell>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-green-600" />
            {item.fromLocationId?.name || "Unknown Location"}
            {item.fromLocationId?.code && (
              <div className="text-sm text-green-600">
                ({item.fromLocationId.code})
              </div>
            )}
          </div>
        </TableCell>

        {/* ✅ To Location */}
        <TableCell>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-green-600" />
            {item.toLocationId?.name || "Unknown Location"}
            {item.toLocationId?.code && (
              <div className="text-sm text-green-600">
                ({item.toLocationId.code})
              </div>
            )}
          </div>
        </TableCell>

        <TableCell className="font-medium text-green-700">
          {item.requestedQuantity}
        </TableCell>
      </TableRow>
    ))}

    <TableRow className="bg-green-100 hover:bg-green-200">
      <TableCell colSpan={5} className="text-right font-medium text-green-800">
        Grand Total
      </TableCell>
      <TableCell className="font-medium text-green-800">{totalQuantity}</TableCell>
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
          onClick={() => router.push('/inventory/stockwithdrawal/LoctoLoc')}
          className="border-green-300 text-green-700 hover:bg-green-50"
        >
          Back to Withdrawals
        </Button>
        {withdrawal.status === StockWithdrawalStatus.PENDING && (
          <Button 
            onClick={() => router.push(`/inventory/stockwithdrawal/LoctoLoc/${withdrawal._id}`)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Edit Withdrawal
          </Button>
        )}
      </div>
    </div>
  );
};

export default StockLocationWithdrawalDetailPage;