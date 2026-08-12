import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User, getTenantUserModel } from "@/models/User";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const UserModel = await getTenantUserModel(request);
    const { id } = await params;
    const { relativeId, relationshipType } = await request.json();

    if (!relativeId || !relationshipType || !["parent", "child"].includes(relationshipType)) {
      return Response.json({ error: "Invalid relativeId or relationshipType" }, { status: 400 });
    }

    if (id === relativeId) {
      return Response.json({ error: "Cannot link a user to themselves" }, { status: 400 });
    }

    let user = await UserModel.findById(id);
    if (!user) user = await User.findById(id);

    let relative = await UserModel.findById(relativeId);
    if (!relative) relative = await User.findById(relativeId);

    if (!user || !relative) {
      return Response.json({ error: "User or relative not found" }, { status: 404 });
    }

    if (relationshipType === "parent") {
      // Set user's parent to relative
      user.parent = relativeId as any;
      user.parentRelationship = relative.sex === "Female" ? "Mother" : "Father";
      
      // Update user's familyMembers
      if (!user.familyMembers.some((fid) => fid.toString() === relativeId)) {
        user.familyMembers.push(relativeId as any);
      }
      
      // Update parent's familyMembers
      await UserModel.findByIdAndUpdate(relativeId, {
        $addToSet: { familyMembers: id },
      });
      await User.findByIdAndUpdate(relativeId, {
        $addToSet: { familyMembers: id },
      });
      
      await user.save();
    } else if (relationshipType === "child") {
      // Set relative's parent to user
      relative.parent = id as any;
      relative.parentRelationship = relative.sex === "Female" ? "Daughter" : "Son";

      // Update relative's familyMembers
      if (!relative.familyMembers.some((fid) => fid.toString() === id)) {
        relative.familyMembers.push(id as any);
      }

      // Update user's familyMembers
      await UserModel.findByIdAndUpdate(id, {
        $addToSet: { familyMembers: relativeId },
      });
      await User.findByIdAndUpdate(id, {
        $addToSet: { familyMembers: relativeId },
      });

      await relative.save();
    }

    return Response.json({ message: "Family relationship linked successfully" });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
