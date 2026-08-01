import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Business } from "@/models/Business";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/businesses/[id] - Get a single business by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const business = await Business.findById(id).populate("owner", "name phone gotra");
    if (!business) {
      return Response.json({ error: "Business not found" }, { status: 404 });
    }
    return Response.json(business);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/businesses/[id] - Update a business by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    const updatedBusiness = await Business.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("owner", "name phone gotra");

    if (!updatedBusiness) {
      return Response.json({ error: "Business not found" }, { status: 404 });
    }
    return Response.json(updatedBusiness);
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to update business" }, { status: 400 });
  }
}

// DELETE /api/businesses/[id] - Delete a business by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const deletedBusiness = await Business.findByIdAndDelete(id);
    if (!deletedBusiness) {
      return Response.json({ error: "Business not found" }, { status: 404 });
    }
    return Response.json({ message: "Business deleted successfully" });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
