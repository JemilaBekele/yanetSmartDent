import Credit from '@/app/(models)/creadit';
import Invoice from '@/app/(models)/Invoice';
import MedicalFinding from '@/app/(models)/MedicalFinding';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

connect();

export async function GET(request: NextRequest) {
    await authorizedMiddleware(request);
    try {
        MedicalFinding.aggregate([{ $sample: { size: 1 } }]);
        Credit.aggregate([{ $sample: { size: 1 } }]);
        Invoice.aggregate([{ $sample: { size: 1 } }]);
      // Query for patients with specific medical history and unpaid invoices or credits
      const patients = await Patient.find({})
        .populate({
          path: 'MedicalFinding',
          match: {
            $or: [
              { "TreatmentPlan.Bridge": true },
              { "TreatmentPlan.Crown": true },
              { "TreatmentDone.Bridge": true },
              { "TreatmentDone.Crown": true }
            ],
          },
        })
        .populate({
          path: 'branch',
          select: 'name location phone',
        })
       
  
      // Filter out patients that do not have matching treatment plans/treatments done
      const filteredPatients = patients.filter(
        (patient) => patient.MedicalFinding.length > 0
      );
  
      // Map to include only relevant patient data
      const patientData = filteredPatients.map((patient) => ({
        _id: patient._id,
        cardno: patient.cardno,
        firstname: patient.firstname,
        age: patient.age,
        sex: patient.sex,
        MedicalFinding: patient.MedicalFinding,
        branch: patient.branch ? {
          _id: patient.branch._id,
          name: patient.branch.name,
          location: patient.branch.location,
          phone: patient.branch.phone
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