"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ArrowLeft,
  Phone,
  MapPin,
  ShieldAlert,
  Heart,
  Briefcase,
  GraduationCap,
  Calendar,
  Users,
  RefreshCw,
  Eye,
  X,
  Check,
  Mail,
  Home,
  User,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";

interface Member {
  _id: string;
  name: string;
  mobileNumber: string;
  phone?: string;
  email?: string;
  city?: string;
  village?: string;
  address?: string;
  gotra?: string;
  kulDevi?: string;
  bloodGroup?: string;
  age?: number;
  sex?: string;
  maritalStatus?: string;
  avatar?: string;
  education?: string;
  institution?: string;
  occupationType?: string;
  profession?: string;
  company?: string;
  role?: string;
  isPropertyManager?: boolean;
  parent?: { _id: string; name: string; mobileNumber: string } | string;
  parentRelationship?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function CommunityAdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inspection Modal State
  const [inspectMember, setInspectMember] = useState<Member | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchMembers = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/community/members?status=${activeTab}`, {
        headers: {
          "x-caller-mobile": user.mobileNumber,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        setPendingCount(data.pendingCount || 0);
      } else {
        setErrorMessage(data.error || "Failed to fetch community members");
      }
    } catch {
      setErrorMessage("Network error while fetching members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role !== "admin" && user.role !== "super-admin") {
        router.replace("/");
        return;
      }
      fetchMembers();
    }
  }, [user, activeTab]);

  // Approval Modal & WhatsApp credentials state
  const [approvalModalMember, setApprovalModalMember] = useState<Member | null>(null);
  const [approvalPassword, setApprovalPassword] = useState("");
  const [makePropertyManager, setMakePropertyManager] = useState(false);

  const generate6DigitKey = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleOpenApproveModal = (member: Member) => {
    setApprovalModalMember(member);
    setApprovalPassword(generate6DigitKey());
    setMakePropertyManager(!!member.isPropertyManager);
  };

  const handleApprovalAction = async (
    memberId: string,
    action: "approve" | "reject",
    customPassword?: string,
    isPropMgr?: boolean
  ) => {
    if (!user) return null;
    setProcessingId(memberId);
    try {
      const res = await fetch(`/api/community/members/${memberId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerMobile: user.mobileNumber,
          action,
          password: customPassword && customPassword.trim() !== "" ? customPassword.trim() : undefined,
          isPropertyManager: isPropMgr,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "approve") {
          const pwdNotice = data.generatedPassword ? ` | Password: ${data.generatedPassword}` : "";
          const msgNotice = data.messageSent
            ? " | 📱 WhatsApp sent!"
            : data.messageError
            ? ` | ⚠️ WhatsApp: ${data.messageError}`
            : "";
          showToast(`✅ ${data.user.name} approved!${pwdNotice}${msgNotice}`);
        } else {
          showToast(`❌ ${data.user.name} registration rejected.`);
        }

        // Update inspecting member if currently open
        if (inspectMember && inspectMember._id === memberId) {
          setInspectMember({
            ...inspectMember,
            status: action === "approve" ? "approved" : "rejected",
            isPropertyManager: data.user?.isPropertyManager,
          });
        }

        fetchMembers();
        return data;
      } else {
        alert(data.error || `Failed to ${action} member`);
        return null;
      }
    } catch {
      alert(`Network error trying to ${action} member`);
      return null;
    } finally {
      setProcessingId(null);
    }
  };

  const handleTogglePropertyManager = async (memberId: string, currentVal?: boolean) => {
    if (!user) return;
    setProcessingId(memberId);
    try {
      const res = await fetch(`/api/community/members/${memberId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerMobile: user.mobileNumber,
          action: "toggle_property_manager",
          isPropertyManager: !currentVal,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          !currentVal
            ? `🏢 ${data.user.name} designated as Property Manager!`
            : `ℹ️ Property Manager role removed for ${data.user.name}`
        );
        if (inspectMember && inspectMember._id === memberId) {
          setInspectMember({ ...inspectMember, isPropertyManager: !currentVal });
        }
        fetchMembers();
      } else {
        alert(data.error || "Failed to update property manager status");
      }
    } catch {
      alert("Network error updating property manager status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!user) return;
    if (
      !confirm(
        `⚠️ Are you sure you want to PERMANENTLY delete member "${memberName}"?\n\nThis action will remove the user account and member details permanently.`
      )
    ) {
      return;
    }

    setProcessingId(memberId);
    try {
      const res = await fetch(`/api/users/${memberId}`, {
        method: "DELETE",
        headers: {
          "x-caller-mobile": user.mobileNumber,
        },
      });

      if (res.ok) {
        showToast(`🗑️ Member ${memberName} deleted successfully!`);
        if (inspectMember && inspectMember._id === memberId) {
          setInspectMember(null);
        }
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete member");
      }
    } catch {
      alert("Network error while trying to delete member");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveWithWhatsApp = async () => {
    if (!approvalModalMember || !user) return;
    const member = approvalModalMember;
    const passToSet = approvalPassword.trim() || undefined;

    const data = await handleApprovalAction(member._id, "approve", passToSet, makePropertyManager);
    setApprovalModalMember(null);

    const activePassword = data?.generatedPassword || passToSet || "6-digit random password";
    const cleanMobile = member.mobileNumber.replace(/\D/g, "");
    const formattedMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const message = `Namaste ${member.name}! 🙏\n\nYour registration on Community Circle has been APPROVED! 🎉${makePropertyManager ? "\n🏢 You have been designated as a Property Manager." : ""}\n\n🔑 Your login credentials:\n• Mobile Number: ${cleanMobile}\n• Initial Password: ${activePassword}\n\nPlease sign in at ${window.location.origin}/auth to access your community directory, hubs, and family tree.`;
    const waUrl = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleApproveOnly = async () => {
    if (!approvalModalMember || !user) return;
    const passToSet = approvalPassword.trim() || undefined;
    await handleApprovalAction(approvalModalMember._id, "approve", passToSet, makePropertyManager);
    setApprovalModalMember(null);
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.mobileNumber.includes(q) ||
      (m.city && m.city.toLowerCase().includes(q)) ||
      (m.gotra && m.gotra.toLowerCase().includes(q))
    );
  });

  const exportToCSV = () => {
    if (!filteredMembers || filteredMembers.length === 0) return;
    const headers = [
      "Name",
      "Mobile Number",
      "Alternate Phone",
      "City",
      "Village",
      "Address",
      "Gotra",
      "KulDevi",
      "Blood Group",
      "Gender",
      "Age",
      "Marital Status",
      "Education",
      "Institution",
      "Occupation Type",
      "Profession",
      "Company",
      "Role",
      "Approval Status",
      "Registration Date",
    ];

    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const csvRows = [
      headers.join(","),
      ...filteredMembers.map((row) =>
        [
          escapeCSV(row.name),
          escapeCSV(row.mobileNumber),
          escapeCSV(row.phone),
          escapeCSV(row.city),
          escapeCSV(row.village),
          escapeCSV(row.address),
          escapeCSV(row.gotra),
          escapeCSV(row.kulDevi),
          escapeCSV(row.bloodGroup),
          escapeCSV(row.sex),
          escapeCSV(row.age),
          escapeCSV(row.maritalStatus),
          escapeCSV(row.education),
          escapeCSV(row.institution),
          escapeCSV(row.occupationType),
          escapeCSV(row.profession),
          escapeCSV(row.company),
          escapeCSV(row.role || "member"),
          escapeCSV(row.status || "pending"),
          escapeCSV(row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ""),
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `community_members_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Bulk Upload States
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ addedCount: number; skippedCount: number; errors: string[] } | null>(null);

  const downloadCSVTemplate = () => {
    const headers = [
      "Name",
      "Mobile Number",
      "Email",
      "City",
      "Village",
      "Address",
      "Gotra",
      "KulDevi",
      "Age",
      "Sex",
      "Marital Status",
      "Blood Group",
      "Education",
      "Institution",
      "Occupation Type",
      "Profession",
      "Company",
    ];

    const sampleRow1 = [
      '"Rajesh Sharma"',
      '"9876543210"',
      '"rajesh.sharma@example.com"',
      '"Indore"',
      '"Ashta"',
      '"123 M.G. Road"',
      '"Kashyap"',
      '"Bijasan"',
      '"35"',
      '"Male"',
      '"Married"',
      '"B+"',
      '"B.Tech"',
      '"IIT Indore"',
      '"Business"',
      '"Entrepreneur"',
      '"Sharma Enterprises"',
    ];

    const sampleRow2 = [
      '"Priya Verma"',
      '"9876543211"',
      '"priya.verma@example.com"',
      '"Bhopal"',
      '"Sehore"',
      '"45 Park Street"',
      '"Vatsa"',
      '"Bhavani"',
      '"28"',
      '"Female"',
      '"Single"',
      '"O+"',
      '"M.Sc"',
      '"Bhopal University"',
      '"Service"',
      '"Software Engineer"',
      '"TCS"',
    ];

    const csvContent = [headers.join(","), sampleRow1.join(","), sampleRow2.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `community_members_upload_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r\n|\n/);
    if (lines.length <= 1) return [];

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map((col) => col.replace(/^"|"$/g, "").trim());
    };

    const headers = parseCSVLine(lines[0]);
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = parseCSVLine(line);
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) {
          rowObj[h] = values[idx] || "";
        }
      });
      rows.push(rowObj);
    }
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    setBulkResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const rows = parseCSVText(text);
        setParsedRows(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkUpload = async () => {
    if (!user || parsedRows.length === 0) return;
    setBulkUploading(true);
    try {
      const res = await fetch("/api/community/members/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-caller-mobile": user.mobileNumber,
        },
        body: JSON.stringify({
          callerMobile: user.mobileNumber,
          membersData: parsedRows,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBulkResult({
          addedCount: data.addedCount,
          skippedCount: data.skippedCount,
          errors: data.errors || [],
        });
        showToast(`🎉 Bulk import finished: ${data.addedCount} members added!`);
        fetchMembers();
      } else {
        alert(data.error || "Failed to bulk upload members");
      }
    } catch {
      alert("Network error during bulk upload");
    } finally {
      setBulkUploading(false);
    }
  };

  const getParentName = (m: Member): string | null => {
    if (!m.parent) return null;
    if (typeof m.parent === "object" && m.parent.name) {
      return m.parent.name;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-whatsapp-green text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push("/")}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors border-0 text-white cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-extrabold tracking-wide flex items-center space-x-2">
                <span>Member Approvals</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </h1>
              <p className="text-[11px] text-emerald-100 font-medium">
                Inspect member signups & approve or reject requests
              </p>
            </div>
          </div>
          {/* Header Action Icons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadCSVTemplate}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors border-0 text-white cursor-pointer active:scale-90"
              title="📥 Download Ready-to-Fill Excel/CSV Upload Template"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
            </button>
            <button
              onClick={() => {
                setBulkModalOpen(true);
                setBulkFile(null);
                setParsedRows([]);
                setBulkResult(null);
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors border-0 text-white cursor-pointer active:scale-90 shadow-xs"
              title="📤 Bulk Upload Community Members (CSV/Excel)"
            >
              <Upload className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={fetchMembers}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors border-0 text-white cursor-pointer active:scale-90"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white/10 p-1 rounded-2xl mt-4">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 border-0 cursor-pointer ${
              activeTab === "pending"
                ? "bg-white text-whatsapp-green shadow-xs"
                : "text-white/80 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 border-0 cursor-pointer ${
              activeTab === "approved"
                ? "bg-white text-whatsapp-green shadow-xs"
                : "text-white/80 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 border-0 cursor-pointer ${
              activeTab === "rejected"
                ? "bg-white text-whatsapp-green shadow-xs"
                : "text-white/80 hover:text-white"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 flex-1 flex flex-col space-y-4">
        {/* Search Input & Minimalistic Action Icons */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-white rounded-2xl p-2.5 shadow-xs border border-slate-200/80 flex items-center space-x-2">
            <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 ml-1.5" />
            <input
              type="text"
              placeholder="Search by name, mobile, city, or Gotra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-hidden text-sm font-semibold text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Minimalistic Action Icon Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0 select-none">
            <button
              onClick={downloadCSVTemplate}
              title="Download Ready-to-Fill CSV Template"
              className="w-10 h-10 rounded-2xl bg-amber-50 hover:bg-amber-100/80 text-amber-700 border border-amber-200/60 flex items-center justify-center shadow-2xs active:scale-90 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => {
                setBulkModalOpen(true);
                setBulkFile(null);
                setParsedRows([]);
                setBulkResult(null);
              }}
              title="Bulk Upload Members (CSV/Excel)"
              className="w-10 h-10 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200/60 flex items-center justify-center shadow-2xs active:scale-90 transition-all cursor-pointer"
            >
              <Upload className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-whatsapp-green border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          /* Empty State */
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No {activeTab} registrations</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {activeTab === "pending"
                ? "There are currently no new member signup requests awaiting your approval."
                : `No ${activeTab} members matching your filter.`}
            </p>
          </div>
        ) : (
          /* Member List Cards */
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div
                key={member._id}
                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 flex flex-col space-y-3 relative overflow-hidden"
              >
                {/* Member Header Info */}
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => setInspectMember(member)}
                    className="flex items-center space-x-3 cursor-pointer group flex-1 min-w-0"
                  >
                    <img
                      src={
                        member.avatar ||
                        (member.sex === "Female"
                          ? "/avatar_female.jpg"
                          : member.sex === "Male"
                          ? "/avatar_male.jpg"
                          : "/avatar.jpg")
                      }
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-xs shrink-0 bg-slate-50 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-800 leading-tight truncate group-hover:text-whatsapp-green transition-colors flex items-center space-x-1.5">
                        <span>{member.name}</span>
                        {member.role === "admin" && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border border-emerald-200 shrink-0">
                            Admin
                          </span>
                        )}
                        {member.isPropertyManager && (
                          <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border border-indigo-200 shrink-0">
                            🏢 Property Manager
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs text-slate-500 font-semibold flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{member.mobileNumber}</span>
                        </span>
                        {member.bloodGroup && (
                          <span className="bg-red-50 text-red-600 font-bold px-1.5 py-0.2 rounded-md text-[10px] border border-red-100">
                            {member.bloodGroup}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      !member.status || member.status === "pending"
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : member.status === "approved"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    {member.status || "pending"}
                  </span>
                </div>

                {/* Grid Details */}
                <div
                  onClick={() => setInspectMember(member)}
                  className="grid grid-cols-2 gap-2 bg-slate-50/80 rounded-2xl p-3 text-xs border border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  {member.city && (
                    <div className="flex items-center space-x-1.5 text-slate-600 font-semibold truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.city}{member.village ? `, ${member.village}` : ""}</span>
                    </div>
                  )}

                  {member.gotra && (
                    <div className="flex items-center space-x-1.5 text-slate-600 font-semibold truncate">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Gotra: {member.gotra}</span>
                    </div>
                  )}

                  {member.kulDevi && (
                    <div className="flex items-center space-x-1.5 text-slate-600 font-semibold truncate">
                      <Heart className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">KulDevi: {member.kulDevi}</span>
                    </div>
                  )}

                  {(member.sex || member.maritalStatus) && (
                    <div className="flex items-center space-x-1.5 text-slate-600 font-semibold truncate">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {[member.sex, member.maritalStatus, member.age ? `${member.age} yrs` : null]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                    </div>
                  )}

                  {member.profession && (
                    <div className="flex items-center space-x-1.5 text-slate-600 font-semibold truncate col-span-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.profession}{member.company ? ` @ ${member.company}` : ""}</span>
                    </div>
                  )}

                  {member.createdAt && (
                    <div className="flex items-center space-x-1.5 text-slate-400 font-medium text-[10px] col-span-2 pt-1 border-t border-slate-200/50">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Registered on {new Date(member.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Minimalist Icon Actions Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setInspectMember(member)}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl transition-all flex items-center space-x-1.5 border-0 cursor-pointer active:scale-95"
                    title="Inspect Member Profile"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Profile</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {/* WhatsApp Quick Share Button */}
                    <a
                      href={`https://wa.me/${member.mobileNumber.replace(/\D/g, "").length === 10 ? `91${member.mobileNumber.replace(/\D/g, "")}` : member.mobileNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Namaste ${member.name}! 🙏\n\nYour Community Circle login credentials:\n• Mobile: ${member.mobileNumber}\n• Password: Community123\n\nPlease log in at ${typeof window !== "undefined" ? window.location.origin : ""}/auth`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/80 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
                      title="Send Credentials via WhatsApp"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                    </a>

                    {(!member.status || member.status === "pending") && (
                      <>
                        <button
                          onClick={() => handleOpenApproveModal(member)}
                          disabled={processingId === member._id}
                          className="w-8.5 h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white shadow-xs flex items-center justify-center transition-all border-0 cursor-pointer disabled:opacity-40"
                          title="Approve & Set Password for Member"
                        >
                          <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                        </button>

                        <button
                          onClick={() => handleApprovalAction(member._id, "reject")}
                          disabled={processingId === member._id}
                          className="w-8.5 h-8.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 active:scale-90 flex items-center justify-center transition-all border-0 cursor-pointer disabled:opacity-40"
                          title="Reject Member Registration"
                        >
                          <X className="w-4.5 h-4.5 stroke-[2.5]" />
                        </button>
                      </>
                    )}

                    {member.status === "approved" && (
                      <button
                        onClick={() => handleApprovalAction(member._id, "reject")}
                        disabled={processingId === member._id}
                        className="w-8.5 h-8.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 active:scale-90 flex items-center justify-center transition-all border-0 cursor-pointer disabled:opacity-40"
                        title="Revoke / Reject Member Access"
                      >
                        <X className="w-4.5 h-4.5 stroke-[2.5]" />
                      </button>
                    )}

                    {member.status === "rejected" && (
                      <button
                        onClick={() => handleApprovalAction(member._id, "approve")}
                        disabled={processingId === member._id}
                        className="w-8.5 h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white shadow-xs flex items-center justify-center transition-all border-0 cursor-pointer disabled:opacity-40"
                        title="Approve Member Registration"
                      >
                        <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                      </button>
                    )}

                    {/* Toggle Property Manager Role */}
                    <button
                      onClick={() => handleTogglePropertyManager(member._id, member.isPropertyManager)}
                      disabled={processingId === member._id}
                      className={`w-8.5 h-8.5 rounded-xl border active:scale-90 flex items-center justify-center transition-all cursor-pointer border-0 disabled:opacity-40 ${
                        member.isPropertyManager
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                      }`}
                      title={member.isPropertyManager ? "Remove Property Manager Permission" : "Make Property Manager"}
                    >
                      <Building2 className="w-4.5 h-4.5" />
                    </button>

                    {/* Delete Member Button */}
                    <button
                      onClick={() => handleDeleteMember(member._id, member.name)}
                      disabled={processingId === member._id}
                      className="w-8.5 h-8.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-90 text-white shadow-xs flex items-center justify-center transition-all border-0 cursor-pointer disabled:opacity-40"
                      title="Permanently Delete Member"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FULL PROFILE INSPECTION MODAL ────────────────────────────── */}
      {inspectMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-whatsapp-green" />
                <h3 className="font-extrabold text-sm tracking-wide">Member Profile Inspection</h3>
              </div>
              <button
                onClick={() => setInspectMember(null)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors border-0 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              
              {/* Profile Identity Hero */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                <img
                  src={
                    inspectMember.avatar ||
                    (inspectMember.sex === "Female"
                      ? "/avatar_female.jpg"
                      : inspectMember.sex === "Male"
                      ? "/avatar_male.jpg"
                      : "/avatar.jpg")
                  }
                  alt={inspectMember.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-md bg-slate-50 mb-3"
                />
                <h2 className="text-lg font-black text-slate-800">{inspectMember.name}</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{inspectMember.mobileNumber}</p>
                
                {/* Status Badge */}
                <div className="mt-2">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                      !inspectMember.status || inspectMember.status === "pending"
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : inspectMember.status === "approved"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                  >
                    STATUS: {inspectMember.status || "PENDING"}
                  </span>
                </div>
              </div>

              {/* SECTION: Contact & Location */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Contact & Location
                </h4>
                <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mobile Number:</span>
                    </span>
                    <a
                      href={`tel:${inspectMember.mobileNumber}`}
                      className="font-bold text-whatsapp-green underline"
                    >
                      {inspectMember.mobileNumber}
                    </a>
                  </div>

                  {inspectMember.phone && inspectMember.phone !== inspectMember.mobileNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Alternate Phone:</span>
                      </span>
                      <span className="font-bold text-slate-800">{inspectMember.phone}</span>
                    </div>
                  )}

                  {inspectMember.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email:</span>
                      </span>
                      <span className="font-bold text-slate-800">{inspectMember.email}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>City & Town:</span>
                    </span>
                    <span className="font-bold text-slate-800 text-right">
                      {inspectMember.city || "—"}{inspectMember.village ? `, ${inspectMember.village}` : ""}
                    </span>
                  </div>

                  {inspectMember.address && (
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 font-medium flex items-center space-x-2">
                        <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Address:</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-right max-w-[200px]">
                        {inspectMember.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: Community & Lineage */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Community Identity & Lineage
                </h4>
                <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center space-x-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      <span>Gotra:</span>
                    </span>
                    <span className="font-bold text-slate-800">{inspectMember.gotra || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center space-x-2">
                      <Heart className="w-3.5 h-3.5 text-slate-400" />
                      <span>KulDevi:</span>
                    </span>
                    <span className="font-bold text-slate-800">{inspectMember.kulDevi || "—"}</span>
                  </div>

                  {getParentName(inspectMember) && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Linked Parent:</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {getParentName(inspectMember)} ({inspectMember.parentRelationship || "Parent"})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: Personal Details */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Personal Profile
                </h4>
                <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Gender / Sex:</span>
                    <span className="font-bold text-slate-800">{inspectMember.sex || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Age:</span>
                    <span className="font-bold text-slate-800">
                      {inspectMember.age ? `${inspectMember.age} Years` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Marital Status:</span>
                    <span className="font-bold text-slate-800">{inspectMember.maritalStatus || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Blood Group:</span>
                    <span className="font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                      {inspectMember.bloodGroup || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: Education & Profession */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Education & Profession
                </h4>
                <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center space-x-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>Qualification:</span>
                    </span>
                    <span className="font-bold text-slate-800">{inspectMember.education || "—"}</span>
                  </div>

                  {inspectMember.institution && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Institution:</span>
                      <span className="font-bold text-slate-800">{inspectMember.institution}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium flex items-center space-x-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>Occupation Type:</span>
                    </span>
                    <span className="font-bold text-slate-800">{inspectMember.occupationType || "—"}</span>
                  </div>

                  {inspectMember.profession && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Designation:</span>
                      <span className="font-bold text-slate-800">{inspectMember.profession}</span>
                    </div>
                  )}

                  {inspectMember.company && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Company / Business:</span>
                      <span className="font-bold text-slate-800">{inspectMember.company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: Registration Date */}
              {inspectMember.createdAt && (
                <div className="text-center text-[11px] text-slate-400 font-medium">
                  Registered on {new Date(inspectMember.createdAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Modal Action Footer — Minimalist Icon Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center space-x-2 justify-end">
              {(!inspectMember.status || inspectMember.status === "pending") && (
                <>
                  <button
                    onClick={() => handleOpenApproveModal(inspectMember)}
                    disabled={processingId === inspectMember._id}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                    <span>Approve Member</span>
                  </button>

                  <button
                    onClick={() => handleApprovalAction(inspectMember._id, "reject")}
                    disabled={processingId === inspectMember._id}
                    className="w-10 h-10 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl border border-red-200 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95 border-0"
                    title="Reject Member Registration"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </>
              )}

              {inspectMember.status === "approved" && (
                <button
                  onClick={() => handleApprovalAction(inspectMember._id, "reject")}
                  disabled={processingId === inspectMember._id}
                  className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-2xl border border-red-200 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <X className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>Revoke Member Access</span>
                </button>
              )}

              {inspectMember.status === "rejected" && (
                <button
                  onClick={() => handleApprovalAction(inspectMember._id, "approve")}
                  disabled={processingId === inspectMember._id}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95 border-0"
                >
                  <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>Approve Member</span>
                </button>
              )}

              {/* Permanently Delete Member */}
              <button
                onClick={() => handleDeleteMember(inspectMember._id, inspectMember.name)}
                disabled={processingId === inspectMember._id}
                className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95 border-0"
                title="Permanently Delete Member"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BULK UPLOAD MEMBERS MODAL */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto select-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-indigo-700 font-extrabold text-sm">
                <Upload className="w-5 h-5" />
                <h3>Bulk Upload Community Members</h3>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer bg-transparent border-0 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 space-y-1 text-xs text-amber-900 font-medium">
              <div className="flex items-center space-x-1.5 font-extrabold text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bulk Import Rules & Password Strategy</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                1. Download our ready-to-fill <strong>CSV Template</strong> to populate member rows.<br />
                2. <strong>No Password Column Required:</strong> All bulk uploaded members will receive the default secure password (<code>Community123</code>) and can reset it anytime via Forgot Password.<br />
                3. Members uploaded by Admin are automatically set to <strong>Approved</strong>.
              </p>
              <button
                type="button"
                onClick={downloadCSVTemplate}
                className="mt-2 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all flex items-center space-x-1 border-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>📥 Download Sample CSV Template</span>
              </button>
            </div>

            {/* File Dropzone */}
            <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 rounded-2xl p-4 text-center space-y-2 transition-all">
              <input
                type="file"
                accept=".csv"
                id="bulk-csv-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="bulk-csv-input" className="cursor-pointer block space-y-2">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-700 block">
                    {bulkFile ? bulkFile.name : "Click to select or drop CSV file"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Supports .csv files</span>
                </div>
              </label>
            </div>

            {/* Parsed Rows Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-800">
                  <span>Parsed Members Preview ({parsedRows.length} rows)</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Ready to Upload
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 no-scrollbar">
                  {parsedRows.slice(0, 10).map((r, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 text-[11px] flex justify-between items-center">
                      <div className="truncate pr-2">
                        <span className="font-bold text-slate-800">{r.Name || r.name || "Unnamed"}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{r["Mobile Number"] || r.mobileNumber} &bull; {r.City || r.city}</span>
                      </div>
                      <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-100 shrink-0">
                        Row #{idx + 1}
                      </span>
                    </div>
                  ))}
                  {parsedRows.length > 10 && (
                    <div className="p-2 bg-slate-100 text-center text-[10px] text-slate-500 font-bold">
                      + {parsedRows.length - 10} more rows ready
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBulkUpload}
                  disabled={bulkUploading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer border-0 disabled:opacity-50 mt-2"
                >
                  {bulkUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Importing Members...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Confirm & Upload {parsedRows.length} Members</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Upload Results Log */}
            {bulkResult && (
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-xs space-y-2 border border-slate-800 animate-in fade-in">
                <div className="flex items-center justify-between font-extrabold">
                  <span className="text-emerald-400">✅ Import Summary:</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md">{bulkResult.addedCount} Added / {bulkResult.skippedCount} Skipped</span>
                </div>
                {bulkResult.errors.length > 0 && (
                  <div className="max-h-28 overflow-y-auto text-[10px] text-red-300 font-mono space-y-0.5 bg-black/40 p-2 rounded-xl border border-white/10">
                    {bulkResult.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPROVE MEMBER & SET PASSWORD DIALOG MODAL */}
      {approvalModalMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 select-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <h3>Approve Member Registration</h3>
              </div>
              <button
                onClick={() => setApprovalModalMember(null)}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer bg-transparent border-0 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Details Brief */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Details</span>
              <h4 className="text-sm font-extrabold text-slate-800">{approvalModalMember.name}</h4>
              <p className="text-xs font-semibold text-slate-500 font-mono">📱 {approvalModalMember.mobileNumber} &bull; {approvalModalMember.city}</p>
            </div>

            {/* Set Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Initial 6-Digit Login Key / Password
                </label>
                <button
                  type="button"
                  onClick={() => setApprovalPassword(generate6DigitKey())}
                  className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 transition-all cursor-pointer border-0"
                >
                  🎲 Regenerate Key
                </button>
              </div>
              <input
                type="text"
                value={approvalPassword}
                onChange={(e) => setApprovalPassword(e.target.value)}
                placeholder="e.g. 582910"
                maxLength={10}
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-sm font-mono font-black text-slate-800 outline-hidden focus:border-emerald-500 tracking-widest text-center"
              />
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed text-center">
                Random 6-digit key generated for newly onboarded member.
              </p>
            </div>

            {/* Property Manager Option Toggle */}
            <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                <div>
                  <label htmlFor="makePropMgr" className="text-xs font-black text-indigo-950 cursor-pointer block leading-tight">
                    Assign Property Manager Role
                  </label>
                  <p className="text-[10px] text-indigo-700/80 font-medium mt-0.5">
                    Allows member to manage property bookings
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id="makePropMgr"
                checked={makePropertyManager}
                onChange={(e) => setMakePropertyManager(e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 cursor-pointer rounded-md shrink-0"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleApproveWithWhatsApp}
                disabled={processingId === approvalModalMember._id}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer border-0 disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>Approve & Send Password via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleApproveOnly}
                disabled={processingId === approvalModalMember._id}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs rounded-2xl transition-all border-0 cursor-pointer disabled:opacity-50"
              >
                Approve Only (Without Opening WhatsApp)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
