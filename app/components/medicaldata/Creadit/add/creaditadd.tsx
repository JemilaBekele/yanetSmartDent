import { useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import DataTable from "@/app/components/ui/TableComponent"; // Import Column type here
import { Column } from "@/types/types"; // Adjust the path as necessary
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import axios from "axios";

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

interface Organization {
  _id: string;
  organization: string;
}

interface Customer {
  id: string;
}

type InvoiceFormProps = {
  params: {
    id: string;
  };
};
type ApiOrganization = {
  _id: string;
  organization: string;
};
export default function CreditForm({ params }: InvoiceFormProps) {
  const { data: session } = useSession();

  // State for organizations, categories, and services
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<{ [key: string]: Service[] }>({});
  const [items, setItems] = useState<CreditItem[]>([{ category: "", service: "", quantity: 1, price: 0, description: "" }]);
  const [customerName, setCustomerName] = useState<Customer>({ id: "" });
  const [currentPayment, setCurrentPayment] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<ApiOrganization | null>(null);

  const router = useRouter();
  const patientId = params.id;
  const role = useMemo(() => session?.user?.role || "", [session]);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get("/api/app/org");
        console.log("Fetched organizations:", response.data);

        if (response.data && Array.isArray(response.data.data)) {
          const normalizedData = response.data.data.map((org: ApiOrganization) => ({
            _id: org._id, // Map the 'id' to '_id'
            id: org._id, // Ensure this is the correct ID field
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
    fetchOrganizations();
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

  // Fetch categories for sel
  useEffect(() => {
    console.log("Selected Organization ID:", selectedOrganization?._id ); // Debugging
    if (selectedOrganization?._id ) {
      const fetchCategories = async () => {
        try {
          const response = await fetch(`/api/Creditorgserv/${selectedOrganization?._id }`);
          if (response.ok) {
            const data = await response.json();
            console.log("Fetched categories:", data); // Debugging
            setCategories(data.map((item: any) => item.categoryId));
          } else {
            console.error("Failed to fetch categories:", response.statusText);
            setCategories([]);
          }
        } catch (error) {
          console.error('Failed to fetch categories', error);
        }
      };
      fetchCategories();
    }
  }, [selectedOrganization]);

  // Fetch services for a given category if not already loaded
  const fetchServices = async (categoryId: string) => {
    if (!categoryId || services[categoryId]) return;
    try {
      const response = await fetch(`/api/Creditorgserv/ser/${categoryId}`, {
        method: 'Post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: selectedOrganization?._id,
        }),
      });
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

  const addItem = () => setItems([...items, { category: "", service: "", quantity: 1, price: 0, description: "" }]);

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
        router.push(role === "admin" ? `/admin/creadit/all/${patientId}` : `/doctor/creadit/all/${patientId}`);
      } else {
        setMessage({ text: "Failed to create the Credit.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An error occurred while submitting the Credit.", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    console.log("Selected Organization ID:", selectedOrganization);
  }, [selectedOrganization]);
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
          {Array.from(new Set(categories.filter(cat => cat && cat.name).map(cat => cat.name)))
  .map((name, ) => {
    const cat = categories.find(cat => cat?.name === name);
    return (
      <option key={cat?._id} value={cat?._id}>
        {name}
      </option>
    );
  })}

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
              <div className="mb-6">
         <select
  value={selectedOrganization ? selectedOrganization._id : ""}
  onChange={(e) => {
    const selectedOrgId = e.target.value;
    console.log('Selected Organization ID:', selectedOrgId); // Log selected org ID
    const selectedOrg = organizations.find(org => org._id === selectedOrgId) || null;
    console.log('Found Organization:', selectedOrg); // Log found organization
    setSelectedOrganization(selectedOrg); // Set the full ApiOrganization object
  }}
  className="w-full p-2"
  aria-label="Select Organization"
>
  <option value="" disabled>Select Organization</option>
  {organizations.map((org) => (
    <option key={org._id} value={org._id}>{org.organization}</option>
  ))}
</select>



              </div>

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

              <div className="flex space-x-4 mb-4">
                <div>
                  <label className="block mb-1">Total Amount</label>
                  <input type="text" value={totalAmount} disabled className="w-full p-2 border rounded" />
                </div>

                <div>
                  <label className="block mb-1">Current Payment</label>
                  <input
                    type="number"
                    value={currentPayment}
                    onChange={handleCurrentPaymentChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {message && (
                <div className={`mb-4 text-center ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {message.text}
                </div>
              )}

              <div className="text-center">
                <Button type="submit" disabled={loading} >
                  Submit Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
