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

interface LocationType {
  _id: string;
  name: string;
  createdAt: string;
}

const LocationPage: React.FC = () => {
  const { data: session } = useSession();
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [locationInput, setLocationInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const role = useMemo(() => session?.user?.role || "", [session]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/inventory/Location");
      if (response.status === 200) {
        setLocations(response.data);
        setError(null);
      } else {
        setError("Error fetching locations");
      }
    } catch (err) {
      setError("Error fetching locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;

    const updatedLocations = locations.filter((loc) => loc._id !== id);
    setLocations(updatedLocations);

    const toastId = toast.loading("Deleting location...");
    try {
      const response = await axios.delete(`/api/inventory/Location/${id}`);
      if (response.status === 200) {
        toast.update(toastId, {
          render: "Location deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        fetchLocations();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      setLocations(locations);
      toast.update(toastId, {
        render: "Error deleting location",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!locationInput.trim()) {
      toast.error("Location name cannot be empty.");
      return;
    }

    const toastId = toast.loading(selectedLocation ? "Updating location..." : "Adding location...");
    try {
      let response;
      const payload = { name: locationInput };

      if (selectedLocation) {
        response = await axios.patch(`/api/inventory/Location/${selectedLocation._id}`, payload);
      } else {
        response = await axios.post("/api/inventory/Location", payload);
      }

      if (response.status === 200 || response.status === 201) {
        toast.update(toastId, {
          render: selectedLocation ? "Location updated successfully!" : "Location added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        await fetchLocations();

        setModalOpen(false);
        setSelectedLocation(null);
        setLocationInput("");
      } else {
        throw new Error("Failed to save location");
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
              Locations
            </Typography>
            {(role === "admin" || role === "manager") && (
              <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
                New Location +
              </Button>
            )}
          </div>

          {error && <Typography color="error">{error}</Typography>}
          {loading && <Typography>Loading locations...</Typography>}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <TableRow key={loc._id}>
                      <TableCell>{loc.name}</TableCell>
                      <TableCell align="center">
                        <Button
                          onClick={() => {
                            setSelectedLocation(loc);
                            setLocationInput(loc.name);
                            setModalOpen(true);
                          }}
                          startIcon={<EditOutlined />}
                          color="primary"
                        />
                        <Button onClick={() => handleDelete(loc._id)} startIcon={<DeleteOutlined />} color="error" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      {loading ? "Loading..." : "No locations available."}
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
              {selectedLocation ? "Edit Location" : "Add Location"}
            </Typography>
            <TextField fullWidth label="Location" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} margin="normal" variant="outlined" />
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

export default LocationPage;
