import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Job, getTenantJobModel } from "@/models/Job";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/jobs/[id] - Get a single job by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const JobModel = await getTenantJobModel(request);
    const { id } = await params;
    
    let job = await JobModel.findById(id)
      .populate("postedBy", "name phone gotra")
      .populate("applicants", "name phone gotra mobileNumber");

    if (!job) {
      job = await Job.findById(id)
        .populate("postedBy", "name phone gotra")
        .populate("applicants", "name phone gotra mobileNumber");
    }

    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }
    return Response.json(job);
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/jobs/[id] - Update a job by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const JobModel = await getTenantJobModel(request);
    const { id } = await params;
    const body = await request.json();
    
    let updatedJob = await JobModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("postedBy", "name phone")
      .populate("applicants", "name phone");

    if (!updatedJob) {
      updatedJob = await Job.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      })
        .populate("postedBy", "name phone")
        .populate("applicants", "name phone");
    }

    if (!updatedJob) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }
    return Response.json(updatedJob);
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to update job" }, { status: 400 });
  }
}

// DELETE /api/jobs/[id] - Delete a job by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const JobModel = await getTenantJobModel(request);
    const { id } = await params;
    
    let deletedJob = await JobModel.findByIdAndDelete(id);
    if (!deletedJob) {
      deletedJob = await Job.findByIdAndDelete(id);
    }
    if (!deletedJob) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }
    return Response.json({ message: "Job deleted successfully" });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
