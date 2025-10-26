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
} from "@mui/material";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

interface Category {
  _id: string;
  name: string;
  createdAt: string;
}

const ProductCategoryPage: React.FC = () => {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const role = useMemo(() => session?.user?.role || "", [session]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/inventory/Category");
      if (response.status === 200) {
        setCategories(response.data);
        setError(null);
      } else {
        setError("Error fetching categories");
      }
    } catch (err) {
      setError("Error fetching categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    const updatedCategories = categories.filter((cat) => cat._id !== id);
    setCategories(updatedCategories);

    const toastId = toast.loading("Deleting category...");
    try {
      const response = await axios.delete(`/api/inventory/Category/${id}`);
      if (response.status === 200) {
        toast.update(toastId, {
          render: "Category deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        // Refresh categories after successful deletion
        fetchCategories();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      setCategories(categories); // Revert to original categories
      toast.update(toastId, {
        render: "Error deleting category",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!categoryInput.trim()) {
      toast.error("Category name cannot be empty.");
      return;
    }

    const toastId = toast.loading(selectedCategory ? "Updating category..." : "Adding category...");
    try {
      let response;
      const payload = { name: categoryInput };

      if (selectedCategory) {
        response = await axios.patch(`/api/inventory/Category/${selectedCategory._id}`, payload);
      } else {
        response = await axios.post("/api/inventory/Category", payload);
      }

      // Accept both 200 and 201 status codes
      if (response.status === 200 || response.status === 201) {
        toast.update(toastId, {
          render: selectedCategory ? "Category updated successfully!" : "Category added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        // Refresh categories after successful create/update
        await fetchCategories();
        
        setModalOpen(false);
        setSelectedCategory(null);
        setCategoryInput("");
      } else {
        throw new Error("Failed to save category");
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

  return (
    <div className="flex ml-9 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h5" fontWeight="bold">
              Product Categories
            </Typography>
            {(role === "admin" || role === "manager") && (
              <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
                New Category +
              </Button>
            )}
          </div>

          {error && <Typography color="error">{error}</Typography>}
          {loading && <Typography>Loading categories...</Typography>}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <TableRow key={cat._id}>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell>{new Date(cat.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          onClick={() => {
                            setSelectedCategory(cat);
                            setCategoryInput(cat.name);
                            setModalOpen(true);
                          }}
                          startIcon={<EditOutlined />}
                          color="primary"
                        />
                        <Button onClick={() => handleDelete(cat._id)} startIcon={<DeleteOutlined />} color="error" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      {loading ? "Loading..." : "No categories available."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: { xs: "90%", sm: "80%", md: "60%" }, bgcolor: "background.paper", boxShadow: 24, p: 4, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              {selectedCategory ? "Edit Category" : "Add Category"}
            </Typography>
            <TextField fullWidth label="Category" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} margin="normal" variant="outlined" />
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" color="primary" onClick={handleSave} sx={{ mr: 2 }}>
                Save
              </Button>
              <Button variant="outlined" onClick={() => setModalOpen(false)}>
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

export default ProductCategoryPage;