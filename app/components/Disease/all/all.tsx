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

type DiseaseInfo = {
  _id: string;
  disease: string;
  createdBy?: {
    username: string;
  };
  createdAt: string;
};



const DiseasePage: React.FC = () => {

  const { data: session } = useSession();
  const [diseaseInfo, setDiseaseInfo] = useState<DiseaseInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseInfo | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [diseaseInput, setDiseaseInput] = useState<string>("");
  const role = useMemo(() => session?.user?.role || "", [session]);

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const response = await axios.get("/api/Disease/findall");
        if (response.status === 200) {
          setDiseaseInfo(response.data.data);
        } else {
          setError("Error fetching diseases");
        }
      } catch (err) {
        setError("Error fetching diseases");
      }
    };
    fetchDiseases();
  }, []);

  const handleDelete = async (recordId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this disease? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const updatedDiseaseInfo = diseaseInfo.filter((item) => item._id !== recordId);
    setDiseaseInfo(updatedDiseaseInfo);

    const toastId = toast.loading("Deleting record...");
    try {
      const response = await axios.delete(`/api/Disease/${recordId}`);
      if (response.data && response.data.success) {
        toast.update(toastId, {
          render: "Record deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        throw new Error(response.data.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setDiseaseInfo((prevData) => [...prevData, updatedDiseaseInfo.find((item) => item._id === recordId)!]);
      toast.update(toastId, {
        render: "Error deleting record.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!diseaseInput.trim()) {
      toast.error("Disease name cannot be empty.");
      return;
    }
  
    const toastId = toast.loading(selectedDisease ? "Updating record..." : "Adding record...");
  
    try {
      let response;
  
      // Prepare the payload
      const payload = { disease: diseaseInput };
  
      if (selectedDisease) {
        // Update existing disease
        response = await axios.patch(`/api/Disease/${selectedDisease._id}`, payload);
      } else {
        // Create new disease
        response = await axios.post("/api/Disease/findall", payload);
      }
  
      // Log the full API response for debugging
  
      // Check if the response indicates success
      if (
        response.data &&
        (response.data.success ||
          response.data.message === "Success" ||
          response.status === 200)
      ) {
        toast.update(toastId, {
          render: selectedDisease ? "Record updated successfully!" : "Record added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
  
        // Update local state
        const updatedDiseaseInfo = selectedDisease
          ? diseaseInfo.map((item) =>
              item._id === selectedDisease._id ? { ...item, disease: diseaseInput } : item
            )
          : [
              ...diseaseInfo,
              {
                _id: response.data.data?._id || response.data._id,
                disease: diseaseInput,
                createdAt: new Date().toISOString(),
              },
            ];
  
        setDiseaseInfo(updatedDiseaseInfo);
        setModalOpen(false);
        setSelectedDisease(null);
        setDiseaseInput("");
      } else {
        throw new Error(response.data.error || "Failed to save");
      }
    } catch (err) {
      console.error("Error saving disease:", err);
  
      // Log the full error response if available
      if (axios.isAxiosError(err)) {
        console.error("Axios Error Response:", err.response?.data);
      }
  
      toast.update(toastId, {
        render: err instanceof Error ? err.message : "An unexpected error occurred.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="flex ml-9 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className=" p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h5" fontWeight="bold">
              Disease Information
            </Typography>
            {(role === "admin" || role === "doctor") && (
              <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
                New Disease +
              </Button>
            )}
          </div>
          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="error">
                {error}
              </Typography>
            </Box>
          )}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Disease</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diseaseInfo.length > 0 ? (
                  diseaseInfo.map((info) => (
                    <TableRow key={info._id}>
                      <TableCell>{info.disease}</TableCell>
                      <TableCell>{new Date(info.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          onClick={() => {
                            setSelectedDisease(info);
                            setDiseaseInput(info.disease);
                            setModalOpen(true);
                          }}
                          startIcon={<EditOutlined />}
                          color="primary"
                        >
                   
                        </Button>
                        <Button
                          onClick={() => handleDelete(info._id)}
                          startIcon={<DeleteOutlined />}
                          color="error"
                        >
                      
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No disease information available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Add/Edit Disease Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
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
              {selectedDisease ? "Edit Disease" : "Add Disease"}
            </Typography>
            <TextField
              fullWidth
              label="Disease"
              placeholder="Enter disease name"
              value={diseaseInput}
              onChange={(e) => setDiseaseInput(e.target.value)}
              margin="normal"
              variant="outlined"
            />
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

export default DiseasePage;