import { NextRequest, NextResponse } from "next/server";

function getMsgServiceUrl(): string {
  let rawMsgUrl = process.env.MSG_SERVICE_URL;
  if (
    !rawMsgUrl ||
    rawMsgUrl.includes("localhost") ||
    rawMsgUrl.includes("mysocialclan.com") ||
    rawMsgUrl.trim() === ""
  ) {
    rawMsgUrl = "https://community-circle-production.up.railway.app";
  }
  if (rawMsgUrl.startsWith("http://") && rawMsgUrl.includes("railway.app")) {
    rawMsgUrl = rawMsgUrl.replace(/^http:\/\//i, "https://");
  }
  return rawMsgUrl.replace(/\/+$/, "");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get("phoneNumber") || "";
    const checkOnly = searchParams.get("checkOnly") || "";
    const instanceName = searchParams.get("instanceName") || "";

    const msgServiceUrl = getMsgServiceUrl();

    const params = new URLSearchParams();
    if (phoneNumber) params.append("phoneNumber", phoneNumber);
    if (checkOnly) params.append("checkOnly", checkOnly);
    if (instanceName) params.append("instanceName", instanceName);

    const url = `${msgServiceUrl}/api/instance/status${params.toString() ? `?${params.toString()}` : ""}`;

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
        error: `Messaging backend returned HTTP ${res.status}.`,
      });
    }

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({
        success: false,
        isOnline: false,
        state: "DISCONNECTED",
        error: `Gateway returned invalid response (HTTP ${res.status})`,
      });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API invitations/device-status] Error connecting to msgservice:", error);
    return NextResponse.json({
      success: false,
      isOnline: false,
      state: "DISCONNECTED",
      error: `Cannot reach messaging service: ${error.message || "Network error"}`,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, phoneNumber, instanceName } = body;

    const msgServiceUrl = getMsgServiceUrl();

    if (action === "disconnect") {
      // Forward the specific user's phoneNumber and instanceName so msgservice
      // disconnects only their session, not the shared whastflow_bot
      const res = await fetch(`${msgServiceUrl}/api/instance/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber || undefined,
          instanceName: instanceName || undefined,
          platform: "community-circle",
        }),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: true };
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
