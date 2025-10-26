import { useEffect, useState } from "react";
import axios from "axios";

export interface Product {
  id?: string;
  productCode: string;
  name: string;
  description?: string;
  categoryId: string;
  subCategoryId?: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Get all
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/inventory/Product");
      setProducts(res.data.products || []);
    } finally {
      setLoading(false);
    }
  };
 const deleteProduct = async (id: string) => {
    await axios.delete("/api/inventory/Product", { data: { id } });
    await fetchProducts();
  };
  // ✅ Create
  const createProduct = async (product: Product) => {
    await axios.post("/api/inventory/Product", product);
    await fetchProducts();
  };

  // ✅ Update
  const updateProduct = async (product: Product) => {
    await axios.patch("/api/inventory/Product", product);
    await fetchProducts();
  };

  // ✅ Delete
 

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, createProduct, updateProduct, deleteProduct, fetchProducts };
}
