import Branch from '@/app/(models)/branch';
import Credit from '@/app/(models)/creadit';
import Invoice from '@/app/(models)/Invoice';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    // Run the authorization middleware
    await authorizedMiddleware(request);

    // Get query parameters - we'll ignore branchId for filtering but keep for consistency
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

   
    // First, fetch all branches to get their names
    const allBranches = await Branch.find({});
    const branchMap = new Map();
    
    // Create a map of branch IDs to branch names
    allBranches.forEach(branch => {
      branchMap.set(branch._id.toString(), branch.name);
    });


    // Aggregate services from both Invoice and Credit collections WITHOUT branch filtering
    const invoiceStats = await Invoice.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            serviceId: '$items.service.id',
            branch: '$branch'
          },
          serviceName: { $first: '$items.service.service' },
          branch: { $first: '$branch' },
          totalUsageCount: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
    ]);

    const creditStats = await Credit.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            serviceId: '$items.service.id',
            branch: '$branch'
          },
          serviceName: { $first: '$items.service.service' },
          branch: { $first: '$branch' },
          totalUsageCount: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
    ]);


    // Combine statistics from both sources
    const combinedStats = [...invoiceStats, ...creditStats];

    // Merge statistics by service ID and branch
    const mergedStats = combinedStats.reduce((acc, curr) => {
      const serviceId = curr._id.serviceId.toString();
      const branchId = curr.branch ? curr.branch.toString() : 'no-branch';
      
      const existing = acc.find(stat => 
        stat._id.serviceId.toString() === serviceId && 
        (stat.branch ? stat.branch.toString() : 'no-branch') === branchId
      );
      
      if (existing) {
        existing.totalUsageCount += curr.totalUsageCount;
        existing.totalRevenue += curr.totalRevenue;
      } else {
        acc.push({
          _id: curr._id,
          serviceName: curr.serviceName,
          branch: curr.branch,
          totalUsageCount: curr.totalUsageCount,
          totalRevenue: curr.totalRevenue,
        });
      }
      return acc;
    }, []);


    // Get overall statistics (all branches combined)
    const overallStats = mergedStats.reduce((acc, curr) => {
      const serviceId = curr._id.serviceId.toString();
      const existing = acc.find(stat => stat._id.toString() === serviceId);
      
      if (existing) {
        existing.totalUsageCount += curr.totalUsageCount;
        existing.totalRevenue += curr.totalRevenue;
      } else {
        acc.push({
          _id: curr._id.serviceId,
          serviceName: curr.serviceName,
          totalUsageCount: curr.totalUsageCount,
          totalRevenue: curr.totalRevenue,
        });
      }
      return acc;
    }, []);

    // Group statistics by branch - analyze ALL branches separately
    const statsByBranch = mergedStats.reduce((acc, curr) => {
      const branchId = curr.branch ? curr.branch.toString() : 'no-branch';
      
      // Get the actual branch name from the branchMap
      let branchName = 'No Branch';
      if (curr.branch) {
        branchName = branchMap.get(curr.branch.toString()) || `Branch ${curr.branch.toString()}`;
      }
      
      if (!acc[branchId]) {
        acc[branchId] = {
          branchId: curr.branch,
          branchName: branchName,
          services: [],
          totalRevenue: 0,
          totalUsage: 0,
          serviceCount: 0
        };
      }
      
      acc[branchId].services.push({
        _id: curr._id.serviceId,
        serviceName: curr.serviceName,
        totalUsageCount: curr.totalUsageCount,
        totalRevenue: curr.totalRevenue,
      });
      
      acc[branchId].totalRevenue += curr.totalRevenue;
      acc[branchId].totalUsage += curr.totalUsageCount;
      acc[branchId].serviceCount = acc[branchId].services.length;
      
      return acc;
    }, {});

    // Convert to array and sort branches by revenue
    const branchStatsArray = Object.values(statsByBranch).map((branch: any) => ({
      ...branch,
      services: branch.services
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10), // Top 10 services per branch
      averageRevenuePerService: branch.serviceCount > 0 ? branch.totalRevenue / branch.serviceCount : 0
    })).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    // Calculate branch summary statistics
    const branchSummary = {
      totalBranches: branchStatsArray.length,
      totalRevenueAllBranches: branchStatsArray.reduce((sum: number, branch: any) => sum + branch.totalRevenue, 0),
      totalUsageAllBranches: branchStatsArray.reduce((sum: number, branch: any) => sum + branch.totalUsage, 0),
      averageRevenuePerBranch: branchStatsArray.length > 0 ? 
        branchStatsArray.reduce((sum: number, branch: any) => sum + branch.totalRevenue, 0) / branchStatsArray.length : 0,
      topPerformingBranch: branchStatsArray.length > 0 ? branchStatsArray[0] : null,
      lowestPerformingBranch: branchStatsArray.length > 0 ? branchStatsArray[branchStatsArray.length - 1] : null
    };

    // Rank overall by usage count (Top 14)
    const rankByUsage = [...overallStats].sort((a, b) => b.totalUsageCount - a.totalUsageCount).slice(0, 14);

    // Rank overall by revenue (Top 14)
    const rankByRevenue = [...overallStats].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 14);


    // Return the statistics
    return NextResponse.json({
      success: true,
      data: {
        rankByUsage,
        rankByRevenue,
        branchStats: branchStatsArray,
        branchSummary,
        filters: {
          // Note: branch filtering is not applied in this analysis
          analysisType: 'all-branches-separate'
        }
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/service-statistics:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching service statistics',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

interface Query {
  'createdBy.id'?: string | mongoose.Types.ObjectId;
  branch?: mongoose.Types.ObjectId;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Run the authorization middleware
    await authorizedMiddleware(request);

    // Parse the request body
    const body = await request.json();

    // Get filter parameters - all are optional
    const { createdBy, startDate, endDate, branchId } = body;
    
  
    // Prepare the filter object - start with empty object
    const filter: Query = {};

    // Add createdBy filter if provided
    if (createdBy) {
      filter["createdBy.id"] = new mongoose.Types.ObjectId(createdBy);
    }

    // Add branch filter if provided
    if (branchId) {
      filter.branch = new mongoose.Types.ObjectId(branchId);
    }

    // If dates are provided, add them to the filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        } else {
          return NextResponse.json(
            { success: false, message: 'Invalid startDate format.' },
            { status: 400 }
          );
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        } else {
          return NextResponse.json(
            { success: false, message: 'Invalid endDate format.' },
            { status: 400 }
          );
        }
      }
    }


    // If no filters are applied, use empty match (get all documents)
    const matchStage = Object.keys(filter).length > 0 ? { $match: filter } : { $match: {} };

    // Aggregate services from Invoice collection
    const invoiceStats = await Invoice.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            serviceId: '$items.service.id',
            branch: '$branch'
          },
          serviceName: { $first: '$items.service.service' },
          branch: { $first: '$branch' },
          totalUsageCount: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
    ]);

    // Aggregate services from Credit collection
    const creditStats = await Credit.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            serviceId: '$items.service.id',
            branch: '$branch'
          },
          serviceName: { $first: '$items.service.service' },
          branch: { $first: '$branch' },
          totalUsageCount: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
    ]);

 
    // Combine statistics from both sources
    const combinedStats = [...invoiceStats, ...creditStats];

    // Merge statistics by service ID and branch
    const mergedStats = combinedStats.reduce((acc, curr) => {
      const serviceId = curr._id.serviceId.toString();
      const branchId = curr.branch ? curr.branch.toString() : 'no-branch';
      
      const existing = acc.find(stat => 
        stat._id.serviceId.toString() === serviceId && 
        (stat.branch ? stat.branch.toString() : 'no-branch') === branchId
      );
      
      if (existing) {
        existing.totalUsageCount += curr.totalUsageCount;
        existing.totalRevenue += curr.totalRevenue;
      } else {
        acc.push({
          _id: curr._id,
          serviceName: curr.serviceName,
          branch: curr.branch,
          totalUsageCount: curr.totalUsageCount,
          totalRevenue: curr.totalRevenue,
        });
      }
      return acc;
    }, []);


    // Get overall statistics (all branches combined)
    const overallStats = mergedStats.reduce((acc, curr) => {
      const serviceId = curr._id.serviceId.toString();
      const existing = acc.find(stat => stat._id.toString() === serviceId);
      
      if (existing) {
        existing.totalUsageCount += curr.totalUsageCount;
        existing.totalRevenue += curr.totalRevenue;
      } else {
        acc.push({
          _id: curr._id.serviceId,
          serviceName: curr.serviceName,
          totalUsageCount: curr.totalUsageCount,
          totalRevenue: curr.totalRevenue,
        });
      }
      return acc;
    }, []);

    // Group statistics by branch
    const statsByBranch = mergedStats.reduce((acc, curr) => {
      const branchId = curr.branch ? curr.branch.toString() : 'no-branch';
      const branchName = curr.branch ? `Branch ${curr.branch.toString()}` : 'No Branch';
      
      if (!acc[branchId]) {
        acc[branchId] = {
          branchId: curr.branch,
          branchName: branchName,
          services: [],
          totalRevenue: 0,
          totalUsage: 0
        };
      }
      
      acc[branchId].services.push({
        _id: curr._id.serviceId,
        serviceName: curr.serviceName,
        totalUsageCount: curr.totalUsageCount,
        totalRevenue: curr.totalRevenue,
      });
      
      acc[branchId].totalRevenue += curr.totalRevenue;
      acc[branchId].totalUsage += curr.totalUsageCount;
      
      return acc;
    }, {});

    // Convert to array and sort branches by revenue
    const branchStatsArray = Object.values(statsByBranch).map((branch: any) => ({
      ...branch,
      services: branch.services.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    })).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    // Rank by usage count
    const rankByUsage = [...overallStats].sort((a, b) => b.totalUsageCount - a.totalUsageCount);

    // Rank by revenue
    const rankByRevenue = [...overallStats].sort((a, b) => b.totalRevenue - a.totalRevenue);

   
    // Return the rankings
    return NextResponse.json({
      success: true,
      data: {
        rankByUsage,
        rankByRevenue,
        branchStats: branchStatsArray,
        filters: {
          createdBy: createdBy || null,
          branchId: branchId || null,
          startDate: startDate || null,
          endDate: endDate || null
        }
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/service-statistics:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching service statistics',
        error: error.message,
      },
      { status: 500 }
    );
  }
}