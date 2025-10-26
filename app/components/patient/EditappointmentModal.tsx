"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

// Define AppointmentData type
interface AppointmentData {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentEndTime: string;
  reasonForVisit: string;
  status: string;
  doctorId: { id: string; username: string };
  patientId: { id: string };
}

interface EditAppointmentModalProps {
  isOpen: boolean;
  formData: AppointmentData | null;
  onClose: () => void;
  onUpdate: (data: AppointmentData) => Promise<void>;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  isOpen,
  formData,
  onClose,
  onUpdate,
}) => {
  const [localData, setLocalData] = useState<AppointmentData | null>(formData);
  const [doctors, setDoctors] = useState<{ _id: string; username: string }[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("/api/patient/doctor");
        const data = await response.json();
        if (response.ok) {
          setDoctors(data);
        }
      } catch (err) {
        console.error("An error occurred while fetching doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    setLocalData(formData);
  }, [formData]);

  if (!isOpen || !localData) return null;

  const handleChange = (field: keyof AppointmentData, value: string | { id: string; username: string }) => {
    if (field === "doctorId") {
      setLocalData({ ...localData, doctorId: value as { id: string; username: string } });
    } else {
      setLocalData({ ...localData, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localData) {
      await onUpdate(localData);
    }
  };
  const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
   
    boxShadow: 24,
    maxHeight: "80vh", // Limit the height of the modal
    overflowY: "auto", // Enable vertical scrolling
    p: 4,
    borderRadius: 2,
  };
  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6">Edit Appointment</Typography>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={localData.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <MenuItem value="Scheduled">Scheduled</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Appointment Date"
            type="date"
            value={localData.appointmentDate}
            onChange={(e) => handleChange("appointmentDate", e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Appointment Time"
            type="time"
            value={localData.appointmentTime}
            onChange={(e) => handleChange("appointmentTime", e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Appointment End Time"
            type="time"
            value={localData.appointmentEndTime}
            onChange={(e) => handleChange("appointmentEndTime", e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Reason for Visit"
            value={localData.reasonForVisit}
            onChange={(e) => handleChange("reasonForVisit", e.target.value)}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel className="mb-3 mt-3">Select Doctor</InputLabel>
            <Select
              value={localData.doctorId.id}
              onChange={(e) => {
                const selectedDoctor = doctors.find(doctor => doctor._id === e.target.value);
                if (selectedDoctor) {
                  handleChange("doctorId", { id: selectedDoctor._id, username: selectedDoctor.username });
                }
              }}
            >
              {doctors.map((doctor) => (
                <MenuItem key={doctor._id} value={doctor._id}> {doctor.username}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button variant="contained" type="submit">Update</Button>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default EditAppointmentModal;