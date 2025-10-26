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
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
interface Supplier {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  tinNumber?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormValues {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  tinNumber?: string;
  notes?: string;
}

interface CreateSupplierModalProps {
  closeModal: () => void;
  onSuccess?: () => void;
}

export default function CreateSupplierModal({
  closeModal,
  onSuccess
}: CreateSupplierModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: '',
      tinNumber: '',
      notes: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        toast.error('Supplier name is required');
        return;
      }
      
      // Validate email format if provided
      if (data.email && data.email !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          toast.error('Please enter a valid email address');
          return;
        }
      }
      
      // Clean up empty strings to undefined
      const cleanedData: Supplier = {
        name: data.name,
        contactName: data.contactName || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
        tinNumber: data.tinNumber || undefined,
        notes: data.notes || undefined
      };
      
      // Use fetch API instead of axios
      const url = '/api/inventory/Supplier';
      const method = 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      
      toast.success('Supplier created successfully');
      closeModal();
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      const backendMessage = error.message || 'Error creating supplier';
      toast.error(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Create New Supplier
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Required Fields */}
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter supplier name'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='contactName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter contact name'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter phone number'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Enter email address'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='tinNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TIN Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter TIN number'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='country'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter country'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='address'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Enter full address'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='city'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter city'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Additional notes or comments'
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2 pt-4'>
              <Button variant='outline' type='button' onClick={closeModal}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Supplier'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}