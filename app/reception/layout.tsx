import Navbar from '../components/tools/navbar'
import Recpage from '../components/tools/recpage'

import React, { ReactNode } from "react";


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

