import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Credit from '@/app/(models)/creadit'; 
import Patient from '@/app/(models)/Patient'; 
import Orgnazation from '@/app/(models)/Orgnazation';
import mongoose from 'mongoose';

connect();

type CreditQuery = {
  'currentPayment.confirm': boolean;
  'createdBy.id'?: string;
  creditDate?: {
    $gte: Date;
    $lte: Date;
  };
  'customerName.id'?: { $in: mongoose.Types.ObjectId[] };
  status?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { createdBy, creditDate, organization, status } = body;

    const query: CreditQuery = { 'currentPayment.confirm': false }; // Only unconfirmed credits

    if (createdBy) {
      query['createdBy.id'] = createdBy;
    }

    if (creditDate?.start && creditDate?.end) {
      query.creditDate = {
        $gte: new Date(creditDate.start),
        $lte: new Date(creditDate.end),
      };
    }

    if (organization) {
      console.log(`Searching for organization by ID: ${organization}`);

      // Ensure organization exists
      const org = await Orgnazation.findOne({ _id: organization }).select('_id');
      if (!org) {
        console.log('No organization found with the given ID.');
        return NextResponse.json([], { status: 200 });
      }

      console.log(`Organization found with ID: ${org._id}`);

      // Find patients linked to this organization
      const patients = await Patient.find({ Orgnazation: org._id }).select('_id');

      if (patients.length === 0) {
        console.log('No patients found for the given organization.');
        return NextResponse.json([], { status: 200 });
      }

      const patientIds = patients.map((patient) => new mongoose.Types.ObjectId(patient._id));
      console.log(`Patients found with IDs: ${patientIds}`);

      // Apply the patient filter to the main query
      query['customerName.id'] = { $in: patientIds };
    }

    if (status) {
      query.status = status;
    }

    // Debugging: Log the final query before execution
    console.log('Final query for credits:', JSON.stringify(query, null, 2));

    // Execute the query with correct filters
    const credits = await Credit.find(query)
      .populate({ path: 'customerName.id', model: 'Patient', select: 'firstname' })
      .populate({
        path: 'createdBy.id',
        model: 'User',
        select: 'username',
      })
      .exec();

    console.log(`Credits found: ${credits.length}`);
    return NextResponse.json(credits, { status: 200 });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

