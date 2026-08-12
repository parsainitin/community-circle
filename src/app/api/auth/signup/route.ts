import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User, getTenantUserModel } from "@/models/User";
import { Post } from "@/models/Post";
import { Community } from "@/models/Community";
import { getTenantId } from "@/lib/tenant";
import { hashPassword } from "@/lib/auth-crypto";
import { notifyAdminNewRegistration } from "@/lib/msgservice";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const UserModel = await getTenantUserModel(request);
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
      const parentUser = await UserModel.findById(parentId);
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
          const checkUser = await UserModel.findOne({ mobileNumber: uniqueId }).lean();
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

    const cleanMobile = (finalMobileNumber || "").trim();
    const digits = cleanMobile.replace(/\D/g, "");

    // Check if user already exists with the same mobileNumber in this tenant DB
    const existingUser = await UserModel.findOne({
      $or: [
        { mobileNumber: cleanMobile },
        { mobile: cleanMobile },
        { phone: cleanMobile },
        ...(digits.length >= 10 ? [{ mobile: { $regex: digits.slice(-10) + "$" } }] : []),
        ...(digits.length >= 10 ? [{ mobileNumber: { $regex: digits.slice(-10) + "$" } }] : []),
        ...(digits.length >= 10 ? [{ phone: { $regex: digits.slice(-10) + "$" } }] : []),
      ],
    });

    if (existingUser) {
      return Response.json({ error: "This mobile number is already registered" }, { status: 400 });
    }

    if (email) {
      const emailTaken = await UserModel.findOne({ email: email.toLowerCase() });
      if (emailTaken) {
        return Response.json({ error: "This email address is already registered" }, { status: 400 });
      }
    }

    // Hash the password before saving
    const hashedPassword = hashPassword(finalPassword);

    const communityId = await getTenantId(request);

    const newUser: any = await UserModel.create({
      name,
      phone: phone || finalMobileNumber,
      mobile: finalMobileNumber,
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
      role: "member",
      communityId: communityId ?? undefined,
    });

    if (parentId) {
      // Add the child to parent's familyMembers list
      await UserModel.findByIdAndUpdate(parentId, {
        $addToSet: { familyMembers: newUser._id },
      });
    }

    // Explicitly update status in database to pending to ensure field is set in MongoDB
    await UserModel.updateOne({ _id: newUser._id }, { $set: { status: "pending" } });

    // Fetch community name
    let communityName = "Community Circle";
    if (communityId) {
      const commObj = await Community.findById(communityId).select("name").lean();
      if (commObj?.name) {
        communityName = commObj.name;
      }
    }

    // Notify Community Admin ONLY via WhatsApp (excluding super-admin and fallback numbers)
    try {
      const adminList: string[] = [];
      if (communityId) {
        // Query users who are assigned as community admin for this community
        const communityAdmins = await UserModel.find({
          role: { $in: ["admin", "COMMUNITY_ADMIN"] as any },
        }).select("mobileNumber phone mobile").lean();



        for (const adm of communityAdmins) {
          const num = adm.mobileNumber || adm.phone;
          const cleanNum = num ? num.replace(/\D/g, "") : "";
          if (
            cleanNum &&
            cleanNum !== "9999912345" &&
            cleanNum !== "919644019992" &&
            cleanNum !== "9644019992"
          ) {
            adminList.push(num);
          }
        }
      }

      if (adminList.length > 0) {
        await notifyAdminNewRegistration({
          adminPhoneNumbers: adminList,
          memberName: newUser.name,
          memberMobile: finalMobileNumber,
          memberCity: finalCity || "Not specified",
          communityName,
          memberId: String(newUser._id),
        });
      } else {
        console.log(`[signup route] No dedicated Community Admin found for communityId: ${communityId}. Notification omitted.`);
      }
    } catch (notifyErr: any) {
      console.error("[signup route] Failed to notify admin via WhatsApp:", notifyErr.message || notifyErr);
    }


    // Remove password from response and ensure status is pending
    const userResponse = newUser.toObject();
    delete userResponse.password;
    userResponse.status = "pending";

    return Response.json(userResponse, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to sign up" }, { status: 400 });
  }
}

