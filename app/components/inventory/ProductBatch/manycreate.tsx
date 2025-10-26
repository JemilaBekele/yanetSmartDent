'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FormControl,
  FormLabel,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

// Batch-related interfaces
interface BatchFormValues {
  batchNumber: string;
  expiryDate: string;
  manufactureDate: string;
  size: string;
  price: number;
  warningQuantity: number;
  productId: string;
  createdById?: string;
}

interface ProductBatch {
  _id: string;
  batchNumber: string;
  expiryDate: string;
  manufactureDate: string;
  size: string;
  price: number;
  warningQuantity: number;
  productId: string;
  createdById?: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  _id: string;
  productCode: string;
  name: string;
  description?: string;
}

// Unit-related interfaces
interface UnitOfMeasure {
  _id: string;
  name: string;
  symbol: string;
}

interface ProductUnit {
  _id: string;
  productId: Product;
  conversionToBase: number;
  unitOfMeasureId: UnitOfMeasure;
  isDefault: boolean;
  created_at: string;
}

interface UnitFormValues {
  productId: string;
  unitOfMeasureId: string;
  conversionToBase: number;
  isDefault: boolean;
}

export default function ProductBatchesPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);
  
  // Batch states
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);
  const [batchLoading, setBatchLoading] = useState(true);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

  // Unit states
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null);
  const [unitSubmitting, setUnitSubmitting] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

  // Batch form
  const { register: registerBatch, handleSubmit: handleBatchSubmit, reset: resetBatch, 
          formState: { errors: batchErrors }, setValue: setBatchValue } = useForm<BatchFormValues>();

  // Unit form
  const { control: unitControl, handleSubmit: handleUnitSubmit, reset: resetUnit, 
          setValue: setUnitValue } = useForm<UnitFormValues>({
    defaultValues: {
      productId: productId,
      conversionToBase: 1,
      isDefault: false
    }
  });

  // Reset batch form when productId is available
  useEffect(() => {
    if (productId) {
      resetBatch({
        batchNumber: '',
        expiryDate: '',
        manufactureDate: '',
        size: '',
        price: 0,
        warningQuantity: 0,
        productId: productId,
      });
      
      // Set productId in unit form
      setUnitValue('productId', productId);
    }
  }, [productId, resetBatch, setUnitValue]);

  // Fetch product details, batches, units, and product units
  useEffect(() => {
    // In the useEffect where you fetch data
const fetchData = async () => {
  if (!productId) return;
  
  try {
    setBatchLoading(true);
    const [productRes, batchesRes, unitsRes, productUnitsRes] = await Promise.all([
      axios.get(`/api/inventory/Product/${productId}`),
      axios.get(`/api/inventory/ProductBatch/pro/${productId}`),
      axios.get(`/api/inventory/productunit/unitmeasure/`),
      axios.get(`/api/inventory/productunit/product/${productId}`)
    ]);

    if (productRes.status === 200) {
      setProduct(productRes.data);
    }

    if (batchesRes.status === 200) {
      const batchesData = Array.isArray(batchesRes.data) 
        ? batchesRes.data 
        : batchesRes.data.data || [];
      setBatches(batchesData);
    }

    if (unitsRes.status === 200) {
      setUnits(unitsRes.data);
    }

    if (productUnitsRes.status === 200) {
      // Ensure productUnits is always an array
      const productUnitsData = Array.isArray(productUnitsRes.data) 
        ? productUnitsRes.data 
        : productUnitsRes.data.data || [];
      setProductUnits(productUnitsData);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Failed to load product data');
  } finally {
    setBatchLoading(false);
  }
};

// Also update the refreshProductUnits function


    fetchData();
  }, [productId]);

  // Batch functions
  const onSubmitBatch = async (values: BatchFormValues) => {
    try {
      setBatchSubmitting(true);
      const response = await fetch('/api/inventory/ProductBatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create batch');
      }

      toast.success('Batch created successfully');
      setIsBatchModalOpen(false);
      resetBatch();
      
      // Refresh batches list
      await refreshBatches();
    } catch (error: any) {
      console.error('Error creating batch:', error);
      toast.error(error.message || 'Failed to create batch');
    } finally {
      setBatchSubmitting(false);
    }
  };

  const onEditBatchSubmit = async (values: BatchFormValues) => {
    if (!editingBatch) return;
    
    try {
      setBatchSubmitting(true);
      const response = await fetch(`/api/inventory/ProductBatch/${editingBatch._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update batch');
      }

      toast.success('Batch updated successfully');
      setIsEditBatchModalOpen(false);
      setEditingBatch(null);
      resetBatch();
      
      // Refresh batches list
      await refreshBatches();
    } catch (error: any) {
      console.error('Error updating batch:', error);
      toast.error(error.message || 'Failed to update batch');
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    
    try {
      setDeletingBatchId(id);
      const response = await fetch(`/api/inventory/ProductBatch/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete batch');
      }

      toast.success('Batch deleted successfully');
      
      // Refresh batches list
      await refreshBatches();
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      toast.error(error.message || 'Failed to delete batch');
    } finally {
      setDeletingBatchId(null);
    }
  };

  const refreshBatches = async () => {
    try {
      const batchesRes = await axios.get(`/api/inventory/ProductBatch/pro/${productId}`);
      const batchesData = Array.isArray(batchesRes.data) 
        ? batchesRes.data 
        : batchesRes.data.data || [];
      setBatches(batchesData);
    } catch (error) {
      console.error('Error refreshing batches:', error);
      toast.error('Failed to refresh batches');
    }
  };

  const openEditBatchModal = (batch: ProductBatch) => {
    setEditingBatch(batch);
    setBatchValue('batchNumber', batch.batchNumber || '');
    setBatchValue('manufactureDate', batch.manufactureDate || '');
    setBatchValue('expiryDate', batch.expiryDate || '');
    setBatchValue('size', batch.size || '');
    setBatchValue('price', batch.price || 0);
    setBatchValue('warningQuantity', batch.warningQuantity || 0);
    setBatchValue('productId', productId);
    setIsEditBatchModalOpen(true);
  };

  // Unit functions
  const onSubmitUnit = async (values: UnitFormValues) => {
    try {
      setUnitSubmitting(true);
      let response;
      
      if (editingUnit) {
        response = await axios.patch(`/api/inventory/productunit/${editingUnit._id}`, values);
      } else {
        response = await axios.post("/api/inventory/productunit", values);
      }

      if (response.status === 200 || response.status === 201) {
        toast.success(editingUnit ? 'Unit updated successfully!' : 'Unit added successfully!');
        setIsUnitModalOpen(false);
        setEditingUnit(null);
        resetUnit();
        
        // Refresh product units
        await refreshProductUnits();
      } else {
        throw new Error('Failed to save unit');
      }
    } catch (error: any) {
      console.error('Error saving unit:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save unit');
    } finally {
      setUnitSubmitting(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    
    try {
      setDeletingUnitId(id);
      const response = await axios.delete(`/api/inventory/productunit/${id}`);

      if (response.status === 200) {
        toast.success('Unit deleted successfully');
        await refreshProductUnits();
      } else {
        throw new Error('Failed to delete unit');
      }
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to delete unit');
    } finally {
      setDeletingUnitId(null);
    }
  };

 const refreshProductUnits = async () => {
  try {
    const response = await axios.get(`/api/inventory/productunit/product/${productId}`);
    const productUnitsData = Array.isArray(response.data) 
      ? response.data 
      : response.data.data || [];
    setProductUnits(productUnitsData);
  } catch (error) {
    console.error('Error refreshing product units:', error);
    toast.error('Failed to refresh product units');
  }
};

  const openEditUnitModal = (unit: ProductUnit) => {
    setEditingUnit(unit);
    setUnitValue('productId', unit.productId._id);
    setUnitValue('unitOfMeasureId', unit.unitOfMeasureId._id);
    setUnitValue('conversionToBase', unit.conversionToBase);
    setUnitValue('isDefault', unit.isDefault);
    setIsUnitModalOpen(true);
  };

  const openCreateUnitModal = () => {
    setEditingUnit(null);
    resetUnit({
      productId: productId,
      unitOfMeasureId: '',
      conversionToBase: 1,
      isDefault: false
    });
    setIsUnitModalOpen(true);
  };

  const createUnitOfMeasure = async () => {
    const unitName = prompt("Enter the name of the new unit:");
    if (!unitName) return;
    
    const unitSymbol = prompt("Enter the symbol for the new unit:");
    if (!unitSymbol) return;
    
    try {
      const response = await axios.post("/api/inventory/productunit/unitmeasure", {
        name: unitName,
        symbol: unitSymbol
      });
      
      if (response.status === 201) {
        toast.success('Unit of measure created successfully');
        // Refresh units list
        const unitsRes = await axios.get("/api/inventory/productunit/unitmeasure/");
        setUnits(unitsRes.data);
      } else {
        throw new Error('Failed to create unit of measure');
      }
    } catch (error: any) {
      console.error('Error creating unit of measure:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create unit of measure');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (batchLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!product) {
    return <div className="flex justify-center items-center h-64">Product not found</div>;
  }

  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-500">{product.productCode} - {product.description}</p>
          </div>
        </div>

        <Tabs defaultValue="batches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
          </TabsList>
          
          <TabsContent value="batches">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsBatchModalOpen(true)}>Add New Batch</Button>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Manufacture Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Warning Quantity</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No batches found for this product
                      </TableCell>
                    </TableRow>
                  ) : (
                    batches.map((batch) => (
                      <TableRow key={batch._id}>
                        <TableCell className="font-medium">{batch.batchNumber || 'N/A'}</TableCell>
                        <TableCell>{batch.manufactureDate ? formatDate(batch.manufactureDate) : 'N/A'}</TableCell>
                        <TableCell>{batch.expiryDate ? formatDate(batch.expiryDate) : 'N/A'}</TableCell>
                        <TableCell>{batch.size || 'N/A'}</TableCell>
                        <TableCell>{batch.price.toFixed(2)}</TableCell>
                        <TableCell>{batch.warningQuantity}</TableCell>
                        <TableCell>{formatDate(batch.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditBatchModal(batch)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDeleteBatch(batch._id)}
                              disabled={deletingBatchId === batch._id}
                            >
                              {deletingBatchId === batch._id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="units">
            <div className="flex justify-end mb-4">
              <Button onClick={openCreateUnitModal}>Add New Unit</Button>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit of Measure</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Conversion Factor</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
<TableBody>
  {!productUnits || productUnits.length === 0 ? (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-4">
        No units found for this product
      </TableCell>
    </TableRow>
  ) : (
    productUnits.map((unit) => (
      <TableRow key={unit._id}>
        <TableCell>{unit.unitOfMeasureId?.name || 'N/A'}</TableCell>
        <TableCell>{unit.unitOfMeasureId?.symbol || 'N/A'}</TableCell>
        <TableCell>{unit.conversionToBase}</TableCell>
        <TableCell>{unit.isDefault ? "Yes" : "No"}</TableCell>
        <TableCell>{new Date(unit.created_at).toLocaleDateString()}</TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openEditUnitModal(unit)}
            >
              <EditOutlined />
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => handleDeleteUnit(unit._id)}
              disabled={deletingUnitId === unit._id}
            >
              {deletingUnitId === unit._id ? 'Deleting...' : <DeleteOutlined />}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))
  )}
</TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Batch Modal */}
        <Modal
          title="Add New Batch"
          description="Create a new batch for this product"
          isOpen={isBatchModalOpen}
          onClose={() => {
            setIsBatchModalOpen(false);
            resetBatch();
          }}
          size="sm"
        >
          <form onSubmit={handleBatchSubmit(onSubmitBatch)} className="space-y-4">
            <input type="hidden" {...registerBatch('productId')} value={productId} />
            
            <div>
              <label className="text-sm font-medium">Batch Number</label>
              <Input
                {...registerBatch('batchNumber')}
                disabled={batchSubmitting}
                placeholder="Enter batch number (optional)"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Manufacture Date</label>
              <Input
                type="date"
                {...registerBatch('manufactureDate')}
                disabled={batchSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <Input
                type="date"
                {...registerBatch('expiryDate')}
                disabled={batchSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Size</label>
              <Input
                {...registerBatch('size')}
                disabled={batchSubmitting}
                placeholder="e.g., 100ml, 500mg, 1kg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Price</label>
              <Input
                type="number"
                step="0.01"
                {...registerBatch('price', { valueAsNumber: true })}
                disabled={batchSubmitting}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Warning Quantity</label>
              <Input
                type="number"
                {...registerBatch('warningQuantity', { valueAsNumber: true })}
                disabled={batchSubmitting}
                placeholder="0"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsBatchModalOpen(false);
                  resetBatch();
                }} 
                disabled={batchSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={batchSubmitting}>
                {batchSubmitting ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Batch Modal */}
        <Modal
          title="Edit Batch"
          description="Update batch details"
          isOpen={isEditBatchModalOpen}
          onClose={() => {
            setIsEditBatchModalOpen(false);
            setEditingBatch(null);
            resetBatch();
          }}
          size="sm"
        >
          <form onSubmit={handleBatchSubmit(onEditBatchSubmit)} className="space-y-4">
            <input type="hidden" {...registerBatch('productId')} value={productId} />
            
            <div>
              <label className="text-sm font-medium">Batch Number</label>
              <Input
                {...registerBatch('batchNumber')}
                disabled={batchSubmitting}
                placeholder="Enter batch number (optional)"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Manufacture Date</label>
              <Input
                type="date"
                {...registerBatch('manufactureDate')}
                disabled={batchSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <Input
                type="date"
                {...registerBatch('expiryDate')}
                disabled={batchSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Size</label>
              <Input
                {...registerBatch('size')}
                disabled={batchSubmitting}
                placeholder="e.g., 100ml, 500mg, 1kg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Price</label>
              <Input
                type="number"
                step="0.01"
                {...registerBatch('price', { valueAsNumber: true })}
                disabled={batchSubmitting}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Warning Quantity</label>
              <Input
                type="number"
                {...registerBatch('warningQuantity', { valueAsNumber: true })}
                disabled={batchSubmitting}
                placeholder="0"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditBatchModalOpen(false);
                  setEditingBatch(null);
                  resetBatch();
                }} 
                disabled={batchSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={batchSubmitting}>
                {batchSubmitting ? 'Updating...' : 'Update Batch'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add/Edit Unit Modal */}
        <Modal
          title={editingUnit ? "Edit Unit" : "Add New Unit"}
          description={editingUnit ? "Update unit details" : "Add a new unit for this product"}
          isOpen={isUnitModalOpen}
          onClose={() => {
            setIsUnitModalOpen(false);
            setEditingUnit(null);
            resetUnit();
          }}
          size="sm"
        >
          <form onSubmit={handleUnitSubmit(onSubmitUnit)} className="space-y-4">
            <Controller
              control={unitControl}
              name="unitOfMeasureId"
              rules={{ required: "Unit of measure is required" }}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit of Measure</label>
                  <div className="flex gap-2">
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={unitSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit._id} value={unit._id}>
                            {unit.name} ({unit.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={createUnitOfMeasure}
                      disabled={unitSubmitting}
                    >
                      New Unit
                    </Button>
                  </div>
                </div>
              )}
            />

            <Controller
              control={unitControl}
              name="conversionToBase"
              rules={{ 
                required: "Conversion factor is required",
                min: { value: 0.01, message: "Conversion factor must be greater than 0" }
              }}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conversion to Base Unit</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={unitSubmitting}
                    placeholder="1.0"
                    min="0.01"
                  />
                </div>
              )}
            />

            {/* <Controller
              control={unitControl}
              name="isDefault"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={unitSubmitting}
                  />
                  <label className="text-sm font-medium">Set as Default Unit</label>
                </div>
              )}
            /> */}

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsUnitModalOpen(false);
                  setEditingUnit(null);
                  resetUnit();
                }} 
                disabled={unitSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={unitSubmitting}>
                {unitSubmitting ? (editingUnit ? 'Updating...' : 'Creating...') : (editingUnit ? 'Update Unit' : 'Create Unit')}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}