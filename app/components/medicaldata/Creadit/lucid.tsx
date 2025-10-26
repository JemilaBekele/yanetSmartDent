// Import necessary modules and types
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import DataTable from "@/app/components/ui/TableComponent"; // Import Column type here
import { Column } from "@/types/types"; // Adjust the path as necessary
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

// Extend the CreditItem interface to include a category
interface CreditItem {
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
}

type InvoiceFormProps = {
  params: {
    id: string;
  };
};

export default function CreditForm({ params }: InvoiceFormProps) {
  const { data: session } = useSession();

  // State for categories and services (keyed by category id)
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<{ [key: string]: Service[] }>({});

  // Update CreditItem state to include category
  const [items, setItems] = useState<CreditItem[]>([
    { category: "", service: "", quantity: 1, price: 0, description: "" },
  ]);

  const [customerName, setCustomerName] = useState<Customer>({ id: "" });
  const [currentPayment, setCurrentPayment] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const router = useRouter();
  const patientId = params.id;
  const role = useMemo(() => session?.user?.role || "", [session]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/Category");
        if (response.ok) {
          setCategories(await response.json());
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patient/registerdata/${patientId}`);
        if (response.ok) {
          const patient = await response.json();
          setCustomerName({ id: patient._id });
        }
      } catch (error) {
        console.error("Failed to fetch patient details", error);
      }
    };

    fetchPatient();
  }, [patientId]);

  // Fetch services for a given category if not already loaded
  const fetchServices = async (categoryId: string) => {
    if (!categoryId || services[categoryId]) return;
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

  // When category is selected, update the row and fetch corresponding services
  const handleCategoryChange = (index: number, categoryId: string) => {
    fetchServices(categoryId);
    const updatedItems = [...items];
    // Reset service and price when category changes
    updatedItems[index] = { ...updatedItems[index], category: categoryId, service: "", price: 0 };
    setItems(updatedItems);
  };

  // When a service is selected, update its price from the corresponding service info
  const handleServiceChange = (index: number, serviceId: string) => {
    const categoryId = items[index].category;
    const selectedService = services[categoryId]?.find((s) => s._id === serviceId);
    if (selectedService) {
      const updatedItems = [...items];
      updatedItems[index] = { ...updatedItems[index], service: selectedService._id, price: selectedService.price };
      setItems(updatedItems);
      calculateTotal(updatedItems);
    }
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedItems = [...items];
    const { name, value } = e.target;
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: name === "quantity" || name === "price" ? Number(value) : value,
    };
    setItems(updatedItems);
    calculateTotal(updatedItems);
  };

  const addItem = () =>
    setItems([...items, { category: "", service: "", quantity: 1, price: 0, description: "" }]);

  const calculateTotal = (updatedItems: CreditItem[]) => {
    const total = updatedItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    setTotalAmount(total);
  };
  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    calculateTotal(updatedItems);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null); // Clear previous message

    if (currentPayment > totalAmount) {
      alert("Current Payment cannot be greater than Total Amount.");
      setLoading(false);
      return;
    }

    const creditData = {
      items: items.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.price,
        description: item.description || "",
      })),
      customerName,
      currentPayment: {
        amount: currentPayment,
        date: new Date(),
        confirm: false,
        receipt: true,
      },
      status: "Credit",
      createdBy: {
        userId: session?.user?.id || "",
        username: session?.user?.username || "",
      },
    };

    try {
      const response = await fetch(`/api/Creadit/payment/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creditData),
      });

      if (response.ok) {
        setMessage({ text: "Credit created successfully!", type: "success" });
        router.push(
          role === "admin" ? `/admin/creadit/all/${patientId}` : `/doctor/creadit/all/${patientId}`
        );
      } else {
        setMessage({ text: "Failed to create the Credit.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An error occurred while submitting the Credit.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Define table columns including the new Category column
  const columns: Column<CreditItem>[] = [
    {
      header: "Category",
      key: "category",
      render: (item: CreditItem) => (
        <select
          value={item.category}
          onChange={(e) => handleCategoryChange(items.indexOf(item), e.target.value)}
          className="w-full p-2"
          aria-label="Select category"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Service",
      key: "service",
      render: (item: CreditItem) => (
        <select
          value={item.service}
          onChange={(e) => handleServiceChange(items.indexOf(item), e.target.value)}
          className="w-full p-2"
          aria-label="Select service"
          disabled={!item.category} // Disable until a category is chosen
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
      render: (item: CreditItem) => (
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
      render: (item: CreditItem) => (
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
      render: (item: CreditItem) => (
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
      key: "amount" as keyof CreditItem, // Cast to satisfy TypeScript
      render: (item: CreditItem) => <span>{item.quantity * item.price}</span>,
    },
  ];

  // Manual payment state
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
              <h1 className="text-2xl font-bold">Add Credit</h1>
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
                <Button type="button" onClick={addItem} variant="ghost">
                  <PlusOutlined /> Add
                </Button>
              </div>

              <div className="flex space-x-6 mb-4">
                <div>
                  <label className="font-bold">Current Payment:</label>
                  <input
                    type="number"
                    value={currentPayment}
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
                {loading ? "Submitting..." : "Submit Credit"}
              </button>

              {message && (
                <p
                  className={`mt-4 text-center ${
                    message.type === "error"
                      ? "bg-red-200 p-2 text-red-500"
                      : "p-2 bg-green-300 text-green-500"
                  }`}
                >
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
