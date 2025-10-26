'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

interface UnitOfMeasure {
  _id: string;
  name: string;
  symbol?: string;
}

interface Product {
  _id: string;
  name: string;
  productCode: string;
}

interface FormValues {
  unitOfMeasureId: string;
  conversionToBase: number;
  isDefault: boolean;
}

interface CreateProductUnitModalProps {
  closeModal: () => void;
  onSuccess?: () => void;
  refreshUnits?: () => void;
  productId: string;
}

export default function CreateProductUnitModal({
  closeModal,
  onSuccess,
  refreshUnits,
  productId
}: CreateProductUnitModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const form = useForm<FormValues>({
    defaultValues: {
      unitOfMeasureId: '',
      conversionToBase: 1,
      isDefault: false
    }
  });

  // 🔹 Fetch product details
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      
      try {
        setLoadingProduct(true);
        const res = await axios.get(`/api/inventory/Product/${productId}`);
        if (res.status === 200) {
          setProduct(res.data);
        } else {
          toast.error('Failed to fetch product details');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        toast.error('Failed to fetch product details');
      } finally {
        setLoadingProduct(false);
      }
    }
    fetchProduct();
  }, [productId]);

  // 🔹 Fetch available units of measure
  useEffect(() => {
    async function fetchUoms() {
      try {
        const res = await fetch('/api/inventory/productunit/unitmeasure');
        const data = await res.json();
        if (res.ok) {
          setUoms(data);
        } else {
          toast.error(data.message || 'Failed to fetch units of measure');
        }
      } catch (err) {
        console.error('Error fetching UOMs:', err);
        toast.error('Failed to fetch units of measure');
      }
    }
    fetchUoms();
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);

      if (!productId || productId.trim() === '') {
        toast.error('Product ID is required');
        return;
      }

      if (!values.unitOfMeasureId) {
        toast.error('Please select a unit of measure');
        return;
      }

      if (values.conversionToBase <= 0) {
        toast.error('Conversion to base must be greater than 0');
        return;
      }

      const response = await fetch('/api/inventory/productunit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          productId
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create product unit');
      }

      toast.success('Product unit created successfully');
      closeModal();
      form.reset();

      if (refreshUnits) {
        await refreshUnits();
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating product unit:', error);
      toast.error(error.message || 'Failed to create product unit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Create New Product Unit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Product ID readonly */}
          

              {/* Product Name readonly */}
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input 
                    value={loadingProduct ? "Loading..." : (product ? `${product.name} (${product.productCode})` : "Not found")} 
                    readOnly 
                    className="bg-gray-100" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              {/* Unit of Measure dropdown */}
              <FormField
                control={form.control}
                name='unitOfMeasureId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {uoms.map((uom) => (
                            <SelectItem key={uom._id} value={uom._id}>
                              {uom.name} {uom.symbol && `(${uom.symbol})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conversion to base */}
              <FormField
                control={form.control}
                name='conversionToBase'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversion To Base *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0.0001'
                        step='0.0001'
                        placeholder='Enter conversion rate'
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Default Unit toggle */}
              {/* <FormField
                control={form.control}
                name='isDefault'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Unit</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <input
                          type='checkbox'
                          id={`isDefault-${productId}`}
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={`isDefault-${productId}`} className="text-sm">
                          Set as default unit for this product
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>

            <div className='flex justify-end gap-2 pt-4'>
              <Button variant='outline' type='button' onClick={closeModal}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Unit'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}