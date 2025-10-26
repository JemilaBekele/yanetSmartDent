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
} from "@mui/material";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Category {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface SubCategory {
  _id: string;
  name: string;
  procategoryId: {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  categoryName?: string; // For display purposes
}

interface SubCategoryFormValues {
  id?: string;
  name: string;
  procategoryId: string; // Store only the category ID for form submission
}

const SubCategoryPage: React.FC = () => {
  const { data: session } = useSession();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<SubCategoryFormValues>({
    name: "",
    procategoryId: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const role = useMemo(() => session?.user?.role || "", [session]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get<Category[]>("/api/inventory/Category", {
        headers: { Authorization: `Bearer ` },
      });
      if (response.status === 200) {
        setCategories(response.data);
      } else {
        setError("Error fetching categories");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Error fetching categories");
    }
  };

  // Fetch subcategories
  const fetchSubCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get<SubCategory[]>("/api/inventory/SubCategory", {
        headers: { Authorization: `Bearer ` },
      });
      if (response.status === 200) {
        // Enrich subcategories with category names for display
        const subCategoriesWithCategoryNames = response.data.map((subCat) => ({
          ...subCat,
          categoryName: subCat.procategoryId?.name || "Unknown Category",
        }));
        setSubCategories(subCategoriesWithCategoryNames);
        setError(null);
      } else {
        setError("Error fetching subcategories");
      }
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      setError("Error fetching subcategories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subcategory?")) return;

    const toastId = toast.loading("Deleting subcategory...");
    try {
      const response = await axios.delete(`/api/inventory/SubCategory/${id}`, {
        headers: { Authorization: `Bearer ` },
      });
      if (response.status === 200 || response.status === 204) {
        toast.update(toastId, {
          render: "Subcategory deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        await fetchSubCategories(); // Refresh subcategories
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Error deleting subcategory:", err);
      toast.update(toastId, {
        render: err.response?.data?.message || err.message || "Error deleting subcategory",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!formValues.name.trim()) {
      toast.error("Subcategory name cannot be empty.");
      return;
    }

    if (!formValues.procategoryId) {
      toast.error("Please select a category.");
      return;
    }

    const toastId = toast.loading(selectedSubCategory ? "Updating subcategory..." : "Adding subcategory...");
    try {
      let response;
      const payload = {
        name: formValues.name,
        procategoryId: formValues.procategoryId, // Send only the category ID
      };

      if (selectedSubCategory) {
        response = await axios.patch(`/api/inventory/SubCategory/${selectedSubCategory._id}`, payload, {
          headers: { Authorization: `Bearer ` },
        });
      } else {
        response = await axios.post("/api/inventory/SubCategory", payload, {
          headers: { Authorization: `Bearer ` },
        });
      }

      if (response.status === 200 || response.status === 201) {
        toast.update(toastId, {
          render: selectedSubCategory ? "Subcategory updated successfully!" : "Subcategory added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        await fetchSubCategories(); // Refresh subcategories
        setModalOpen(false);
        setSelectedSubCategory(null);
        setFormValues({
          name: "",
          procategoryId: "",
        });
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Error saving subcategory:", err);
      toast.update(toastId, {
        render: err.response?.data?.message || err.message || "An unexpected error occurred.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleEdit = (subCat: SubCategory) => {
    setSelectedSubCategory(subCat);
    setFormValues({
      name: subCat.name,
      procategoryId: subCat.procategoryId._id, // Use the category ID
    });
    setModalOpen(true);
  };

  return (
    <div className="flex ml-9 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h5" fontWeight="bold">
              Product Subcategories
            </Typography>
               <Link  href="/inventory/ProCategory">
             <Button  variant="contained" color="primary" >
    Catagory
  </Button>
          </Link>
            {(role === "admin" || role === "manager") && (
              <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
                New Subcategory +
              </Button>
            )}
          </div>

          {error && <Typography color="error">{error}</Typography>}
          {loading && <Typography>Loading subcategories...</Typography>}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Subcategory</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subCategories.length > 0 ? (
                  subCategories.map((subCat) => (
                    <TableRow key={subCat._id}>
                      <TableCell>{subCat.name}</TableCell>
                      <TableCell>{subCat.categoryName}</TableCell>
                      <TableCell>{new Date(subCat.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          onClick={() => handleEdit(subCat)}
                          startIcon={<EditOutlined />}
                          color="primary"
                        />
                        <Button
                          onClick={() => handleDelete(subCat._id)}
                          startIcon={<DeleteOutlined />}
                          color="error"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {loading ? "Loading..." : "No subcategories available."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedSubCategory(null);
            setFormValues({
              name: "",
              procategoryId: "",
            });
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "90%", sm: "80%", md: "60%" },
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" gutterBottom>
              {selectedSubCategory ? "Edit Subcategory" : "Add Subcategory"}
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                value={formValues.procategoryId}
                label="Category"
                onChange={(e) => setFormValues({ ...formValues, procategoryId: e.target.value })}
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No categories available
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Subcategory Name"
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              margin="normal"
              variant="outlined"
            />

            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" color="primary" onClick={handleSave} sx={{ mr: 2 }}>
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedSubCategory(null);
                  setFormValues({
                    name: "",
                    procategoryId: "",
                  });
                }}
              >
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

export default SubCategoryPage;