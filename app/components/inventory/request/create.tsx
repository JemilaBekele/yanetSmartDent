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

interface Product {
  _id: string;
  name: string;
  productCode: string;
}

interface ProductBatch {
  _id: string;
  batchNumber: string;
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
  };
}

interface InventoryRequestItem {
  productId: string;
  batchId?: string;
  productUnitId: string;
  requestedQuantity: number;
  availableQuantity?: number;
  isAvailable?: boolean;
  conversionToBase?: number;
}

interface InventoryRequestFormValues {
  notes: string;
  requestDate: Date;
  items: InventoryRequestItem[];
}

interface SelectOption {
  value: string;
  label: string;
}

export default function CreateInventoryRequestPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } =
    useForm<InventoryRequestFormValues>({
      defaultValues: {
        notes: '',
        requestDate: new Date(),
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

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items');
  const totalProducts = items.length;
  const totalRequestedQuantity = items.reduce((sum, item) => sum + (item.requestedQuantity || 0), 0);

  // Calculate availability status
  const allItemsAvailable = items.every(item => item.isAvailable && item.availableQuantity && item.availableQuantity > 0);
  const someItemsAvailable = items.some(item => item.isAvailable && item.availableQuantity && item.availableQuantity > 0);
  const availabilityStatus = allItemsAvailable 
    ? 'All Available' 
    : someItemsAvailable 
      ? 'Partially Available' 
      : 'Not Available';

  const refreshProducts = async () => {
    try {
      const response = await fetch('/api/inventory/Product');
      const data = await response.json();
      if (response.ok) setProducts(data.data || data);
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await refreshProducts();
      } catch (error) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: InventoryRequestFormValues) => {
    try {
      setSubmitting(true);
      
      // Validate that requested quantities don't exceed available quantities
      const itemsExceedingStock = data.items.filter(item => {
        const requestedBaseQty = item.requestedQuantity * (item.conversionToBase || 1);
        const availableBaseQty = (item.availableQuantity || 0) * (item.conversionToBase || 1);
        return requestedBaseQty > availableBaseQty;
      });
      
      if (itemsExceedingStock.length > 0) {
        toast.error('Some items exceed available stock. Please adjust quantities.');
        return;
      }

      const requestData = { 
        ...data, 
        requestDate: data.requestDate.toISOString(),
        items: data.items.map(item => ({
          productId: item.productId,
          batchId: item.batchId,
          productUnitId: item.productUnitId,
          requestedQuantity: item.requestedQuantity
        }))
      };

      const response = await fetch('/api/inventory/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create request');

      toast.success('Inventory request created successfully');
      router.push('/inventory/request');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () =>
    append({
      productId: '',
      batchId: '',
      productUnitId: '',
      requestedQuantity: 1,
    });

  const removeItem = (index: number) => {
    if (fields.length > 1) remove(index);
    else toast.error('At least one item is required');
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Create Inventory Request</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestDate">Request Date</Label>
                <Controller
                  name="requestDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register('notes')} placeholder="Additional notes (optional)" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Request Items</CardTitle>
            <Button type="button" onClick={addItem} variant="outline" size="sm">
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
                    <InventoryRequestItemRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      products={products}
                      removeItem={removeItem}
                      setValue={setValue}
                      watch={watch}
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
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || availabilityStatus === 'Not Available'}
          >
            {submitting ? 'Creating Request...' : 'Create Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------------- InventoryRequest Item Row ---------------- //
interface ItemRowProps {
  index: number;
  control: any;
  register: any;
  products: Product[];
  removeItem: (index: number) => void;
  setValue: any;
  watch: any;
}

function InventoryRequestItemRow({ index, control, register, products, removeItem, setValue, watch }: ItemRowProps) {
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

  const productOptions: SelectOption[] = products.map(p => ({ value: p._id, label: `${p.name} (${p.productCode})` }));
  const batchOptions: SelectOption[] = batches.map(b => ({ value: b._id, label: `${b.batchNumber} (${b.size})` }));
  const unitOptions: SelectOption[] = units.map(u => ({
    value: u._id,
    label: u.unitOfMeasureId ? `${u.unitOfMeasureId.name} (${u.conversionToBase})${u.isDefault ? ' (Default)' : ''}` : `${u.name}${u.isDefault ? ' (Default)' : ''}`,
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
        // If 404, return 0 instead of throwing an error
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
        const res = await fetch(`/api/inventory/ProductBatch/pro/${productId}`);
        const data = await res.json();
        if (res.ok) setBatches(data.data || data);
      } catch {
        toast.error('Failed to load batches');
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
  }, [productId]);

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
        const res = await fetch(`/api/inventory/productunit/pro/${productId}`);
        const data = await res.json();
        if (res.ok) {
          setUnits(data.data || data);
          const defaultUnit = (data.data || data).find((u: ProductUnit) => u.isDefault) || (data.data || data)[0];
          if (defaultUnit) {
            setValue(`items.${index}.productUnitId`, defaultUnit._id);
            setValue(`items.${index}.conversionToBase`, defaultUnit.conversionToBase);
          }
        }
      } catch {
        toast.error('Failed to load units');
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchUnits();
  }, [productId]);

  // Check availability when batch, unit, or requested quantity changes
  useEffect(() => {
    checkAvailability();
  }, [batchId, productUnitId, requestedQuantity, conversionToBase]);

  // Update conversion factor when unit changes
  const handleUnitChange = (selectedOption: SelectOption | null) => {
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
      <TableCell>
        <Controller
          name={`items.${index}.productId`}
          control={control}
          rules={{ required: 'Product required' }}
          render={({ field }) => (
            <Select
              options={productOptions}
              value={productOptions.find(opt => opt.value === field.value)}
              onChange={sel => field.onChange(sel?.value)}
              placeholder="Select product"
              isClearable
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          )}
        />
      </TableCell>

      <TableCell>
        <Controller
          name={`items.${index}.batchId`}
          control={control}
          rules={{ required: 'Batch required' }}
          render={({ field }) => (
            <Select
              options={batchOptions}
              value={batchOptions.find(opt => opt.value === field.value)}
              onChange={sel => field.onChange(sel?.value)}
              placeholder={loadingBatches ? 'Loading...' : 'Select batch'}
              isDisabled={loadingBatches || !productId}
              isClearable
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          )}
        />
      </TableCell>

      <TableCell>
        <Controller
          name={`items.${index}.productUnitId`}
          control={control}
          rules={{ required: 'Unit required' }}
          render={({ field }) => (
            <Select
              options={unitOptions}
              value={unitOptions.find(opt => opt.value === field.value)}
              onChange={handleUnitChange}
              placeholder={loadingUnits ? 'Loading...' : 'Select unit'}
              isDisabled={loadingUnits || !productId}
              isClearable
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          )}
        />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{availableQuantity.toFixed(2)}</span>
        </div>
      </TableCell>

      <TableCell>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          {...register(`items.${index}.requestedQuantity`, {
            required: 'Requested quantity required',
            min: { value: 0.01, message: 'Must be greater than 0' },
            valueAsNumber: true,
          })}
          className="w-[120px]"
        />
      </TableCell>

      <TableCell>
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

      <TableCell>
        <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}