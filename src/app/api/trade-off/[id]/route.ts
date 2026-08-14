import { NextRequest } from "next/server";
import { getTenantTradeOffModel } from "@/models/TradeOff";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const TradeOffModel = await getTenantTradeOffModel(request);

    const deletedItem = await TradeOffModel.findByIdAndDelete(id);
    if (!deletedItem) {
      return Response.json({ error: "Trade-off post not found" }, { status: 404 });
    }

    return Response.json({ message: "Listing deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to delete listing" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const TradeOffModel = await getTenantTradeOffModel(request);
    const body = await request.json();

    const updatedItem = await TradeOffModel.findByIdAndUpdate(id, body, {
      new: true,
    }).populate("owner", "name mobileNumber phone avatar city gotra");

    if (!updatedItem) {
      return Response.json({ error: "Trade-off post not found" }, { status: 404 });
    }

    return Response.json({ item: updatedItem }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to update listing" },
      { status: 500 }
    );
  }
}
