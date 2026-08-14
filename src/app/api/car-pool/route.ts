import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { getTenantCarPoolModel } from "@/models/CarPool";
import { getTenantPostModel } from "@/models/Post";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const CarPoolModel = await getTenantCarPoolModel(request);

    const { searchParams } = new URL(request.url);
    const tripType = searchParams.get("tripType");
    const originCity = searchParams.get("originCity");
    const destinationCity = searchParams.get("destinationCity");
    const search = searchParams.get("search");
    const ownerId = searchParams.get("owner");

    const query: any = { status: "active" };

    if (ownerId) {
      query.owner = ownerId;
      // Allow viewing all statuses for own listings if specified
      delete query.status;
    }

    if (tripType && tripType !== "all") {
      query.tripType = tripType;
    }

    if (originCity && originCity.trim()) {
      query.originCity = new RegExp(originCity.trim(), "i");
    }

    if (destinationCity && destinationCity.trim()) {
      query.destinationCity = new RegExp(destinationCity.trim(), "i");
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), "i");
      query.$or = [
        { originCity: reg },
        { destinationCity: reg },
        { vehicleDetails: reg },
        { pickupLocation: reg },
        { dropLocation: reg },
        { notes: reg },
      ];
    }

    const rides = await CarPoolModel.find(query)
      .populate("owner", "name mobileNumber phone avatar city gotra")
      .sort({ travelDate: 1, createdAt: -1 })
      .lean();

    return Response.json({ rides });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to fetch carpool listings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const CarPoolModel = await getTenantCarPoolModel(request);
    const communityId = await getTenantId(request);
    const body = await request.json();

    const {
      owner,
      tripType,
      requestCategory,
      parcelDetails,
      parcelWeight,
      originCity,
      destinationCity,
      travelDate,
      travelTime,
      availableSeats,
      pricePerSeat,
      vehicleDetails,
      pickupLocation,
      dropLocation,
      notes,
      contactPhone,
      whatsappNumber,
    } = body;

    if (!owner || !originCity || !destinationCity || !travelDate || !availableSeats) {
      return Response.json(
        { error: "Please fill in all required fields: From, To, Date, Seats" },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (travelDate.trim() < todayStr) {
      return Response.json(
        { error: "Travel date cannot be in the past" },
        { status: 400 }
      );
    }

    const newRide = await CarPoolModel.create({
      owner,
      tripType: tripType || "offer",
      requestCategory: requestCategory || "passenger",
      parcelDetails: parcelDetails?.trim() || undefined,
      parcelWeight: parcelWeight?.trim() || undefined,
      originCity: originCity.trim(),
      destinationCity: destinationCity.trim(),
      travelDate: travelDate.trim(),
      travelTime: travelTime?.trim() || undefined,
      availableSeats: Number(availableSeats) || 1,
      pricePerSeat: pricePerSeat !== undefined ? Number(pricePerSeat) : 0,
      vehicleDetails: vehicleDetails?.trim() || undefined,
      pickupLocation: pickupLocation?.trim() || undefined,
      dropLocation: dropLocation?.trim() || undefined,
      notes: notes?.trim() || undefined,
      contactPhone: contactPhone?.trim() || undefined,
      whatsappNumber: whatsappNumber?.trim() || undefined,
      status: "active",
      communityId: communityId ?? undefined,
    });

    const populatedRide = await CarPoolModel.findById(newRide._id)
      .populate("owner", "name mobileNumber phone avatar city gotra")
      .lean();

    // Auto-publish to Community Wall as a carpool post
    try {
      const PostModel = await getTenantPostModel(request);
      const isOffer = (tripType || "offer") === "offer";
      const isParcel = requestCategory === "parcel";
      const actionTitle = isOffer
        ? "🚘 OUTSTATION RIDE OFFER"
        : isParcel
        ? "📦 OUTSTATION PARCEL / COURIER SEND REQUEST"
        : "🙋 OUTSTATION RIDE NEEDED";
      const contentStr = `${actionTitle}\nFrom: ${originCity.trim()} ➔ To: ${destinationCity.trim()}\nDate: ${travelDate.trim()}${travelTime ? ` at ${travelTime.trim()}` : ""}${isParcel && parcelDetails ? `\nParcel Details: ${parcelDetails.trim()}${parcelWeight ? ` (Weight: ${parcelWeight.trim()})` : ""}` : ""}${!isParcel ? `\nSeats: ${availableSeats} ${isOffer ? "available" : "needed"}${pricePerSeat ? ` (${pricePerSeat} INR/seat)` : ""}` : ""}`;

      await PostModel.create({
        author: owner,
        type: "carpool",
        content: contentStr,
        carpoolDetails: {
          tripType: tripType || "offer",
          requestCategory: requestCategory || "passenger",
          parcelDetails: parcelDetails?.trim() || undefined,
          parcelWeight: parcelWeight?.trim() || undefined,
          originCity: originCity.trim(),
          destinationCity: destinationCity.trim(),
          travelDate: travelDate.trim(),
          travelTime: travelTime?.trim() || undefined,
          availableSeats: Number(availableSeats) || 1,
          pricePerSeat: pricePerSeat !== undefined ? Number(pricePerSeat) : 0,
          vehicleDetails: vehicleDetails?.trim() || undefined,
          pickupLocation: pickupLocation?.trim() || undefined,
          dropLocation: dropLocation?.trim() || undefined,
          contactPhone: contactPhone?.trim() || undefined,
          whatsappNumber: whatsappNumber?.trim() || undefined,
          notes: notes?.trim() || undefined,
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h TTL
      });
    } catch (postErr) {
      console.error("Failed to auto-publish carpool post to community wall", postErr);
    }

    return Response.json({ ride: populatedRide }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to create carpool posting" },
      { status: 500 }
    );
  }
}
