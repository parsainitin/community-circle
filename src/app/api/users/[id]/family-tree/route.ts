import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Recursive helper to get descendants hierarchical tree
async function getDescendantsTree(userId: string): Promise<any[]> {
  const children = await User.find({ parent: userId }).select("name phone gotra mobileNumber parent avatar sex");
  const results: any[] = [];

  for (const child of children) {
    const childTree = await getDescendantsTree(child._id.toString());
    results.push({
      _id: child._id,
      name: child.name,
      phone: child.phone,
      mobileNumber: child.mobileNumber,
      gotra: child.gotra,
      avatar: child.avatar,
      sex: child.sex,
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

    const user = await User.findById(id).select("name phone gotra mobileNumber parent avatar sex");
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Traverse upwards for ancestors (parent, grandparent, etc.)
    const ancestors = [];
    let currentParentId = user.parent;
    const visited = new Set<string>([id]); // prevent infinite loops in cyclic linkages

    while (currentParentId) {
      const parentIdStr = currentParentId.toString();
      if (visited.has(parentIdStr)) {
        break; // Cycle detected
      }
      visited.add(parentIdStr);

      const parentUser = await User.findById(currentParentId).select("name phone gotra mobileNumber parent avatar sex");
      if (!parentUser) break;

      ancestors.push({
        _id: parentUser._id,
        name: parentUser.name,
        phone: parentUser.phone,
        mobileNumber: parentUser.mobileNumber,
        gotra: parentUser.gotra,
        avatar: parentUser.avatar,
        sex: parentUser.sex,
      });

      currentParentId = parentUser.parent;
    }

    // Fetch descendants recursively
    const descendants = await getDescendantsTree(id);

    return Response.json({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        mobileNumber: user.mobileNumber,
        gotra: user.gotra,
        avatar: user.avatar,
        sex: user.sex,
      },
      ancestors,
      descendants,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
