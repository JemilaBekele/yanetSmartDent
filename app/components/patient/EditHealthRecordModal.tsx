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
  Grid,
  Tabs,
  Tab,
} from "@mui/material";

// Define MedicalRecordData type
interface MedicalRecordData {
  _id: string;
  bloodgroup: string;
  weight: string;
  height: string;
  allergies: string;
  habits: string;
  Medication: string;
  Core_Temperature: string;
  Respiratory_Rate: string;
  Blood_Oxygen: string;
  Blood_Pressure: string;
  heart_Rate: string;
  Hypertension: string;
  Hypotension: string;
  Tuberculosis: string;
  Hepatitis: string;
  Diabetics: string;
  BleedingTendency: string;
  Epilepsy: string;
  Astema: string;
  description: string;
  userinfo: Array<{
    BloodPressure: boolean;
    Hypotension: boolean;
    Diabetics: boolean;
    BleedingTendency: boolean;
    Tuberculosis: boolean;
    Epilepsy: boolean;
    Hepatitis: boolean;
    Allergies: boolean;
    Asthma: boolean;
    IfAnydrugstaking: boolean;
    Pregnancy: boolean;
    IfanyotherDiseases: string;
  }>;
}

interface EditHealthRecordModalProps {
  isOpen: boolean;
  formData: MedicalRecordData | null;
  onClose: () => void;
  onUpdate: (data: MedicalRecordData) => Promise<void>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`medical-record-tabpanel-${index}`}
      aria-labelledby={`medical-record-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
}

const EditHealthRecordModal: React.FC<EditHealthRecordModalProps> = ({
  isOpen,
  formData,
  onClose,
  onUpdate,
}) => {
  const [localData, setLocalData] = useState<MedicalRecordData | null>(formData);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    setLocalData(formData);
  }, [formData]);

  if (!isOpen || !localData) return null;

  const handleChange = (field: keyof MedicalRecordData, value: string) => {
    setLocalData({ ...localData, [field]: value });
  };

  const handleUserInfoChange = (
    field: keyof MedicalRecordData["userinfo"][0],
    value: string | boolean
  ) => {
    if (localData) {
      const updatedUserInfo = [...localData.userinfo];
      if (field === "IfanyotherDiseases") {
        updatedUserInfo[0][field] = value as string;
      } else {
        updatedUserInfo[0][field] = value === "true";
      }
      setLocalData({ ...localData, userinfo: updatedUserInfo });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localData) {
      await onUpdate(localData);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: '90%',
    maxWidth: 1200,
    bgcolor: "background.paper",
    boxShadow: 24,
    maxHeight: "80vh",
    overflowY: "auto",
    p: 4,
    borderRadius: 2,
  };

  // Define vital signs fields
  const vitalSignsFields = [
    "Core_Temperature",
    "Respiratory_Rate", 
    "Blood_Oxygen",
    "Blood_Pressure",
    "heart_Rate"
  ];

  // Define other medical fields (excluding vital signs)
  const otherMedicalFields = [
    "weight",
    "height", 
    "Medication",
    "allergies",
    "habits",
    "Hypertension",
    "Hypotension",
    "Tuberculosis",
    "Astema",
    "Hepatitis",
    "Diabetics",
    "BleedingTendency",
    "Epilepsy",
    "description"
  ];

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>Edit Medical Record</Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Vital Signs" />
            <Tab label="Medical Information" />
            <Tab label="User Information" />
          </Tabs>
        </Box>

        <form onSubmit={handleSubmit}>
          {/* Vital Signs Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              {/* Blood Group */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    value={localData.bloodgroup}
                    onChange={(e) => handleChange("bloodgroup", e.target.value)}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                      <MenuItem key={group} value={group}>{group}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Vital Signs Fields */}
              {vitalSignsFields.map((field) => (
                <Grid item xs={12} sm={6} md={4} key={field}>
                  <TextField
                    fullWidth
                    label={field.replace(/_/g, " ")}
                    value={localData[field as keyof MedicalRecordData]}
                    onChange={(e) => handleChange(field as keyof MedicalRecordData, e.target.value)}
                  />
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Medical Information Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              {otherMedicalFields.map((field) => (
                <Grid item xs={12} sm={6} md={4} key={field}>
                  <TextField
                    fullWidth
                    label={field.replace(/_/g, " ")}
                    value={localData[field as keyof MedicalRecordData]}
                    onChange={(e) => handleChange(field as keyof MedicalRecordData, e.target.value)}
                  />
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* User Information Tab */}
          <TabPanel value={tabValue} index={2}>
            {localData.userinfo && localData.userinfo.length > 0 && (
              <Grid container spacing={2}>
                {Object.entries(localData.userinfo[0]).map(([key, value]) => {
                  if (key === "_id") return null;

                  if (key === "IfanyotherDiseases") {
                    return (
                      <Grid item xs={12} key={key}>
                        <TextField
                          fullWidth
                          label="If any other diseases"
                          value={value || ""}
                          onChange={(e) =>
                            handleUserInfoChange(key as "IfanyotherDiseases", e.target.value)
                          }
                          multiline
                          rows={3}
                        />
                      </Grid>
                    );
                  }

                  if (typeof value === "boolean") {
                    return (
                      <Grid item xs={12} sm={6} md={4} key={key}>
                        <FormControl fullWidth>
                          <InputLabel>
                            {key === "Tuberculosis" ? "Tuberculosis / Pneumonia" : key.replace(/([A-Z])/g, ' $1').trim()}
                          </InputLabel>
                          <Select
                            value={value ? "true" : "false"}
                            onChange={(e) =>
                              handleUserInfoChange(key as keyof MedicalRecordData["userinfo"][0], e.target.value)
                            }
                          >
                            <MenuItem value="true">True</MenuItem>
                            <MenuItem value="false">False</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    );
                  }

                  return null;
                })}
              </Grid>
            )}
          </TabPanel>

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button variant="contained" type="submit">Update</Button>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default EditHealthRecordModal;