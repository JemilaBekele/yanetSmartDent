"use client";
import React from "react";
import SideNavbar from "./sidebar";
import {  UserOutlined,ProjectOutlined,SolutionOutlined,FormOutlined,FundOutlined ,BuildOutlined ,TeamOutlined, ContainerOutlined} from '@ant-design/icons';

const items = [
  { label: "Dashboard", icon: <ProjectOutlined/>, link: "/reception" },
  { label: "CompanyProfile", icon: <ContainerOutlined/>, link: "/reception/CompanyProfile" },
  { label: "Register", icon: <FormOutlined />, link: "/reception/client/add" },
  { label: "Active Order", icon: <SolutionOutlined />, link: "/reception/activeorder" },
  { label: "Appointment", icon: <SolutionOutlined />, link: "/reception/listappoint" },
  { label: "Filter Patient", icon: <SolutionOutlined />, link: "/reception/filterpatient" },
  { label: "Patients", icon: <TeamOutlined />, link: "/reception/client/all" },
  { label: "Order", icon: <BuildOutlined />, link: "/reception/client/order" },
  { label: "Expense", icon: <FundOutlined />, link: "/reception/expense/add" },
  { label: "All Credit", icon: <FundOutlined />, link: "/reception/unconfitmcredit" },
  { label: "Invoice  Report", icon: <FundOutlined />, link: "/reception/Invoice/report" },
  { label: "Profile", icon: <UserOutlined />, link: "/reception/profile" },

];

const Recpage: React.FC = () => {
  return (
    <div>
      <SideNavbar items={items} />
      {/* Other page content */}
    </div>
  );
};

export default Recpage;
