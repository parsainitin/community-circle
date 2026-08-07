import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Post } from "@/models/Post";
import { getTenantId } from "@/lib/tenant";
import { hashPassword } from "@/lib/auth-crypto";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      name,
      phone,
      mobileNumber,
      password,
      gotra,
      kulDevi,
      address,
      city,
      village,
      age,
      sex,
      maritalStatus,
      bloodGroup,
      parentId,
      parentRelationship,
      avatar,
      education,
      institution,
      occupationType,
      profession,
      company,
      email,
      latitude,
      longitude,
      googleMapsUrl,
    } = body;

    const isChild = parentRelationship === "Son" || parentRelationship === "Daughter";

    let finalCity = city;
    let finalVillage = village;
    let finalAddress = address;

    if (!finalCity && parentId) {
      const parentUser = await User.findById(parentId);
      if (parentUser) {
        finalCity = parentUser.city;
        if (!finalVillage) {
          finalVillage = parentUser.village;
        }
        if (!finalAddress) {
          finalAddress = parentUser.address;
        }
      }
    }

    if (!name) {
      return Response.json({ error: "Missing required field: name" }, { status: 400 });
    }

    if (!finalCity) {
      finalCity = "";
    }

    let finalMobileNumber = mobileNumber;
    let finalPassword = password;

    if (!finalMobileNumber) {
      if (isChild) {
        // Generate a 10-character alphanumeric ID for child/dependent without mobile number
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let uniqueId = "";
        let isTaken = true;
        let attempts = 0;
        while (isTaken && attempts < 10) {
          uniqueId = "";
          for (let i = 0; i < 10; i++) {
            uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          const checkUser = await User.findOne({ mobileNumber: uniqueId }).lean();
          isTaken = !!checkUser;
          attempts++;
        }
        finalMobileNumber = uniqueId;
      } else {
        return Response.json({ error: "Missing required field: mobileNumber" }, { status: 400 });
      }
    }

    if (!finalPassword) {
      // Generate a random 6-digit initial key (e.g. 482910)
      finalPassword = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Check if user already exists with the same mobileNumber
    const existingUser = await User.findOne({ mobileNumber: finalMobileNumber });
    if (existingUser) {
      return Response.json({ error: "User already exists with this mobile number" }, { status: 400 });
    }

    if (email) {
      const emailTaken = await User.findOne({ email: email.toLowerCase() });
      if (emailTaken) {
        return Response.json({ error: "This email address is already registered" }, { status: 400 });
      }
    }

    // Hash the password before saving
    const hashedPassword = hashPassword(finalPassword);

    const communityId = await getTenantId(request);

    const newUser = await User.create({
      name,
      phone: phone || finalMobileNumber,
      mobileNumber: finalMobileNumber,
      password: hashedPassword,
      gotra,
      kulDevi,
      address: finalAddress,
      city: finalCity,
      village: finalVillage,
      age: age ? Number(age) : undefined,
      sex,
      maritalStatus,
      bloodGroup,
      avatar: avatar || "",
      parent: parentId || undefined,
      parentRelationship: parentRelationship || undefined,
      familyMembers: parentId ? [parentId] : [],
      education,
      institution,
      occupationType,
      profession,
      company,
      email: email ? email.toLowerCase() : undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      googleMapsUrl: googleMapsUrl || undefined,
      status: "pending",
      communityId: communityId ?? undefined,
    });

    if (parentId) {
      // Add the child to parent's familyMembers list
      await User.findByIdAndUpdate(parentId, {
        $addToSet: { familyMembers: newUser._id },
      });
    }

    // Explicitly update status in database to pending to ensure field is set in MongoDB
    await User.updateOne({ _id: newUser._id }, { $set: { status: "pending" } });

    // Remove password from response and ensure status is pending
    const userResponse = newUser.toObject();
    delete userResponse.password;
    userResponse.status = "pending";

    return Response.json(userResponse, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to sign up" }, { status: 400 });
  }
}
