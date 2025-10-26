"use client";

import { useState, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { SearchOutlined } from '@ant-design/icons';
import { useRouter } from "next/navigation";
import Image from 'next/image';

const Navbar = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize session data to avoid unnecessary re-renders
  const username = useMemo(() => session?.user?.username || 'Guest', [session]);
  const role = useMemo(() => session?.user?.role || '', [session]);
  const image = useMemo(() => session?.user?.image || '/uploads/default-profile.jpg', [session]);

  // Handle loading state
  if (status === 'loading') {
    return <div>Loading...</div>; // Display loading message
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const path = `/${role}/search?search=${encodeURIComponent(searchTerm)}`;
      router.push(path);
    }
  };

  return (
    <div className="p-8 bg-gray-100 flex items-center justify-between fixed top-0 left-0 md:left-60 w-full md:w-[calc(100%-15rem)] h-16 z-10 transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-2 p-2 rounded-lg shadow-md">
        <SearchOutlined className="text-black" />
        <input
          type="text"
          placeholder="Search patients"
          className="bg-transparent border-none text-black outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch} // Trigger search on Enter
        />
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center">
          <Image
            src={image}
            alt={username}
            width={50}
            height={50}
            className="rounded-full object-cover"
          />
        </div>
        <div className="text-indigo-400 text-base font-normal capitalize p-1">
          {username}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
