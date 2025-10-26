'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';

interface SupplierFormValues {
  _id?: string;
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

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SupplierFormValues | null;
  onSuccess?: () => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState } = useForm<SupplierFormValues>({
    defaultValues: {
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: '',
      tinNumber: '',
      notes: '',
    },
  });

  // Reset form when initialData changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset(
        initialData || {
          name: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          country: '',
          tinNumber: '',
          notes: '',
        }
      );
    }
  }, [isOpen, initialData, reset]);

  // Submit form
  const onSubmit = async (values: SupplierFormValues) => {
    try {
      setLoading(true);

      const url = initialData
        ? `/api/inventory/Supplier/${initialData._id}`
        : '/api/inventory/Supplier';

      const method = initialData ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Something went wrong');
        return;
      }

      toast.success(data.message);
      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Error submitting supplier');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
  <Modal
    title={initialData ? 'Update Supplier' : 'Create Supplier'}
    description={
      initialData
        ? 'Edit the supplier details below.'
        : 'Fill in the form to create a new supplier.'
    }
    isOpen={isOpen}
    onClose={onClose}
    size="lg"
  >
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Name */}
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          {...register('name', { required: 'Supplier name is required' })}
          disabled={loading}
          placeholder="Enter supplier name"
        />
        {formState.errors.name && (
          <p className="text-sm text-red-500">{formState.errors.name.message}</p>
        )}
      </div>

      {/* Contact Name */}
      <div>
        <label className="text-sm font-medium">Contact Name</label>
        <Input
          {...register('contactName')}
          disabled={loading}
          placeholder="Enter contact person name"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-sm font-medium">Phone</label>
        <Input
          {...register('phone')}
          disabled={loading}
          placeholder="Enter phone number"
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          {...register('email')}
          disabled={loading}
          placeholder="Enter email"
        />
      </div>

      {/* Address */}
      <div>
        <label className="text-sm font-medium">Address</label>
        <Input
          {...register('address')}
          disabled={loading}
          placeholder="Enter address"
        />
      </div>

      {/* City */}
      <div>
        <label className="text-sm font-medium">City</label>
        <Input
          {...register('city')}
          disabled={loading}
          placeholder="Enter city"
        />
      </div>

      {/* Country */}
      <div>
        <label className="text-sm font-medium">Country</label>
        <Input
          {...register('country')}
          disabled={loading}
          placeholder="Enter country"
        />
      </div>

      {/* TIN Number */}
      <div>
        <label className="text-sm font-medium">TIN Number</label>
        <Input
          {...register('tinNumber')}
          disabled={loading}
          placeholder="Enter TIN number"
        />
      </div>

      {/* Notes - full width */}
      <div className="md:col-span-2">
        <label className="text-sm font-medium">Notes</label>
        <Input
          {...register('notes')}
          disabled={loading}
          placeholder="Enter notes"
        />
      </div>

      {/* Buttons - full width */}
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  </Modal>
);

};
