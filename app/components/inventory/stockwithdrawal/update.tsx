'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Select from 'react-select';

interface PersonalStockEntry {
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  price: number;
  productId: string;
  productName: string;
  quantity: number;
  status: string;
  userId: string;
}

interface Product {
  _id: string;
  name: string;
  code: string;
}

interface Location {
  _id: string;
  name: string;
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

interface StockWithdrawalItem {
  productId: string;
  batchId: string;
  productUnitId: string;
  requestedQuantity: number;
  toLocationId: string; // Removed fromLocationId
  availableQuantity: number;
}

interface StockWithdrawalFormValues {
  notes: string;
  items: StockWithdrawalItem[];
}

interface StockWithdrawalData {
  _id: string;
  notes: string;
  items: StockWithdrawalItem[];
  status: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function UpdateStockWithdrawalPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const isEditMode = !!id;

  const [personalStock, setPersonalStock] = useState<PersonalStockEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<StockWithdrawalData | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } =
    useForm<StockWithdrawalFormValues>({
      defaultValues: {
        notes: '',
        items: [
          {
            productId: '',
            batchId: '',
            productUnitId: '',
            requestedQuantity: 1,
            toLocationId: '', // Removed fromLocationId
            availableQuantity: 0,
          },
        ],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items');
  const totalProducts = items.length;
  const totalRequestedQuantity = items.reduce((sum, item) => sum + (item.requestedQuantity || 0), 0);

  const fetchPersonalStock = async () => {
    try {
      const response = await fetch('/api/inventory/stock/usercheck');
      const data = await response.json();
      if (response.ok) {
        setPersonalStock(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch personal stock');
      }
    } catch (error) {
      console.error('Error fetching personal stock:', error);
      toast.error('Failed to load your available stock');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory/Product');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/inventory/Location');
      const data = await response.json();
      if (response.ok) {
        setLocations(data.data || data);
      } else {
        throw new Error(data.message || 'Failed to fetch locations');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const fetchStockWithdrawalRequest = async () => {
    try {
      const response = await fetch(`/api/inventory/stockwithdrawal/${id}`);
      if (!response.ok) throw new Error('Failed to fetch stock withdrawal request');
      
      const data = await response.json();
      setExistingRequest(data);
      
      reset({
        notes: data.notes || '',
        items: data.items.map((item: any) => ({
          productId: item.productId?._id || item.productId,
          batchId: item.batchId?._id || item.batchId,
          productUnitId: item.productUnitId?._id || item.productUnitId,
          requestedQuantity: item.requestedQuantity,
          toLocationId: item.toLocationId?._id || item.toLocationId, // Removed fromLocationId
          availableQuantity: 0,
        })),
      });
    } catch (error) {
      console.error('Error fetching stock withdrawal request:', error);
      toast.error('Failed to load stock withdrawal request');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchPersonalStock(),
          fetchProducts(),
          fetchLocations(),
          isEditMode && fetchStockWithdrawalRequest(),
        ]);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditMode]);

  const onSubmit = async (data: StockWithdrawalFormValues) => {
    try {
      setSubmitting(true);

      for (const item of data.items) {
        const stockItem = personalStock.find(s => s.batchId === item.batchId);
        if (stockItem) {
          const unitResponse = await fetch(`/api/inventory/productunit/get/${item.productUnitId}`);
          const unitData = await unitResponse.json();
          
          if (unitResponse.ok) {
            const unit = unitData.data || unitData;
            const requestedInBaseUnits = item.requestedQuantity * unit.conversionToBase;
            
            if (requestedInBaseUnits > stockItem.quantity) {
              throw new Error(`Requested quantity for batch ${stockItem.batchNumber} exceeds available quantity (${stockItem.quantity} base units)`);
            }
          }
        }
      }

      const response = await fetch(`/api/inventory/stockwithdrawal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update stock withdrawal request');

      toast.success('Stock withdrawal request updated successfully');
      router.push('/inventory/stockwithdrawal');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stock withdrawal request');
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
      toLocationId: '', // Removed fromLocationId
      availableQuantity: 0,
    });

  const removeItem = (index: number) => {
    if (fields.length > 1) remove(index);
    else toast.error('At least one item is required');
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">
        Edit Stock Withdrawal Request
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                {...register('notes')} 
                placeholder="Reason for withdrawal (optional)" 
                className="w-full"
              />
            </div>
            {isEditMode && existingRequest && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Input 
                  value={existingRequest.status} 
                  disabled 
                  className="bg-gray-100"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Withdrawal Items</CardTitle>
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
                    {/* Removed From Location column */}
                    <TableHead className="min-w-[150px]">To Location</TableHead>
                    <TableHead className="min-w-[120px]">Available Qty</TableHead>
                    <TableHead className="min-w-[120px]">Requested Qty</TableHead>
                    <TableHead className="min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <StockWithdrawalItemRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      personalStock={personalStock}
                      products={products}
                      locations={locations}
                      removeItem={removeItem}
                      setValue={setValue}
                      watch={watch}
                      isEditMode={isEditMode}
                      existingRequest={existingRequest}
                      errors={errors}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-gray-100 rounded-lg grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Requested Qty</p>
                <p className="text-2xl font-bold">{totalRequestedQuantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Updating Withdrawal Request...' : 'Update Withdrawal Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface ItemRowProps {
  index: number;
  control: any;
  register: any;
  personalStock: PersonalStockEntry[];
  products: Product[];
  locations: Location[];
  removeItem: (index: number) => void;
  setValue: any;
  watch: any;
  isEditMode: boolean;
  existingRequest: StockWithdrawalData | null;
  errors: any;
}

function StockWithdrawalItemRow({
  index,
  control,
  register,
  personalStock,
  products,
  locations,
  removeItem,
  setValue,
  watch,
  isEditMode,
  existingRequest,
  errors
}: ItemRowProps) {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [selectedUnitConversion, setSelectedUnitConversion] = useState(1);

  const batchId = watch(`items.${index}.batchId`);
  const productId = watch(`items.${index}.productId`);
  const productUnitId = watch(`items.${index}.productUnitId`);
  const toLocationId = watch(`items.${index}.toLocationId`);
  const selectedBatch = personalStock.find(s => s.batchId === batchId);

  const availableBaseQuantity = selectedBatch ? selectedBatch.quantity : 0;
  const availableQuantityInSelectedUnit = availableBaseQuantity / selectedUnitConversion;
  const canRequestAny = availableQuantityInSelectedUnit >= 1;

  useEffect(() => {
    setValue(`items.${index}.availableQuantity`, availableQuantityInSelectedUnit);
  }, [batchId, availableBaseQuantity, productUnitId, selectedUnitConversion, setValue, index]);

  useEffect(() => {
    if (productUnitId && units.length > 0) {
      const selectedUnit = units.find(u => u._id === productUnitId);
      if (selectedUnit) {
        setSelectedUnitConversion(selectedUnit.conversionToBase);
      }
    }
  }, [productUnitId, units]);

  const productOptions: SelectOption[] = products.map(p => ({
    value: p._id,
    label: `${p.name}`,
  }));

  const batchOptions: SelectOption[] = personalStock
    .filter(s => !productId || s.productId === productId)
    .map(s => ({
      value: s.batchId,
      label: `${s.batchNumber} (Available: ${s.quantity} base units)`,
      quantity: s.quantity,
    }));

  const unitOptions: SelectOption[] = units.map(u => ({
    value: u._id,
    label: u.unitOfMeasureId
      ? `${u.unitOfMeasureId.symbol} (${u.conversionToBase})${u.isDefault ? ' (Default)' : ''}`
      : `${u.isDefault ? ' (Default)' : ''}`,
    conversion: u.conversionToBase,
  }));

  const locationOptions: SelectOption[] = locations.map(l => ({
    value: l._id,
    label: l.name,
  }));

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
      zIndex: 9999,
    }),
  };

  useEffect(() => {
    const fetchUnits = async () => {
      if (!productId) {
        setUnits([]);
        return;
      }
      try {
        setLoadingUnits(true);
        const res = await fetch(`/api/inventory/productunit/pro/${productId}`);
        const data = await res.json();
        if (res.ok) {
          setUnits(data.data || data);
          const defaultUnit = data.find((u: ProductUnit) => u.isDefault) || data[0];
          if (defaultUnit) {
            setValue(`items.${index}.productUnitId`, defaultUnit._id);
            setSelectedUnitConversion(defaultUnit.conversionToBase);
          }
        }
      } catch {
        toast.error('Failed to load units');
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchUnits();
  }, [productId, setValue, index]);

  const isEditable = !isEditMode || (existingRequest && ['PENDING', 'DRAFT'].includes(existingRequest.status.toUpperCase()));

  return (
    <TableRow>
      <TableCell>
        <Controller
          name={`items.${index}.productId`}
          control={control}
          rules={{ required: 'Product required' }}
          render={({ field }) => (
            <Select
              options={productOptions}
              value={productOptions.find(opt => opt.value === field.value)}
              onChange={sel => {
                field.onChange(sel?.value);
                setValue(`items.${index}.batchId`, '');
              }}
              placeholder="Select product"
              isClearable
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              isDisabled={!isEditable}
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
              placeholder="Select batch"
              isClearable
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              isDisabled={!isEditable}
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
              onChange={sel => {
                field.onChange(sel?.value);
                if (sel) {
                  const selectedUnit = units.find(u => u._id === sel.value);
                  if (selectedUnit) {
                    setSelectedUnitConversion(selectedUnit.conversionToBase);
                  }
                }
              }}
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

      {/* Removed From Location column */}

      <TableCell>
        <Controller
          name={`items.${index}.toLocationId`}
          control={control}
          rules={{ required: 'To location required' }}
          render={({ field }) => (
            <Select
              options={locationOptions}
              value={locationOptions.find(opt => opt.value === field.value)}
              onChange={sel => field.onChange(sel?.value)}
              placeholder="Select to location"
              isClearable
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              isDisabled={!isEditable}
            />
          )}
        />
      </TableCell>

      <TableCell>
        <Input
          type="number"
          value={availableQuantityInSelectedUnit.toFixed(2)}
          disabled
          className="bg-gray-100"
        />
        {!canRequestAny && (
          <p className="text-xs text-red-500 mt-1">
            Insufficient stock for this unit (min: {selectedUnitConversion} base units)
          </p>
        )}
      </TableCell>

      <TableCell>
        <Input
          type="number"
          min={canRequestAny ? 1 : 0}
          step="1"
          max={canRequestAny ? Math.floor(availableQuantityInSelectedUnit) : 0}
          disabled={!isEditable || !canRequestAny}
          {...register(`items.${index}.requestedQuantity`, {
            required: 'Requested quantity required',
            min: {
              value: canRequestAny ? 1 : 0,
              message: canRequestAny ? 'Must be at least 1' : 'Insufficient stock for this unit',
            },
            max: {
              value: canRequestAny ? Math.floor(availableQuantityInSelectedUnit) : 0,
              message: `Cannot exceed available quantity (${Math.floor(availableQuantityInSelectedUnit)})`,
            },
            valueAsNumber: true,
            validate: (value) => {
              if (!canRequestAny && value > 0) {
                return 'Cannot request this unit - insufficient base units available';
              }
              return true;
            },
          })}
        />
        {errors.items?.[index]?.requestedQuantity && (
          <p className="text-xs text-red-500 mt-1">
            {errors.items[index].requestedQuantity.message}
          </p>
        )}
      </TableCell>

      <TableCell>
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