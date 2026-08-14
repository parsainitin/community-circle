import { NextRequest } from "next/server";
import { getTenantTradeOffModel } from "@/models/TradeOff";
import { getTenantPostModel } from "@/models/Post";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const TradeOffModel = await getTenantTradeOffModel(request);
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const tradeType = searchParams.get("tradeType");
    const queryStr = searchParams.get("query");

    const communityId = await getTenantId(request);

    const filter: any = { status: "active" };

    if (communityId) {
      filter.communityId = communityId;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (tradeType && tradeType !== "all") {
      filter.tradeType = tradeType;
    }

    if (queryStr) {
      const regex = new RegExp(queryStr.trim(), "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
        { pricingModel: regex },
      ];
    }

    const items = await TradeOffModel.find(filter)
      .sort({ createdAt: -1 })
      .populate("owner", "name mobileNumber phone avatar city gotra")
      .lean();

    return Response.json({ items }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to fetch trade-off listings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const TradeOffModel = await getTenantTradeOffModel(request);
    const body = await request.json();

    const {
      owner,
      tradeType,
      category,
      title,
      description,
      itemCondition,
      pricingModel,
      availableDate,
      location,
      contactPhone,
      whatsappNumber,
    } = body;

    if (!owner || !title || !description || !category) {
      return Response.json(
        { error: "Please fill in required fields: Title, Category, Description" },
        { status: 400 }
      );
    }

    // Past Date Validation
    if (availableDate && availableDate.trim()) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (availableDate.trim() < todayStr) {
        return Response.json(
          { error: "Available date cannot be in the past" },
          { status: 400 }
        );
      }
    }

    const communityId = await getTenantId(request);

    const newItem = await TradeOffModel.create({
      owner,
      tradeType: tradeType || "offer",
      category: category || "goods",
      title: title.trim(),
      description: description.trim(),
      itemCondition: itemCondition?.trim() || undefined,
      pricingModel: pricingModel?.trim() || undefined,
      availableDate: availableDate?.trim() || undefined,
      location: location?.trim() || undefined,
      contactPhone: contactPhone?.trim() || undefined,
      whatsappNumber: whatsappNumber?.trim() || undefined,
      status: "active",
      communityId: communityId ?? undefined,
    });

    const populatedItem = await TradeOffModel.findById(newItem._id)
      .populate("owner", "name mobileNumber phone avatar city gotra")
      .lean();

    // Auto-publish to Community Wall
    try {
      const PostModel = await getTenantPostModel(request);
      const isOffer = (tradeType || "offer") === "offer";
      const categoryLabel =
        category === "vehicles"
          ? "🚗 VEHICLE"
          : category === "services"
          ? "🛠️ SERVICE / SKILL"
          : category === "crowd_sharing"
          ? "👥 CROWD SHARING"
          : "📦 GOODS / ITEM";

      const actionHeadline = isOffer
        ? `🔄 TRADE-OFF OFFER: ${categoryLabel}`
        : `🔄 TRADE-OFF NEED / BORROW: ${categoryLabel}`;

      const contentStr = `${actionHeadline}\nItem/Service: ${title.trim()}\nDescription: ${description.trim()}${pricingModel ? `\nTerms: ${pricingModel.trim()}` : ""}${availableDate ? `\nAvailable: ${availableDate.trim()}` : ""}`;

      await PostModel.create({
        author: owner,
        type: "trade_off",
        content: contentStr,
        tradeOffDetails: {
          tradeType: tradeType || "offer",
          category: category || "goods",
          title: title.trim(),
          itemCondition: itemCondition?.trim() || undefined,
          pricingModel: pricingModel?.trim() || undefined,
          availableDate: availableDate?.trim() || undefined,
          location: location?.trim() || undefined,
          contactPhone: contactPhone?.trim() || undefined,
          whatsappNumber: whatsappNumber?.trim() || undefined,
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
    } catch (postErr) {
      console.error("Failed to auto-publish trade-off post to community wall", postErr);
    }

    return Response.json({ item: populatedItem }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to create trade-off listing" },
      { status: 500 }
    );
  }
}
