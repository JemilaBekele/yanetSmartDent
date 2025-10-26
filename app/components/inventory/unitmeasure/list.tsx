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

interface UnitOfMeasure {
  _id: string;
  name: string;
  symbol: string;
  createdAt: string;
}

const UnitOfMeasurePage: React.FC = () => {
  const { data: session } = useSession();
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitOfMeasure | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [symbolInput, setSymbolInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const role = useMemo(() => session?.user?.role || "", [session]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/inventory/productunit/unitmeasure");
      if (response.status === 200) {
        setUnits(response.data);
        setError(null);
      } else {
        setError("Error fetching units of measure");
      }
    } catch (err) {
      setError("Error fetching units of measure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this unit of measure?")) return;

    const updatedUnits = units.filter((unit) => unit._id !== id);
    setUnits(updatedUnits);

    const toastId = toast.loading("Deleting unit of measure...");
    try {
      const response = await axios.delete(`/api/inventory/productunit/unitmeasure/${id}`);
      if (response.status === 200) {
        toast.update(toastId, {
          render: "Unit of measure deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        // Refresh units after successful deletion
        fetchUnits();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      setUnits(units); // Revert to original units
      toast.update(toastId, {
        render: "Error deleting unit of measure",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!nameInput.trim()) {
      toast.error("Unit name cannot be empty.");
      return;
    }

    const toastId = toast.loading(selectedUnit ? "Updating unit..." : "Adding unit...");
    try {
      let response;
      const payload = { name: nameInput, symbol: symbolInput };

      if (selectedUnit) {
        response = await axios.patch(`/api/inventory/productunit/unitmeasure/${selectedUnit._id}`, payload);
      } else {
        response = await axios.post("/api/inventory/productunit/unitmeasure", payload);
      }

      // Accept both 200 and 201 status codes
      if (response.status === 200 || response.status === 201) {
        toast.update(toastId, {
          render: selectedUnit ? "Unit updated successfully!" : "Unit added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        // Refresh units after successful create/update
        await fetchUnits();
        
        setModalOpen(false);
        setSelectedUnit(null);
        setNameInput("");
        setSymbolInput("");
      } else {
        throw new Error("Failed to save unit");
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
    setSelectedUnit(null);
    setNameInput("");
    setSymbolInput("");
  };

  return (
    <div className="flex ml-9 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h5" fontWeight="bold">
              Units of Measure
            </Typography>
            {(role === "admin" || role === "manager") && (
              <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
                New Unit +
              </Button>
            )}
          </div>

          {error && <Typography color="error">{error}</Typography>}
          {loading && <Typography>Loading units...</Typography>}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {units.length > 0 ? (
                  units.map((unit) => (
                    <TableRow key={unit._id}>
                      <TableCell>{unit.name}</TableCell>
                      <TableCell>{unit.symbol || "-"}</TableCell>
                      <TableCell>{new Date(unit.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setNameInput(unit.name);
                            setSymbolInput(unit.symbol || "");
                            setModalOpen(true);
                          }}
                          startIcon={<EditOutlined />}
                          color="primary"
                        />
                        <Button onClick={() => handleDelete(unit._id)} startIcon={<DeleteOutlined />} color="error" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {loading ? "Loading..." : "No units of measure available."}
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
            borderRadius: 2 
          }}>
            <Typography variant="h5" gutterBottom>
              {selectedUnit ? "Edit Unit of Measure" : "Add Unit of Measure"}
            </Typography>
            <TextField 
              fullWidth 
              label="Unit Name" 
              value={nameInput} 
              onChange={(e) => setNameInput(e.target.value)} 
              margin="normal" 
              variant="outlined" 
              required
            />
            <TextField 
              fullWidth 
              label="Symbol (Optional)" 
              value={symbolInput} 
              onChange={(e) => setSymbolInput(e.target.value)} 
              margin="normal" 
              variant="outlined" 
              placeholder="e.g., kg, pcs, m"
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

export default UnitOfMeasurePage;