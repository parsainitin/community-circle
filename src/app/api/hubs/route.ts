import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Hub, getTenantHubModel } from "@/models/Hub";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const HubModel = await getTenantHubModel(request);
    const communityId = await getTenantId(request);

    const { searchParams } = new URL(request.url);
    const hubType = searchParams.get("hubType");
    const search = searchParams.get("search");

    const query: any = {};
    if (communityId) {
      query.communityId = communityId;
    }

    if (hubType && hubType !== "all") {
      query.hubType = hubType;
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), "i");
      query.$or = [{ title: reg }, { description: reg }, { category: reg }, { location: reg }];
    }

    let hubs = await HubModel.find(query)
      .populate("owner", "name mobileNumber phone avatar city gotra")
      .sort({ createdAt: -1 })
      .lean();

    if (hubs.length === 0 && HubModel !== Hub) {
      hubs = await Hub.find(query)
        .populate("owner", "name mobileNumber phone avatar city gotra")
        .sort({ createdAt: -1 })
        .lean();
    }

    return Response.json({ hubs });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to fetch hub items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const HubModel = await getTenantHubModel(request);
    const communityId = await getTenantId(request);
    const body = await request.json();

    const {
      owner,
      hubType,
      title,
      category,
      description,
      price,
      priceUnit,
      contactPhone,
      whatsappNumber,
      location,
      images,
    } = body;

    if (!owner || !hubType || !title || !description) {
      return Response.json(
        { error: "Missing required fields: owner, hubType, title, description" },
        { status: 400 }
      );
    }

    const newHub = await HubModel.create({
      owner,
      hubType,
      title,
      category,
      description,
      price: price ? Number(price) : undefined,
      priceUnit: priceUnit || undefined,
      contactPhone: contactPhone || undefined,
      whatsappNumber: whatsappNumber || undefined,
      location: location || undefined,
      images: Array.isArray(images) ? images : [],
      communityId: communityId ?? undefined,
    });

    const populatedHub = await HubModel.findById(newHub._id)
      .populate("owner", "name mobileNumber phone avatar city gotra")
      .lean();

    return Response.json({ hub: populatedHub }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create hub listing" }, { status: 500 });
  }
}
