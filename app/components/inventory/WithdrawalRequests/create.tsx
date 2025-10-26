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

interface PersonalStockEntry {
  batchId: string;
  quantity: number;
  productId: string; 
  productDetails?: {
    _id: string;
    name: string;
    code: string;
  };
  batchNumber: string;
  expiryDate: string;
  price: number;
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

interface WithdrawalRequestItem {
  productId: string;
  batchId: string;
  productUnitId: string;
  requestedQuantity: number;
  availableQuantity: number;
}

interface WithdrawalRequestFormValues {
  notes: string;
  items: WithdrawalRequestItem[];
}

interface SelectOption {
  value: string;
  label: string;
}

interface Product {
  _id: string;
  name: string;
  code: string;
}

export default function CreateWithdrawalRequestPage() {
  const router = useRouter();
  const [personalStock, setPersonalStock] = useState<PersonalStockEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
          },
        ],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items');
  const totalProducts = items.length;
  const totalRequestedQuantity = items.reduce((sum, item) => sum + (item.requestedQuantity || 0), 0);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory/Product');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchPersonalStock = async () => {
    try {
      const response = await fetch('/api/inventory/Holder/usercheck');
      const data = await response.json();
      if (response.ok) {
        setPersonalStock(data.data || []);
        await fetchProducts();
      } else {
        throw new Error(data.message || 'Failed to fetch personal stock');
      }
    } catch (error) {
      console.error('Error fetching personal stock:', error);
      toast.error('Failed to load your available stock');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchPersonalStock();
      } catch (error) {
        toast.error('Failed to load personal stock');
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
            
            if (requestedInBaseUnits > stockItem.quantity) {
              throw new Error(`Requested quantity for batch ${stockItem.batchNumber} exceeds your available quantity (${stockItem.quantity} base units)`);
            }
          }
        }
      }
      
      const response = await fetch('/api/inventory/WithdrawalRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create withdrawal request');

      toast.success('Withdrawal request created successfully');
      router.push('/inventory/Withdrawal');
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
                      products={products}
                      removeItem={removeItem}
                      setValue={setValue}
                      watch={watch}
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

// ---------------- WithdrawalRequest Item Row ---------------- //
interface ItemRowProps {
  index: number;
  control: any;
  register: any;
  personalStock: PersonalStockEntry[];
  products: Product[];
  removeItem: (index: number) => void;
  setValue: any;
  watch: any;
}

function WithdrawalRequestItemRow({ index, control, register, personalStock, products, removeItem, setValue, watch }: ItemRowProps) {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [selectedUnitConversion, setSelectedUnitConversion] = useState(1);

  // Watch the productId for THIS specific row
  const productId = watch(`items.${index}.productId`);
  const batchId = watch(`items.${index}.batchId`);
  const productUnitId = watch(`items.${index}.productUnitId`);
  
  // Filter batches based on the selected product in THIS row
  const batchesForSelectedProduct = personalStock.filter(stock => stock.productId === productId);
  const selectedBatch = batchesForSelectedProduct.find(s => s.batchId === batchId);
  
  // Get available quantity in base units
  const availableBaseQuantity = selectedBatch ? selectedBatch.quantity : 0;
  
  // Convert available quantity to selected unit
  const availableQuantityInSelectedUnit = availableBaseQuantity / selectedUnitConversion;
  const canRequestAny = availableQuantityInSelectedUnit >= 1;

  // Update available quantity when batch or unit changes
  useEffect(() => {
    setValue(`items.${index}.availableQuantity`, availableQuantityInSelectedUnit);
  }, [batchId, availableBaseQuantity, productUnitId, selectedUnitConversion, setValue, index]);

  // Update selected unit conversion factor when unit changes
  useEffect(() => {
    if (productUnitId && units.length > 0) {
      const selectedUnit = units.find(u => u._id === productUnitId);
      if (selectedUnit) {
        setSelectedUnitConversion(selectedUnit.conversionToBase);
      }
    }
  }, [productUnitId, units]);

  // Get unique products from personal stock that have batches
  const availableProducts = Array.from(
    new Map(
      personalStock.map(stock => [stock.productId, stock])
    ).values()
  );

  // Product options - only show products that have stock
  const productOptions: SelectOption[] = availableProducts.map(stock => {
    const productName = stock.productDetails?.name || 
                       products.find(p => p._id === stock.productId)?.name || 
                       `Product ${stock.productId.substring(0, 8)}...`;
    const productCode = stock.productDetails?.code || 
                       products.find(p => p._id === stock.productId)?.code || '';
    
    return {
      value: stock.productId,
      label: productCode ? `${productName} (${productCode})` : productName
    };
  });

  // Batch options - only show batches for the selected product in THIS row
  const batchOptions: SelectOption[] = batchesForSelectedProduct.map(stock => ({ 
    value: stock.batchId, 
    label: `${stock.batchNumber} (Available: ${stock.quantity} base units)`,
    quantity: stock.quantity
  }));

  const unitOptions: SelectOption[] = units.map(u => ({
    value: u._id,
    label: u.unitOfMeasureId ? 
      `${u.unitOfMeasureId.symbol} (${u.conversionToBase})${u.isDefault ? ' (Default)' : ''}` : 
      `${u.isDefault ? ' (Default)' : ''}`,
    conversion: u.conversionToBase
  }));

  // Custom styles for react-select
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

  // Fetch units when product changes for THIS row
  useEffect(() => {
    const fetchUnits = async () => {
      if (!productId) { 
        setUnits([]); 
        // Reset unit and batch when product is cleared
        setValue(`items.${index}.productUnitId`, '');
        setValue(`items.${index}.batchId`, '');
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
  }, [productId, index, setValue]);

  // Reset batch and unit when product changes
  const handleProductChange = (selectedOption: SelectOption | null) => {
    setValue(`items.${index}.productId`, selectedOption?.value || '');
    setValue(`items.${index}.batchId`, '');
    setValue(`items.${index}.productUnitId`, '');
    setUnits([]);
  };

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
              onChange={handleProductChange}
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
              placeholder={productId ? "Select batch" : "Select product first"}
              isDisabled={!productId}
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
        <Input
          type="number"
          value={availableQuantityInSelectedUnit.toFixed(2)}
          disabled
          className="bg-muted"
        />
        {!canRequestAny && availableBaseQuantity > 0 && (
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
          disabled={!canRequestAny}
          {...register(`items.${index}.requestedQuantity`, {
            required: 'Requested quantity required',
            min: { 
              value: canRequestAny ? 1 : 0, 
              message: canRequestAny ? 'Must be at least 1' : 'Insufficient stock for this unit'
            },
            max: { 
              value: canRequestAny ? Math.floor(availableQuantityInSelectedUnit) : 0, 
              message: `Cannot exceed available quantity (${Math.floor(availableQuantityInSelectedUnit)})` 
            },
            valueAsNumber: true,
            validate: (value) => {
              if (!canRequestAny && value > 0) {
                return 'Cannot request this unit - insufficient base units available';
              }
              return true;
            }
          })}
        />
        {!canRequestAny && (
          <p className="text-xs text-red-500 mt-1">
            Need at least {selectedUnitConversion} base units to request 1 of this unit
          </p>
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