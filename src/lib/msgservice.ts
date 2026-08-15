interface SendWhatsAppMessageParams {
  phoneNumber: string;
  message: string;
  title?: string;
}

export interface SendWhatsAppMessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Sends a direct WhatsApp text message via msgservice (whastflow-backend).
 */
export async function sendWhatsAppMessage({
  phoneNumber,
  message,
  title = "Member Notification",
}: SendWhatsAppMessageParams): Promise<SendWhatsAppMessageResponse> {
  const rawMsgUrl = process.env.MSG_SERVICE_URL || "http://localhost:3000";
  const msgServiceUrl = rawMsgUrl.replace(/\/+$/, "");

  try {
    const response = await fetch(`${msgServiceUrl}/api/message/direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumbers: [phoneNumber],
        message,
        title,
      }),
    });

    const result = await response.json();

    if (
      !response.ok ||
      result.success === false ||
      (result.data && result.data.failedDeliveries > 0 && result.data.successfulDeliveries === 0)
    ) {
      console.error("[msgservice client] Failed response:", result);
      return {
        success: false,
        error: result.error || result.message || "WhatsApp gateway failed to deliver message",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    console.error("[msgservice client] Error calling msgservice:", error.message || error);
    return {
      success: false,
      error: error.message || "Failed to reach msgservice API",
    };
  }
}

interface NotifyAdminParams {
  adminPhoneNumbers: string[];
  memberName: string;
  memberMobile: string;
  memberCity?: string;
  communityName?: string;
  memberId: string;
}

/**
 * Sends a WhatsApp notification to Admin(s) with candidate info and Approve/Reject action links.
 */
export async function notifyAdminNewRegistration({
  adminPhoneNumbers,
  memberName,
  memberMobile,
  memberCity = "Not specified",
  communityName = "Community Circle",
  memberId,
}: NotifyAdminParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  const approveUrl = `${baseUrl}/api/community/members/${memberId}/quick-approval?action=approve`;
  const rejectUrl = `${baseUrl}/api/community/members/${memberId}/quick-approval?action=reject`;

  const messageText = `🔔 *New Registration Request Alert!*

👤 *Candidate Name:* ${memberName}
📱 *Candidate Mobile:* ${memberMobile}
📍 *City:* ${memberCity}
🏰 *Community:* ${communityName}

Please select an action below to process:

✅ *Approve Member:*
${approveUrl}

❌ *Reject Member:*
${rejectUrl}`;

  const results = [];
  for (const adminPhone of adminPhoneNumbers) {
    if (adminPhone && adminPhone.trim()) {
      const res = await sendWhatsAppMessage({
        phoneNumber: adminPhone,
        message: messageText,
        title: `Admin Registration Alert - ${memberName}`,
      });
      results.push(res);
    }
  }

  return results;
}

