import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get a single user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await User.findById(id).populate("familyMembers", "name phone gotra");
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json(user);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update a user by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    if (body.latitude !== undefined && body.latitude !== null && body.latitude !== "") {
      body.latitude = Number(body.latitude);
    }
    if (body.longitude !== undefined && body.longitude !== null && body.longitude !== "") {
      body.longitude = Number(body.longitude);
    }
    if (
      (!body.googleMapsUrl || String(body.googleMapsUrl).trim() === "") &&
      body.latitude !== undefined &&
      body.longitude !== undefined &&
      !isNaN(body.latitude) &&
      !isNaN(body.longitude)
    ) {
      body.googleMapsUrl = `https://www.google.com/maps?q=${body.latitude},${body.longitude}`;
    }
    
    const updatedUser = await User.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("familyMembers", "name phone gotra");

    if (!updatedUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json(updatedUser);
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to update user" }, { status: 400 });
  }
}

// DELETE /api/users/[id] - Delete a user by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
