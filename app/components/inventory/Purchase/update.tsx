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
import { CalendarIcon, Plus, Trash2, RefreshCw, Ruler } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import Select from 'react-select';
import CreateSupplierModal from '../supplier/model';
import CreateBatchModal from '../ProductBatch/modal';
import CreateProductUnitModal from '../productunit/modal';

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

interface PurchaseItem {
  _id?: string;
  productId: string;
  batchId: string;
  productUnitId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseFormValues {
  invoiceNo: string;
  supplierId: string;
  notes: string;
  purchaseDate: Date;
  approvalStatus: string;
  items: PurchaseItem[];
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

export default function UpdatePurchasePage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showProductUnitModal, setShowProductUnitModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    defaultValues: {
      invoiceNo: '',
      supplierId: '',
      notes: '',
      purchaseDate: new Date(),
      approvalStatus: 'PENDING',
      items: [
        {
          productId: '',
          batchId: '',
          productUnitId: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
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
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalProducts = items.length;

  // Convert suppliers to react-select options
  const supplierOptions: SelectOption[] = suppliers.map(supplier => ({
    value: supplier._id,
    label: supplier.name
  }));

  // Approval status options
  const approvalStatusOptions: SelectOption[] = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  // Refresh data functions
  const refreshSuppliers = async () => {
    try {
      const response = await fetch('/api/inventory/Supplier');
      const data = await response.json();
      if (response.ok) {
        setSuppliers(data.data || data);
      }
    } catch (error) {
      console.error('Error refreshing suppliers:', error);
    }
  };

  const refreshProducts = async () => {
    try {
      const response = await fetch('/api/inventory/Product');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.data || data);
        toast.success('Products refreshed successfully');
      } else {
        toast.error('Failed to refresh products');
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
      toast.error('Failed to refresh products');
    }
  };

  // Fetch purchase data and related data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch purchase data
        const purchaseResponse = await fetch(`/api/inventory/Purchase/${id}`);
        const purchaseData = await purchaseResponse.json();
        
        if (!purchaseResponse.ok) {
          throw new Error(purchaseData.message || 'Failed to fetch purchase data');
        }

        // Fetch suppliers and products
        await Promise.all([refreshSuppliers(), refreshProducts()]);
        
        // Set form values with fetched purchase data
        if (purchaseData) {
          // Format the items to match our form structure
          const formattedItems = purchaseData.items?.map((item: any) => ({
            _id: item._id,
            productId: item.productId?._id || item.productId || '',
            batchId: item.batchId?._id || item.batchId || '',
            productUnitId: item.productUnitId?._id || item.productUnitId || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
          })) || [];

          reset({
            invoiceNo: purchaseData.invoiceNo || '',
            supplierId: purchaseData.supplierId?._id || purchaseData.supplierId || '',
            notes: purchaseData.notes || '',
            purchaseDate: new Date(purchaseData.purchaseDate) || new Date(),
            approvalStatus: purchaseData.approvalStatus || 'PENDING',
            items: formattedItems
          });
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Failed to load purchase data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, reset]);

  const onSubmit = async (data: PurchaseFormValues) => {
    try {
      setSubmitting(true);
      
      // Format the data for API
      const purchaseData = {
        ...data,
        purchaseDate: data.purchaseDate.toISOString(),
      };

      const response = await fetch(`/api/inventory/Purchase/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update purchase');
      }

      toast.success('Purchase updated successfully');
      router.push('/inventory/Purchase');
    } catch (error: any) {
      console.error('Error updating purchase:', error);
      toast.error(error.message || 'Failed to update purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    append({
      productId: '',
      batchId: '',
      productUnitId: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error('At least one item is required');
    }
  };

  // Function to open batch modal for a specific product
  const openBatchModal = (productId: string, index: number) => {
    if (!productId) {
      toast.error('Please select a product first');
      return;
    }
    setSelectedProductId(productId);
    setSelectedProductIndex(index);
    setShowBatchModal(true);
  };

  // Function to open product unit modal for a specific product
  const openProductUnitModal = (productId: string, index: number) => {
    if (!productId) {
      toast.error('Please select a product first');
      return;
    }
    setSelectedProductId(productId);
    setSelectedProductIndex(index);
    setShowProductUnitModal(true);
  };

  // Function to handle batch creation success
  const handleBatchCreated = async () => {
    await refreshProducts();
    toast.success('Batch created successfully');
    
    // Refresh batches for the specific product
    if (selectedProductIndex >= 0) {
      const productId = watch(`items.${selectedProductIndex}.productId`);
      if (productId) {
        // This will trigger the useEffect in PurchaseItemRow to refetch batches
        setValue(`items.${selectedProductIndex}.productId`, productId);
      }
    }
  };

  // Function to handle supplier creation success
  const handleSupplierCreated = async () => {
    await refreshSuppliers();
    toast.success('Supplier created successfully');
  };

  // Function to handle product unit creation success
  const handleProductUnitCreated = async () => {
    await refreshProducts();
    toast.success('Product unit created successfully');
    
    // Refresh units for the specific product
    if (selectedProductIndex >= 0) {
      const productId = watch(`items.${selectedProductIndex}.productId`);
      if (productId) {
        // This will trigger the useEffect in PurchaseItemRow to refetch units
        setValue(`items.${selectedProductIndex}.productId`, productId);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Update Purchase</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNo">Invoice Number *</Label>
                <Input
                  id="invoiceNo"
                  {...register('invoiceNo', { required: 'Invoice number is required' })}
                  placeholder="Enter invoice number"
                />
                {errors.invoiceNo && (
                  <p className="text-sm text-red-500">{errors.invoiceNo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier *</Label>
                <div className="flex gap-2">
                  <Controller
                    name="supplierId"
                    control={control}
                    rules={{ required: 'Supplier is required' }}
                    render={({ field }) => (
                      <Select
                        options={supplierOptions}
                        value={supplierOptions.find(option => option.value === field.value)}
                        onChange={(selected) => field.onChange(selected?.value)}
                        placeholder="Select a supplier"
                        isClearable
                        className="flex-1"
                        styles={{
                          menu: (provided) => ({
                            ...provided,
                            zIndex: 50,
                          }),
                        }}
                      />
                    )}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowSupplierModal(true)}
                    className="whitespace-nowrap"
                  >
                    + New
                  </Button>
                </div>
                {errors.supplierId && (
                  <p className="text-sm text-red-500">{errors.supplierId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Controller
                  name="purchaseDate"
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
                    />
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional notes (optional)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Purchase Items</CardTitle>
            <div className="flex gap-2">
              <Button 
                type="button" 
                onClick={refreshProducts} 
                variant="outline" 
                size="sm"
                title="Refresh products list"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Products
              </Button>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Product</TableHead>
                    <TableHead className="w-[200px]">Batch</TableHead>
                    <TableHead className="w-[150px]">Unit</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    <TableHead className="w-[120px]">Unit Price</TableHead>
                    <TableHead className="w-[120px]">Total</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <PurchaseItemRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      products={products}
                      removeItem={removeItem}
                      setValue={setValue}
                      watch={watch}
                      openBatchModal={openBatchModal}
                      openProductUnitModal={openProductUnitModal}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Total Products</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Quantity</p>
                  <p className="text-2xl font-bold">{totalQuantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
                </div>
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
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Updating Purchase...' : 'Update Purchase'}
          </Button>
        </div>
      </form>

      {/* Modals */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <CreateSupplierModal
            closeModal={() => setShowSupplierModal(false)}
            onSuccess={handleSupplierCreated}
          />
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <CreateBatchModal
            closeModal={() => setShowBatchModal(false)}
            onSuccess={handleBatchCreated}
            productId={selectedProductId}
          />
        </div>
      )}

      {showProductUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <CreateProductUnitModal
            closeModal={() => setShowProductUnitModal(false)}
            onSuccess={handleProductUnitCreated}
            productId={selectedProductId}
          />
        </div>
      )}
    </div>
  );
}

// Component for each purchase item row
interface PurchaseItemRowProps {
  index: number;
  control: any;
  register: any;
  products: Product[];
  removeItem: (index: number) => void;
  setValue: any;
  watch: any;
  openBatchModal: (productId: string, index: number) => void;
  openProductUnitModal: (productId: string, index: number) => void;
}

function PurchaseItemRow({
  index,
  control,
  register,
  products,
  removeItem,
  setValue,
  watch,
  openBatchModal,
  openProductUnitModal,
}: PurchaseItemRowProps) {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const productId = watch(`items.${index}.productId`);
  const batchId = watch(`items.${index}.batchId`);
  const quantity = watch(`items.${index}.quantity`) as unknown as number | undefined;
  const unitPrice = watch(`items.${index}.unitPrice`) as unknown as number | undefined;

  // Convert products to react-select options
  const productOptions: SelectOption[] = products.map(product => ({
    value: product._id,
    label: `${product.name} (${product.productCode})`
  }));

  // Convert batches to react-select options
  const batchOptions: SelectOption[] = batches.map(batch => ({
    value: batch._id,
    label: `${batch.batchNumber} (${batch.size}) - $${batch.price}`
  }));

  // Convert units to react-select options with safe handling for unitOfMeasureId
  const unitOptions: SelectOption[] = units.map(unit => ({
    value: unit._id,
    label: unit.unitOfMeasureId 
      ? `${unit.unitOfMeasureId.name} (${unit.conversionToBase})${unit.isDefault ? " (Default)" : ""}`
      : `${unit.name}${unit.isDefault ? " (Default)" : ""}`
  }));

  // Fetch batches when product changes
  useEffect(() => {
    const fetchBatches = async () => {
      if (!productId) {
        setBatches([]);
        return;
      }

      try {
        setLoadingBatches(true);
        const response = await fetch(`/api/inventory/ProductBatch/pro/${productId}`);
        const data = await response.json();

        if (response.ok) {
          setBatches(data.data || data);
          // Auto-select the first batch if available and no batch is selected
          if (data.length > 0 && !batchId) {
            setValue(`items.${index}.batchId`, data[0]._id);
            setValue(`items.${index}.unitPrice`, data[0].price);
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
  }, [productId, index, setValue, batchId]);

  // Fetch units when product changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!productId) {
        setUnits([]);
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

  // Calculate total price when quantity or unit price changes
  useEffect(() => {
    const totalPrice = (quantity ?? 0) * (unitPrice ?? 0);
    setValue(`items.${index}.totalPrice`, totalPrice);
  }, [quantity, unitPrice, index, setValue]);

  return (
    <TableRow className="h-16">
      <TableCell className="py-2 align-middle">
        <div className="flex gap-2 items-center">
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
                styles={{
                  container: (provided) => ({
                    ...provided,
                    minWidth: '180px',
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 40,
                    width: '100%',
                  }),
                  control: (provided) => ({
                    ...provided,
                    minHeight: '40px',
                  }),
                }}
              />
            )}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => openBatchModal(productId, index)}
            className="shrink-0"
            title="Create new batch"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
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
              onChange={(selected) => {
                field.onChange(selected?.value);
                // Set unit price based on selected batch
                const selectedBatch = batches.find((batch) => batch._id === selected?.value);
                if (selectedBatch) {
                  setValue(`items.${index}.unitPrice`, selectedBatch.price);
                }
              }}
              placeholder={loadingBatches ? 'Loading...' : 'Select batch'}
              isDisabled={loadingBatches || !productId}
              isClearable
              styles={{
                container: (provided) => ({
                  ...provided,
                  minWidth: '180px',
                }),
                menu: (provided) => ({
                  ...provided,
                  zIndex: 40,
                  width: '100%',
                }),
                control: (provided) => ({
                  ...provided,
                  minHeight: '40px',
                }),
              }}
            />
          )}
        />
      </TableCell>

      <TableCell className="py-2 align-middle">
        <div className="flex gap-2 items-center">
          <Controller
            name={`items.${index}.productUnitId`}
            control={control}
            rules={{ required: 'Unit is required' }}
            render={({ field }) => (
              <Select
                options={unitOptions}
                value={unitOptions.find(option => option.value === field.value)}
                onChange={(selected) => field.onChange(selected?.value)}
                placeholder={loadingUnits ? 'Loading...' : 'Select unit'}
                isDisabled={loadingUnits || !productId}
                isClearable
                styles={{
                  container: (provided) => ({
                    ...provided,
                    minWidth: '150px',
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 40,
                    width: '100%',
                  }),
                  control: (provided) => ({
                    ...provided,
                    minHeight: '40px',
                  }),
                }}
              />
            )}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => openProductUnitModal(productId, index)}
            className="shrink-0"
            title="Create new product unit"
          >
            <Ruler className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>

      <TableCell className="py-2 align-middle">
        <Input
          type="number"
          min="1"
          step="1"
          className="w-[100px]"
          {...register(`items.${index}.quantity`, {
            required: 'Quantity is required',
            min: { value: 1, message: 'Quantity must be at least 1' },
            valueAsNumber: true,
          })}
        />
      </TableCell>

      <TableCell className="py-2 align-middle">
        <Input
          type="number"
          min="0"
          step="0.01"
          className="w-[100px]"
          {...register(`items.${index}.unitPrice`, {
            required: 'Unit price is required',
            min: { value: 0, message: 'Unit price cannot be negative' },
            valueAsNumber: true,
          })}
        />
      </TableCell>

      <TableCell className="py-2 align-middle">
        <Input
          type="number"
          readOnly
          className="w-[100px] bg-muted"
          {...register(`items.${index}.totalPrice`, { valueAsNumber: true })}
        />
      </TableCell>

      <TableCell className="py-2 align-middle">
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={() => removeItem(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}