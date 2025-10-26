import { Modal, Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newService: any) => void;
}
type ApiOrganization = {
    _id: string;
    organization: string;
  };
const AddServiceModal: React.FC<AddServiceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [service, setService] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>("");
  const [organizationid, setOrganizationid] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
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
      
            console.log("Fetched organizations:", response.data);
      
            if (response.data && Array.isArray(response.data.data)) {
              const normalizedData = response.data.data.map((org: ApiOrganization) => ({
                id: org._id,
                organization: org.organization,
              }));
              setOrganizations(normalizedData);
            } else {
              console.error("Unexpected API response format:", response.data);
            }
          } catch (error) {
            console.error("Error fetching organizations:", error);
          }
        };

    fetchCategories();
    fetchOrganizations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newService = { service, categoryId, price, organizationid };
      
      const response = await axios.post("/api/Creditorgserv", newService);
      onSubmit(response.data); // Callback to parent component
      onClose(); // Close modal
    } catch (error) {
      console.error("Error adding service:", error);
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

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          Add New Service
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Service Name"
            value={service}
            onChange={(e) => setService(e.target.value)
              
            }
            fullWidth
            required
            margin="normal"
            
          />
          <TextField
            label="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            fullWidth
            required
            margin="normal"
          />
          <FormControl fullWidth required margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required margin="normal">
            <InputLabel>Organization</InputLabel>
            <Select
  value={organizationid}
  onChange={(e) => setOrganizationid(e.target.value)}
  label="Organization"
>
   {/* Log the organizations array to check */}
  {organizations.map((org) => (
    <MenuItem key={org.id} value={org.id}>  {/* Ensure 'id' matches your normalized data */}
      {org.organization}
    </MenuItem>
  ))}
</Select>

          </FormControl>
          <div className="flex justify-end mt-4">
            <Button variant="outlined" onClick={onClose} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Add Service
            </Button>
          </div>
        </form>
      </Box>
    </Modal>
  );
};

export default AddServiceModal;
