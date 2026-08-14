import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/msgservice";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipients, title, message } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients selected for broadcast" },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Invitation message body is required" },
        { status: 400 }
      );
    }

    const fullMessage = title ? `*${title}*\n\n${message}` : message;

    const results = [];
    for (const recipient of recipients) {
      const phone = recipient.phone;
      if (phone && phone.trim()) {
        const res = await sendWhatsAppMessage({
          phoneNumber: phone.trim(),
          message: fullMessage,
          title: title || "Digital Invitation",
        });

        results.push({
          name: recipient.name,
          phone: recipient.phone,
          success: res.success,
          error: res.error,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      total: recipients.length,
      sentCount: successCount,
      logs: results,
    });
  } catch (error: any) {
    console.error("Error broadcasting invitation messages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to broadcast invitations" },
      { status: 500 }
    );
  }
}
