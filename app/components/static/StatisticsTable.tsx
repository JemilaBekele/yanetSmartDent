import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";

interface ServiceStat {
  _id: string;
  serviceName: string;
  totalUsageCount: number;
  totalRevenue: number;
}

interface BranchStat {
  branchId: string;
  branchName: string;
  services: ServiceStat[];
  totalRevenue: number;
  totalUsage: number;
  serviceCount: number;
  averageRevenuePerService: number;
}

interface BranchSummary {
  totalBranches: number;
  totalRevenueAllBranches: number;
  totalUsageAllBranches: number;
  averageRevenuePerBranch: number;
  topPerformingBranch: BranchStat | null;
  lowestPerformingBranch: BranchStat | null;
}

interface StatisticsData {
  rankByUsage: ServiceStat[];
  rankByRevenue: ServiceStat[];
  branchStats: BranchStat[];
  branchSummary: BranchSummary;
}

const StatisticsTable: React.FC = () => {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'branches'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/statics/rankservice');
        const result = await response.json();
console.log(result)
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading statistics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  const { rankByUsage, rankByRevenue, branchStats, branchSummary } = data;

  return (
    <div className="flex">
      <div className="flex-grow md:ml-60 container mx-auto p-4 lg:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Service Performance Dashboard</h1>
          <p className="text-gray-600">Comprehensive analysis across all branches and services</p>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('branches')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'branches'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Branch Analysis ({branchStats.length})
          </button>
        </div>

        {activeView === 'overview' ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {branchSummary.totalBranches}
                </div>
                <div className="text-sm text-blue-800 font-medium">Total Branches</div>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {formatCurrency(branchSummary.totalRevenueAllBranches)}
                </div>
                <div className="text-sm text-green-800 font-medium">Total Revenue</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {branchSummary.totalUsageAllBranches.toLocaleString()}
                </div>
                <div className="text-sm text-purple-800 font-medium">Total Service Usage</div>
              </div>
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {formatCurrency(branchSummary.averageRevenuePerBranch)}
                </div>
                <div className="text-sm text-orange-800 font-medium">Avg Revenue per Branch</div>
              </div>
            </div>

            {/* Top Performing Branch Card */}
            {branchSummary.topPerformingBranch && (
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span className="font-semibold">Top Performing Branch</span>
                    </div>
                    <h3 className="text-2xl font-bold">{branchSummary.topPerformingBranch.branchName}</h3>
                    <p className="text-yellow-100">
                      {formatCurrency(branchSummary.topPerformingBranch.totalRevenue)} • {branchSummary.topPerformingBranch.totalUsage.toLocaleString()} usage
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{formatCurrency(branchSummary.topPerformingBranch.averageRevenuePerService)}</div>
                    <div className="text-yellow-100 text-sm">Avg per service</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Usage Rankings Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white">Usage Rankings</h2>
                        <p className="text-blue-100 text-sm">Most frequently used services</p>
                      </div>
                    </div>
                    <div className="bg-blue-500 px-3 py-1 rounded-full">
                      <span className="text-white text-sm font-medium">{rankByUsage.length} Services</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-20 font-semibold text-gray-700 py-3">Rank</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-3">Service Name</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-3 text-right">Usage Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankByUsage.map((stat, index) => (
                          <TableRow key={stat._id} className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100">
                            <TableCell className="py-4">
                              <div className="flex items-center">
                                {index < 3 ? (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                    'bg-orange-100 text-orange-800'
                                  }`}>
                                    <span className="font-bold text-sm">{index + 1}</span>
                                  </div>
                                ) : (
                                  <span className="w-8 h-8 flex items-center justify-center text-gray-600 font-medium">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="font-medium text-gray-900">{stat.serviceName}</div>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-semibold text-gray-900">{stat.totalUsageCount.toLocaleString()}</span>
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Revenue Rankings Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white">Revenue Rankings</h2>
                        <p className="text-green-100 text-sm">Highest revenue generating services</p>
                      </div>
                    </div>
                    <div className="bg-green-500 px-3 py-1 rounded-full">
                      <span className="text-white text-sm font-medium">{rankByRevenue.length} Services</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-20 font-semibold text-gray-700 py-3">Rank</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-3">Service Name</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-3 text-right">Total Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankByRevenue.map((stat, index) => (
                          <TableRow key={stat._id} className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100">
                            <TableCell className="py-4">
                              <div className="flex items-center">
                                {index < 3 ? (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                    'bg-orange-100 text-orange-800'
                                  }`}>
                                    <span className="font-bold text-sm">{index + 1}</span>
                                  </div>
                                ) : (
                                  <span className="w-8 h-8 flex items-center justify-center text-gray-600 font-medium">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="font-medium text-gray-900">{stat.serviceName}</div>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(stat.totalRevenue)}
                                </span>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Branch Analysis View */
          <div className="space-y-6">
            {branchStats.map((branch, index) => (
              <div key={branch.branchId} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className={`px-6 py-4 ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                  index === 1 ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                  index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                  'bg-gradient-to-r from-blue-600 to-blue-700'
                } text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {index < 3 && (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-400' :
                          index === 1 ? 'bg-gray-400' :
                          'bg-orange-400'
                        }`}>
                          <span className="font-bold text-white text-lg">{index + 1}</span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-semibold">{branch.branchName}</h2>
                        <p className="opacity-90 text-sm">
                          {branch.serviceCount} services • {branch.totalUsage.toLocaleString()} total usage
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{formatCurrency(branch.totalRevenue)}</div>
                      <div className="text-sm opacity-90">Total Revenue</div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <div className="text-lg font-bold text-blue-600">{branch.serviceCount}</div>
                      <div className="text-sm text-blue-800">Services Offered</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(branch.averageRevenuePerService)}</div>
                      <div className="text-sm text-green-800">Avg per Service</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl">
                      <div className="text-lg font-bold text-purple-600">{branch.totalUsage.toLocaleString()}</div>
                      <div className="text-sm text-purple-800">Total Usage</div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-700 py-3">Service Name</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-3 text-right">Usage</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-3 text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {branch.services.map((service, serviceIndex) => (
                          <TableRow key={service._id} className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100">
                            <TableCell className="py-3">
                              <div className="font-medium text-gray-900">{service.serviceName}</div>
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <span className="text-gray-700">{service.totalUsageCount.toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <span className="font-semibold text-green-600">
                                {formatCurrency(service.totalRevenue)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsTable;