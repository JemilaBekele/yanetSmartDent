import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import axios from "axios";

interface OrderUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

type MedicalStaff = {
  _id: string;
  username: string;
  role: string;
  lead?: boolean;
  senior?: boolean;
  junior?: boolean;
  head?: boolean;
  position?: string;
};

const ReOrderUpdateModal: React.FC<OrderUpdateModalProps> = ({ isOpen, onClose, orderId }) => {
  const [status, setStatus] = useState("");
  const [medicalStaff, setMedicalStaff] = useState<MedicalStaff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<MedicalStaff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<MedicalStaff | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(''); // 'doctor' or 'nurse'
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch order details and medical staff when the modal opens
  useEffect(() => {
    const fetchOrder = async () => {
      setFetching(true);
      setError(null);
      try {
        const response = await fetch(`/api/patient/order/orderlist/active/${orderId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch order details");
        }
        setStatus(data.order.status);
        const assignedDoctor = data.order.assignedDoctorTo;
        if (assignedDoctor) {
          setSelectedStaff({ 
            _id: assignedDoctor.id, 
            username: assignedDoctor.username,
            role: assignedDoctor.role || 'doctor' // Default to doctor if role not specified
          });
          // Set the role based on the assigned staff
          setSelectedRole(assignedDoctor.role || 'doctor');
        }
      } catch (err) {
        setError("Error fetching order data");
      } finally {
        setFetching(false);
      }
    };

    const fetchMedicalStaff = async () => {
      try {
        const response = await axios.get("/api/Doctor/both");
        if (response.data && Array.isArray(response.data)) {
          setMedicalStaff(response.data);
        } else {
          console.error("Invalid medical staff data format");
        }
      } catch (err) {
        console.error("Error fetching medical staff:", err);
        setError("Error fetching medical staff");
      }
    };

    if (isOpen) {
      fetchOrder();
      fetchMedicalStaff();
    }
  }, [isOpen, orderId]);

  // Filter staff based on selected role and search
  useEffect(() => {
    let filtered = medicalStaff;
    
    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter(staff => staff.role === selectedRole);
    }
    
    // Filter by search term
    if (staffSearch) {
      filtered = filtered.filter(staff => 
        staff.username.toLowerCase().includes(staffSearch.toLowerCase()) ||
        staff.position?.toLowerCase().includes(staffSearch.toLowerCase())
      );
    }
    
    setFilteredStaff(filtered);
  }, [medicalStaff, selectedRole, staffSearch]);

  const getStaffBadge = (staff: MedicalStaff) => {
    if (staff.role === 'doctor') {
      if (staff.lead) return '👑 Lead Doctor';
      if (staff.senior) return '⭐ Senior Doctor';
      if (staff.junior) return '👨‍⚕️ Junior Doctor';
      return '👨‍⚕️ Doctor';
    } else if (staff.role === 'nurse') {
      if (staff.head) return '👩‍⚕️ Head Nurse';
      return '👩‍⚕️ Nurse';
    }
    return staff.role;
  };

  const getStaffDisplayName = (staff: MedicalStaff) => {
    const badge = getStaffBadge(staff);
    return `${staff.username} - ${badge}`;
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    if (!selectedStaff) {
      setError("Please select a medical staff before updating the order.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/patient/order/orderlist/active/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status,
          assignedDoctorTo: {
            id: selectedStaff._id,
            username: selectedStaff.username,
            role: selectedStaff.role,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update order");
      }
      setMessage({ text: "Order updated successfully!", type: "success" });
      setTimeout(() => {
        onClose(); // Close the modal after success
      }, 1500);
    } catch (err) {
      setError("Error updating order");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Update Order
        </Typography>

        {fetching ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <>
            {/* Status Selection */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            {/* Medical Staff Selection */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Staff Type</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setSelectedStaff(null);
                  setStaffSearch('');
                }}
                label="Staff Type"
              >
                <MenuItem value="">Select staff type</MenuItem>
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="nurse">Nurse</MenuItem>
              </Select>
            </FormControl>

            {selectedRole && (
              <>
                {/* Staff Search */}
                <TextField
                  fullWidth
                  margin="normal"
                  label={`Search ${selectedRole === 'doctor' ? 'Doctors' : 'Nurses'}`}
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder={`Search by name or position...`}
                />

                {/* Staff Selection */}
                <FormControl fullWidth margin="normal">
                  <InputLabel>Assign {selectedRole === 'doctor' ? 'Doctor' : 'Nurse'}</InputLabel>
                  <Select
                    value={selectedStaff?._id || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value as string;
                      const staff = filteredStaff.find((staff) => staff._id === selectedId);
                      setSelectedStaff(staff || null);
                    }}
                    label={`Assign ${selectedRole === 'doctor' ? 'Doctor' : 'Nurse'}`}
                  >
                    <MenuItem value="">Select a {selectedRole}</MenuItem>
                    {filteredStaff.map((staff) => (
                      <MenuItem key={staff._id} value={staff._id}>
                        {getStaffDisplayName(staff)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Selected Staff Preview */}
                {selectedStaff && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'primary.light', 
                    borderRadius: 1, 
                    mt: 2,
                    color: 'white'
                  }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Staff:
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {selectedStaff.username}<br />
                      <strong>Role:</strong> {getStaffBadge(selectedStaff)}<br />
                      {selectedStaff.position && (
                        <><strong>Position:</strong> {selectedStaff.position}</>
                      )}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </>
        )}

        <Box display="flex" justifyContent="flex-end" mt={3} gap={1}>
          <Button 
            onClick={onClose} 
            color="secondary" 
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            color="primary"
            variant="contained"
            disabled={loading || fetching || !selectedStaff}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Updating..." : "Update Order"}
          </Button>
        </Box>

        {message && (
          <Alert 
            severity={message.type === "success" ? "success" : "error"} 
            sx={{ mt: 2 }}
          >
            {message.text}
          </Alert>
        )}
      </Box>
    </Modal>
  );
};

export default ReOrderUpdateModal;