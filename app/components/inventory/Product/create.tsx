'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';

interface ProductFormValues {
  _id?: string;
  productCode: string;
  name: string;
  description?: string;
  categoryId: string;
  subCategoryId?: string;
}

interface Category {
  _id: string;  // Changed from id to _id
  name: string;
}

interface SubCategory {
  _id: string;  // Changed from id to _id
  name: string;
  procategoryId: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ProductFormValues | null;
  onSuccess?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, control, formState } =
    useForm<ProductFormValues>({
      defaultValues: {
        productCode: '',
        name: '',
        description: '',
        categoryId: '',
        subCategoryId: '',
      },
    });

  const selectedCategory = watch('categoryId');

  // Reset form when initialData changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset(
        initialData || {
          productCode: '',
          name: '',
          description: '',
          categoryId: '',
          subCategoryId: '',
        }
      );
    }
  }, [isOpen, initialData, reset]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<Category[]>("/api/inventory/Category");
        if (response.status === 200) {
          setCategories(response.data);
        } else {
          setError("Error fetching categories");
        }
      } catch (error) {
        setError("Error fetching categories");
        console.error(error);
      }
    };
    
    if (isOpen) fetchCategories();
  }, [isOpen]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!selectedCategory) {
        setSubCategories([]);
        return;
      }

      try {
        const res = await fetch(`/api/inventory/SubCategory/${selectedCategory}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load subcategories');
        setSubCategories(data.subCategories || []);
        
        // If we're in edit mode and the current subCategory doesn't belong to the selected category, reset it
        if (initialData?.subCategoryId) {
          const currentSubCategory = data.subCategories.find(
            (sub: SubCategory) => sub._id === initialData.subCategoryId
          );
          
          if (!currentSubCategory) {
            setValue('subCategoryId', '');
          }
        }
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    if (selectedCategory) {
      fetchSubCategories();
    }
  }, [selectedCategory, setValue, initialData]);

  // Submit form
  const onSubmit = async (values: ProductFormValues) => {
  try {
    setLoading(true);

    // Include the ID in the URL for PATCH requests
    const url = initialData 
      ? `/api/inventory/Product/${initialData._id}`  // Include ID for updates
      : '/api/inventory/Product';                    // No ID for new products

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
    toast.error('Error submitting product');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  return (
    <Modal
      title={initialData ? 'Update Product' : 'Create Product'}
      description={
        initialData
          ? 'Edit the product details below.'
          : 'Fill in the form to create a new product.'
      }
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Product Code */}
        <div>
          <label className="text-sm font-medium">Product Code</label>
          <Input
            {...register('productCode', { required: 'Product code is required' })}
            disabled={loading}
            placeholder="Enter product code"
          />
          {formState.errors.productCode && (
            <p className="text-sm text-red-500">
              {formState.errors.productCode.message}
            </p>
          )}
        </div>

        {/* Product Name */}
        <div>
          <label className="text-sm font-medium">Product Name</label>
          <Input
            {...register('name', { required: 'Product name is required' })}
            disabled={loading}
            placeholder="Enter product name"
          />
          {formState.errors.name && (
            <p className="text-sm text-red-500">{formState.errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium">Description</label>
          <Input
            {...register('description')}
            disabled={loading}
            placeholder="Enter product description"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium">Category</label>
          <Controller
            control={control}
            name="categoryId"
            rules={{ required: 'Category is required' }}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category">
                    {field.value ? categories.find(cat => cat._id === field.value)?.name : "Select category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {formState.errors.categoryId && (
            <p className="text-sm text-red-500">{formState.errors.categoryId.message}</p>
          )}
        </div>

        {/* SubCategory */}
        <div>
          <label className="text-sm font-medium">SubCategory</label>
          <Controller
            control={control}
            name="subCategoryId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading || !selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedCategory 
                      ? "Select a category first" 
                      : subCategories.length === 0 
                        ? "No subcategories available" 
                        : "Select subcategory"
                  }>
                    {field.value ? subCategories.find(sub => sub._id === field.value)?.name : 
                      (!selectedCategory 
                        ? "Select a category first" 
                        : subCategories.length === 0 
                          ? "No subcategories available" 
                          : "Select subcategory")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((sub) => (
                    <SelectItem key={sub._id} value={sub._id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
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