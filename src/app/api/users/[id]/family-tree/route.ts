import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to get spouse for a user
async function getSpouse(userId: string): Promise<any | null> {
  const user = await User.findById(userId).select("parent parentRelationship");
  if (!user) return null;

  if (user.parent && (user.parentRelationship === "Wife" || user.parentRelationship === "Husband")) {
    return await User.findById(user.parent).select("name phone gotra kulDevi mobileNumber parent avatar sex parentRelationship city village");
  }

  return await User.findOne({
    parent: userId,
    parentRelationship: { $in: ["Wife", "Husband"] }
  }).select("name phone gotra kulDevi mobileNumber parent avatar sex parentRelationship city village");
}

// Recursive helper to get descendants hierarchical tree
async function getDescendantsTree(userId: string, visited: Set<string>): Promise<any[]> {
  const spouse = await getSpouse(userId);
  const parentIds = [userId];
  if (spouse) {
    parentIds.push(spouse._id.toString());
  }

  // Find all children where parent is either spouse of the couple, excluding spouse relations
  const children = await User.find({
    parent: { $in: parentIds },
    parentRelationship: { $nin: ["Wife", "Husband"] }
  }).select("name phone gotra kulDevi mobileNumber parent avatar sex parentRelationship city village");

  const results: any[] = [];

  for (const child of children) {
    const childIdStr = child._id.toString();
    if (visited.has(childIdStr)) continue; // prevent cycle
    visited.add(childIdStr);

    const childSpouse = await getSpouse(childIdStr);
    if (childSpouse) {
      visited.add(childSpouse._id.toString());
    }

    const childTree = await getDescendantsTree(childIdStr, visited);
    results.push({
      _id: child._id,
      name: child.name,
      phone: child.phone,
      mobileNumber: child.mobileNumber,
      gotra: child.gotra,
      kulDevi: child.kulDevi,
      avatar: child.avatar,
      sex: child.sex,
      city: child.city,
      village: child.village,
      parentRelationship: child.parentRelationship,
      spouse: childSpouse ? {
        _id: childSpouse._id,
        name: childSpouse.name,
        phone: childSpouse.phone,
        mobileNumber: childSpouse.mobileNumber,
        gotra: childSpouse.gotra,
        kulDevi: childSpouse.kulDevi,
        avatar: childSpouse.avatar,
        sex: childSpouse.sex,
        city: childSpouse.city,
        village: childSpouse.village,
        parentRelationship: childSpouse.parentRelationship,
      } : null,
      children: childTree,
    });
  }
  return results;
}

// GET /api/users/[id]/family-tree - Generate user family tree
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    const user = await User.findById(id).select("name phone gotra kulDevi mobileNumber parent avatar sex parentRelationship city village");
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const spouse = await getSpouse(id);

    // Track visited nodes to prevent cycles
    const visited = new Set<string>([id]);
    if (spouse) {
      visited.add(spouse._id.toString());
    }

    // Traverse upwards for ancestors (parent, grandparent, etc.)
    const ancestors = [];
    let currentParentId = (user.parentRelationship !== "Wife" && user.parentRelationship !== "Husband")
      ? user.parent
      : null;

    while (currentParentId) {
      const parentIdStr = currentParentId.toString();
      if (visited.has(parentIdStr)) {
        break; // Cycle detected
      }
      visited.add(parentIdStr);

      const parentUser = await User.findById(currentParentId).select("name phone gotra kulDevi mobileNumber parent avatar sex parentRelationship city village");
      if (!parentUser) break;

      const parentSpouse = await getSpouse(parentIdStr);
      if (parentSpouse) {
        visited.add(parentSpouse._id.toString());
      }

      ancestors.push({
        _id: parentUser._id,
        name: parentUser.name,
        phone: parentUser.phone,
        mobileNumber: parentUser.mobileNumber,
        gotra: parentUser.gotra,
        kulDevi: parentUser.kulDevi,
        avatar: parentUser.avatar,
        sex: parentUser.sex,
        city: parentUser.city,
        village: parentUser.village,
        parentRelationship: parentUser.parentRelationship,
        spouse: parentSpouse ? {
          _id: parentSpouse._id,
          name: parentSpouse.name,
          phone: parentSpouse.phone,
          mobileNumber: parentSpouse.mobileNumber,
          gotra: parentSpouse.gotra,
          kulDevi: parentSpouse.kulDevi,
          avatar: parentSpouse.avatar,
          sex: parentSpouse.sex,
          city: parentSpouse.city,
          village: parentSpouse.village,
          parentRelationship: parentSpouse.parentRelationship,
        } : null,
      });

      currentParentId = (parentUser.parentRelationship !== "Wife" && parentUser.parentRelationship !== "Husband")
        ? parentUser.parent
        : null;
    }

    // Fetch descendants recursively
    const descendants = await getDescendantsTree(id, visited);

    return Response.json({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        mobileNumber: user.mobileNumber,
        gotra: user.gotra,
        kulDevi: user.kulDevi,
        avatar: user.avatar,
        sex: user.sex,
        city: user.city,
        village: user.village,
        parentRelationship: user.parentRelationship,
        spouse: spouse ? {
          _id: spouse._id,
          name: spouse.name,
          phone: spouse.phone,
          mobileNumber: spouse.mobileNumber,
          gotra: spouse.gotra,
          kulDevi: spouse.kulDevi,
          avatar: spouse.avatar,
          sex: spouse.sex,
          city: spouse.city,
          village: spouse.village,
          parentRelationship: spouse.parentRelationship,
        } : null,
      },
      ancestors,
      descendants,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
