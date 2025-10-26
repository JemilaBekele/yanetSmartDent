import Navbar from '../components/tools/navbar'

import React, { ReactNode } from "react";
import Recpage from '../components/tools/nurse';


interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex">

      <div className="flex-1 bg-wh-800 p-5 min-h-screen">

        <Recpage/> 
          
        <Navbar/>

        <div className="flex-1 ">
        {children}
        </div>

      </div>   

    </div>
  );
};

export default Layout;

