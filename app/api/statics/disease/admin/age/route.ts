import { NextRequest, NextResponse } from 'next/server';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Age from '@/app/(models)/age';
import Patient from '@/app/(models)/Patient';
import mongoose from 'mongoose';

connect();

export async function POST(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  try {
    const body = await request.json();
    const { startDate, endDate, branchId } = body; // Added branchId

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

    // Build the match stage condition
    const matchStage: any = {
      createdAt: { $gte: start, $lte: end }
    };

    // Add branch filter if branchId is provided
    if (branchId) {
      // Validate if branchId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(branchId)) {
        return NextResponse.json({
          message: 'Invalid branch ID format',
          success: false,
        }, { status: 400 });
      }
      matchStage.branch = new mongoose.Types.ObjectId(branchId);
    }

    const statistics = await Age.aggregate([
      {
        $match: matchStage // Use the dynamic match stage
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
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({
      message: 'Failed to retrieve data',
      success: false,
    }, { status: 500 });
  }
}