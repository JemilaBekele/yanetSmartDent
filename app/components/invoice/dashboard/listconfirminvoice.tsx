import { useState, useEffect } from "react"; 
import { Table, TableCaption, TableHead, TableHeader, TableBody, TableCell, TableRow } from "@/components/ui/table";
import PaymentModal from "./PaymentModal"; // Import the modal component

interface Invoice {
  _id: string;
  customerName: {
    username: string;
    cardno: string;
  };
  totalAmount: number;
  totalpaid: number;
  balance: number;
  currentpayment: {
    amount: number;
    date: Date;
    confirm: boolean;
    receipt: boolean;
  };
  createdBy: {
    username: string;
  };
  items: {
    service: {
      service: string;
    };
    price: number;
  }[];
}

const UnconfirmedInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number>(0);
  const [currentReceipt, setCurrentReceipt] = useState<boolean>(false);
  const [serviceDetails, setServiceDetails] = useState<{ serviceName: string; price: number }[]>([]);

  // Fetch invoices function
  const fetchUnconfirmedInvoices = async () => {
    try {
      const response = await fetch('/api/Invoice/payment/report');
      if (!response.ok) {
        throw new Error('Failed to fetch unconfirmed invoices');
      }
      const data = await response.json();
      if (data.success) {
        setInvoices(data.data);
      } else {
        setError(data.error || "Unknown error occurred");
      }
    } catch (err) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnconfirmedInvoices(); // Fetch on component mount

    // Set an interval to fetch invoices every minute
    const intervalId = setInterval(fetchUnconfirmedInvoices, 10000); // 10000 ms = 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const openModal = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice._id);
    setCurrentPaymentAmount(invoice.currentpayment.amount);
    setCurrentReceipt(invoice.currentpayment.receipt);
    setServiceDetails(
      invoice.items.map((item) => ({
        serviceName: item.service.service,
        price: item.price,
      }))
    );
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = async () => {
    try {
      const response = await fetch(`/api/Invoice/payment/comfirm/${selectedInvoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: selectedInvoiceId, currentpayment: currentPaymentAmount, receiptvalue: currentReceipt }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.message || "Failed to update invoice");
      } else {
        fetchUnconfirmedInvoices(); // Refresh invoices
        handleModalClose();
      }
    } catch (error) {
      setError("Failed to update invoice");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-5xl bg-white mx-auto p-6 ">
      <h1 className="text-2xl font-bold mb-6 text-center">Unconfirmed Invoices</h1>
      <Table>
        <TableCaption>A list of patients with Unconfirmed Invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Patient Name</TableHead>
            <TableHead>Card No</TableHead>
            <TableHead>Current Payment</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(invoices) && invoices.length > 0 ? (
            invoices.map((invoice) => (
              <TableRow key={invoice._id}>
                <TableCell>{invoice.customerName.username}</TableCell>
                <TableCell>{invoice.customerName.cardno}</TableCell>
                <TableCell>{invoice.currentpayment.amount}</TableCell>
                <TableCell>{invoice.createdBy.username}</TableCell>
                <TableCell>
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => openModal(invoice)}
                  >
                    Update
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No unconfirmed invoices found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaymentModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        currentPayment={currentPaymentAmount}
        receipt={currentReceipt}
        serviceDetails={serviceDetails} // Pass service details
        onReceiptChange={setCurrentReceipt}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default UnconfirmedInvoices;
