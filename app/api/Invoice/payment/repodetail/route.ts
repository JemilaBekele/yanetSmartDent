import { connect } from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import Invoice from '@/app/(models)/Invoice';
import mongoose from 'mongoose';
connect();

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    // Use URLSearchParams to get the invoiceId from the query string
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId"); // Extract invoiceId from query

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    // Ensure invoiceId is not null before checking its validity
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      console.error("Invoice not found for ID:", invoiceId);
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: unknown) {
    console.error("Error in GET /api/Invoice/payment/repodetail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
