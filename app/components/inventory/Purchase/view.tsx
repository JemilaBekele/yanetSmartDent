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
  Receipt,
  Truck,
  DollarSign,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { formatDate } from '@/app/lib/format';

// Types
interface Supplier {
  _id: string;
  name: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
}

interface Product {
  _id: string;
  name: string;
  productCode: string;
}

interface ProductBatch {
  _id: string;
  batchNumber: string;
  price: number;
  size: string;
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
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

interface PurchaseItem {
  _id?: string;
  productId: Product;
  batchId: ProductBatch;
  productUnitId: ProductUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Purchase {
  _id: string;
  invoiceNo: string;
  supplierId: Supplier;
  notes: string;
  purchaseDate: string;
  approvalStatus: string;
  items: PurchaseItem[];
  createdBy?: {
    _id: string;
    name: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

type PurchaseViewProps = {
  id?: string;
};

const PurchaseDetailPage: React.FC<PurchaseViewProps> = ({ id }) => {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus>();
  const router = useRouter();

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        if (id) {
          const response = await fetch(`/api/inventory/Purchase/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch purchase');
          }
          const purchaseData = await response.json();
          console.log(purchaseData)
          setPurchase(purchaseData);
          setSelectedStatus(purchaseData.approvalStatus);
        }
      } catch (error) {
        toast.error('Failed to fetch purchase details');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!id || !selectedStatus) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/inventory/Purchase/approve/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvalStatus: selectedStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update purchase status');
      }

      // Update local state
      setPurchase(prev => prev ? {
        ...prev,
        approvalStatus: selectedStatus,
        updatedAt: new Date().toISOString()
      } : null);
      
      toast.success(`Purchase status updated to ${selectedStatus} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update purchase status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-green-600" />
        <p className="text-green-600">Loading purchase details...</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-red-600">Purchase not found</p>
      </div>
    );
  }

  // Calculate total amount
  const totalAmount = purchase.items?.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  ) || 0;

  // Calculate total quantity
  const totalQuantity = purchase.items?.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  ) || 0;

  // Check if purchase is already approved or rejected
  const isImmutable = purchase.approvalStatus === ApprovalStatus.APPROVED || 
                     purchase.approvalStatus === ApprovalStatus.REJECTED;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 bg-gray-50">
      {/* Purchase Status Update Section */}
      {!isImmutable && (
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-xl font-bold text-green-800">Update Purchase Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Select
                value={selectedStatus}
                onValueChange={(value: ApprovalStatus) => setSelectedStatus(value)}
              >
                <SelectTrigger className="w-full sm:w-[200px] border-green-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ApprovalStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={ApprovalStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={ApprovalStatus.REJECTED}>Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === purchase.approvalStatus}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
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
              
              {selectedStatus && selectedStatus !== purchase.approvalStatus && (
                <Badge variant="outline" className="ml-2 border-green-500 text-green-600">
                  Changing from {purchase.approvalStatus} to {selectedStatus}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Details Card */}
      <Card className="shadow-lg border border-gray-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-green-800">
            <Receipt className="text-green-600" />
            Purchase Invoice: {purchase.invoiceNo}
            <Badge
              variant={
                purchase.approvalStatus === ApprovalStatus.APPROVED
                  ? 'default'
                  : purchase.approvalStatus === ApprovalStatus.REJECTED
                  ? 'destructive'
                  : 'secondary'
              }
              className={
                purchase.approvalStatus === ApprovalStatus.APPROVED
                  ? 'ml-2 bg-green-100 text-green-800'
                  : purchase.approvalStatus === ApprovalStatus.REJECTED
                  ? 'ml-2 bg-red-100 text-red-800'
                  : 'ml-2 bg-yellow-100 text-yellow-800'
              }
            >
              {purchase.approvalStatus === ApprovalStatus.APPROVED ? (
                <>
                  <Check className="h-3 w-3 mr-1" /> {purchase.approvalStatus}
                </>
              ) : purchase.approvalStatus === ApprovalStatus.REJECTED ? (
                <>
                  <X className="h-3 w-3 mr-1" /> {purchase.approvalStatus}
                </>
              ) : (
                <>{purchase.approvalStatus}</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchase Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Info className="h-5 w-5 text-green-500" />
                Purchase Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Invoice No:</span> {purchase.invoiceNo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Supplier:</span> {purchase.supplierId?.name || 'Unknown Supplier'}
                  </p>
                </div>
                {purchase.supplierId?.contactInfo?.phone && (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Supplier Phone:</span> {purchase.supplierId.contactInfo.phone}
                    </p>
                  </div>
                )}
                {purchase.supplierId?.contactInfo?.email && (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Supplier Email:</span> {purchase.supplierId.contactInfo.email}
                    </p>
                  </div>
                )}
                {purchase.createdBy && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <p className="text-gray-700">
                      <span className="font-medium">Created By:</span> {purchase.createdBy.name}
                    </p>
                  </div>
                )}
                {purchase.updatedBy && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <p className="text-gray-700">
                      <span className="font-medium">Updated By:</span> {purchase.updatedBy.name}
                    </p>
                  </div>
                )}
                {purchase.notes && (
                  <div>
                    <p className="font-medium text-gray-700">Notes:</p>
                    <p className="text-gray-600">{purchase.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Date and Amount Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Calendar className="h-5 w-5 text-green-500" />
                Date & Amount Details
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-700">Purchase Date:</p>
                  <p className="text-gray-600">{formatDate(purchase.purchaseDate)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Created At:</p>
                  <p className="text-gray-600">{formatDate(purchase.createdAt)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Updated At:</p>
                  <p className="text-gray-600">{formatDate(purchase.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Total Items:</span> {purchase.items?.length || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Total Quantity:</span> {totalQuantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Total Amount:</span> ${totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Items Table Section */}
          {purchase.items?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-700">Purchase Items</h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-50">
                    <TableHead className="text-green-800">Product</TableHead>
                    <TableHead className="text-green-800">Batch</TableHead>
                    <TableHead className="text-green-800">Unit</TableHead>
                    <TableHead className="text-green-800">Quantity</TableHead>
                    <TableHead className="text-green-800">Unit Price</TableHead>
                    <TableHead className="text-green-800">Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items.map((item, index) => (
                    <TableRow key={item._id || index} className="hover:bg-gray-100">
                      <TableCell className="font-medium text-gray-800">
                        {item.productId?.name || 'Unknown Product'}
                        {item.productId?.productCode && (
                          <div className="text-sm text-gray-500">
                            Code: {item.productId.productCode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {item.batchId?.batchNumber || 'N/A'}
                        {item.batchId?.size && (
                          <div className="text-sm text-gray-500">
                            Size: {item.batchId.size}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {item.productUnitId.unitOfMeasureId?.name|| 'N/A'}
                        {item.productUnitId?.abbreviation && (
                          <div className="text-sm text-gray-500">
                            ({item.productUnitId.unitOfMeasureId?.name})
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">{item.quantity}</TableCell>
                      <TableCell className="text-gray-700">${item.unitPrice?.toFixed(2)}</TableCell>
                      <TableCell className="font-medium text-gray-800">
                        ${item.totalPrice?.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-green-50">
                    <TableCell colSpan={3} className="text-right font-medium text-green-800">
                      Grand Total
                    </TableCell>
                    <TableCell className="font-medium text-green-800">{totalQuantity}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-medium text-green-800">${totalAmount.toFixed(2)}</TableCell>
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
          onClick={() => router.push('/inventory/Purchase')}
          className="border-green-500 text-green-500 hover:bg-green-50"
        >
          Back to Purchases
        </Button>
        {!isImmutable && (
          <Button 
            onClick={() => router.push(`/inventory/Purchase/${purchase._id}`)}
            className="bg-green-600 hover:bg-green-700"
          >
            Edit Purchase
          </Button>
        )}
      </div>
    </div>
  );
};

export default PurchaseDetailPage;