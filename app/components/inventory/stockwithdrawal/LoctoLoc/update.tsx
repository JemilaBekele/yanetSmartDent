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

interface LocationStockEntry {
  locationStockId: string;
  batchId: string;
  locationId: string;
  quantity: number;
  status: string;
  productId: string;
  productName: string;
  productCode: string;
  batchNumber: string;
  expiryDate: string;
  price: number;
  locationName: string;
  locationType: string;
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
  fromLocationId: string;
  toLocationId: string;
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

export default function UpdateStockLocationWithdrawalPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const isEditMode = !!id;

  const [locationStock, setLocationStock] = useState<LocationStockEntry[]>([]);
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
            fromLocationId: '',
            toLocationId: '',
            availableQuantity: 0,
          },
        ],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items');
  const totalProducts = items.length;
  const totalRequestedQuantity = items.reduce((sum, item) => sum + (item.requestedQuantity || 0), 0);

  const fetchLocationStock = async () => {
    try {
      const response = await fetch('/api/inventory/stock/locaation');
      const data = await response.json();
      if (response.ok) {
        setLocationStock(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch location stock');
      }
    } catch (error) {
      console.error('Error fetching location stock:', error);
      toast.error('Failed to load location stock');
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
      const response = await fetch(`/api/inventory/loctolocstockwithdrawal/${id}`);
      if (!response.ok) throw new Error('Failed to fetch stock withdrawal request');
      
      const data = await response.json();
            console.log('Fetch response:', data);

      setExistingRequest(data);
      
      reset({
        notes: data.notes || '',
        items: data.items.map((item: any) => ({
          productId: item.productId?._id || item.productId,
          batchId: item.batchId?._id || item.batchId,
          productUnitId: item.productUnitId?._id || item.productUnitId,
          requestedQuantity: item.requestedQuantity,
          fromLocationId: item.fromLocationId?._id || item.fromLocationId,
          toLocationId: item.toLocationId?._id || item.toLocationId,
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
          fetchLocationStock(),
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
        if (item.fromLocationId === item.toLocationId) {
          throw new Error('From and To locations cannot be the same');
        }

        // Find the stock item in the specific fromLocation
        const stockItem = locationStock.find(s => 
          s.batchId === item.batchId && s.locationId === item.fromLocationId
        );
        
        if (stockItem) {
          const unitResponse = await fetch(`/api/inventory/productunit/get/${item.productUnitId}`);
          const unitData = await unitResponse.json();
          
          if (unitResponse.ok) {
            const unit = unitData.data || unitData;
            const requestedInBaseUnits = item.requestedQuantity * unit.conversionToBase;
            
            if (requestedInBaseUnits > stockItem.quantity + 0.0001) {
              throw new Error(`Requested quantity for batch ${stockItem.batchNumber} exceeds available quantity (${stockItem.quantity} base units) in location ${stockItem.locationName}`);
            }
          }
        } else {
          throw new Error(`No stock found for the selected batch in the from location`);
        }
      }

      const response = await fetch(`/api/inventory/loctolocstockwithdrawal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update stock withdrawal request');

      toast.success('Stock withdrawal request updated successfully');
      router.push('/inventory/stockwithdrawal/LoctoLoc');
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
      fromLocationId: '',
      toLocationId: '',
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
                    <TableHead className="min-w-[150px]">From Location</TableHead>
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
                      locationStock={locationStock}
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
  locationStock: LocationStockEntry[];
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
  locationStock,
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
  const [quantityError, setQuantityError] = useState<string>('');

  const productId = watch(`items.${index}.productId`);
  const batchId = watch(`items.${index}.batchId`);
  const productUnitId = watch(`items.${index}.productUnitId`);
  const fromLocationId = watch(`items.${index}.fromLocationId`);
  const toLocationId = watch(`items.${index}.toLocationId`);
  const requestedQuantity = watch(`items.${index}.requestedQuantity`);
  
  // Find stock item based on both batchId AND fromLocationId
  const selectedStockItem = locationStock.find(s => 
    s.batchId === batchId && s.locationId === fromLocationId
  );
  
  // Get available quantity in base units from the specific location
  const availableBaseQuantity = selectedStockItem ? selectedStockItem.quantity : 0;
  
  // Convert available quantity to selected unit
  const availableQuantityInSelectedUnit = availableBaseQuantity / (selectedUnitConversion || 1);
  
  // Allow requesting any positive amount up to the available quantity
  const maxRequestable = availableQuantityInSelectedUnit;

  // Validate quantity whenever requested quantity, batch, location, or unit changes
  useEffect(() => {
    if (requestedQuantity && selectedStockItem && selectedUnitConversion) {
      const requestedInBase = requestedQuantity * selectedUnitConversion;
      
      if (requestedInBase > availableBaseQuantity) {
        setQuantityError(`Requested amount (${requestedInBase.toFixed(2)} base units) exceeds available stock (${availableBaseQuantity} base units) in ${selectedStockItem.locationName}`);
      } else {
        setQuantityError('');
      }
    } else {
      setQuantityError('');
    }
  }, [requestedQuantity, selectedStockItem, selectedUnitConversion, availableBaseQuantity]);

  // Update available quantity when batch, location, or unit changes
  useEffect(() => {
    setValue(`items.${index}.availableQuantity`, availableQuantityInSelectedUnit);
  }, [batchId, fromLocationId, availableBaseQuantity, productUnitId, selectedUnitConversion, setValue, index]);

  // Update selected unit conversion factor when unit changes
  useEffect(() => {
    if (productUnitId && units.length > 0) {
      const selectedUnit = units.find(u => u._id === productUnitId);
      if (selectedUnit) {
        setSelectedUnitConversion(selectedUnit.conversionToBase);
      }
    } else if (units.length > 0) {
      const defaultUnit = units.find(u => u.isDefault) || units[0];
      if (defaultUnit) {
        setSelectedUnitConversion(defaultUnit.conversionToBase);
        if (!productUnitId) {
          setValue(`items.${index}.productUnitId`, defaultUnit._id);
        }
      }
    } else {
      setSelectedUnitConversion(1);
    }
  }, [productUnitId, units, setValue, index]);

  // Get unique products from location stock
  const productOptions = Array.from(
    new Map(
      locationStock.map(s => [s.productId, {
        value: s.productId,
        label: s.productName || `Product ${s.productId}`
      }])
    ).values()
  );

  // Get batches for the selected product that have stock in any location
  const batchOptions = locationStock
    .filter(s => !productId || s.productId === productId)
    .map(s => ({ 
      value: s.batchId, 
      label: `${s.batchNumber}`
    }));

  // Get locations that have stock for the selected batch
  const fromLocationOptions = locationStock
    .filter(s => s.batchId === batchId)
    .map(s => ({
      value: s.locationId,
      label: `${s.locationName} (Available: ${s.quantity} base units)`
    }));

  const unitOptions = units.map(u => ({
    value: u._id,
    label: u.unitOfMeasureId
      ? `${u.unitOfMeasureId.name} (${u.unitOfMeasureId.symbol}(${u.conversionToBase}))`
      : `${u.isDefault ? ' (Default)' : ''}`,
    conversion: u.conversionToBase,
  }));

  const toLocationOptions = locations.map(l => ({
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
          if (defaultUnit && !productUnitId) {
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
                setValue(`items.${index}.fromLocationId`, '');
                setValue(`items.${index}.productUnitId`, '');
                setUnits([]);
                setSelectedUnitConversion(1);
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
              onChange={sel => {
                field.onChange(sel?.value);
                setValue(`items.${index}.fromLocationId`, '');
              }}
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

      <TableCell>
        <Controller
          name={`items.${index}.fromLocationId`}
          control={control}
          rules={{ required: 'From location required' }}
          render={({ field }) => (
            <Select
              options={fromLocationOptions}
              value={fromLocationOptions.find(opt => opt.value === field.value)}
              onChange={sel => field.onChange(sel?.value)}
              placeholder={batchId ? "Select from location" : "Select batch first"}
              isDisabled={!batchId || !isEditable}
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
          name={`items.${index}.toLocationId`}
          control={control}
          rules={{ required: 'To location required' }}
          render={({ field }) => (
            <Select
              options={toLocationOptions}
              value={toLocationOptions.find(opt => opt.value === field.value)}
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
        {fromLocationId === toLocationId && fromLocationId && (
          <p className="text-xs text-red-500 mt-1">From and To locations cannot be the same</p>
        )}
      </TableCell>

      <TableCell>
        <div className="flex flex-col">
          <Input
            type="number"
            value={availableQuantityInSelectedUnit.toFixed(2)}
            disabled
            className="bg-gray-100"
          />
          <span className="text-xs text-muted-foreground mt-1">
            {availableBaseQuantity} base units available
            {selectedStockItem && ` in ${selectedStockItem.locationName}`}
          </span>
          {availableBaseQuantity > 0 && availableBaseQuantity < selectedUnitConversion && (
            <p className="text-xs text-yellow-600 mt-1">
              Note: Minimum {selectedUnitConversion} base units needed for 1 full unit
            </p>
          )}
          {availableBaseQuantity === 0 && batchId && fromLocationId && (
            <p className="text-xs text-red-500 mt-1">
              No stock available for this batch in the selected location
            </p>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col">
          <Input
            type="number"
            min={0.01}
            step="any"
            max={maxRequestable}
            disabled={!isEditable || !selectedStockItem}
            {...register(`items.${index}.requestedQuantity`, {
              required: 'Requested quantity required',
              min: { 
                value: 0.01, 
                message: 'Must be at least 0.01' 
              },
              max: { 
                value: maxRequestable, 
                message: `Cannot exceed available quantity (${maxRequestable.toFixed(2)})` 
              },
              valueAsNumber: true,
              validate: (value) => {
                if (!selectedStockItem || !selectedUnitConversion) return true;
                
                const requestedInBase = value * selectedUnitConversion;
                if (requestedInBase > availableBaseQuantity) {
                  return `Requested amount exceeds available stock in ${selectedStockItem.locationName}`;
                }
                return true;
              }
            })}
            className={quantityError ? 'border-red-500' : ''}
          />
          
          {quantityError && (
            <p className="text-xs text-red-500 mt-1">{quantityError}</p>
          )}
          
          {errors?.items?.[index]?.requestedQuantity && (
            <p className="text-xs text-red-500 mt-1">
              {errors.items[index].requestedQuantity.message}
            </p>
          )}
          
          {availableBaseQuantity > 0 && availableBaseQuantity < selectedUnitConversion && (
            <p className="text-xs text-yellow-600 mt-1">
              Note: You can request fractional amounts
            </p>
          )}
        </div>
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