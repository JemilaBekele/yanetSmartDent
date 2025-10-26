"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { useSession } from "next-auth/react";
import ReOrderUpdateModal from "./reception";

type Patient = {
  _id: string;
  firstname: string;
  sex: string;
  cardno:string
  orderId: string | null;
  assignedDoctorTo:string;
};

const ActiveOrders: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data: session } = useSession(); 
   const role = useMemo(() => session?.user?.role || '', [session]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch("/api/patient/order/orderlist/active");
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
            cardno: order.patient.cardno ?? "Unknown",
            sex: order.patient.sex ?? "N/A",
            orderId: order._id,
            assignedDoctorTo: order.assignedDoctorTo.username, // Order ID
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
    <div className="">
      <h1 className="text-2xl font-bold mb-6 text-center">Active Patient Orders</h1>
    
      
      {patients.length === 0 ? (
        <div className="text-center text-gray-500">No patients with active orders.</div>
      ) : (
        <Table>
          <TableCaption>A list of patients with active orders.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead>Card No</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Edit Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map(({ _id, firstname, sex,cardno, assignedDoctorTo,orderId }, index) => (
              <TableRow key={_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{firstname}</TableCell>
                
                <TableCell>{sex}</TableCell>
                <TableCell>{cardno}</TableCell>
                <TableCell>{assignedDoctorTo}</TableCell>
                <TableCell>
                  <Link href={`/${role}/card/all/${_id}`}>
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

export default ActiveOrders;
