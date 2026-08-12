import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Community } from "@/models/Community";
import { hashPassword } from "@/lib/auth-crypto";
import { sendWhatsAppMessage } from "@/lib/msgservice";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // "approve" | "reject"

    if (action !== "approve" && action !== "reject") {
      return new Response(
        renderHtmlPage({
          title: "Invalid Request",
          message: "Missing or invalid action parameter. Expected action=approve or action=reject.",
          type: "error",
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
      );
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return new Response(
        renderHtmlPage({
          title: "Member Not Found",
          message: "The registration request could not be found or has already been removed.",
          type: "error",
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 404 }
      );
    }

    // Fetch community name
    let communityName = "Community Circle";
    if (targetUser.communityId) {
      const community = await Community.findById(targetUser.communityId).select("name").lean();
      if (community?.name) {
        communityName = community.name;
      }
    }

    const targetMobile = targetUser.mobileNumber || targetUser.phone;

    if (action === "approve") {
      // Generate a random 6-digit password
      const plainPassword = Math.floor(100000 + Math.random() * 900000).toString();
      targetUser.status = "approved";
      targetUser.password = hashPassword(plainPassword);
      await targetUser.save();

      // Dispatch automated WhatsApp message to member from Evolution API (+91 9644019992)
      let messageSent = false;
      if (targetMobile) {
        const welcomeMessage = `Namaste ${targetUser.name}! 🙏\n\nYour registration request for ${communityName} has been APPROVED! 🎉\n\n🔑 Your Login Credentials:\n• Mobile Number: ${targetMobile}\n• Initial Password: ${plainPassword}\n\nPlease sign in to access your community directory, announcements, and features.\n\nThank you!`;
        const msgRes = await sendWhatsAppMessage({
          phoneNumber: targetMobile,
          message: welcomeMessage,
          title: `Welcome & Credentials - ${targetUser.name}`,
        });
        messageSent = msgRes.success;
      }

      return new Response(
        renderHtmlPage({
          title: "Member Approved Successfully! 🎉",
          candidateName: targetUser.name,
          candidateMobile: targetMobile,
          communityName,
          generatedPassword: plainPassword,
          messageSent,
          type: "success",
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
      );
    } else {
      targetUser.status = "rejected";
      await targetUser.save();

      return new Response(
        renderHtmlPage({
          title: "Registration Rejected ❌",
          candidateName: targetUser.name,
          candidateMobile: targetMobile,
          communityName,
          type: "warning",
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
      );
    }
  } catch (error: any) {
    return new Response(
      renderHtmlPage({
        title: "Processing Error",
        message: error.message || "An error occurred while processing the request.",
        type: "error",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
    );
  }
}

function renderHtmlPage(options: {
  title: string;
  candidateName?: string;
  candidateMobile?: string;
  communityName?: string;
  generatedPassword?: string;
  messageSent?: boolean;
  message?: string;
  type: "success" | "warning" | "error";
}) {
  const isSuccess = options.type === "success";
  const isWarning = options.type === "warning";
  const themeColor = isSuccess ? "#16a34a" : isWarning ? "#ea580c" : "#dc2626";
  const icon = isSuccess ? "✅" : isWarning ? "❌" : "⚠️";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      max-width: 480px;
      width: 100%;
      padding: 32px;
      text-align: center;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      color: #111827;
      font-size: 22px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 12px;
    }
    p {
      color: #4b5563;
      font-size: 15px;
      line-height: 1.5;
      margin: 8px 0;
    }
    .details-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      text-align: left;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .details-row:last-child {
      margin-bottom: 0;
    }
    .label {
      color: #6b7280;
      font-weight: 500;
    }
    .value {
      color: #111827;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 13px;
      color: #ffffff;
      background-color: ${themeColor};
      margin-top: 12px;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${options.title}</h1>

    ${options.message ? `<p>${options.message}</p>` : ""}

    ${
      options.candidateName
        ? `
      <div class="details-box">
        <div class="details-row">
          <span class="label">Member Name:</span>
          <span class="value">${options.candidateName}</span>
        </div>
        ${
          options.candidateMobile
            ? `<div class="details-row">
          <span class="label">Mobile Number:</span>
          <span class="value">${options.candidateMobile}</span>
        </div>`
            : ""
        }
        ${
          options.communityName
            ? `<div class="details-row">
          <span class="label">Community:</span>
          <span class="value">${options.communityName}</span>
        </div>`
            : ""
        }
        ${
          options.generatedPassword
            ? `<div class="details-row">
          <span class="label">6-Digit Password:</span>
          <span class="value" style="color: ${themeColor}; font-size: 16px;">${options.generatedPassword}</span>
        </div>`
            : ""
        }
      </div>
    `
        : ""
    }

    ${
      isSuccess
        ? `<div class="badge">
      ${options.messageSent ? "📱 Password Sent to Member via WhatsApp" : "⚠️ Approved (WhatsApp dispatch pending)"}
    </div>`
        : ""
    }

    <div class="footer">
      Community Circle Administration Portal
    </div>
  </div>
</body>
</html>`;
}
