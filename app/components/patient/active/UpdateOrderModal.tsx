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
} from "@mui/material";

interface OrderUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

type Doctor = {
  _id: string;
  username: string;
};

const OrderUpdateModal: React.FC<OrderUpdateModalProps> = ({ isOpen, onClose, orderId }) => {
  const [status, setStatus] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch order details when the modal opens
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
        setSelectedDoctor(
          assignedDoctor ? { _id: assignedDoctor.id, username: assignedDoctor.username } : null
        );
      } catch (err) {
        setError("Error fetching order data");
      } finally {
        setFetching(false);
      }
    };

    const fetchDoctors = async () => {
      try {
        const response = await fetch("/api/patient/doctor/both");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch doctors");
        }
        setDoctors(data);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Error fetching doctors");
      }
    };

    if (isOpen) {
      fetchOrder();
      fetchDoctors();
    }
  }, [isOpen, orderId]);

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    if (!selectedDoctor) {
      setError("Please select a doctor before updating the order.");
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
            id: selectedDoctor._id,
            username: selectedDoctor.username,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update order");
      }
      setMessage({ text: "Order updated successfully!", type: "success" });
      onClose(); // Close the modal
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
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Update Order Status
        </Typography>

        {fetching ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
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

            <FormControl fullWidth margin="normal">
              <InputLabel>Assign Doctor</InputLabel>
              <Select
                value={selectedDoctor?._id || ""}
                onChange={(e) => {
                  const selectedId = e.target.value as string;
                  const doctor = doctors.find((doctor) => doctor._id === selectedId);
                  setSelectedDoctor(doctor || null);
                }}
                label="Assign Doctor"
              >
                <MenuItem value="">Select a doctor</MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor._id} value={doctor._id}>
                    {doctor.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button onClick={onClose} color="secondary" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            color="primary"
            variant="contained"
            disabled={loading || fetching}
            sx={{ ml: 1 }}
          >
            {loading ? "Updating..." : "Update"}
          </Button>
        </Box>

        {message && (
          <Alert severity={message.type === "success" ? "success" : "error"} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}
      </Box>
    </Modal>
  );
};

export default OrderUpdateModal;