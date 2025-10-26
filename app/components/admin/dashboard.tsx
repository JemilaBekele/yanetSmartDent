"use client";

import { useEffect, useState } from 'react';
import {
  FieldTimeOutlined,
  CalendarOutlined,
  AuditOutlined,
  TeamOutlined
} from '@ant-design/icons';

import TotalCountBalance from './balance';
import { Piechart } from '../static/piechart';
import { Component } from '../static/chart';
import { PatientTrendChart } from '../static/patient';
import PatientAgePieChart from '../static/patientage';
import PatientGenderPieChart from '../static/patientgender';

const PatientDashboard = () => {
  const [totalPatients, setTotalPatients] = useState<number | null>(null);
  const [lastMonthPatients, setLastMonthPatients] = useState<number | null>(null);
  const [currentMonthPatients, setCurrentMonthPatients] = useState<number | null>(null);
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalPatients = async () => {
    try {
      const response = await fetch('/api/patient/count');
      const data = await response.json();
      if (response.ok) {
        setTotalPatients(data.totalPatients);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch total patients');
    }
  };

  const fetchMonthlyPatients = async () => {
    try {
      const response = await fetch('/api/patient/count/month');
      const data = await response.json();
      if (response.ok) {
        setLastMonthPatients(data.lastMonthPatients);
        setCurrentMonthPatients(data.currentMonthPatients);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch monthly patients');
    }
  };

  const fetchTotalEmployees = async () => {
    try {
      const response = await fetch('/api/register/count');
      const data = await response.json();
      if (response.ok) {
        setTotalEmployees(data.totalEmployees);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch total employees');
    }
  };

  useEffect(() => {
    fetchTotalPatients();
    fetchMonthlyPatients();
    fetchTotalEmployees();
  }, []);

  // Loading state component
  const LoadingSkeleton = () => (
    <div className="animate-pulse bg-gray-200 rounded h-8 w-16 mx-auto"></div>
  );

  // Stat Card Component for reusability
  const StatCard = ({ 
    icon, 
    title, 
    value, 
    loading, 
    iconColor = "text-blue-500",
    children 
  }: {
    icon: React.ReactNode;
    title: string;
    value: number | null;
    loading: boolean;
    iconColor?: string;
    children?: React.ReactNode;
  }) => (
    <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex flex-col items-center mb-3">
        <div className={`text-3xl sm:text-4xl ${iconColor} mb-3`}>
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h2>
      </div>
      {children || (
        <>
          {loading ? (
            <LoadingSkeleton />
          ) : value !== null ? (
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
              {new Intl.NumberFormat('en-US').format(value)}
            </p>
          ) : (
            <p className="text-red-500 text-sm">Error loading data</p>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex m-2 sm:m-4 lg:m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-2 sm:p-4">
        <div className="min-h-screen flex flex-col">
          {/* Content Area */}
          <div className="flex-1 p-4 sm:p-6 lg:p-10 bg-gray-50">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-gray-800">
              Dashboard Overview
            </h1>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 w-full mb-6 sm:mb-8">
              {/* Total Patients */}
              <StatCard
                icon={<FieldTimeOutlined />}
                title="Total Patients"
                value={totalPatients}
                loading={totalPatients === null}
                iconColor="text-blue-600"
              />

              {/* Monthly Patients */}
              <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="flex flex-col items-center mb-3">
                  <CalendarOutlined className="text-3xl sm:text-4xl text-red-600 mb-3" />
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">Monthly Patients</h2>
                </div>
                <div className="w-full flex justify-between mt-2 px-2">
                  {/* Last Month */}
                  <div className="flex flex-col items-center flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-600 mb-1">Last Month</h3>
                    {lastMonthPatients !== null ? (
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        {new Intl.NumberFormat('en-US').format(lastMonthPatients)}
                      </p>
                    ) : (
                      <LoadingSkeleton />
                    )}
                  </div>
                  
                  {/* Divider */}
                  <div className="w-px bg-gray-300 mx-2"></div>
                  
                  {/* Current Month */}
                  <div className="flex flex-col items-center flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-600 mb-1">Current Month</h3>
                    {currentMonthPatients !== null ? (
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        {new Intl.NumberFormat('en-US').format(currentMonthPatients)}
                      </p>
                    ) : (
                      <LoadingSkeleton />
                    )}
                  </div>
                </div>
              </div>

              {/* Total Balance */}
              <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <AuditOutlined className="text-3xl sm:text-4xl text-green-600 mb-3" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Total Balance</h2>
                <TotalCountBalance />
              </div>

              {/* Total Employees */}
              <StatCard
                icon={<TeamOutlined />}
                title="Total Employees"
                value={totalEmployees}
                loading={totalEmployees === null}
                iconColor="text-purple-600"
              />
            </div>

            {/* Charts Grid */}
            <div className="space-y-6 sm:space-y-8">
              {/* First Row of Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                  <Component />
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                  <Piechart />
                </div>
              </div>

              {/* Second Row of Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                  <PatientTrendChart />
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                  <PatientAgePieChart />
                </div>
              </div>

              {/* Third Row - Single Chart Centered */}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 w-full">
                  <PatientGenderPieChart />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;