import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Business } from "@/models/Business";
import { Post } from "@/models/Post";

// GET /api/businesses - List all businesses
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");

    let filter = {};
    if (owner) {
      filter = { owner };
    }

    const businesses = await Business.find(filter)
      .populate("owner", "name phone")
      .sort({ createdAt: -1 });

    return Response.json(businesses);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/businesses - Create a new business
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const newBusiness = await Business.create(body);

    // Auto post update to Wall page
    try {
      await Post.create({
        author: newBusiness.owner,
        content: `🏪 Registered a new business catalog: **${newBusiness.title}**! Check it out in the Business Catalog grid.`,
        type: "text",
      });
    } catch (postErr) {
      console.error("Failed to auto-post business to Wall:", postErr);
    }

    return Response.json(newBusiness, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create business" }, { status: 400 });
  }
}
