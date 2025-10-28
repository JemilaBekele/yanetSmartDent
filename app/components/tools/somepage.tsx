"use client";
import React from "react";
import SideNavbar from "./sidebar";
import { ContainerOutlined, UserOutlined,FundOutlined, ProjectOutlined, TeamOutlined, SolutionOutlined  } from '@ant-design/icons';

const items= [
  { label: "Dashboard", icon: <ProjectOutlined/>, link: "/admin" },
    { label: "Company Profile", icon: <ContainerOutlined/>, link: "/admin/CompanyProfile" },
      //  { label: "Procedure", icon: <FundOutlined />, link: "/admin/Procedure" },
{ label: "Branch", icon: <FundOutlined />, link: "/admin/Branch" },
  { label: "Register", icon: <SolutionOutlined />, link: "/admin/users/add" },
  { label: "Employees", icon: <TeamOutlined />, link: "/admin/users" },
  { label: "Patients", icon: <UserOutlined />, link: "/admin/Patient" },
  { label: "Branch Financial", icon: <UserOutlined />, link: "/admin/allpatient" },
  { label: "Medical Report", icon: <ContainerOutlined/>, link: "/admin/ortho" },
  { label: "Services", icon: <ContainerOutlined/>, link: "/admin/Services" },
    { label: "Expense", icon: <FundOutlined />, link: "/admin/expense/add" },
  { label: "Invoice  Report", icon: <FundOutlined />, link: "/admin/Invoice/report" },
  { label: "Statics", icon: <FundOutlined />, link: "/admin/static/serviceranck" },
   { label: "All Credit", icon: <FundOutlined />, link: "/admin/unconfitmcredit" },

  

];

const SomePage: React.FC = () => {
  return (
    <div>
      <SideNavbar items={items} />
      {/* Other page content */}
    </div>
  );
};

export default SomePage;
