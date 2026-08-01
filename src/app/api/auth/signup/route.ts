import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Post } from "@/models/Post";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

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
      company
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

    if (!name || !finalCity) {
      return Response.json({ error: "Missing required fields: name, city" }, { status: 400 });
    }

    let finalMobileNumber = mobileNumber;
    let finalPassword = password;

    if (!finalMobileNumber) {
      if (isChild) {
        finalMobileNumber = `Child_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      } else {
        return Response.json({ error: "Missing required field: mobileNumber" }, { status: 400 });
      }
    }

    if (!finalPassword) {
      if (isChild) {
        finalPassword = "Community123";
      } else {
        return Response.json({ error: "Missing required field: password" }, { status: 400 });
      }
    }

    // Check if user already exists with the same mobileNumber
    const existingUser = await User.findOne({ mobileNumber: finalMobileNumber });
    if (existingUser) {
      return Response.json({ error: "User already exists with this mobile number" }, { status: 400 });
    }

    // Hash the password before saving
    const hashedPassword = hashPassword(finalPassword);

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
    });

    if (parentId) {
      // Add the child to parent's familyMembers list
      await User.findByIdAndUpdate(parentId, {
        $addToSet: { familyMembers: newUser._id },
      });
    }

    // Auto post welcome update to Wall page
    try {
      await Post.create({
        author: newUser._id,
        content: `👋 Welcome **${newUser.name}** to Jambu Community Circle! Let's welcome our new member! 🎉`,
        type: "text",
      });
    } catch (postErr) {
      console.error("Failed to auto-post welcome to Wall:", postErr);
    }

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return Response.json(userResponse, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to sign up" }, { status: 400 });
  }
}
