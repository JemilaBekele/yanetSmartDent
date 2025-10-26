import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Creadit, CreaditItem, Service } from "@/types/creadit"; // Adjust the path accordingly
import {
  Modal,
  Box,
  Typography,
 
 
 

} from "@mui/material";
interface CreaditEditModalProps {
  visible: boolean;
  onClose: () => void;
  credit: Creadit | null;
  patientId: string; // Ensure you pass patientId to this component
  onSave: (updatedCredit: Partial<Creadit>) => void;
}

const CreaditEditModal: React.FC<CreaditEditModalProps> = ({
  visible,
  onClose,
  credit,
  patientId,
  onSave,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [items, setItems] = useState<CreaditItem[]>([]);

  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [currentPayment, setcurrentPayment] = useState<number>(0); // Add currentPaymentAmount to track the new payment
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
    if (credit) {
      const initializedItems = credit.items.map((item) => ({
        ...item,
        service: item.service || { _id: "", service: "", price: 0 },
      }));
      setItems(initializedItems);
      setTotalAmount(credit.totalAmount || 0);
      setcurrentPayment(credit.currentPayment.amount || 0);
      setTotalPaid(credit.totalPaid || 0);
      setBalance(credit.balance || 0);
      setStatus(credit.status);
    }
  }, [credit]);

   // Add calculateTotal to the dependency array
   const calculateTotal = useCallback((updatedItems: CreaditItem[]) => { // Use useCallback
    const total = updatedItems.reduce((acc, item) => acc + item.totalPrice, 0);
    setTotalAmount(total);
    const newBalance = total - totalPaid;
    setBalance(!isNaN(newBalance) ? newBalance : 0);
  }, [totalPaid]); // Add totalPaid as dependency
 
  useEffect(() => {
    calculateTotal(items);
  }, [items, calculateTotal]);

  const handleServiceChange = (index: number, serviceId: string) => {
    const selectedService = services.find((service) => service._id === serviceId || service.id === serviceId);
    if (selectedService) {
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        service: {
          id: selectedService.id || selectedService._id || "", // Assign `id` or `_id`
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
    } else if (name === "description") {
      updatedItems[index].description = value; // Update description
    }

    // Update totalPrice for the current item
    updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].price;

    setItems(updatedItems);
    calculateTotal(updatedItems);
  };
  const handleNowPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newCurrentPayment = Number(e.target.value);
    
    if (newCurrentPayment + totalPaid > totalAmount) {
      alert("The total paid amount cannot exceed the total amount.");
      newCurrentPayment = totalAmount - totalPaid; // Adjust to maximum allowed
    }

    setcurrentPayment(newCurrentPayment);
  };
 

  const handleSave = async () => {
    if (!credit) {
      console.error("No credit to save.");
      return;
    }

    const updatedCredit = {
      creaditId: credit._id,
      items,
      totalAmount,
      totalPaid: totalPaid ,
      currentPayment: {
        amount: currentPayment || 0, // Ensure currentPayment.amount is always provided
        date: new Date(), // Set to the current date
        confirm: currentPayment > 0 ? false : credit.currentPayment.confirm, // Set to false if payment > 0, otherwise keep existing
        receipt: true, // Always set to true
      },
      balance: balance || 0, // Ensure balance is always a number
      status,
    };

    try {
      const response = await fetch(`/api/Creadit/payment/detail/${credit._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCredit),
      });

      const result = await response.json();
      if (response.ok) {
        onSave(result.credit);
      } else {
        console.error("Failed to update credit:", result.error);
        alert(result.error || "Failed to update credit");
      }
    } catch (error) {
      console.error("Error updating credit:", error);
      alert("An error occurred while updating the credit.");
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
    bgcolor: "background.paper",
   
    boxShadow: 24,
    maxHeight: "80vh", // Limit the height of the modal
    overflowY: "auto", // Enable vertical scrolling
    p: 4,
    borderRadius: 2,
  };
  return (
       <Modal open={visible} onClose={onClose}>
       <Box sx={style}>
         <Typography variant="h6">Edit Credit</Typography>
       
      
        <div className="flex justify-between mb-4 mt-4">
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
                      value={item.description}
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
                value={totalPaid}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
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
                value={currentPayment}
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

export default CreaditEditModal;