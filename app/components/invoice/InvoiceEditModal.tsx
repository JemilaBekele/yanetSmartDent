import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import {
  Modal,
  Box,
  Typography,

} from "@mui/material";
import { Invoice, InvoiceItem, Service } from "@/types/invotwo"; // Adjust path accordingly

interface InvoiceEditModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  patientId: string;
  onSave: (updatedInvoice: Partial<Invoice>) => void;
}

const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  visible,
  onClose,
  invoice,
  patientId,
  onSave,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [currentpayment, setCurrentPayment] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalpaid, setTotalPaid] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [showPart1, setShowPart1] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/Invoice/Service");
        if (response.ok) {
          setServices(await response.json());
        }
      } catch (error) {
        console.error("Failed to fetch services", error);
      }
    };

    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patient/registerdata/${patientId}`);
        if (response.ok) {
          await response.json();
        }
      } catch (error) {
        console.error("Failed to fetch patient details", error);
      }
    };

    fetchServices();
    fetchPatient();
  }, [patientId]);

  useEffect(() => {
    if (invoice) {
      const initializedItems = invoice.items.map((item) => ({
        ...item,
        service: item.service || { _id: "", service: "", price: 0 },
      }));
      setItems(initializedItems);
      setTotalAmount(invoice.totalAmount);
      setCurrentPayment(invoice.currentpayment.amount);
      setTotalPaid(invoice.totalpaid);
      setBalance(invoice.balance);
      setStatus(invoice.status);
    }
  }, [invoice]);

  useEffect(() => {
    calculateTotal(items);
  }, [items]);

  const calculateTotal = (updatedItems: InvoiceItem[]) => {
    const total = updatedItems.reduce((acc, item) => acc + item.totalPrice, 0);
    setTotalAmount(total);
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const selectedService = services.find((service) => service._id === serviceId);
    if (selectedService) {
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        service: {
          _id: selectedService._id,
          service: selectedService.service,
          price: selectedService.price || 0,
          
        },
        totalPrice: updatedItems[index].quantity * (selectedService.price || 0),
      };
      setItems(updatedItems);
      calculateTotal(updatedItems);
    } else {
      console.error(`Service with ID ${serviceId} not found`);
    }
  };

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedItems = [...items];
    const { name, value } = e.target;

    if (name === "quantity") {
      updatedItems[index].quantity = Number(value);
    } else if (name === "price") {
      updatedItems[index].price = Number(value);
    }else if (name === "description") {
      updatedItems[index].description = value; // Update description
    }

    // Update totalPrice for the current item
    updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].price;

    setItems(updatedItems);
    calculateTotal(updatedItems);
  };

  const handleNowPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newCurrentPayment = Number(e.target.value);
    
    if (newCurrentPayment + totalpaid > totalAmount) {
      alert("The total paid amount cannot exceed the total amount.");
      newCurrentPayment = totalAmount - totalpaid; // Adjust to maximum allowed
    }

    setCurrentPayment(newCurrentPayment);
  };

  const handleSave = async () => {
    if (!invoice) {
      console.error("No invoice to save.");
      return;
    }
  
    const updatedInvoice = {
      InvoiceId: invoice._id,
      items,
      totalAmount,
      totalpaid: totalpaid ,
      currentpayment: {
        amount: currentpayment,
        date: new Date(), // Set to the current date
        confirm: currentpayment > 0 ? false : invoice.currentpayment.confirm, // Set to false if payment > 0, otherwise keep existing
      receipt: currentpayment > 0 ? false : invoice.currentpayment.receipt, // Always set to false
      },
      status,
    };
  
    try {
      const response = await fetch(`/api/Invoice/payment/detail/${invoice._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedInvoice),
      });
  
      const result = await response.json();
      if (response.ok) {
        onSave(result.invoice);
      } else {
        console.error("Failed to update invoice:", result.error);
        alert(result.error || "Failed to update invoice");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("An error occurred while updating the invoice.");
    }
  
    onClose();
  };
  

  if (!visible) return null;
  const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "#fff",
   

    maxHeight: "80vh", // Limit the height of the modal
    overflowY: "auto", // Enable vertical scrolling
    p: 4,
    borderRadius: 2,
  };
  return (
    <Modal
    open={visible}
    onClose={onClose}
    slotProps={{
      backdrop: {
        sx: {
          backgroundColor: "rgba(165, 165, 165, 0.1)", // Lighter backdrop
        },
      },
    }}
  >
  

    <Box sx={style}>
      {/* Modal content */}
  
      <Typography variant="h6">Edit Invoice</Typography>
    
   
        <div className="flex justify-between mb-4">
          <Button onClick={() => setShowPart1(true)} variant={showPart1 ? "default" : "outline"}>
            Part 1
          </Button>
          <Button onClick={() => setShowPart1(false)} variant={!showPart1 ? "default" : "outline"}>
            Part 2
          </Button>
        </div>

        {/* Part 1 */}
        {showPart1 && (
          <div className="overflow-y-auto h-72">
            <form className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service</label>
                    <select
                      value={item.service.service || ""}
                      onChange={(e) => handleServiceChange(index, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      aria-label="Select payment status" 
                     
                    >
                      <option value="">{item.service.service || "Select"}</option>
                      {services.map((service) => (
                        <option key={service._id} value={service._id}>
                          {service.service}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
  type="text"
  name="description"
  value={item.description} // Ensure it references item.description
  onChange={(e) => handleInputChange(index, e)}
  className="w-full p-2 border border-gray-300 rounded-md"
/>

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleInputChange(index, e)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                    <input
                      type="number"
                      name="price"
                      value={item.price}
                      onChange={(e) => handleInputChange(index, e)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <span>{item.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </form>
          </div>
        )}

        {/* Part 2 */}
        {!showPart1 && (
          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Paid</label>
              <input
                type="number"
                value={totalpaid}
                onChange={(e) => setTotalPaid(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Amount</label>
              <input
                type="number"
                value={totalAmount}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Payment</label>
              <input
                type="number"
                value={currentpayment}
                onChange={handleNowPaidChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Balance</label>
              <input
                type="number"
                value={balance}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <input
                type="text"
                value={status}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={onClose} className="ml-2">
            Cancel
          </Button>
        </div>
     </Box>
    </Modal>
  );
};

export default InvoiceEditModal;