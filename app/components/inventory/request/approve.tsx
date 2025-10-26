'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import Select from 'react-select';

// Types
interface RequestItem {
  _id?: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  productUnitId: string;
  unitName: string;
  conversionToBase: number;
  requestedQuantity: number;
  approvedQuantity: number;
  availableQuantity: number;
  isAvailable: boolean;
}

interface RequestFormValues {
  requestNo: string;
  requestedById: string;
  notes: string;
  requestDate: Date;
  approvalStatus: string;
  items: RequestItem[];
}

// Type for react-select options
interface SelectOption {
  value: string;
  label: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

// Helper function to extract ID from object or string
const extractId = (idField: any): string => {
  if (typeof idField === 'string') return idField;
  if (idField && typeof idField === 'object' && idField._id) return idField._id;
  return '';
};

export default function UpdateInventoryRequestPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RequestFormValues>({
    defaultValues: {
      requestNo: '',
      notes: '',
      requestDate: new Date(),
      approvalStatus: 'PENDING',
      items: [],
    },
  });

  const items = watch('items');
  const approvalStatus = watch('approvalStatus');
  const totalRequestedQuantity = items.reduce((sum, item) => sum + (item.requestedQuantity || 0), 0);
  const totalApprovedQuantity = items.reduce((sum, item) => sum + (item.approvedQuantity || 0), 0);
  const totalProducts = items.length;

  // Calculate availability status correctly
  const allItemsAvailable = items.every(item => item.isAvailable && item.availableQuantity > 0);
  const someItemsAvailable = items.some(item => item.isAvailable && item.availableQuantity > 0);
  const availabilityStatus = allItemsAvailable 
    ? 'All Available' 
    : someItemsAvailable 
      ? 'Partially Available' 
      : 'Not Available';

  const approvalStatusOptions: SelectOption[] = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  const customSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: '40px',
      height: '40px',
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: '40px',
      padding: '0 8px',
    }),
    input: (provided: any) => ({
      ...provided,
      margin: '0px',
    }),
    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: '40px',
    }),
    menu: (provided: any) => ({
      ...provided,
      position: 'absolute',
      zIndex: 9999,
    }),
    menuPortal: (provided: any) => ({ 
      ...provided, 
      zIndex: 9999 
    }),
  };

  // Fetch available stock for a batch
  const fetchAvailableStock = async (batchId: string) => {
    try {
      const response = await fetch(`/api/inventory/stock/${batchId}`);
      
      if (!response.ok) {
        // If 404, return 0 instead of throwing an error
        if (response.status === 404) {
          return 0;
        }
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch available stock');
      }
      
      const data = await response.json();
      return data.data.availableQuantity || 0;
    } catch (error) {
      console.error('Error fetching available stock:', error);
      return 0;
    }
  };

  // Check if requested quantity is available considering unit conversion
  const checkItemAvailability = async (item: RequestItem) => {
    try {
      // Get available stock for this batch
      const availableStock = await fetchAvailableStock(item.batchId);
      
      // Convert requested quantity to base units for comparison
      const requestedBaseQuantity = item.requestedQuantity * item.conversionToBase;
      const approvedBaseQuantity = item.approvedQuantity * item.conversionToBase;
      
      // Check if approved quantity is available
      const isAvailable = approvedBaseQuantity <= availableStock;
      
      return {
        availableQuantity: availableStock / item.conversionToBase, // Convert back to display units
        isAvailable
      };
    } catch (error) {
      console.error('Error checking item availability:', error);
      return {
        availableQuantity: 0,
        isAvailable: false
      };
    }
  };

  // Check all items for availability
  const checkAllItemsAvailability = async () => {
    if (items.length === 0) return;
    
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        const availability = await checkItemAvailability(item);
        
        // If available quantity is zero, set approved quantity to zero
        const approvedQuantity = availability.availableQuantity === 0 ? 0 : item.approvedQuantity;
        
        return {
          ...item,
          ...availability,
          approvedQuantity
        };
      })
    );
    
    // Update form values with availability info
    setValue('items', updatedItems);
  };

  // Set approved quantity equal to requested quantity by default
  const setApprovedToRequested = () => {
    const updatedItems = items.map(item => ({
      ...item,
      approvedQuantity: item.availableQuantity > 0 ? item.requestedQuantity : 0
    }));
    setValue('items', updatedItems);
    checkAllItemsAvailability();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const requestResponse = await fetch(`/api/inventory/request/${id}`);
        const requestData = await requestResponse.json();

        if (!requestResponse.ok) {
          throw new Error(requestData.message || 'Failed to fetch request data');
        }

        if (requestData) {
          // Fetch detailed information for each item
          const formattedItems = await Promise.all(
            requestData.items?.map(async (item: any) => {
              // Extract IDs properly
              const productId = extractId(item.productId);
              const batchId = extractId(item.batchId);
              const productUnitId = extractId(item.productUnitId);
              
              // Fetch product unit details for conversion factor
              let conversionToBase = 1;
              let unitName = 'Unit';
              let productName = 'Product';
              let batchNumber = 'Batch';
              
              try {
                if (productUnitId) {
                  const productUnitResponse = await fetch(`/api/inventory/productunit/get/${productUnitId}`);
                  if (productUnitResponse.ok) {
                    const productUnitData = await productUnitResponse.json();
                    conversionToBase = productUnitData.conversionToBase || 1;
                    unitName = productUnitData.unitOfMeasureId?.name || 'Unit';
                  }
                }
                
                // Fetch product name
                if (productId) {
                  const productResponse = await fetch(`/api/inventory/Product/${productId}`);
                  if (productResponse.ok) {
                    const productData = await productResponse.json();
                    productName = productData.name || 'Product';
                  }
                }
                
                // Fetch batch number
                if (batchId) {
                  const batchResponse = await fetch(`/api/inventory/ProductBatch/${batchId}`);
                  if (batchResponse.ok) {
                    const batchData = await batchResponse.json();
                    batchNumber = batchData.batchNumber || 'Batch';
                  }
                }
                
              } catch (error) {
                console.error('Error fetching details:', error);
              }
              
              // Check availability
              const availableStock = await fetchAvailableStock(batchId);
              const requestedBaseQuantity = (item.requestedQuantity || 0) * conversionToBase;
              const approvedBaseQuantity = (item.approvedQuantity || 0) * conversionToBase;
              const isAvailable = approvedBaseQuantity <= availableStock;
              
              // If available quantity is zero, set approved quantity to zero
              const approvedQuantity = availableStock === 0 ? 0 : (item.approvedQuantity || item.requestedQuantity || 0);
              
              return {
                _id: item._id,
                productId: productId,
                productName: productName,
                batchId: batchId,
                batchNumber: batchNumber,
                productUnitId: productUnitId,
                unitName,
                conversionToBase,
                requestedQuantity: item.requestedQuantity || 1,
                approvedQuantity: approvedQuantity,
                availableQuantity: availableStock / conversionToBase, // Convert back to display units
                isAvailable
              };
            }) || []
          );

          reset({
            requestNo: requestData.requestNo || '',
            notes: requestData.notes || '',
            requestDate: new Date(requestData.requestDate) || new Date(),
            approvalStatus: requestData.approvalStatus || 'PENDING',
            items: formattedItems
          });

          // Check availability for all items after loading
          setTimeout(() => {
            checkAllItemsAvailability();
          }, 100);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Failed to load request data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, reset]);

  // Recheck availability when approval status changes to APPROVED
  useEffect(() => {
    if (approvalStatus === 'APPROVED') {
      checkAllItemsAvailability();
    }
  }, [approvalStatus]);

  const onSubmit = async (data: RequestFormValues) => {
    try {
      setSubmitting(true);
      
      // Validate that all approved quantities are available if status is APPROVED
      if (data.approvalStatus === 'APPROVED') {
        const unavailableItems = data.items.filter(item => 
          item.approvedQuantity > 0 && !item.isAvailable
        );
        
        if (unavailableItems.length > 0) {
          toast.error('Some items have insufficient stock. Please adjust quantities.');
          return;
        }
      }

      const requestData = {
        approvalStatus: data.approvalStatus,
        items: data.items.map(item => ({
          _id: item._id,
          approvedQuantity: item.approvedQuantity,
        }))
      };

      const response = await fetch(`/api/inventory/request/approve/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update request');
      }

      toast.success('Inventory request updated successfully');
      router.push('/inventory/request');
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error(error.message || 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle approved quantity change
  const handleApprovedQuantityChange = async (index: number, value: number) => {
    const currentItems = [...items];
    currentItems[index].approvedQuantity = value;
    
    // Check availability for this item
    const availability = await checkItemAvailability(currentItems[index]);
    
    // If available quantity is zero, set approved quantity to zero
    const approvedQuantity = availability.availableQuantity === 0 ? 0 : value;
    
    currentItems[index] = {
      ...currentItems[index],
      ...availability,
      approvedQuantity
    };
    
    setValue('items', currentItems);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Update Inventory Request</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestNo">Request Number</Label>
                <Input
                  id="requestNo"
                  {...register('requestNo')}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestDate">Request Date</Label>
                <Controller
                  name="requestDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvalStatus">Approval Status</Label>
                <Controller
                  name="approvalStatus"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={approvalStatusOptions}
                      value={approvalStatusOptions.find(option => option.value === field.value)}
                      onChange={(selected) => field.onChange(selected?.value)}
                      placeholder="Select status"
                      isClearable
                      className="flex-1"
                      styles={customSelectStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                    />
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={setApprovedToRequested}
                disabled={approvalStatus !== 'APPROVED' || items.length === 0}
              >
                Set Approved = Requested
              </Button>
            </div>
            
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items found in this request
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Product</TableHead>
                        <TableHead className="min-w-[150px]">Batch</TableHead>
                        <TableHead className="min-w-[100px]">Unit</TableHead>
                        <TableHead className="min-w-[120px]">Requested Qty</TableHead>
                        <TableHead className="min-w-[120px]">Available Qty</TableHead>
                        <TableHead className="min-w-[120px]">Approved Qty</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item._id || index} className={!item.isAvailable || item.availableQuantity === 0 ? 'bg-red-50' : ''}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.batchNumber}</TableCell>
                          <TableCell>{item.unitName}</TableCell>
                          <TableCell>{item.requestedQuantity}</TableCell>
                          <TableCell>{item.availableQuantity.toFixed(2)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={item.availableQuantity > 0 ? item.requestedQuantity : 0}
                              step="0.01"
                              className="w-[100px]"
                              value={item.approvedQuantity}
                              onChange={(e) => handleApprovedQuantityChange(index, parseFloat(e.target.value) || 0)}
                              disabled={item.availableQuantity === 0}
                            />
                          </TableCell>
                          <TableCell>
                            {item.isAvailable && item.availableQuantity > 0 ? (
                              <CheckCircle className="text-green-500" size={20} />
                            ) : (
                              <AlertCircle className="text-red-500" size={20} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Products</p>
                      <p className="text-2xl font-bold">{totalProducts}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Requested Qty</p>
                      <p className="text-2xl font-bold">{totalRequestedQuantity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Approved Qty</p>
                      <p className="text-2xl font-bold">{totalApprovedQuantity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Availability Status</p>
                      <p className={`text-2xl font-bold ${
                        availabilityStatus === 'All Available' 
                          ? 'text-green-600' 
                          : availabilityStatus === 'Partially Available' 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }`}>
                        {availabilityStatus}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || (approvalStatus === 'APPROVED' && availabilityStatus === 'Not Available')}
          >
            {submitting ? 'Updating Request...' : 'Update Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}