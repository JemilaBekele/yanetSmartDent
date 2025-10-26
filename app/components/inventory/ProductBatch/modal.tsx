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
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Product {
  _id: string;
  name: string;
  productCode: string;
}

interface ProductBatch {
  batchNumber: string;
  expiryDate: string;
  manufactureDate: string;
  size: string;
  price: number;
  warningQuantity: number;
  productId: string;
}

interface FormValues {
  batchNumber: string;
  expiryDate: string;
  manufactureDate: string;
  size: string;
  price: number;
  warningQuantity: number;
}

interface CreateBatchModalProps {
  closeModal: () => void;
  onSuccess?: () => void;
  refreshBatches?: () => void;
  productId: string; // Added productId as a required prop
}

export default function CreateBatchModal({
  closeModal,
  onSuccess,
  refreshBatches,
  productId // Receive productId from props
}: CreateBatchModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const form = useForm<FormValues>({
    defaultValues: {
      batchNumber: '',
      expiryDate: '',
      manufactureDate: '',
      size: '',
      price: 0,
      warningQuantity: 0,
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

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      
      // Validate required fields
      if (!productId || productId.trim() === '') {
        toast.error('Product ID is required');
        return;
      }
      
      if (values.price <= 0) {
        toast.error('Price must be greater than 0');
        return;
      }
      
      if (values.warningQuantity < 0) {
        toast.error('Warning quantity cannot be negative');
        return;
      }
      
      // Validate date logic
      if (values.manufactureDate && values.expiryDate) {
        const manufactureDate = new Date(values.manufactureDate);
        const expiryDate = new Date(values.expiryDate);
        
        if (expiryDate <= manufactureDate) {
          toast.error('Expiry date must be after manufacture date');
          return;
        }
      }

      const response = await fetch('/api/inventory/ProductBatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          batchNumber: values.batchNumber || '',
          productId: productId // Use the productId from props
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create batch');
      }

      toast.success('Batch created successfully');
      closeModal();
      form.reset();
      
      // Refresh batches list if provided
      if (refreshBatches) {
        await refreshBatches();
      }
      
      // Call success callback
      onSuccess?.();
      
    } catch (error: any) {
      console.error('Error creating batch:', error);
      toast.error(error.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Create New Product Batch
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
           

              {/* Display product name as read-only */}
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

              {/* Batch Number is optional */}
              <FormField
                control={form.control}
                name='batchNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter batch number (optional)'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='manufactureDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacture Date</FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='expiryDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='size'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter size (e.g., 100ml, 500g)'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        min='0.01'
                        placeholder='Enter price'
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='warningQuantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warning Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        placeholder='Enter warning quantity'
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex justify-end gap-2 pt-4'>
              <Button variant='outline' type='button' onClick={closeModal}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}