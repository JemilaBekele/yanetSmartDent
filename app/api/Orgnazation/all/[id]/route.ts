import { NextRequest, NextResponse } from 'next/server';
import Orgnazation from '@/app/(models)/Orgnazation';
import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import OrgService from '@/app/(models)/orgacredit';
connect();

interface Orgnazation {
  createdAt: string; // or Date, depending on how you store it
  // Add other fields as needed
}


  
export async function PATCH(request: NextRequest) {
    await authorizedMiddleware(request);
  
    try {
      const body = await request.json();
      const { recordId, ...data } = body;
  
      if (!recordId) {
        return NextResponse.json({ error: "Finding ID is required" }, { status: 400 });
      }
  
      const updatedFinding = await Orgnazation.findByIdAndUpdate(recordId, data, { new: true }).exec();
      if (!updatedFinding) {
        return NextResponse.json({ error: "Organization finding not found" }, { status: 404 });
      }
  
      return NextResponse.json({
        message: "Organization finding updated successfully",
        success: true,
        data: updatedFinding,
      });
    } catch (error) {
      console.error("Error updating Organization finding:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  
  

  


  export async function DELETE(request: NextRequest) {
    await authorizedMiddleware(request);
  
    try {
      const body = await request.json();
      const { recordId } = body;
  
      if (!recordId) {
        return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
      }
  
      // Delete all services associated with the organization
      const deletedServices = await OrgService.deleteMany({ organizationid: recordId });
      console.log(`Deleted ${deletedServices.deletedCount} services associated with organization ${recordId}`);
  
      // Delete the organization
      const deletedOrganization = await Orgnazation.findByIdAndDelete(recordId).exec();
      if (!deletedOrganization) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }
  
      // Remove organization reference from patient records
      const updatedPatients = await Patient.updateMany(
        { Orgnazation: recordId },
        { $pull: { Orgnazation: recordId } }
      );
  
      console.log(`Updated ${updatedPatients.modifiedCount} patients to remove organization reference.`);
  
      return NextResponse.json({
        message: "Organization and associated services deleted successfully, and references removed from patients.",
        success: true,
      });
  
    } catch (error) {
      console.error("Error deleting organization:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  
  