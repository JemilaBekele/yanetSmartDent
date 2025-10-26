"use client"; // Mark this as a Client Component

import React, { ReactNode } from "react";
import Navbar from '../components/tools/navbar';
import SomePage from '../components/tools/somepage';
 // Importing SessionProvider

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    
      <div className="flex">
        <div className="flex-1 bg-wh-800 p-5 min-h-screen">
          {/* Navbar at the top */}
          <Navbar />

          {/* SomePage as a section below Navbar */}
          <SomePage />

          {/* Main content */}
          <div className="flex-1 ">
            {children}
          </div>
        </div>
      </div>
    
  );
};

export default Layout;
