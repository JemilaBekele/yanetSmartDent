"use client";

import ActiveOrders from '@/app/components/patient/active/activepatient';

const UsersPage: React.FC = () => {
 

  return (
    <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
     <ActiveOrders/>
     
    </div>
  );
};

export default UsersPage;
