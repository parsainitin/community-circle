import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { getTenantCarPoolModel } from "@/models/CarPool";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    const CarPoolModel = await getTenantCarPoolModel(request);

    const deletedRide = await CarPoolModel.findByIdAndDelete(id);
    if (!deletedRide) {
      return Response.json({ error: "Ride posting not found" }, { status: 404 });
    }

    return Response.json({ message: "Ride posting deleted successfully" });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to delete ride posting" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    const CarPoolModel = await getTenantCarPoolModel(request);

    const body = await request.json();
    const { status, availableSeats } = body;

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (availableSeats !== undefined) updateFields.availableSeats = Number(availableSeats);

    const updatedRide = await CarPoolModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).populate("owner", "name mobileNumber phone avatar city gotra");

    if (!updatedRide) {
      return Response.json({ error: "Ride posting not found" }, { status: 404 });
    }

    return Response.json({ ride: updatedRide });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to update ride posting" },
      { status: 500 }
    );
  }
}
