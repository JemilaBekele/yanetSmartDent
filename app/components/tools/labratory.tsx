"use client";
import React from "react";
import SideNavbar from "./sidebar";
import {  UserOutlined,ProjectOutlined,SolutionOutlined,FormOutlined,FundOutlined ,BuildOutlined ,TeamOutlined, ContainerOutlined} from '@ant-design/icons';

const items = [
  { label: "Dashboard", icon: <ProjectOutlined/>, link: "/labratory" },
        { label: "Company Profile", icon: <ContainerOutlined/>, link: "/labratory/CompanyProfile" },
  { label: "Finished Laboratory", icon: <SolutionOutlined />, link: "/labratory/finishedlab" },
  { label: "Profile", icon: <UserOutlined />, link: "/labratory/profile" },
];

const Labpage: React.FC = () => {
  return (
    <div>
      <SideNavbar items={items} />
      {/* Other page content */}
    </div>
  );
};

export default Labpage;
