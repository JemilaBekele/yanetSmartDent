import CreditHistory from '@/app/(models)/credithistory';
import Orthodontics from '@/app/(models)/orthodontics';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import History from '@/app/(models)/history'
import Invoice from '@/app/(models)/Invoice';
import Credit from '@/app/(models)/creadit';

connect();

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    Orthodontics.aggregate([{ $sample: { size: 1 } }]);
    Credit.aggregate([{ $sample: { size: 1 } }]);
    Invoice.aggregate([{ $sample: { size: 1 } }]);
    // Query for patients with orthodontic history and payment not fully paid
    const patients = await Patient.find({})
      .populate({
        path: 'Orthodontics',
        match: {}, // Add filtering conditions for Orthodontics if needed
      })
      .populate({
        path: 'branch',
        select: 'name location phone', // Select only the fields you need
      })
      

    // Filter out patients that do not have Orthodontics data or outstanding payments
    const filteredPatients = patients.filter(
      (patient) => patient.Orthodontics.length > 0 
    );

    // Map to include only relevant patient data
    const patientData = filteredPatients.map((patient) => ({
      _id: patient._id,
      cardno: patient.cardno,
      firstname: patient.firstname,
      age: patient.age,
      sex: patient.sex,
      Orthodontics: patient.Orthodontics,
      branch: patient.branch ? {
        _id: patient.branch._id,
        name: patient.branch.name,
      } : null
    }));

    return NextResponse.json({
      success: true,
      data: patientData,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({
      success: false,
      error: 'Server Error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    const body = await request.json();
    const { patientId } = body;

    if (!patientId) {
      return NextResponse.json(
        { message: 'Patient ID is required', success: false },
        { status: 400 }
      );
    }

    // Fetch patient details with branch populated
    const patient = await Patient.findById(patientId)
      .populate({
        path: 'branch',
        select: 'name location phone',
      });

    if (!patient) {
      return NextResponse.json(
        { message: 'Patient not found', success: false },
        { status: 404 }
      );
    }

    // Fetch credit history associated with the patient
    const creditHistory = await CreditHistory.find({ 'Credit.customerName.id': patientId })
      .populate('Credit.id', 'totalAmount totalPaid balance')
      .populate('Credit.customerName.id', 'firstname lastname cardno');

    // Fetch invoice history associated with the patient
    const invoiceHistory = await History.find({ 'Invoice.customerName.id': patientId })
      .populate('Invoice.id', 'totalAmount totalPaid balance')
      .populate('Invoice.customerName.id', 'firstname lastname cardno');

    // Build response object
    const response = {
      patient: {
        _id: patient._id,
        firstname: patient.firstname,
        lastname: patient.lastname,
        cardno: patient.cardno,
        createdAt: patient.createdAt,
        branch: patient.branch ? {
          _id: patient.branch._id,
          name: patient.branch.name,
          location: patient.branch.location,
          phone: patient.branch.phone
        } : null
      },
      creditHistory: creditHistory.map((credit) => ({
        creditId: credit._id,
        amount: credit.Credit.amount,
        createdAt: credit.createdAt,
        totalAmount: credit.Credit.id?.totalAmount || 0,
        totalPaid: credit.Credit.id?.totalPaid || 0,
        balance: credit.Credit.id?.balance || 0,
      })),
      invoiceHistory: invoiceHistory.map((invoice) => ({
        invoiceId: invoice._id,
        amount: invoice.Invoice.amount,
        createdAt: invoice.createdAt,
        receipt: invoice.Invoice.receipt,
        totalAmount: invoice.Invoice.id?.totalAmount || 0,
        totalPaid: invoice.Invoice.id?.totalPaid || 0,
        balance: invoice.Invoice.id?.balance || 0,
      })),
    };

    return NextResponse.json({ success: true, data: response }, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve data', success: false },
      { status: 500 }
    );
  }
}