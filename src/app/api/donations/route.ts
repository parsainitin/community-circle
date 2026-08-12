import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Donation, getTenantDonationModel } from "@/models/Donation";
import { User, getTenantUserModel } from "@/models/User";

// GET /api/donations - List all donations (for reports)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const DonationModel = await getTenantDonationModel(request);
    const donations = await DonationModel.find()
      .populate("donor", "name mobileNumber gotra kulDevi avatar")
      .sort({ createdAt: -1 });

    return Response.json(donations);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/donations - Log a new donation
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const DonationModel = await getTenantDonationModel(request);
    const { donorId, amount, transactionId, status } = await request.json();

    if (!donorId || !amount || !transactionId) {
      return Response.json({ error: "Missing required fields: donorId, amount, transactionId" }, { status: 400 });
    }

    const newDonation = await DonationModel.create({
      donor: donorId,
      amount: Number(amount),
      transactionId,
      status: status || "success",
    });

    // Populate donor info for response
    const populated = await DonationModel.findById(newDonation._id).populate("donor", "name mobileNumber gotra kulDevi");

    return Response.json(populated, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to log donation" }, { status: 400 });
  }
}
