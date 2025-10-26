import { Modal, Box, Typography, List, ListItem, ListItemText, Button } from "@mui/material";
import { useEffect } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPayment: number;
  receipt: boolean; // Keeping the prop but not using it as input
  serviceDetails: { serviceName: string; price: number }[];
  onReceiptChange: (value: boolean) => void; // Keeping but will always set to true
  onSubmit: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  currentPayment,
  receipt, // Keeping but not using as input
  serviceDetails,
  onReceiptChange,
  onSubmit,
}) => {
  useEffect(() => {
    // Always set receipt to true when modal opens
    onReceiptChange(true);
  }, [isOpen, onReceiptChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
    onClose();
  };

  const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    maxHeight: "80vh",
    overflowY: "auto",
    p: 4,
    borderRadius: 2,
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          Confirm Payment
        </Typography>
        <div>
          <Typography variant="subtitle1" gutterBottom>
            Service Details
          </Typography>
          <List>
            {serviceDetails.map((service, index) => (
              <ListItem key={index}>
                <ListItemText primary={service.serviceName} secondary={`${service.price.toFixed(2)}`} />
              </ListItem>
            ))}
          </List>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Typography variant="body1" gutterBottom>
              Current Payment Amount: {currentPayment.toFixed(2)}
            </Typography>
          </div>
          <div className="flex justify-end">
            <Button variant="outlined" onClick={onClose} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Confirm
            </Button>
          </div>
        </form>
      </Box>
    </Modal>
  );
};

export default PaymentModal;