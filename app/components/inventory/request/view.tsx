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
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { formatDate } from '@/app/lib/format';
import { InventoryRequest } from './list';

type InventoryRequestViewProps = {
  id?: string;
};

const InventoryRequestDetailPage: React.FC<InventoryRequestViewProps> = ({ id }) => {
  const [inventoryRequest, setInventoryRequest] = useState<InventoryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchInventoryRequest = async () => {
      try {
        if (id) {
          const response = await fetch(`/api/inventory/request/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch inventory request');
          }
          const requestData = await response.json();
          setInventoryRequest(requestData);
        }
      } catch (error) {
        toast.error('Failed to fetch inventory request details');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryRequest();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-green-600" />
        <p className="text-green-600">Loading inventory request details...</p>
      </div>
    );
  }

  if (!inventoryRequest) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-red-600">Inventory request not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 bg-gray-50">
      {/* Inventory Request Details Card */}
      <Card className="shadow-lg border border-gray-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-green-800">
            <Receipt className="text-green-600" />
            Inventory Request: {inventoryRequest.requestNo}
            <Badge
              variant={
                inventoryRequest.approvalStatus === 'APPROVED'
                  ? 'default'
                  : inventoryRequest.approvalStatus === 'REJECTED'
                  ? 'destructive'
                  : 'secondary'
              }
              className={
                inventoryRequest.approvalStatus === 'APPROVED'
                  ? 'ml-2 bg-green-100 text-green-800'
                  : inventoryRequest.approvalStatus === 'REJECTED'
                  ? 'ml-2 bg-red-100 text-red-800'
                  : 'ml-2 bg-yellow-100 text-yellow-800'
              }
            >
              {inventoryRequest.approvalStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Request Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Info className="h-5 w-5 text-green-500" />
                Request Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Request No:</span> {inventoryRequest.requestNo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Requested By:</span> {inventoryRequest.requestedById?.username || 'Unknown User'}
                  </p>
                </div>
                {inventoryRequest.notes && (
                  <div>
                    <p className="font-medium text-gray-700">Notes:</p>
                    <p className="text-gray-600">{inventoryRequest.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Date and Quantity Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Calendar className="h-5 w-5 text-green-500" />
                Date & Quantity Details
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-700">Request Date:</p>
                  <p className="text-gray-600">{formatDate(inventoryRequest.requestDate)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Created At:</p>
                  <p className="text-gray-600">{formatDate(inventoryRequest.created_at)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Updated At:</p>
                  <p className="text-gray-600">{formatDate(inventoryRequest.updated_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Total Products:</span> {inventoryRequest.totalProducts}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Total Requested Quantity:</span> {inventoryRequest.totalRequestedQuantity}
                  </p>
                </div>
               
              </div>
            </div>
          </div>

          {/* Inventory Request Items Table Section */}
          {inventoryRequest.items?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-700">Requested Items</h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-50">
                    <TableHead className="text-green-800">Product</TableHead>
                    <TableHead className="text-green-800">Batch</TableHead>
                    <TableHead className="text-green-800">Unit</TableHead>
                    <TableHead className="text-green-800">Requested Quantity</TableHead>
                    <TableHead className="text-green-800">Approved Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryRequest.items.map((item, index) => (
                    <TableRow key={item._id || index} className="hover:bg-gray-100">
                      <TableCell className="font-medium text-gray-800">
                        {item.productId?.name || 'Unknown Product'}
                        {item.productId?.productCode && (
                          <div className="text-sm text-gray-500">
                            Code: {item.productId.productCode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">{item.batchId?.batchNumber || 'N/A'}</TableCell>
                      <TableCell className="text-gray-700">
                        {item.productUnitId?.unitOfMeasureId?.name || 'N/A'}
                        {item.productUnitId?.abbreviation && (
                          <div className="text-sm text-gray-500">
                            ({item.productUnitId.unitOfMeasureId?.name})
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">{item.requestedQuantity}</TableCell>
                      <TableCell className="text-gray-700">{item.approvedQuantity ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-green-50">
                    <TableCell colSpan={3} className="text-right font-medium text-green-800">
                      Totals
                    </TableCell>
                    <TableCell className="font-medium text-green-800">{inventoryRequest.totalRequestedQuantity}</TableCell>
                    <TableCell className="font-medium text-green-800">{inventoryRequest.totalApprovedQuantity || 0}</TableCell>
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
          onClick={() => router.push('/inventory/request')}
          className="border-green-500 text-green-500 hover:bg-green-50"
        >
          Back to Inventory Requests
        </Button>
      </div>
    </div>
  );
};

export default InventoryRequestDetailPage;