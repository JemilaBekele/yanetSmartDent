"use client";
import React, { useState, useEffect } from "react";
import { MenuOutlined, LogoutOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from 'next/image'

type NavItem = {
  label: string;
  icon: React.ReactNode;
  link: string;
};

type SideNavbarProps = {
  items: NavItem[];
};

const SideNavbar: React.FC<SideNavbarProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  // Close mobile sidebar when resizing to larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-30 p-2 rounded-md text-gray-800 hover:bg-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white md:hidden"
      >
        <span className="sr-only">Toggle sidebar</span>
        <MenuOutlined className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Desktop Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="hidden md:fixed md:flex top-4 left-4 z-30 p-2 rounded-md text-gray-800 hover:bg-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
      >
        <span className="sr-only">{isCollapsed ? 'Expand' : 'Collapse'} sidebar</span>
        {isCollapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
      </button>

      <div
        className={`fixed top-0 left-0 h-screen bg-white z-20 border-r border-gray-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col ${
          isCollapsed ? 'w-20' : 'w-60'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <div className="flex justify-center">
            <Image 
              src="/assets/file.png"
              alt="SmartDent Logo"
              width={isCollapsed ? 40 : 100}
              height={isCollapsed ? 52 : 130}
              priority
              className="transition-all duration-200"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.map((item, index) => (
            <Link key={index} href={item.link} onClick={() => setIsOpen(false)}>
              <div className={`flex items-center gap-4 py-3 mx-2 mb-2 hover:bg-blue-400 rounded-md group cursor-pointer hover:shadow-lg transition-all duration-200 ${
                isCollapsed ? 'justify-center px-2' : 'px-4'
              }`}>
                <div className="text-xl text-gray-600 group-hover:text-white">
                  {item.icon}
                </div>
                <span className={`text-base text-gray-800 group-hover:text-white font-semibold transition-opacity duration-200 ${
                  isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'
                }`}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200">
          <div className="p-2">
            <div
              className={`flex items-center gap-4 py-3 hover:bg-blue-400 rounded-md group cursor-pointer hover:shadow-lg transition-all duration-200 ${
                isCollapsed ? 'justify-center px-2' : 'px-4'
              }`}
              onClick={handleLogout}
            >
              <LogoutOutlined className="text-xl text-gray-600 group-hover:text-white" />
              <span className={`text-base text-gray-800 group-hover:text-white font-semibold transition-opacity duration-200 ${
                isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'
              }`}>
                Logout
              </span>
            </div>
          </div>
          
          <div className={`px-2 py-3 text-center text-sm text-gray-500 border-t border-gray-200 transition-all duration-200 ${
            isCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100'
          }`}>
            Powered by <span className="font-semibold text-blue-600">SmartDent</span>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black opacity-50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default SideNavbar;