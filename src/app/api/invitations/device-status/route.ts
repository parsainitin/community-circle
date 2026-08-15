import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get("phoneNumber") || "";
    const checkOnly = searchParams.get("checkOnly") || "";

    const rawMsgUrl =
      process.env.MSG_SERVICE_URL ||
      "https://community-circle-production.up.railway.app";
    const msgServiceUrl = rawMsgUrl.replace(/\/+$/, "");

    let url = `${msgServiceUrl}/api/instance/status`;
    const params = new URLSearchParams();
    if (phoneNumber) params.append("phoneNumber", phoneNumber);
    if (checkOnly) params.append("checkOnly", checkOnly);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        isOnline: false,
        state: "OFFLINE",
        error: `Messaging backend returned HTTP ${res.status}. Check MSG_SERVICE_URL in Netlify settings.`,
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API invitations/device-status] Error connecting to msgservice:", error);
    return NextResponse.json({
      success: false,
      isOnline: false,
      state: "DISCONNECTED",
      error: `Cannot reach messaging service: ${error.message || "Network error"}. Ensure MSG_SERVICE_URL is configured in Netlify.`,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const rawMsgUrl =
      process.env.MSG_SERVICE_URL ||
      "https://community-circle-production.up.railway.app";
    const msgServiceUrl = rawMsgUrl.replace(/\/+$/, "");

    if (action === "disconnect") {
      const res = await fetch(`${msgServiceUrl}/api/instance/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({ success: true }));
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
