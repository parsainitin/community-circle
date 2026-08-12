import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Job, getTenantJobModel } from "@/models/Job";
import { Post, getTenantPostModel } from "@/models/Post";

// GET /api/jobs - List all jobs
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const JobModel = await getTenantJobModel(request);
    const { searchParams } = new URL(request.url);
    const postedBy = searchParams.get("postedBy");

    let filter = {};
    if (postedBy) {
      filter = { postedBy };
    }

    let jobs = await JobModel.find(filter)
      .populate("postedBy", "name phone")
      .populate("applicants", "name phone")
      .sort({ createdAt: -1 });

    if (jobs.length === 0 && JobModel !== Job) {
      jobs = await Job.find(filter)
        .populate("postedBy", "name phone")
        .populate("applicants", "name phone")
        .sort({ createdAt: -1 });
    }

    return Response.json(jobs);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const JobModel = await getTenantJobModel(request);
    const PostModel = await getTenantPostModel(request);
    const body = await request.json();
    const newJob = await JobModel.create(body);

    // Auto post update to Wall page
    try {
      await PostModel.create({
        author: newJob.postedBy,
        content: `💼 Posted a new job opening: **${newJob.title}**! Check it out in the Jobs feed.`,
        type: "text",
      });
    } catch (postErr) {
      console.error("Failed to auto-post job to Wall:", postErr);
    }

    return Response.json(newJob, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to create job" }, { status: 400 });
  }
}
