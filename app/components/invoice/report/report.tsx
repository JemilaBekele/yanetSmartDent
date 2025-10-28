"use client";

import { useState, useEffect } from 'react';
import DataTable from "@/app/components/ui/TableComponent";
import Modal from "@/app/components/invoice/detailinvoice";
import { EyeOutlined } from "@ant-design/icons";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button"
import axios from 'axios';
import { AlertCircle, Calendar, CreditCard, DollarSign, Download, FileText, Search, User, Users } from 'lucide-react';

interface Invoice {
  _id: string;
  Invoice: {
    id: string;
    amount: number;
    receipt: boolean;
    created: {
      username: string;
      id: string;
    };
    customerName: {
      id: {
        _id: string;
        firstname: string;
        cardno: string;
      };
    };
  };
  createdAt: string;
}

interface Card {
  _id: string;
  cardprice: number;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
  };
  patient: {
    id: {
      _id: string;
      cardno: string;
      firstname: string;
      age: string;
      sex: string;
    };
    username: string;
  };
}

interface Expense {
  _id: string;
  discription: string;
  amount: number;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
  };
}

interface Doctor {
  _id: string;
  username: string;
}

interface Branch {
  _id: string;
  name: string;
  // Add other branch properties as needed
}

const FetchInvoices = () => {
  const [id, setId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [receipt, setReceipt] = useState('true');
  const [branchId, setBranchId] = useState(''); // New state for branch filter
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); // New state for branches
  const [isReceiptVisible, setIsReceiptVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch branches
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/Branch");
      if (response.status === 200) {
        setBranches(response.data);
        setErrorMessage('');
      } else {
        setErrorMessage("Error fetching branches");
      }
    } catch (err) {
      setErrorMessage("Error fetching branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get("/api/Doctor");
        if (response.data && Array.isArray(response.data)) {
          setDoctors(response.data);
        } else {
          console.error("Invalid doctor data format");
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };

    fetchDoctors();
    fetchBranches(); // Fetch branches on component mount
  }, []);

  const handleFetchInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!id && (!startDate || !endDate)) {
      setErrorMessage('Either username or both start and end dates are required.');
      return;
    }

    try {
      const response = await fetch('/api/Invoice/payment/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id, 
          startDate, 
          endDate, 
          receipt: receipt !== '' ? receipt === 'true' : undefined,
          branchId: branchId || undefined // Include branchId in the request
        }),
      });

      const data = await response.json();
     
      if (data.success) {
        setInvoices(data.data.history || []);
        setCards(data.data.cards || []);
        setExpenses(data.data.Expenses || []);
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setErrorMessage('Failed to fetch invoices. Please try again.');
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice.Invoice.id);
    setIsModalOpen(true);
  };

  const handleToggleReceipt = () => {
    setIsReceiptVisible((prev) => !prev);
  };

  // Function to export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
  
    // Prepare invoice data
    const invoiceData = invoices.map(invoice => ({
      'Invoice ID': invoice.Invoice.id,
      'Patient Name': invoice.Invoice.customerName?.id?.firstname || 'N/A',
      'Amount': invoice.Invoice.amount.toFixed(2),
      'Created By': `Dr ${invoice.Invoice.created?.username}` || 'N/A',
      'Created At': new Date(invoice.createdAt).toLocaleDateString() || 'N/A',
    }));
  
    // Add invoice worksheet if there are invoices
    if (invoiceData.length > 0) {
      const invoiceWorksheet = XLSX.utils.json_to_sheet(invoiceData);
      XLSX.utils.book_append_sheet(workbook, invoiceWorksheet, 'Invoices');
    } else {
      console.log('No invoices to export.');
    }
  
    // Write the file
    XLSX.writeFile(workbook, 'Report_invoice.xlsx');
  };
  
  const exportToExcelcard = () => {
    const workbook = XLSX.utils.book_new();
  
    // Prepare card data
    const cardData = cards.map(card => ({
      'Card ID': card._id,
      'Patient Name': card.patient.id.firstname || 'N/A',
      'Card Price': card.cardprice.toFixed(2),
      'Created By': card.createdBy.username || 'N/A',
      'Created At': new Date(card.createdAt).toLocaleDateString() || 'N/A',
    }));
  
    // Add card worksheet if there are cards
    if (cardData.length > 0) {
      const cardWorksheet = XLSX.utils.json_to_sheet(cardData);
      XLSX.utils.book_append_sheet(workbook, cardWorksheet, 'Cards');
    } else {
      console.log('No cards to export.');
    }
  
    // Write the file
    XLSX.writeFile(workbook, 'Report_card.xlsx');
  };
  
  const exportToExpense = () => {
    const workbook = XLSX.utils.book_new();
  
    // Prepare expense data
    const expenseData = expenses.map(expense => ({
      'Expense ID': expense._id,
      'Description': expense.discription || 'N/A',
      'Amount': expense.amount.toFixed(2),
      'Created By': expense.createdBy.username || 'N/A',
      'Created At': new Date(expense.createdAt).toLocaleDateString() || 'N/A',
    }));
  
    // Add expense worksheet if there are expenses
    if (expenseData.length > 0) {
      const expenseWorksheet = XLSX.utils.json_to_sheet(expenseData);
      XLSX.utils.sheet_add_aoa(expenseWorksheet, [["Expense Report"]], { origin: "A1" });
      XLSX.utils.sheet_add_json(expenseWorksheet, expenseData, { origin: "A3" });
      XLSX.utils.book_append_sheet(workbook, expenseWorksheet, 'Expenses');
    } else {
      console.log('No expenses to export.');
    }
  
    // Write the file
    XLSX.writeFile(workbook, 'Report_expense.xlsx');
  };

  const setPresetDates = (range: string) => {
    const today = new Date();
    let start = new Date();
  
    switch (range) {
      case "today":
        // Today remains today
        break;
  
      case "thisWeek":
        // Set start date to the most recent Monday (handle Sunday as 0, adjust accordingly)
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
        start.setDate(today.getDate() - daysSinceMonday);
        break;
  
      case "oneMonth":
        // Set start date to the 1st of the current month
        start.setDate(1);
        break;
  
      case "threeMonths":
        // Go back 3 months and reset to the 1st day of that month
        start.setMonth(start.getMonth() - 3);
        start.setDate(1);
        break;
  
      case "sixMonths":
        // Go back 6 months and reset to the 1st day of that month
        start.setMonth(start.getMonth() - 6);
        start.setDate(1);
        break;
  
      case "oneyear":
        // Dynamically set to January 1st of the current year
        start = new Date(today.getFullYear(), 0, 1); // January 1st of the current year
        break;
  
      default:
        return;
    }
  
    // Ensure the dates are formatted as YYYY-MM-DD
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };
  
  // Calculate totals
  const totalInvoiceAmount = invoices.reduce((total, invoice) => total + invoice.Invoice.amount, 0).toFixed(2);
  const totalCardPrice = cards.reduce((total, card) => total + card.cardprice, 0).toFixed(2);
  const totalexpenses = expenses.reduce((total, expenses) => total + expenses.amount, 0).toFixed(2);
  const grandTotal = (parseFloat(totalInvoiceAmount) + parseFloat(totalCardPrice) - parseFloat(totalexpenses)).toFixed(2);

  // Define columns for the Invoice DataTable
  const invoiceColumns = [
    {
      header: "Customer",
      key: "customerName.id.firstname" as keyof Invoice,
      render: (invoice: Invoice) =>
        invoice?.Invoice?.customerName?.id?.firstname || 'N/A',
    },
    {
      header: "Amount",
      key: "amount" as keyof Invoice,
      render: (invoice: Invoice) => invoice.Invoice.amount ? `${invoice.Invoice.amount.toFixed(2)}` : '0.00',
    },
    {
      header: "Created By",
      key: "created.username" as keyof Invoice,
      render: (invoice: Invoice) => `${invoice.Invoice.created?.username}` || 'N/A',
    },
    {
      header: "Created At",
      key: "createdAt" as keyof Invoice,
      render: (invoice: Invoice) => new Date(invoice.createdAt).toLocaleDateString() || 'N/A',
    },
    {
      header: "Action",
      key: "action" as keyof Invoice,
      render: (invoice: Invoice) => (
        <button aria-label="view detail" className="text-blue-600 hover:underline hover:bg-blue-200" onClick={() => handleViewInvoice(invoice)}>
          <EyeOutlined className="text-xl text-blue-500" />
        </button>
      ),
    },
  ];

  // Define columns for the Card DataTable
 const cardColumns = [
  {
    header: "Patient Name",
    key: "patient" as keyof Card,
    render: (card: Card) => card.patient?.id?.firstname || 'N/A',
  },
  {
    header: "Card Price",
    key: "cardprice" as keyof Card,
    render: (card: Card) => `${(card.cardprice || 0).toFixed(2)}`,
  },
  {
    header: "Created By",
    key: "createdBy" as keyof Card,
    render: (card: Card) => card.createdBy?.username || 'N/A',
  },
  {
    header: "Created At",
    key: "createdAt" as keyof Card,
    render: (card: Card) => card.createdAt ? new Date(card.createdAt).toLocaleDateString() : 'N/A',
  },
];

  const expensesColumns = [
    {
      header: "Discription",
      key: "discription" as keyof Expense,
      render: (expense: Expense) => expense.discription || 'N/A',
    },
    {
      header: "Amount",
      key: "amount" as keyof Expense,
      render: (expense: Expense) => `${expense.amount.toFixed(2)}`,
    },
    {
      header: "Created By",
      key: "createdBy.username" as keyof Expense,
      render: (expense: Expense) => expense.createdBy.username || 'N/A',
    },
    {
      header: "Created At",
      key: "createdAt" as keyof Expense,
      render: (expense: Expense) => new Date(expense.createdAt).toLocaleDateString() || 'N/A',
    },
  ];

  return (
  <div className="flex flex-col lg:ml-7 mt-4 lg:mt-7 px-4 lg:px-0">
    <div className="flex-grow lg:ml-60 container mx-auto">
      <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Invoice Report</h1>
          <p className="text-gray-600">Generate detailed financial reports across branches and doctors</p>
        </div>

        {/* Filters Section */}
        <form onSubmit={handleFetchInvoices} className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Branch Filter */}
            <div className="space-y-2">
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                <Users className="inline w-4 h-4 mr-2" />
                Branch
              </label>
              <select
                id="branch"
                name="branch"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.name}</option>
                ))}
              </select>
            </div>

            {/* Doctor Filter */}
            <div className="space-y-2">
              <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                <User className="inline w-4 h-4 mr-2" />
                Doctor
              </label>
              <select
                id="doctor"
                name="doctor"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={id}
                onChange={(e) => setId(e.target.value)}
              >
                <option value="">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>{doctor.username}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                <Calendar className="inline w-4 h-4 mr-2" />
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                <Calendar className="inline w-4 h-4 mr-2" />
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Date Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Date Range
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'today', label: 'Today' },
                { key: 'thisWeek', label: 'This Week' },
                { key: 'oneMonth', label: '1 Month' },
                { key: 'threeMonths', label: '3 Months' },
                { key: 'sixMonths', label: '6 Months' },
                { key: 'oneyear', label: '1 Year' }
              ].map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setPresetDates(preset.key)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Receipt Status Toggle */}
        

          {/* Action Button */}
          <div className="flex justify-center">
            <button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Generate Report
            </button>
          </div>
        </form>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {errorMessage}
            </p>
          </div>
        )}

        {/* Results Section */}
        {(invoices.length > 0 || cards.length > 0 || expenses.length > 0) && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {invoices.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-blue-600 text-sm font-medium">Total Invoices</div>
                  <div className="text-2xl font-bold text-blue-700">{invoices.length}</div>
                  <div className="text-blue-600 font-medium">Amount: {totalInvoiceAmount}</div>
                </div>
              )}
              {cards.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-green-600 text-sm font-medium">Total Cards</div>
                  <div className="text-2xl font-bold text-green-700">{cards.length}</div>
                  <div className="text-green-600 font-medium">Amount: {totalCardPrice}</div>
                </div>
              )}
              {expenses.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-orange-600 text-sm font-medium">Total Expenses</div>
                  <div className="text-2xl font-bold text-orange-700">{expenses.length}</div>
                  <div className="text-orange-600 font-medium">Amount: {totalexpenses}</div>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="bg-gradient-to-r from-purple-400 to-blue-200 p-6 rounded-lg text-white text-center">
              <div className="text-lg font-medium mb-2">Grand Total</div>
              <div className="text-3xl font-bold">{grandTotal}</div>
            </div>

            {/* Data Tables */}
            {invoices.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoices
                </h2>
                <DataTable data={invoices} columns={invoiceColumns} />
              </div>
            )}

            {cards.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Cards
                </h2>
                <DataTable data={cards} columns={cardColumns} />
              </div>
            )}

            {expenses.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Expenses
                </h2>
                <DataTable data={expenses} columns={expensesColumns} />
              </div>
            )}

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-gray-200">
              {invoices.length > 0 && (
                <Button 
                  onClick={exportToExcel} 
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Invoices
                </Button>
              )}
              {cards.length > 0 && (
                <Button 
                  onClick={exportToExcelcard} 
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Cards
                </Button>
              )}
              {expenses.length > 0 && (
                <Button 
                  onClick={exportToExpense} 
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Expenses
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {invoices.length === 0 && cards.length === 0 && expenses.length === 0 && !errorMessage && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Report Generated</h3>
            <p className="text-gray-500">Select your filters and click "Generate Report" to view data</p>
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} invoiceId={selectedInvoiceId} />
      </div>
    </div>
  </div>
);
};

export default FetchInvoices;