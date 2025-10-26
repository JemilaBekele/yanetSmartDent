"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import DataTable from "@/app/components/ui/TableComponent"; 
import { Column } from "@/types/types"; 
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface InvoiceItem {
  category: string;
  service: string;
  quantity: number;
  price: number;
  description?: string;
}

interface Service {
  _id: string;
  service: string;
  price: number;
}

interface Category {
  _id: string;
  name: string;
}

interface Customer {
  id: string;
  username: string;
}

type InvoiceFormProps = {
  params: {
    id: string;
  };
};

export default function InvoiceForm({ params }: InvoiceFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const patientId = params.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<{ [key: string]: Service[] }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customerName, setCustomerName] = useState<Customer>({ id: "", username: "" });

  const [items, setItems] = useState<InvoiceItem[]>([
    { category: "", service: "", quantity: 1, price: 0, description: "" },
  ]);

  const [currentpayment, setCurrentPayment] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  const role = useMemo(() => session?.user?.role || "", [session]);

  // ✅ Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/Category");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchCategories();
  }, []);

  // ✅ Fetch services based on category
  const fetchServices = async (categoryId: string) => {
    if (!categoryId) return;
    try {
      const response = await fetch(`/api/Invoice/Service/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setServices((prev) => ({ ...prev, [categoryId]: data }));
      }
    } catch (error) {
      console.error("Failed to fetch services", error);
    }
  };

  // ✅ Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patient/registerdata/${patientId}`);
        if (response.ok) {
          const patient = await response.json();
          setCustomerName({ id: patient._id, username: patient.firstname });
        }
      } catch (error) {
        console.error("Failed to fetch patient details", error);
      }
    };

    fetchPatient();
  }, [patientId]);

  // ✅ Handle category change
  const handleCategoryChange = (index: number, categoryId: string) => {
    fetchServices(categoryId);
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], category: categoryId, service: "", price: 0 };
    setItems(updatedItems);
  };

  // ✅ Handle service change
  const handleServiceChange = (index: number, serviceId: string) => {
    const selectedService = services[items[index].category]?.find((s) => s._id === serviceId);
    if (selectedService) {
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        service: selectedService._id,
        price: selectedService.price,
      };
      setItems(updatedItems);
      calculateTotal(updatedItems);
    }
  };

  // ✅ Handle item input changes
  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedItems = [...items];
    const { name, value } = e.target;
    updatedItems[index] = { ...updatedItems[index], [name]: name === "quantity" || name === "price" ? Number(value) : value };
    setItems(updatedItems);
    calculateTotal(updatedItems);
  };

  // ✅ Add new item row
  const addItem = () => setItems([...items, { category: "", service: "", quantity: 1, price: 0, description: "" }]);

  // ✅ Calculate total amount
  const calculateTotal = (updatedItems: InvoiceItem[]) => {
    const total = updatedItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    setTotalAmount(total);
  };
  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    calculateTotal(updatedItems);
  };
  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (currentpayment > totalAmount) {
      alert("Current Payment cannot be greater than Total Amount.");
      setLoading(false);
      return;
    }

    const invoiceData = {
      items: items.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.price,
        description: item.description || "",
      })),
      customerName,
      currentpayment,
      status: "order",
      confirm: false,
    };

    try {
      const response = await fetch(`/api/Invoice/payment/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        setMessage({ text: "Invoice created successfully!", type: "success" });
        router.push(role === "admin" ? `/admin/finace/Invoice/all/${patientId}` : `/doctor/Invoice/all/${patientId}`);
      } else {
        setMessage({ text: "Failed to create the invoice.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An error occurred while submitting the invoice.", type: "error" });
    } finally {
      setLoading(false);
    }
  };


  const columns: Column<InvoiceItem>[] = [
    {
      header: "Category",
      key: "category",
      render: (item: InvoiceItem) => (
        <select
          value={item.category}
          onChange={(e) => handleCategoryChange(items.indexOf(item), e.target.value)}
          className="w-full p-2"
          aria-label="Select category"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Service",
      key: "service",
      render: (item: InvoiceItem) => (
        <select
          value={item.service}
          onChange={(e) => handleServiceChange(items.indexOf(item), e.target.value)}
          className="w-full p-2"
          aria-label="Select service"
          disabled={!item.category} // Prevents selection without choosing a category
        >
          <option value="">Select a service</option>
          {services[item.category]?.map((service) => (
            <option key={service._id} value={service._id}>
              {service.service}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Description",
      key: "description",
      render: (item: InvoiceItem) => (
        <input
          type="text"
          name="description"
          value={item.description}
          onChange={(e) => handleItemChange(items.indexOf(item), e)}
          className="w-full p-2"
        />
      ),
    },
    {
      header: "Quantity",
      key: "quantity",
      render: (item: InvoiceItem) => (
        <input
          type="number"
          name="quantity"
          value={item.quantity}
          min="1"
          onChange={(e) => handleItemChange(items.indexOf(item), e)}
          className="w-full p-2"
        />
      ),
    },
    {
      header: "Unit Price",
      key: "price",
      render: (item: InvoiceItem) => (
        <input
          type="number"
          name="price"
          min="0"
          value={item.price}
          onChange={(e) => handleItemChange(items.indexOf(item), e)}
          className="w-full p-2"
        />
      ),
    },
    {
      header: "Amount",
      key: "amount" as keyof InvoiceItem, // Cast to satisfy TypeScript
      render: (item: InvoiceItem) => <span>{item.quantity * item.price}</span>,
    },
  ];
  
  const [isManualPayment, setIsManualPayment] = useState(false);

  useEffect(() => {
    if (!isManualPayment) { 
      setCurrentPayment(totalAmount); 
    }
  }, [totalAmount, isManualPayment]);

  const handleCurrentPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPayment(Number(e.target.value));
    setIsManualPayment(true); 
  };
  return (
    <div className="flex ml-7 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="flex space-x-4">
          <div className="w-1/3">
            <PatientComponent params={params} />
          </div>
          <div className="w-auto bg-white p-6 rounded-lg shadow-md">
            <header className="text-center mb-6">
              <h1 className="text-2xl font-bold">Add Invoice</h1>
              <p className="text-gray-600 capitalize">To: {customerName.username}</p>
            </header>

            <form onSubmit={handleSubmit}>
            <DataTable
  data={items}
  columns={columns}
  caption="Invoice Items"
  actions={(item) => {
    const index = items.indexOf(item);
    return (
      <button
        type="button"
        onClick={() => handleDeleteItem(index)}
        className="text-red-500 hover:text-red-700 transition"
        aria-label="Delete invoice item"
      >
        <DeleteOutlined />
      </button>
    );
  }}
/>

              <div className="text-center mb-4">
                
                <Button type="button" onClick={addItem} variant="ghost"><PlusOutlined />  Add</Button>
              </div>

              <div className="flex space-x-6 mb-4">
                <div>
                  <label className="font-bold">Current Payment:</label>
                  <input
                    type="number"
                    value={currentpayment}
                    onChange={handleCurrentPaymentChange}
                    className="border border-gray-100 p-2 rounded w-full"
                    
                  />
                </div>
                <div>
                  <label className="font-bold">Total Amount:</label>
                  <input
                    type="number"
                    value={totalAmount}
                    readOnly
                    className="border border-gray-100 p-2 rounded w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {loading ? "Submitting..." : "Submit Invoice"}
              </button>

              {message && (
                <p className={`mt-4 text-center ${message.type === "error" ? "bg-red-200 p-2 text-red-500" : "p-2 bg-green-300 text-green-500"}`}>
                  {message.text}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
