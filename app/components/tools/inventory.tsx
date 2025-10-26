"use client";
import React from "react";
import SideNavbar from "./sidebar";
import { ContainerOutlined,  ProjectOutlined, SolutionOutlined } from '@ant-design/icons';

const items= [
  { label: "Dashboard", icon: <ProjectOutlined/>, link: "/inventory" },
 { label: "Comprehensive", icon: <ContainerOutlined/>, link: "/inventory/Comprehensive" },

 { label: "SubCategory", icon: <ContainerOutlined/>, link: "/inventory/SubCategory" },
  { label: "Product", icon: <SolutionOutlined />, link: "/inventory/Product" },
  { label: "ProductUnit", icon: <ContainerOutlined/>, link: "/inventory/productunit" },

  { label: "Purchase", icon: <ContainerOutlined/>, link: "/inventory/Purchase" },
  { label: "Inventory Request", icon: <ContainerOutlined/>, link: "/inventory/request" },
  // { label: "Stock  Holder", icon: <ContainerOutlined/>, link: "/inventory/Holder" },  
  { label: "Item Withdrawal", icon: <ContainerOutlined/>, link: "/inventory/Withdrawal" },
  { label: "Location Stock Withdrawal", icon: <ContainerOutlined/>, link: "/inventory/stockwithdrawal/LoctoLoc" },
  { label: "Location Main Withdrawal", icon: <ContainerOutlined/>, link: "/inventory/stockwithdrawal/LocMain" },

  { label: "Stock Withdrawal", icon: <ContainerOutlined/>, link: "/inventory/stockwithdrawal" },
  
  
];
const Invpage: React.FC = () => {
  return (
    <div>
      <SideNavbar items={items} />
      {/* Other page content */}
    </div>
  );
};

export default Invpage;
