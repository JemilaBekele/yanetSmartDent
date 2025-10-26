'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import Select from 'react-select';

// Types
interface User {
  _id: string;
  name: string;
  email: string;
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
  conversionToBase: number;
  unitOfMeasureId?: {
    _id: string;
    name: string;
    symbol: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

interface RequestItem {
  _id?: string;
  productId: string;
  batchId: string;
  productUnitId: string;
  requestedQuantity: number;
  availableQuantity?: number;
  isAvailable?: boolean;
  conversionToBase?: number;
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

export default function UpdateInventoryRequestPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentApprovalStatus, setCurrentApprovalStatus] = useState<string>('PENDING');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({
    defaultValues: {
      requestNo: '',
      notes: '',
      requestDate: new Date(),
      approvalStatus: 'PENDING',
      items: [
        {
          productId: '',
          batchId: '',
          productUnitId: '',
          requestedQuantity: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Watch items to calculate totals
  const items = watch('items');
  const approvalStatus = watch('approvalStatus');
  const totalRequestedQuantity = items.reduce((sum, item) => sum + (item.requestedQuantity || 0), 0);
  const totalProducts = items.length;

  // Calculate availability status
  const allItemsAvailable = items.every(item => item.isAvailable && item.availableQuantity && item.availableQuantity > 0);
  const someItemsAvailable = items.some(item => item.isAvailable && item.availableQuantity && item.availableQuantity > 0);
  const availabilityStatus = allItemsAvailable 
    ? 'All Available' 
    : someItemsAvailable 
      ? 'Partially Available' 
      : 'Not Available';

  // Check if form is editable (only editable when status is PENDING)
  const isEditable = currentApprovalStatus === 'PENDING';

  // Convert users to react-select options
  const userOptions: SelectOption[] = users.map(user => ({
    value: user._id,
    label: user.name
  }));

  const approvalStatusOptions: SelectOption[] = [
    { value: 'PENDING', label: 'Pending' },
  ];

  // Custom styles for react-select to prevent scrolling issues
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

  // Refresh data functions
  const refreshUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.data || data);
      }
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };

  const refreshProducts = async () => {
    try {
      const response = await fetch('/api/inventory/Product');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.data || data);
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  // Fetch available stock for a batch
  const fetchAvailableStock = async (batchId: string) => {
    try {
      const response = await fetch(`/api/inventory/stock/${batchId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return 0;
        }
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch available stock');
      }
      
      const data = await response.json();
      return data.data?.availableQuantity || 0;
    } catch (error) {
      console.error('Error fetching available stock:', error);
      return 0;
    }
  };

  // Fetch request data and related data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch request data
        const requestResponse = await fetch(`/api/inventory/request/${id}`);
        const requestData = await requestResponse.json();
        
        if (!requestResponse.ok) {
          throw new Error(requestData.message || 'Failed to fetch request data');
        }

        // Fetch users and products
        await Promise.all([refreshUsers(), refreshProducts()]);
        
        // Set form values with fetched request data
        if (requestData) {
          setCurrentApprovalStatus(requestData.approvalStatus || 'PENDING');

          // Format the items to match our form structure with availability data
          const formattedItems = await Promise.all(
            requestData.items?.map(async (item: any) => {
              const productId = item.productId?._id || item.productId || '';
              const batchId = item.batchId?._id || item.batchId || '';
              const productUnitId = item.productUnitId?._id || item.productUnitId || '';
              
              // Fetch unit details for conversion factor
              let conversionToBase = 1;
              if (productUnitId) {
                try {
                  const unitResponse = await fetch(`/api/inventory/productunit/get/${productUnitId}`);
                  if (unitResponse.ok) {
                    const unitData = await unitResponse.json();
                    conversionToBase = unitData.conversionToBase || 1;
                  }
                } catch (error) {
                  console.error('Error fetching unit details:', error);
                }
              }

              // Check availability
              let availableQuantity = 0;
              let isAvailable = false;
              
              if (batchId) {
                try {
                  const availableStock = await fetchAvailableStock(batchId);
                  const requestedBaseQty = (item.requestedQuantity || 0) * conversionToBase;
                  availableQuantity = availableStock / conversionToBase;
                  isAvailable = requestedBaseQty <= availableStock;
                } catch (error) {
                  console.error('Error checking availability:', error);
                }
              }

              return {
                _id: item._id,
                productId: productId,
                batchId: batchId,
                productUnitId: productUnitId,
                requestedQuantity: item.requestedQuantity || 1,
                availableQuantity: availableQuantity,
                isAvailable: isAvailable,
                conversionToBase: conversionToBase
              };
            }) || []
          );

          reset({
            requestNo: requestData.requestNo || '',
            requestedById: requestData.requestedById?._id || requestData.requestedById || '',
            notes: requestData.notes || '',
            requestDate: new Date(requestData.requestDate) || new Date(),
            approvalStatus: requestData.approvalStatus || 'PENDING',
            items: formattedItems
          });
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

  const onSubmit = async (data: RequestFormValues) => {
    try {
      setSubmitting(true);
      
      // Validate that requested quantities don't exceed available quantities when status is APPROVED
      if (data.approvalStatus === 'APPROVED') {
        const itemsExceedingStock = data.items.filter(item => {
          const requestedBaseQty = item.requestedQuantity * (item.conversionToBase || 1);
          const availableBaseQty = (item.availableQuantity || 0) * (item.conversionToBase || 1);
          return requestedBaseQty > availableBaseQty;
        });
        
        if (itemsExceedingStock.length > 0) {
          toast.error('Some items exceed available stock. Please adjust quantities before approving.');
          return;
        }
      }

      // Format the data for API
      const requestData = {
        ...data,
        requestDate: data.requestDate.toISOString(),
        // Only send approval status if it's changed
        ...(data.approvalStatus !== currentApprovalStatus && { approvalStatus: data.approvalStatus })
      };

      const response = await fetch(`/api/inventory/request/${id}`, {
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

  const addItem = () => {
    if (!isEditable) {
      toast.error('Cannot add items to an approved request');
      return;
    }
    append({
      productId: '',
      batchId: '',
      productUnitId: '',
      requestedQuantity: 1,
    });
  };

  const removeItem = (index: number) => {
    if (!isEditable) {
      toast.error('Cannot remove items from an approved request');
      return;
    }
    
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error('At least one item is required');
    }
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
                <Label htmlFor="requestNo">Request Number *</Label>
                <Input
                  id="requestNo"
                  {...register('requestNo', { required: 'Request number is required' })}
                  placeholder="Enter request number"
                  disabled={!isEditable}
                />
                {errors.requestNo && (
                  <p className="text-sm text-red-500">{errors.requestNo.message}</p>
                )}
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
                          disabled={!isEditable}
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
                          disabled={!isEditable}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
{/* 
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
              </div> */}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional notes (optional)"
                  disabled={!isEditable}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Request Items</CardTitle>
            <Button 
              type="button" 
              onClick={addItem} 
              variant="outline" 
              size="sm"
              disabled={!isEditable}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Product</TableHead>
                    <TableHead className="min-w-[150px]">Batch</TableHead>
                    <TableHead className="min-w-[150px]">Unit</TableHead>
                    <TableHead className="min-w-[120px]">Available Qty</TableHead>
                    <TableHead className="min-w-[120px]">Requested Qty</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <RequestItemRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      products={products}
                      removeItem={removeItem}
                      setValue={setValue}
                      watch={watch}
                      isEditable={isEditable}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Requested Qty</p>
                <p className="text-2xl font-bold">{totalRequestedQuantity}</p>
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
              <div>
                <p className="text-sm font-medium">Current Status</p>
                <p className={`text-2xl font-bold ${
                  currentApprovalStatus === 'APPROVED' 
                    ? 'text-green-600' 
                    : currentApprovalStatus === 'REJECTED' 
                      ? 'text-red-600' 
                      : 'text-yellow-600'
                }`}>
                  {currentApprovalStatus}
                </p>
              </div>
            </div>
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

// Component for each request item row
interface RequestItemRowProps {
  index: number;
  control: any;
  register: any;
  products: Product[];
  removeItem: (index: number) => void;
  setValue: any;
  watch: any;
  isEditable: boolean;
}

function RequestItemRow({
  index,
  control,
  register,
  products,
  removeItem,
  setValue,
  watch,
  isEditable,
}: RequestItemRowProps) {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  const productId = watch(`items.${index}.productId`);
  const batchId = watch(`items.${index}.batchId`);
  const productUnitId = watch(`items.${index}.productUnitId`);
  const requestedQuantity = watch(`items.${index}.requestedQuantity`);
  const conversionToBase = watch(`items.${index}.conversionToBase`);

  // Convert products to react-select options
  const productOptions: SelectOption[] = products.map(product => ({
    value: product._id,
    label: `${product.name} (${product.productCode})`
  }));

  // Convert batches to react-select options
  const batchOptions: SelectOption[] = batches.map(batch => ({
    value: batch._id,
    label: `${batch.batchNumber} (${batch.size})`
  }));

  // Convert units to react-select options with safe handling for unitOfMeasureId
  const unitOptions: SelectOption[] = units.map(unit => ({
    value: unit._id,
    label: unit.unitOfMeasureId 
      ? `${unit.unitOfMeasureId.name} (${unit.conversionToBase})${unit.isDefault ? " (Default)" : ""}`
      : `${unit.name}${unit.isDefault ? " (Default)" : ""}`
  }));

  // Custom styles for react-select to prevent scrolling issues
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
        if (response.status === 404) {
          return 0;
        }
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch available stock');
      }
      
      const data = await response.json();
      return data.data?.availableQuantity || 0;
    } catch (error) {
      console.error('Error fetching available stock:', error);
      return 0;
    }
  };

  // Check availability when batch or unit changes
  const checkAvailability = async () => {
    if (!batchId || !productUnitId) {
      setAvailableQuantity(0);
      setIsAvailable(false);
      return;
    }

    try {
      const availableStock = await fetchAvailableStock(batchId);
      const currentConversion = conversionToBase || 1;
      const availableInUnit = availableStock / currentConversion;
      
      setAvailableQuantity(availableInUnit);
      
      // Check if requested quantity is available (considering unit conversion)
      const requestedBaseQty = (requestedQuantity || 0) * currentConversion;
      setIsAvailable(requestedBaseQty <= availableStock);
      
      // Update the form values
      setValue(`items.${index}.availableQuantity`, availableInUnit);
      setValue(`items.${index}.isAvailable`, requestedBaseQty <= availableStock);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableQuantity(0);
      setIsAvailable(false);
    }
  };

  // Fetch batches when product changes
  useEffect(() => {
    const fetchBatches = async () => {
      if (!productId) {
        setBatches([]);
        setAvailableQuantity(0);
        setIsAvailable(false);
        return;
      }

      try {
        setLoadingBatches(true);
        const response = await fetch(`/api/inventory/ProductBatch/pro/${productId}`);
        const data = await response.json();

        if (response.ok) {
          setBatches(data.data || data);
          // Auto-select the first batch if available and no batch is selected
          const currentBatchId = watch(`items.${index}.batchId`);
          if (!currentBatchId && data.length > 0) {
            setValue(`items.${index}.batchId`, data[0]._id);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch batches');
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
        toast.error('Failed to load batches');
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();
  }, [productId, index, setValue, watch]);

  // Fetch units when product changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!productId) {
        setUnits([]);
        setAvailableQuantity(0);
        setIsAvailable(false);
        return;
      }

      try {
        setLoadingUnits(true);
        const response = await fetch(`/api/inventory/productunit/pro/${productId}`);
        const data = await response.json();

        if (response.ok) {
          setUnits(data.data || data);
          // Auto-select the default unit if available and no unit is selected
          const currentUnitId = watch(`items.${index}.productUnitId`);
          if (!currentUnitId) {
            const defaultUnit = data.find((unit: ProductUnit) => unit.isDefault) || data[0];
            if (defaultUnit) {
              setValue(`items.${index}.productUnitId`, defaultUnit._id);
              setValue(`items.${index}.conversionToBase`, defaultUnit.conversionToBase);
            }
          }
        } else {
          throw new Error(data.message || 'Failed to fetch units');
        }
      } catch (error) {
        console.error('Error fetching units:', error);
        toast.error('Failed to load units');
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [productId, index, setValue, watch]);

  // Check availability when batch, unit, or requested quantity changes
  useEffect(() => {
    checkAvailability();
  }, [batchId, productUnitId, requestedQuantity, conversionToBase]);

  // Update conversion factor when unit changes
  const handleUnitChange = (selectedOption: SelectOption | null) => {
    if (!isEditable) return;
    
    if (selectedOption) {
      const selectedUnit = units.find(u => u._id === selectedOption.value);
      if (selectedUnit) {
        setValue(`items.${index}.conversionToBase`, selectedUnit.conversionToBase);
      }
      setValue(`items.${index}.productUnitId`, selectedOption.value);
    } else {
      setValue(`items.${index}.productUnitId`, '');
      setValue(`items.${index}.conversionToBase`, 1);
    }
  };

  return (
    <TableRow className={!isAvailable && availableQuantity > 0 ? 'bg-yellow-50' : !isAvailable ? 'bg-red-50' : ''}>
      <TableCell className="py-2 align-middle">
        <Controller
          name={`items.${index}.productId`}
          control={control}
          rules={{ required: 'Product is required' }}
          render={({ field }) => (
            <Select
              options={productOptions}
              value={productOptions.find(option => option.value === field.value)}
              onChange={(selected) => field.onChange(selected?.value)}
              placeholder="Select product"
              isClearable
              className="flex-1"
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              isDisabled={!isEditable}
            />
          )}
        />
      </TableCell>

      <TableCell className="py-2 align-middle">
        <Controller
          name={`items.${index}.batchId`}
          control={control}
          rules={{ required: 'Batch is required' }}
          render={({ field }) => (
            <Select
              options={batchOptions}
              value={batchOptions.find(option => option.value === field.value)}
              onChange={(selected) => field.onChange(selected?.value)}
              placeholder={loadingBatches ? 'Loading...' : 'Select batch'}
              isDisabled={loadingBatches || !productId || !isEditable}
              isClearable
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          )}
        />
      </TableCell>

      <TableCell className="py-2 align-middle">
        <Controller
          name={`items.${index}.productUnitId`}
          control={control}
          rules={{ required: 'Unit is required' }}
          render={({ field }) => (
            <Select
              options={unitOptions}
              value={unitOptions.find(option => option.value === field.value)}
              onChange={handleUnitChange}
              placeholder={loadingUnits ? 'Loading...' : 'Select unit'}
              isDisabled={loadingUnits || !productId || !isEditable}
              isClearable
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          )}
        />
      </TableCell>

      <TableCell className="py-2 align-middle">
        <div className="flex items-center gap-2">
          <span className="font-medium">{availableQuantity.toFixed(2)}</span>
        </div>
      </TableCell>

      <TableCell className="py-2 align-middle">
        <Input
          type="number"
          min="0.01"
          step="0.01"
          className="w-[120px]"
          {...register(`items.${index}.requestedQuantity`, {
            required: 'Requested quantity is required',
            min: { value: 0.01, message: 'Quantity must be greater than 0' },
            valueAsNumber: true,
          })}
          disabled={!isEditable}
        />
      </TableCell>

      <TableCell className="py-2 align-middle">
        {batchId && productUnitId ? (
          isAvailable ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <AlertCircle className="text-red-500" size={20} />
          )
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>

      <TableCell className="py-2 align-middle">
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={() => removeItem(index)}
          disabled={!isEditable}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}