"use client";

import { useState, useEffect } from "react";
import { EyeOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import DataTable from "@/app/components/ui/TableComponent";
import { Modal, Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import axios from "axios";
import AddServiceModal from "./add";

interface Service {
  _id: string;
  service: string;
  categoryId: { _id: string; name: string };
  price: number;
  organizationid: { _id: string; organization: string };
}

interface DataRow {
  organizationId: string;
  id: number;
  ID: string;
  service: string;
  categoryName: string;
  price: number;
  organizationName: string;
}

const CreServicesPage: React.FC = () => {
  const [rows, setRows] = useState<DataRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<DataRow[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [organizations, setOrganizations] = useState<{ _id: string; organization: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [currentService, setCurrentService] = useState<DataRow | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get("/api/Creditorgserv");
        const data: Service[] = response.data;
        if (data.length === 0) return;

        const formattedData = data.map((service, index) => ({
          id: index + 1,
          ID: service._id,
          service: service.service,
          categoryName: service.categoryId?.name || "Unknown",
          price: service.price,
          organizationName: service.organizationid?.organization || "Unknown",
          organizationId: service.organizationid?._id || "",
        }));

        setRows(formattedData);
        setFilteredRows(formattedData);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/Category");
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchOrganizations = async () => {
      try {
        const response = await axios.get("/api/app/org");
        setOrganizations(response.data.data);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchServices();
    fetchCategories();
    fetchOrganizations();
  }, []);

  const handleOpenEditModal = (service: DataRow) => {
    setCurrentService(service);
    setOpenEditModal(true);
  };

  const handleEditService = async (updatedService: DataRow) => {
    try {
      await axios.put(`/api/Creditorgserv/${updatedService.ID}`, updatedService);
      setRows((prevRows) => prevRows.map((row) => (row.ID === updatedService.ID ? updatedService : row)));
      setOpenEditModal(false);
    } catch (error) {
      console.error("Error editing service:", error);
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
    p: 4,
    borderRadius: 2,
  };

  return (
    <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Services List</h1>
      <DataTable
        data={filteredRows}
        columns={[{ header: "Service Name", key: "service", render: (row) => row.service }]}
        caption="List of Services"
        actions={(row: DataRow) => (
          <div className="flex gap-2">
            <button onClick={() => handleOpenEditModal(row)}><EditOutlined className="text-yellow-500" /></button>
          </div>
        )}
      />
      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <Box sx={style}>
          <Typography variant="h6" gutterBottom>Edit Service</Typography>
          <form onSubmit={(e) => { e.preventDefault(); if (currentService) handleEditService(currentService); }}>
            <TextField label="Service Name" value={currentService?.service || ""} onChange={(e) => setCurrentService((prev) => prev ? { ...prev, service: e.target.value } : null)} fullWidth required margin="normal" />
            <TextField label="Price" type="number" value={currentService?.price || ""} onChange={(e) => setCurrentService((prev) => prev ? { ...prev, price: parseFloat(e.target.value) } : null)} fullWidth required margin="normal" />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select value={currentService?.categoryName || ""} onChange={(e) => setCurrentService((prev) => prev ? { ...prev, categoryName: e.target.value } : null)}>
                {categories.map((cat) => <MenuItem key={cat._id} value={cat.name}>{cat.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Organization</InputLabel>
              <Select
  value={currentService?.organizationName || ""}
  onChange={(e) =>
    setCurrentService((prev) =>
      prev ? { ...prev, organizationName: e.target.value } : null
    )
  }
>
  {organizations.map((org) => (
    <MenuItem key={org._id} value={org.organization} style={{ color: 'black' }}>
      {org.organization}
    </MenuItem>
  ))}
</Select>


            </FormControl>
            <div className="flex justify-end mt-4">
              <Button variant="outlined" onClick={() => setOpenEditModal(false)} sx={{ mr: 2 }}>Cancel</Button>
              <Button variant="contained" type="submit">Save Changes</Button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default CreServicesPage;
