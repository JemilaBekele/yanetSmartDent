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
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { Product } from '../Product/list';

interface PersonalStockEntry {
  batchId: string;
  quantity: number;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  price: number;
  locationId: string;
  productName:string;
}

interface ProductUnit {
  _id: string;
  productId: Product;
  conversionToBase: number;
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
  type: string;
}

interface WithdrawalRequestItem {
  productId: string;
  batchId: string;
  productUnitId: string;
  requestedQuantity: number;
  availableQuantity: number;
  fromLocationId: string;
  toLocationId: string;
}

interface WithdrawalRequestFormValues {
  notes: string;
  items: WithdrawalRequestItem[];
}

interface SelectOption {
  value: string;
  label: string;
}

export default function CreateStockRequestPage() {
  const router = useRouter();
  const [personalStock, setPersonalStock] = useState<PersonalStockEntry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } =
    useForm<WithdrawalRequestFormValues>({
      defaultValues: {
        notes: '',
        items: [
          {
            productId: '',
            batchId: '',
            productUnitId: '',
            requestedQuantity: 1,
            availableQuantity: 0,
            fromLocationId: '',
            toLocationId: '',
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchPersonalStock(), fetchLocations()]);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: WithdrawalRequestFormValues) => {
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
            
            if (requestedInBaseUnits > stockItem.quantity + 0.0001) {
              throw new Error(`Requested quantity for batch ${stockItem.batchNumber} exceeds your available quantity (${stockItem.quantity} base units)`);
            }
          }
        }
      }
      
      const response = await fetch('/api/inventory/stockwithdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create withdrawal request');

      toast.success('Withdrawal request created successfully');
      router.push('/inventory/stockwithdrawal');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create withdrawal request');
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
      availableQuantity: 0,
      fromLocationId: '',
      toLocationId: '',
    });

  const removeItem = (index: number) => {
    if (fields.length > 1) remove(index);
    else toast.error('At least one item is required');
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Create Withdrawal Request</h1>

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
              />
            </div>
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
    <WithdrawalRequestItemRow
      key={field.id}
      index={index}
      control={control}
      register={register}
      personalStock={personalStock}
      locations={locations}
      removeItem={removeItem}
      setValue={setValue}
      watch={watch}
      errors={errors} // Add this line to pass the errors prop
    />
  ))}
</TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg grid grid-cols-2 gap-4">
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
            {submitting ? 'Creating Withdrawal Request...' : 'Create Withdrawal Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Change this line in the WithdrawalRequestItemRow interface
interface ItemRowProps {
  index: number;
  control: any;
  register: any;
  personalStock: PersonalStockEntry[];
  locations: Location[];
  removeItem: (index: number) => void;
  setValue: any;
  watch: any;
  errors?: any; // Make errors optional by adding the question mark
}

function WithdrawalRequestItemRow({ index, control, register, personalStock, locations, removeItem, setValue, watch, errors }: ItemRowProps & { errors: any }) {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [selectedUnitConversion, setSelectedUnitConversion] = useState(1);
  const [quantityError, setQuantityError] = useState<string>('');

  const productId = watch(`items.${index}.productId`);
  const batchId = watch(`items.${index}.batchId`);
  const productUnitId = watch(`items.${index}.productUnitId`);
  const requestedQuantity = watch(`items.${index}.requestedQuantity`);
  const selectedBatch = personalStock.find(s => s.batchId === batchId);
  
  // Get available quantity in base units
  const availableBaseQuantity = selectedBatch ? selectedBatch.quantity : 0;
  
  // Convert available quantity to selected unit
  const availableQuantityInSelectedUnit = availableBaseQuantity / (selectedUnitConversion || 1);
  
  // Allow requesting any positive amount up to the available quantity
  const maxRequestable = availableQuantityInSelectedUnit;

  // Validate quantity whenever requested quantity, batch, or unit changes
  useEffect(() => {
    if (requestedQuantity && selectedBatch && selectedUnitConversion) {
      const requestedInBase = requestedQuantity * selectedUnitConversion;
      
      if (requestedInBase > availableBaseQuantity) {
        setQuantityError(`Requested amount (${requestedInBase.toFixed(2)} base units) exceeds available stock (${availableBaseQuantity} base units)`);
      } else {
        setQuantityError('');
      }
    } else {
      setQuantityError('');
    }
  }, [requestedQuantity, selectedBatch, selectedUnitConversion, availableBaseQuantity]);

  // Debug logging to trace values
  useEffect(() => {
    console.log('Selected batch:', selectedBatch);
    console.log('Available base quantity:', availableBaseQuantity);
    console.log('Selected unit conversion:', selectedUnitConversion);
    console.log('Available in selected unit:', availableQuantityInSelectedUnit);
  }, [selectedBatch, availableBaseQuantity, selectedUnitConversion, availableQuantityInSelectedUnit]);

  // Update available quantity and fromLocationId when batch or unit changes
  useEffect(() => {
    setValue(`items.${index}.availableQuantity`, availableQuantityInSelectedUnit);
    
    if (selectedBatch && selectedBatch.locationId) {
      setValue(`items.${index}.fromLocationId`, selectedBatch.locationId);
    } else if (!selectedBatch) {
      setValue(`items.${index}.fromLocationId`, '');
    }
  }, [batchId, availableBaseQuantity, productUnitId, selectedUnitConversion, setValue, index, selectedBatch]);

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

  // Reset unit conversion when product changes
  useEffect(() => {
    if (!productId) {
      setSelectedUnitConversion(1);
      setUnits([]);
      setValue(`items.${index}.productUnitId`, '');
      setValue(`items.${index}.batchId`, '');
      setValue(`items.${index}.availableQuantity`, 0);
    }
  }, [productId, setValue, index]);

  const productOptions: SelectOption[] = Array.from(
    new Map(
      personalStock.map(s => [s.productId, {
        value: s.productId,
      label: s.productName || `Product ${s.productId}` // Use productName if available
      }])
    ).values()
  );

  const batchOptions: SelectOption[] = personalStock
    .filter(s => s.productId === productId)
    .map(s => ({ 
      value: s.batchId, 
      label: `${s.batchNumber}`
    }));

  const unitOptions: SelectOption[] = units.map(u => ({
    value: u._id,
    label: u.unitOfMeasureId ? 
      `${u.unitOfMeasureId.name} (${u.unitOfMeasureId.symbol}(${u.conversionToBase})) ` : 
      `${u.isDefault ? ' (Default)' : ''}`,
    conversion: u.conversionToBase
  }));

  const locationOptions: SelectOption[] = locations.map(l => ({
    value: l._id,
    label: l.name
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
      zIndex: 9999 
    }),
  };

  useEffect(() => {
    const fetchUnits = async () => {
      if (!productId) { 
        setUnits([]); 
        setSelectedUnitConversion(1);
        return; 
      }
      
      try {
        setLoadingUnits(true);
        const res = await fetch(`/api/inventory/productunit/pro/${productId}`);
        const data = await res.json();
        if (res.ok) {
          const unitsData = data.data || data;
          setUnits(unitsData);
          
          const defaultUnit = unitsData.find((u: ProductUnit) => u.isDefault) || unitsData[0];
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
                setValue(`items.${index}.productUnitId`, '');
                setUnits([]);
                setSelectedUnitConversion(1);
              }}
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
              placeholder="Select batch"
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
        <Controller
          name={`items.${index}.fromLocationId`}
          control={control}
          rules={{ required: 'From location required' }}
          render={({ field }) => (
            <Select
              options={locationOptions}
              value={locationOptions.find(opt => opt.value === field.value)}
              onChange={sel => field.onChange(sel?.value)}
              placeholder="Select from location"
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
              options={locationOptions}
              value={locationOptions.find(opt => opt.value === field.value)}
              onChange={sel => field.onChange(sel?.value)}
              placeholder="Select to location"
              isClearable
              styles={customSelectStyles}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          )}
        />
      </TableCell>

      <TableCell>
        <div className="flex flex-col">
          <Input
            type="number"
            value={availableQuantityInSelectedUnit.toFixed(2)}
            disabled
            className="bg-muted"
          />
          <span className="text-xs text-muted-foreground mt-1">
            {availableBaseQuantity} base units available
          </span>
          {availableBaseQuantity > 0 && availableBaseQuantity < selectedUnitConversion && (
            <p className="text-xs text-yellow-600 mt-1">
              Note: Minimum {selectedUnitConversion} base units needed for 1 full unit
            </p>
          )}
          {availableBaseQuantity === 0 && selectedBatch && (
            <p className="text-xs text-red-500 mt-1">
              No stock available for this batch
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
                if (!selectedBatch || !selectedUnitConversion) return true;
                
                const requestedInBase = value * selectedUnitConversion;
                if (requestedInBase > availableBaseQuantity) {
                  return `Requested amount exceeds available stock`;
                }
                return true;
              }
            })}
            className={quantityError ? 'border-red-500' : ''}
          />
          
          {/* Show validation error */}
          {quantityError && (
            <p className="text-xs text-red-500 mt-1">{quantityError}</p>
          )}
          
          {/* Show form validation error */}
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
        <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}