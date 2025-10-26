"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  code: string;
}

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

const ProductUnitPage: React.FC = () => {
  const { data: session } = useSession();
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductUnit, setSelectedProductUnit] = useState<ProductUnit | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [productId, setProductId] = useState<string>("");
  const [unitOfMeasureId, setUnitOfMeasureId] = useState<string>("");
  const [conversionToBase, setConversionToBase] = useState<number>(1);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const role = useMemo(() => session?.user?.role || "", [session]);

  const fetchProductUnits = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/inventory/productunit");
      if (response.status === 200) {
        setProductUnits(response.data);
        setError(null);
      } else {
        setError("Error fetching product units");
      }
    } catch (err) {
      setError("Error fetching product units");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/inventory/Product");
      if (response.status === 200) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await axios.get("/api/inventory/productunit/unitmeasure/");
      if (response.status === 200) {
        setUnits(response.data);
      }
    } catch (err) {
      console.error("Error fetching units:", err);
    }
  };

  useEffect(() => {
    fetchProductUnits();
    fetchProducts();
    fetchUnits();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product unit?")) return;

    const updatedProductUnits = productUnits.filter((pu) => pu._id !== id);
    setProductUnits(updatedProductUnits);

    const toastId = toast.loading("Deleting product unit...");
    try {
      const response = await axios.delete(`/api/inventory/productunit/${id}`);
      if (response.status === 200) {
        toast.update(toastId, {
          render: "Product unit deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        fetchProductUnits();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      setProductUnits(productUnits);
      toast.update(toastId, {
        render: "Error deleting product unit",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!productId || !unitOfMeasureId || !conversionToBase) {
      toast.error("Product, Unit of Measure, and Conversion factor are required.");
      return;
    }

    if (conversionToBase <= 0) {
      toast.error("Conversion factor must be greater than 0.");
      return;
    }

    const toastId = toast.loading(selectedProductUnit ? "Updating product unit..." : "Adding product unit...");
    try {
      let response;
      const payload = { productId, unitOfMeasureId, conversionToBase, isDefault };

      if (selectedProductUnit) {
        response = await axios.patch(`/api/inventory/productunit/${selectedProductUnit._id}`, payload);
      } else {
        response = await axios.post("/api/inventory/productunit", payload);
      }

      if (response.status === 200 || response.status === 201) {
        toast.update(toastId, {
          render: selectedProductUnit ? "Product unit updated successfully!" : "Product unit added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        await fetchProductUnits();
        handleModalClose();
      } else {
        throw new Error("Failed to save product unit");
      }
    } catch (err: any) {
      toast.update(toastId, {
        render: err.response?.data?.message || err.message || "An unexpected error occurred.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedProductUnit(null);
    setProductId("");
    setUnitOfMeasureId("");
    setConversionToBase(1);
    setIsDefault(false);
  };

  const handleEdit = (productUnit: ProductUnit) => {
    setSelectedProductUnit(productUnit);
    setProductId(productUnit.productId._id);
    setUnitOfMeasureId(productUnit.unitOfMeasureId._id);
    setConversionToBase(productUnit.conversionToBase);
    setIsDefault(productUnit.isDefault);
    setModalOpen(true);
  };

  return (
    <div className="flex ml-9 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h5" fontWeight="bold">
              Product Units
            </Typography>
              
                 
                   
                    <Link  href="/inventory/UnitOfMeasure">
                               <Button  variant="contained" color="primary" >
                      Unit
                    </Button>
                            </Link>
                              <Link  href="/inventory/LocationPage">
                                         <Button  variant="contained" color="primary" >
                                Locations
                              </Button>
                                      </Link>
                                        <Link  href="/inventory/supplier">
                                                   <Button  variant="contained" color="primary" >
                                          Suppliers
                                        </Button>
                                                </Link>
                                                 
            {(role === "admin" || role === "manager") && (
              <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
                New Product Unit +
              </Button>
            )}
          </div>

          {error && <Typography color="error">{error}</Typography>}
          {loading && <Typography>Loading product units...</Typography>}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Unit of Measure</TableCell>
                  <TableCell>Conversion Factor</TableCell>
                  <TableCell>Default</TableCell>
                  <TableCell>Date Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productUnits.length > 0 ? (
                  productUnits.map((pu) => (
                    <TableRow key={pu._id}>
                      <TableCell>{pu.productId.name} ({pu.productId.code})</TableCell>
                      <TableCell>{pu.unitOfMeasureId.name} ({pu.unitOfMeasureId.symbol})</TableCell>
                      <TableCell>{pu.conversionToBase}</TableCell>
                      <TableCell>{pu.isDefault ? "Yes" : "No"}</TableCell>
                      <TableCell>{new Date(pu.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          onClick={() => handleEdit(pu)}
                          startIcon={<EditOutlined />}
                          color="primary"
                        />
                        <Button onClick={() => handleDelete(pu._id)} startIcon={<DeleteOutlined />} color="error" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {loading ? "Loading..." : "No product units available."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <Modal open={modalOpen} onClose={handleModalClose}>
          <Box sx={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)", 
            width: { xs: "90%", sm: "80%", md: "60%" }, 
            bgcolor: "background.paper", 
            boxShadow: 24, 
            p: 4, 
            borderRadius: 2,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <Typography variant="h5" gutterBottom>
              {selectedProductUnit ? "Edit Product Unit" : "Add Product Unit"}
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Product</InputLabel>
              <Select
                value={productId}
                label="Product"
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                {products.map((product) => (
                  <MenuItem key={product._id} value={product._id}>
                    {product.name} ({product.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Unit of Measure</InputLabel>
              <Select
                value={unitOfMeasureId}
                label="Unit of Measure"
                onChange={(e) => setUnitOfMeasureId(e.target.value)}
                required
              >
                {units.map((unit) => (
                  <MenuItem key={unit._id} value={unit._id}>
                    {unit.name} ({unit.symbol})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Conversion to Base Unit"
              type="number"
              value={conversionToBase}
              onChange={(e) => setConversionToBase(Number(e.target.value))}
              margin="normal"
              variant="outlined"
              required
              inputProps={{ min: 0.01, step: 0.01 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  color="primary"
                />
              }
              label="Set as Default Unit for this Product"
            />

            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" color="primary" onClick={handleSave} sx={{ mr: 2 }}>
                Save
              </Button>
              <Button variant="outlined" onClick={handleModalClose}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>

        <ToastContainer />
      </div>
    </div>
  );
};

export default ProductUnitPage;