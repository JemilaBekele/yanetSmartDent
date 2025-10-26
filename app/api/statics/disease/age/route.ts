import { NextRequest, NextResponse } from 'next/server';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Age from '@/app/(models)/age';
import User from '@/app/(models)/User';

connect();

export async function POST(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  if (typeof request === 'object' && request !== null && 'user' in request) {
    const user = (request as { user: { id: string; username: string } }).user;
    
    const createdBy = {
      id: user.id,
      username: user.username,
    };
    
    // Populate user with branch details
    const fullUser = await User.findById(createdBy.id)
      .select('branch')
      .populate('branch', 'name location phone')
      .exec();
      
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
      const body = await request.json();
      const { startDate, endDate, showAll } = body; // Added showAll parameter for admin override

      if (!startDate || !endDate) {
        return NextResponse.json({
          message: 'Start date and end date are required',
          success: false,
        }, { status: 400 });
      }

      // Parse and validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({
          message: 'Invalid date format',
          success: false,
        }, { status: 400 });
      }

      // Build match filter based on user's branch
      const matchFilter: any = {
        createdAt: { $gte: start, $lte: end }
      };

      // Add branch filter if user has a branch assigned and showAll is not true
      // For admin users, they can choose to see all branches by setting showAll=true
      const shouldFilterByBranch = fullUser.branch && !showAll;
      if (shouldFilterByBranch) {
        matchFilter.branch = fullUser.branch._id;
      }

      const statistics = await Age.aggregate([
        {
          $match: matchFilter
        },
        {
          $group: {
            _id: "$patient"
          }
        },
        {
          $lookup: {
            from: "patients",
            localField: "_id",
            foreignField: "_id",
            as: "patientDetails"
          }
        },
        {
          $unwind: "$patientDetails"
        },
        {
          $addFields: {
            ageInt: { $toInt: "$patientDetails.age" }
          }
        },
        {
          $group: {
            _id: {
              gender: "$patientDetails.sex",
              ageGroup: {
                $switch: {
                  branches: [
                    { case: { $lt: ["$ageInt", 5] }, then: "<5" },
                    { case: { $and: [{ $gte: ["$ageInt", 5] }, { $lte: ["$ageInt", 10] }] }, then: "5-10" },
                    { case: { $and: [{ $gte: ["$ageInt", 11] }, { $lte: ["$ageInt", 19] }] }, then: "11-19" },
                    { case: { $and: [{ $gte: ["$ageInt", 20] }, { $lte: ["$ageInt", 29] }] }, then: "20-29" },
                    { case: { $and: [{ $gte: ["$ageInt", 30] }, { $lte: ["$ageInt", 45] }] }, then: "30-45" },
                    { case: { $and: [{ $gte: ["$ageInt", 46] }, { $lte: ["$ageInt", 65] }] }, then: "46-65" },
                    { case: { $gte: ["$ageInt", 66] }, then: "66+" }
                  ],
                  default: "Unknown"
                }
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: "$_id.gender",
            ageGroups: {
              $push: {
                ageGroup: "$_id.ageGroup",
                count: "$count"
              }
            },
            total: { $sum: "$count" }
          }
        },
        {
          $project: {
            gender: "$_id",
            ageGroups: 1,
            total: 1,
            _id: 0
          }
        }
      ]);

      return NextResponse.json({
        message: 'Statistics fetched successfully',
        success: true,
        data: statistics,
        filteredByBranch: shouldFilterByBranch,
        userBranch: fullUser.branch ? {
          _id: fullUser.branch._id,
          name: fullUser.branch.name,
          location: fullUser.branch.location,
          phone: fullUser.branch.phone
        } : null,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }, { status: 200 });

    } catch (error) {
      console.error('Error fetching data:', error);
      return NextResponse.json({
        message: 'Failed to retrieve data',
        success: false,
      }, { status: 500 });
    }
  } else {
    return NextResponse.json({
      message: 'User information not found',
      success: false,
    }, { status: 401 });
  }
}