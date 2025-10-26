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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

interface Branch {
  _id: string;
  name: string;
  location: string | null;
  phone: string | null;
  manager: {
    _id: string;
    name: string;
    email: string;
    username: string;
  } | null;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
}

const BranchPage: React.FC = () => {
  const { data: session } = useSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [locationInput, setLocationInput] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [managerInput, setManagerInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const role = useMemo(() => session?.user?.role || "", [session]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/Branch");
      if (response.status === 200) {
        setBranches(response.data);
        setError(null);
      } else {
        setError("Error fetching branches");
      }
    } catch (err) {
      setError("Error fetching branches");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users"); // Adjust this endpoint to match your users API
      if (response.status === 200) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;

    const updatedBranches = branches.filter((branch) => branch._id !== id);
    setBranches(updatedBranches);

    const toastId = toast.loading("Deleting branch...");
    try {
      const response = await axios.delete(`/api/Branch/${id}`);
      if (response.status === 200) {
        toast.update(toastId, {
          render: "Branch deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        // Refresh branches after successful deletion
        fetchBranches();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      setBranches(branches); // Revert to original branches
      toast.update(toastId, {
        render: "Error deleting branch",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!nameInput.trim()) {
      toast.error("Branch name cannot be empty.");
      return;
    }

    const toastId = toast.loading(selectedBranch ? "Updating branch..." : "Adding branch...");
    try {
      let response;
      const payload = { 
        name: nameInput, 
        location: locationInput || null, 
        phone: phoneInput || null, 
        manager: managerInput || null 
      };

      if (selectedBranch) {
        response = await axios.patch(`/api/Branch/${selectedBranch._id}`, payload);
      } else {
        response = await axios.post("/api/Branch", payload);
      }

      // Accept both 200 and 201 status codes
      if (response.status === 200 || response.status === 201) {
        toast.update(toastId, {
          render: selectedBranch ? "Branch updated successfully!" : "Branch added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        // Refresh branches after successful create/update
        await fetchBranches();
        
        setModalOpen(false);
        setSelectedBranch(null);
        setNameInput("");
        setLocationInput("");
        setPhoneInput("");
        setManagerInput("");
      } else {
        throw new Error("Failed to save branch");
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
    setSelectedBranch(null);
    setNameInput("");
    setLocationInput("");
    setPhoneInput("");
    setManagerInput("");
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setNameInput(branch.name);
    setLocationInput(branch.location || "");
    setPhoneInput(branch.phone || "");
    setManagerInput(branch.manager?._id || "");
    setModalOpen(true);
  };

  return (
    <div className="flex ml-9 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h5" fontWeight="bold">
              Branches
            </Typography>
            {(role === "admin" || role === "manager") && (
              <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
                New Branch +
              </Button>
            )}
          </div>

          {error && <Typography color="error">{error}</Typography>}
          {loading && <Typography>Loading branches...</Typography>}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Date Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.length > 0 ? (
                  branches.map((branch) => (
                    <TableRow key={branch._id}>
                      <TableCell>{branch.name}</TableCell>
                      <TableCell>{branch.location || "-"}</TableCell>
                      <TableCell>{branch.phone || "-"}</TableCell>
                      <TableCell>{branch.manager?.name || "No manager"}</TableCell>
                      <TableCell>{new Date(branch.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          onClick={() => handleEdit(branch)}
                          startIcon={<EditOutlined />}
                          color="primary"
                        />
                        <Button 
                          onClick={() => handleDelete(branch._id)} 
                          startIcon={<DeleteOutlined />} 
                          color="error" 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {loading ? "Loading..." : "No branches available."}
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
            maxWidth: "500px",
            bgcolor: "background.paper", 
            boxShadow: 24, 
            p: 4, 
            borderRadius: 2 
          }}>
            <Typography variant="h5" gutterBottom>
              {selectedBranch ? "Edit Branch" : "Add Branch"}
            </Typography>
            <TextField 
              fullWidth 
              label="Branch Name" 
              value={nameInput} 
              onChange={(e) => setNameInput(e.target.value)} 
              margin="normal" 
              variant="outlined" 
              required
            />
            <TextField 
              fullWidth 
              label="Location" 
              value={locationInput} 
              onChange={(e) => setLocationInput(e.target.value)} 
              margin="normal" 
              variant="outlined" 
              placeholder="e.g., Main Street, Downtown"
            />
            <TextField 
              fullWidth 
              label="Phone Number" 
              value={phoneInput} 
              onChange={(e) => setPhoneInput(e.target.value)} 
              margin="normal" 
              variant="outlined" 
              placeholder="e.g., +1 234 567 8900"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Manager</InputLabel>
              <Select
                value={managerInput}
                label="Manager"
                onChange={(e) => setManagerInput(e.target.value)}
              >
                <MenuItem value="">
                  <em>No manager</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

export default BranchPage;