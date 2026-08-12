import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { PropertyBooking, getTenantPropertyBookingModel } from "@/models/PropertyBooking";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const PropertyBookingModel = await getTenantPropertyBookingModel(request);
    let properties = await PropertyBookingModel.find({}).sort({ createdAt: -1 }).lean();
    if (properties.length === 0 && PropertyBookingModel !== PropertyBooking) {
      properties = await PropertyBooking.find({}).sort({ createdAt: -1 }).lean();
    }
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
    const PropertyBookingModel = await getTenantPropertyBookingModel(request);
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

    const cleanName = String(propertyName || "").trim();
    const cleanType = String(propertyType || "").trim();

    if (!cleanName || !cleanType) {
      return Response.json(
        { error: "Property name and type are required" },
        { status: 400 }
      );
    }

    const newProperty = await PropertyBookingModel.create({
      propertyName: cleanName,
      propertyType: cleanType,
      location: location ? String(location).trim() : undefined,
      capacity: capacity ? Number(capacity) : undefined,
      pricePerDay: pricePerDay ? Number(pricePerDay) : undefined,
      contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      owner: owner && mongoose.Types.ObjectId.isValid(owner) ? owner : undefined,
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
    const PropertyBookingModel = await getTenantPropertyBookingModel(request);
    const body = await request.json();
    const { propertyId, action, date, bookedBy, contactPhone, notes } = body;

    const cleanPropId = String(propertyId || "").trim();
    const cleanDate = String(date || "").trim();

    if (!cleanPropId || !mongoose.Types.ObjectId.isValid(cleanPropId) || !cleanDate) {
      return Response.json(
        { error: "Valid Property ID and date are required" },
        { status: 400 }
      );
    }

    let property = await PropertyBookingModel.findById(cleanPropId);
    if (!property) {
      property = await PropertyBooking.findById(cleanPropId);
    }
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    if (action === "book") {
      const existingIndex = property.bookedDates.findIndex((b) => b.date === cleanDate);
      const newSlot = {
        date: cleanDate,
        bookedBy: String(bookedBy || "Booked Member").trim(),
        contactPhone: String(contactPhone || "").trim(),
        notes: String(notes || "").trim(),
      };
      if (existingIndex >= 0) {
        property.bookedDates[existingIndex] = newSlot;
      } else {
        property.bookedDates.push(newSlot);
      }
    } else if (action === "free") {
      property.bookedDates = property.bookedDates.filter((b) => b.date !== cleanDate);
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
