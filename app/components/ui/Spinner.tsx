import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-ping w-16 h-16 rounded-full bg-sky-500"></div>
    </div>
  );
};

export default Spinner;
