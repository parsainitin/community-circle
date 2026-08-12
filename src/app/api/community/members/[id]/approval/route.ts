import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User, getTenantUserModel } from "@/models/User";
import { Community } from "@/models/Community";
import { hashPassword } from "@/lib/auth-crypto";
import { sendWhatsAppMessage } from "@/lib/msgservice";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/community/members/[id]/approval — approve or reject a pending member
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const UserModel = await getTenantUserModel(request);
    const { id } = await params;
    const body = await request.json();
    const { callerMobile, action, password, isPropertyManager } = body; // action: "approve" | "reject" | "toggle_property_manager"

    if (!callerMobile || !action) {
      return Response.json({ error: "Missing required fields: callerMobile, action" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject" && action !== "toggle_property_manager") {
      return Response.json({ error: "Action must be 'approve', 'reject', or 'toggle_property_manager'" }, { status: 400 });
    }

    const caller = await UserModel.findOne({ mobileNumber: callerMobile }).lean();
    if (!caller || (caller.role !== "admin" && caller.role !== "super-admin")) {
      return Response.json({ error: "Forbidden: Only community admins can manage member roles" }, { status: 403 });
    }

    const targetUser = await UserModel.findById(id);
    if (!targetUser) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify admin is in the same community (super-admin bypasses)
    if (caller.role === "admin" && String(caller.communityId) !== String(targetUser.communityId)) {
      return Response.json({ error: "Forbidden: Cannot manage members outside your community" }, { status: 403 });
    }

    let generatedPassword = "";
    let messageSent = false;
    let messageError: string | undefined = undefined;

    if (action === "toggle_property_manager") {
      targetUser.isPropertyManager = typeof isPropertyManager === "boolean" ? isPropertyManager : !targetUser.isPropertyManager;
    } else {
      const newStatus = action === "approve" ? "approved" : "rejected";
      targetUser.status = newStatus;
      if (action === "approve") {
        const plainPassword = (password && String(password).trim() !== "")
          ? String(password).trim()
          : Math.floor(100000 + Math.random() * 900000).toString();
        
        generatedPassword = plainPassword;
        targetUser.password = hashPassword(plainPassword);
        
        if (typeof isPropertyManager === "boolean") {
          targetUser.isPropertyManager = isPropertyManager;
        }

        // Fetch community details for customized message
        let communityName = "Community Circle";
        if (targetUser.communityId) {
          const community = await Community.findById(targetUser.communityId).select("name").lean();
          if (community?.name) {
            communityName = community.name;
          }
        }

        const targetMobile = targetUser.mobileNumber || targetUser.phone;
        if (targetMobile) {
          const messageText = `Namaste ${targetUser.name}! 🙏\n\nYour registration request for ${communityName} has been APPROVED! 🎉\n\n🔑 Your Login Credentials:\n• Mobile Number: ${targetMobile}\n• Initial Password: ${plainPassword}\n\nPlease sign in to access your community directory, announcements, and features.\n\nThank you!`;
          
          const msgResponse = await sendWhatsAppMessage({
            phoneNumber: targetMobile,
            message: messageText,
            title: `Member Approval - ${targetUser.name}`,
          });

          messageSent = msgResponse.success;
          if (!msgResponse.success) {
            messageError = msgResponse.error;
          }
        }
      }
    }

    await targetUser.save();

    const userObj = targetUser.toObject();
    delete (userObj as any).password;

    return Response.json({
      message: `Member ${action} updated successfully`,
      user: userObj,
      generatedPassword: generatedPassword || undefined,
      messageSent,
      messageError,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to update member approval status" }, { status: 500 });
  }
}

