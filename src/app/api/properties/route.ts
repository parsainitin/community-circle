import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { PropertyBooking } from "@/models/PropertyBooking";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const properties = await PropertyBooking.find({}).sort({ createdAt: -1 }).lean();
    return Response.json({ properties });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      propertyName,
      propertyType,
      location,
      capacity,
      pricePerDay,
      contactPhone,
      description,
      owner,
    } = body;

    if (!propertyName || !propertyType) {
      return Response.json(
        { error: "Property name and type are required" },
        { status: 400 }
      );
    }

    const newProperty = await PropertyBooking.create({
      propertyName,
      propertyType,
      location: location || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      pricePerDay: pricePerDay ? Number(pricePerDay) : undefined,
      contactPhone: contactPhone || undefined,
      description: description || undefined,
      owner: owner || undefined,
      bookedDates: [],
    });

    return Response.json({ property: newProperty }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to create property" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { propertyId, action, date, bookedBy, contactPhone, notes } = body;

    if (!propertyId || !date) {
      return Response.json(
        { error: "Property ID and date are required" },
        { status: 400 }
      );
    }

    const property = await PropertyBooking.findById(propertyId);
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    if (action === "book") {
      // Add or update booking for date
      const existingIndex = property.bookedDates.findIndex((b) => b.date === date);
      const newSlot = {
        date,
        bookedBy: bookedBy || "Booked Member",
        contactPhone: contactPhone || "",
        notes: notes || "",
      };
      if (existingIndex >= 0) {
        property.bookedDates[existingIndex] = newSlot;
      } else {
        property.bookedDates.push(newSlot);
      }
    } else if (action === "free") {
      // Remove booking for date (mark as free)
      property.bookedDates = property.bookedDates.filter((b) => b.date !== date);
    }

    await property.save();
    return Response.json({ property });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to update property booking" },
      { status: 500 }
    );
  }
}
