import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { PropertyBooking, getTenantPropertyBookingModel } from "@/models/PropertyBooking";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const PropertyBookingModel = await getTenantPropertyBookingModel(request);
    const properties = await PropertyBookingModel.find({})
      .populate("owner", "name mobileNumber phone avatar")
      .sort({ createdAt: -1 })
      .lean();
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
      packages,
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

    const cleanPackages = Array.isArray(packages)
      ? packages
          .map((pkg: any) => ({
            name: String(pkg.name || "").trim(),
            pricePerDay: Number(pkg.pricePerDay || 0),
            description: pkg.description ? String(pkg.description).trim() : undefined,
          }))
          .filter((pkg: any) => pkg.name && pkg.pricePerDay > 0)
      : [];

    const newProperty = await PropertyBookingModel.create({
      propertyName: cleanName,
      propertyType: cleanType,
      location: location ? String(location).trim() : undefined,
      capacity: capacity ? Number(capacity) : undefined,
      pricePerDay: pricePerDay ? Number(pricePerDay) : undefined,
      contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      packages: cleanPackages,
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
    const {
      propertyId,
      action,
      date,
      bookedBy,
      contactPhone,
      notes,
      packageName,
      propertyName,
      propertyType,
      location,
      capacity,
      pricePerDay,
      description,
      packages,
    } = body;

    const cleanPropId = String(propertyId || "").trim();

    if (!cleanPropId || !mongoose.Types.ObjectId.isValid(cleanPropId)) {
      return Response.json(
        { error: "Valid Property ID is required" },
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

    if (action === "updatePackages" || action === "updateProperty") {
      if (propertyName !== undefined) property.propertyName = String(propertyName).trim();
      if (propertyType !== undefined) property.propertyType = String(propertyType).trim();
      if (location !== undefined) property.location = String(location).trim();
      if (capacity !== undefined) property.capacity = Number(capacity);
      if (pricePerDay !== undefined) property.pricePerDay = Number(pricePerDay);
      if (contactPhone !== undefined) property.contactPhone = String(contactPhone).trim();
      if (description !== undefined) property.description = String(description).trim();
      if (Array.isArray(packages)) {
        property.packages = packages
          .map((pkg: any) => ({
            name: String(pkg.name || "").trim(),
            pricePerDay: Number(pkg.pricePerDay || 0),
            description: pkg.description ? String(pkg.description).trim() : undefined,
          }))
          .filter((pkg: any) => pkg.name && pkg.pricePerDay > 0);
      }
    } else if (action === "book") {
      const cleanDate = String(date || "").trim();
      if (!cleanDate) {
        return Response.json({ error: "Date is required for booking" }, { status: 400 });
      }
      const todayStr = new Date().toISOString().split("T")[0];
      if (cleanDate < todayStr) {
        return Response.json({ error: "Booking date cannot be in the past" }, { status: 400 });
      }
      const existingIndex = property.bookedDates.findIndex((b) => b.date === cleanDate);
      const newSlot = {
        date: cleanDate,
        bookedBy: String(bookedBy || "Booked Member").trim(),
        contactPhone: String(contactPhone || "").trim(),
        notes: String(notes || "").trim(),
        packageName: packageName ? String(packageName).trim() : undefined,
      };
      if (existingIndex >= 0) {
        property.bookedDates[existingIndex] = newSlot;
      } else {
        property.bookedDates.push(newSlot);
      }
    } else if (action === "free") {
      const cleanDate = String(date || "").trim();
      if (!cleanDate) {
        return Response.json({ error: "Date is required to free booking" }, { status: 400 });
      }
      property.bookedDates = property.bookedDates.filter((b) => b.date !== cleanDate);
    }

    await property.save();
    return Response.json({ property });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to update property" },
      { status: 500 }
    );
  }
}
