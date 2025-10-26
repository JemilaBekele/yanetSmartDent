import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import CreditHistory from '@/app/(models)/credithistory';
import Organization from '@/app/(models)/Orgnazation';
import Patient from '@/app/(models)/Patient';
import User from '@/app/(models)/User';
import mongoose, { Types } from 'mongoose';

connect();

// Define the query type explicitly
interface CreditQuery {
  'Credit.created.id'?: Types.ObjectId;
  createdAt?: { $gte: Date; $lte: Date };
  'Credit.customerName.id'?: { $in: Types.ObjectId[] };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { createdBy, creditDate, organization, patientId } = body;

    const query: CreditQuery = {};

    // Filter by createdBy ID
    if (createdBy) {
      if (!mongoose.Types.ObjectId.isValid(createdBy)) {
        return NextResponse.json({ error: 'Invalid createdBy ID format' }, { status: 400 });
      }
      query['Credit.created.id'] = new mongoose.Types.ObjectId(createdBy);
    }

    // Filter by date range
    if (creditDate?.start && creditDate?.end) {
      const startDate = new Date(creditDate.start);
      const endDate = new Date(creditDate.end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      endDate.setHours(23, 59, 59, 999); // Ensure full day inclusion
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    let patientIds: Types.ObjectId[] = [];

    // Alternative Patient Search
    if (patientId) {
      console.log(`Searching for individual patient by ID: ${patientId}`);
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return NextResponse.json({ error: 'Invalid patient ID format' }, { status: 400 });
      }
      patientIds.push(new mongoose.Types.ObjectId(patientId));
    }

    // Filter by organization and retrieve associated patient IDs
    if (organization) {
      console.log(`Searching for organization by ID: ${organization}`);

      if (!mongoose.Types.ObjectId.isValid(organization)) {
        return NextResponse.json({ error: 'Invalid organization ID format' }, { status: 400 });
      }

      const org = await Organization.findOne({ _id: organization }).select('_id patient');
      if (!org) {
        console.log('No organization found with the given ID.');
        return NextResponse.json({ message: 'Organization not found', success: false }, { status: 404 });
      }

      console.log(`Organization found with ID: ${org._id}`);

      if (!org.patient || org.patient.length === 0) {
        console.log('No patients linked to this organization.');
        return NextResponse.json({ message: 'No patients linked to this organization.', success: false }, { status: 200 });
      }

      const orgPatientIds: Types.ObjectId[] = org.patient
        .map((p) => (mongoose.Types.ObjectId.isValid(p.id) ? new mongoose.Types.ObjectId(p.id) : null))
        .filter((id): id is Types.ObjectId => id !== null); // Ensure valid ObjectIds

      if (orgPatientIds.length === 0) {
        return NextResponse.json({ message: 'No valid patient IDs found for this organization.', success: false }, { status: 200 });
      }

      patientIds = [...patientIds, ...orgPatientIds];
      console.log(`Patients found with IDs: ${patientIds}`);
    }

    // Apply patient filter
    if (patientIds.length > 0) {
      query['Credit.customerName.id'] = { $in: patientIds };
    }

    console.log('Executing CreditHistory Query:', JSON.stringify(query, null, 2));

    // Fetch credits and populate required fields
    const credits = await CreditHistory.find(query)
      .populate({
        path: 'Credit.customerName.id',
        model: 'Patient',
        select: 'firstname lastname cardno phoneNumber Town', // Including more patient details
      })
      .populate({
        path: 'Credit.created.id',
        model: 'User',
        select: 'username role phone', // Fetching user role and phone
      })
      .exec();

    // Formatting data for frontend
    const formattedCredits = credits.map(credit => ({
      _id: credit._id,
      amount: credit.Credit.amount,
      createdBy: {
        username: credit.createdBy?.username || 'Unknown',
        id: credit.createdBy?.id || null
      },
      patient: credit.Credit.customerName.id
        ? {
            
            cardno: credit.Credit.customerName.id.cardno,
            firstname: credit.Credit.customerName.id.firstname,
           
          }
        : null,
      createdByUser: credit.Credit.created.id
        ? {
         
            username: credit.Credit.created.id.username,
          
          }
        : null
    }));

    // Log formatted data
    console.log('Formatted Credits Data:', JSON.stringify(formattedCredits, null, 2));

    return NextResponse.json({
      message: 'Credits retrieved successfully',
      success: true,
      data: formattedCredits,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching credits:', error);

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    } else if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 422 });
    } else {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }
}
