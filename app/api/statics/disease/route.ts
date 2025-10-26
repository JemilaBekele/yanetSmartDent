import MedicalFinding from '@/app/(models)/MedicalFinding';
import User from '@/app/(models)/User';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

connect();

export async function POST(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json({
        message: 'Start date and end date are required',
        success: false,
      }, { status: 400 });
    }

    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      
      const createdBy = {
        id: user.id,
        username: user.username,
      };

      // Get user's branch
      const fullUser = await User.findById(createdBy.id).select('branch').exec();
      if (!fullUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userBranch = fullUser.branch;

      // Parse and validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({
          message: 'Invalid date format',
          success: false,
        }, { status: 400 });
      }

      // Build match query based on user's branch
      const matchQuery: any = {
        diseases: { $exists: true, $ne: [] },
        'diseases.diseaseTime': { $gte: start, $lte: end },
      };

      // Only filter by branch if user has a branch assigned
      if (userBranch) {
        matchQuery.branch = userBranch;
      }

      // Aggregation to get disease statistics filtered by branch
      const diseaseStatistics = await MedicalFinding.aggregate([
        {
          $match: matchQuery,
        },
        {
          $lookup: {
            from: 'patients', // Name of the Patient collection
            localField: 'patientId',
            foreignField: '_id',
            as: 'patientInfo',
          },
        },
        {
          $unwind: '$patientInfo',
        },
        {
          $lookup: {
            from: 'diseases', // Name of the Disease collection
            localField: 'diseases.disease',
            foreignField: '_id',
            as: 'diseaseInfo',
          },
        },
        {
          $unwind: '$diseaseInfo',
        },
        {
          $addFields: {
            age: { $toInt: '$patientInfo.age' }, // Convert age to integer
            gender: '$patientInfo.sex',
            disease: '$diseaseInfo.disease',
          },
        },
        {
          $group: {
            _id: {
              disease: '$disease',
              gender: '$gender',
              ageGroup: {
                $switch: {
                  branches: [
                    { case: { $lt: ['$age', 1] }, then: '<1' },
                    { case: { $and: [{ $gte: ['$age', 1] }, { $lte: ['$age', 4] }] }, then: '1-4' },
                    { case: { $and: [{ $gte: ['$age', 5] }, { $lte: ['$age', 14] }] }, then: '5-14' },
                    { case: { $and: [{ $gte: ['$age', 15] }, { $lte: ['$age', 29] }] }, then: '15-29' },
                    { case: { $and: [{ $gte: ['$age', 30] }, { $lte: ['$age', 64] }] }, then: '30-64' },
                    { case: { $gte: ['$age', 65] }, then: '65+' }
                  ],
                  default: 'Unknown'
                }
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.disease',
            stats: {
              $push: {
                gender: '$_id.gender',
                ageGroup: '$_id.ageGroup',
                count: '$count',
              },
            },
          },
        },
      ]);

      return NextResponse.json({
        message: 'Data retrieved successfully',
        success: true,
        data: diseaseStatistics,
        userBranch: userBranch, // Optional: include user's branch in response for debugging
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({
      message: 'Failed to retrieve data',
      success: false,
    }, { status: 500 });
  }
}