import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dwexzmd4s",
  api_key: process.env.CLOUDINARY_API_KEY || "819348332248451", // Fallback to provided keys if env not fully loaded
  api_secret: process.env.CLOUDINARY_API_SECRET || "RfAmWrlgQJcoTT0pjYJH6CrzYeU",
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 5 MB size limit enforcement
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "File exceeds maximum size limit of 5MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Stream upload to Cloudinary
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "jambu_community_circle",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as any);
          }
        )
        .end(buffer);
    });

    return Response.json({ url: uploadResult.secure_url });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return Response.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
