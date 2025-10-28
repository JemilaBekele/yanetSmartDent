"use client";
import React from "react";
import SideNavbar from "./sidebar";
import {  UserOutlined,ProjectOutlined,SolutionOutlined ,TeamOutlined, ContainerOutlined} from '@ant-design/icons';

const items = [
  { label: "Dashboard", icon: <ProjectOutlined/>, link: "/nurse" },
          { label: "Company Profile", icon: <ContainerOutlined/>, link: "/nurse/CompanyProfile" },
  { label: "My orders", icon: <TeamOutlined />, link: "/nurse/myorder" },

  { label: "ALL Active Orders", icon: <SolutionOutlined />, link: "/nurse/activeorder" },
  { label: "Appointment", icon: <SolutionOutlined />, link: "/nurse/listappoint" },
  { label: "Filter Patient", icon: <SolutionOutlined />, link: "/nurse/filterpatient" },
  { label: "Patients", icon: <TeamOutlined />, link: "/nurse/client/all" },
  { label: "Profile", icon: <UserOutlined />, link: "/nurse/profile" },
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
