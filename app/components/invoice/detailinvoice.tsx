import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Invoice } from "@/types/invotwo";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, invoiceId }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoiceDetails = async (invoiceId: string) => {
      if (!invoiceId) {
        console.warn("No invoiceId provided");
        return;
      }

      console.log("Fetching details for invoice ID:", invoiceId);

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/api/Invoice/payment/repodetail?invoiceId=${invoiceId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          setInvoice(response.data); // Set invoice data
        } else {
          setError(response.data.error || "Failed to fetch invoice details.");
          setInvoice(null); // Clear invoice if error occurs
        }
      } catch (err) {
        const errorMessage = axios.isAxiosError(err) && err.response
          ? err.response.data.error || "Failed to fetch invoice details. Please try again."
          : "Failed to fetch invoice details. Please try again.";
        setError(errorMessage);
        setInvoice(null); // Clear invoice if error occurs
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && invoiceId) {
      fetchInvoiceDetails(invoiceId); // Pass the invoiceId when fetching
    }
  }, [isOpen, invoiceId]);

  if (!isOpen) return null; // Don't render if modal is closed

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "text-green-500 bg-green-100";
      case "Pending":
        return "text-yellow-500 bg-yellow-100";
      case "Cancel":
        return "text-red-500 bg-red-100";
      case "Order":
        return "text-blue-500 bg-blue-100";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md h-3/4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition duration-150 hover:bg-blue-200"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold text-center mb-6">Invoice Details</h2>
        
        {loading ? (
          <div className="text-center">Loading...</div> // Loading indicator inside the HTML
        ) : error ? (
          <div className="text-red-500 mb-2">{error}</div>
        ) : (
          invoice && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <strong className="text-gray-700">Invoice ID:</strong>{' '}
                <span className="text-gray-900">{invoice._id}</span>
              </div>
              <div>
                <strong className="text-gray-700">Invoice Date:</strong>{' '}
                <span className="text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
              </div>
              <div>
                <strong className="text-gray-700">Total Amount:</strong>{' '}
                <span className="text-gray-900">{invoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-gray-600">Created By: Dr {invoice.createdBy.username}</div>
              <div>
                <strong className="text-gray-700">Status:</strong>{' '}
                <span className={`text-sm font-bold py-1 px-3 rounded ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          )
        )}

        <h3 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">Items</h3>
        <div className="overflow-y-auto h-48">
          <ul className="space-y-3">
            {invoice?.items.map((item, index) => (
              <li key={index} className="flex justify-between items-start bg-gray-100 p-3 rounded-lg shadow-sm">
                <div>
                  <div className="font-medium text-gray-800">
                    {item.service.service} (x{item.quantity})
                  </div>
                  <div className="text-gray-600">Description: {item.description}</div>
                  <div className="text-gray-600">Price per unit: {item.price.toFixed(2)}</div>
                </div>
                <span className="text-lg font-bold text-gray-800">{item.totalPrice.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Modal;
