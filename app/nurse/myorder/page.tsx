"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CodeOutlined, EditOutlined } from "@ant-design/icons";
import ReOrderUpdateModal from "@/app/components/patient/active/reception";

type Patient = {
  _id: string;
  firstname: string;
  sex: string;
  finish:boolean;
  orderId: string | null;
};

const Home: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch("/api/patient/order/orderlist");
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        console.log("Fetched Orders Data:", data);

        if (!data || !data.orders || !Array.isArray(data.orders)) {
          throw new Error("Invalid data format received: 'orders' key is missing or not an array.");
        }

        // ✅ Fix: Ensure only patients with active orders are included
        const filteredPatients = data.orders
          .filter((order: any) => order.patient && order._id) // Exclude missing patients/orders
          .map((order: any) => ({
            _id: order.patient._id, // Patient ID
            firstname: order.patient.firstname ?? "Unknown",
            sex: order.patient.sex ?? "N/A",
            finish: order.patient.finish?? "off",
            orderId: order._id, // Order ID
          }));

        if (filteredPatients.length === 0) {
          throw new Error("No patients with active orders found.");
        }

        setPatients(filteredPatients);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
    const intervalId = setInterval(fetchPatients, 20000);
    return () => clearInterval(intervalId);
  }, []);

  const handleEditOrder = (orderId: string) => {
    console.log("Editing Order ID:", orderId);
    setSelectedOrderId(orderId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <h1 className="text-xl font-bold mb-5">Patients with Active Orders</h1>
    
      
      {patients.length === 0 ? (
        <div className="text-center text-gray-500">No patients with active orders.</div>
      ) : (
        <Table>
          <TableCaption>A list of   patients with active orders.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Sex</TableHead>
                            <TableHead>Actions</TableHead>
              <TableHead>Edit Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map(({ _id, firstname, sex, orderId, finish }, index) => (
              <TableRow key={_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{firstname}</TableCell>
                <TableCell>{sex}</TableCell>
          

                <TableCell>
                  <Link href={`/nurse/medicaldata/healthinfo/all/${_id}`}>
                    <CodeOutlined className="text-2xl text-gray-600 hover:bg-slate-900 group-hover:text-white" />
                  </Link>
                </TableCell>
                <TableCell>
                  {orderId && (
                    <button
                      onClick={() => handleEditOrder(orderId)}
                      className="ml-2 text-blue-600 hover:bg-slate-500"
                      aria-label="Edit Order"
                    >
                      <EditOutlined />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {selectedOrderId && (
        <ReOrderUpdateModal isOpen={isModalOpen} onClose={closeModal} orderId={selectedOrderId} />
      )}
    </div>
  );
};

export default Home;