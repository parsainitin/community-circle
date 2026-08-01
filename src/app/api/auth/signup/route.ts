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
    const { name, phone, mobileNumber, password, gotra, address, age, sex, maritalStatus, bloodGroup, parentId, parentRelationship, avatar } = body;

    if (!name || !mobileNumber || !password) {
      return Response.json({ error: "Missing required fields: name, mobileNumber, password" }, { status: 400 });
    }

    // Check if user already exists with the same mobileNumber
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      return Response.json({ error: "User already exists with this mobile number" }, { status: 400 });
    }

    // Hash the password before saving
    const hashedPassword = hashPassword(password);

    const newUser = await User.create({
      name,
      // Use phone = mobileNumber if phone is not provided, since both are mobile/phone fields
      phone: phone || mobileNumber,
      mobileNumber,
      password: hashedPassword,
      gotra,
      address,
      age: age ? Number(age) : undefined,
      sex,
      maritalStatus,
      bloodGroup,
      avatar: avatar || "",
      parent: parentId || undefined,
      parentRelationship: parentRelationship || undefined,
      familyMembers: parentId ? [parentId] : [],
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
