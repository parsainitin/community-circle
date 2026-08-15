"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  Users,
  Search,
  Sparkles,
  Bold,
  Italic,
  Strikethrough,
  List,
  ImagePlus,
  Trash2,
  Smartphone,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  ShieldCheck,
  Zap,
  KeyRound,
  Copy,
  Check,
  PhoneCall,
  AlertTriangle,
  Radio,
  ChevronDown,
  Wifi,
  WifiOff,
  Lock,
} from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";

interface Contact {
  id: string;
  name: string;
  phone: string;
  city?: string;
  gotra?: string;
  avatar?: string;
}

const TEMPLATE_PRESETS = [
  {
    id: "marriage",
    icon: "🌺",
    name: "Marriage & Saptapadi",
    title: "Vivah Amantran (विवाह निमंत्रण)",
    text: `*🌺 ॐ श्री गणेशाय नमः 🌺*

सादर आमंत्रित हैं हमारे सुपुत्र/सुपुत्री के मांगलिक विवाह संस्कार में!

*🗓️ दिनांक:* रविवार, 15 नवंबर 2026
*⏰ समय:* सायं 6:00 बजे से
*📍 स्थान:* महाराजा अग्रसेन भवन व गार्डन, इंदौर
*🍲 प्रीतिभोज:* सायं 7:30 बजे

आपकी गरिमामयी उपस्थिति एवं शुभाशीष आकांक्षी:
*समस्त गुप्ता एवं जैन परिवार*
📱 संपर्क: 98260 17177`,
  },
  {
    id: "katha",
    icon: "🪔",
    name: "Pooja & Katha",
    title: "Shree Satyanarayan Katha (सत्यनारायण कथा)",
    text: `*🪔 श्री सत्यनारायण कथा व महाप्रसाद 🪔*

जय श्री कृष्णा! आप सभी धर्मप्रेमी समाजजनों को सूचित करते हुए अपार हर्ष हो रहा है कि हमारे निवास स्थान पर श्री सत्यनारायण भगवान की कथा का आयोजन रखा गया है।

*🗓️ तिथि:* शनिवार, 24 अक्टूबर 2026
*⏰ कथा समय:* प्रातः 10:30 बजे
*🍲 महाप्रसाद:* दोपहर 1:00 बजे से
*📍 स्थान:* फ्लैट नं. 402, सांई रेसीडेंसी, विजय नगर, इंदौर

आप सभी सपरिवार पधारकर धर्मलाभ प्राप्त करें।
*भवदीय:* रमेशजी एवं सुनीता जैन
📱 98260 12345`,
  },
  {
    id: "agm",
    icon: "📢",
    name: "Community Meeting",
    title: "Annual General Meeting (वार्षिक साधारण सभा)",
    text: `*📢 समाज कार्यसमिति आवश्यक बैठक 📢*

समस्त सम्माननीय कार्यकारिणी सदस्यों एवं समाज बंधुओं को सूचित किया जाता है कि समाज विकास एवं आगामी कार्यक्रमों हेतु आवश्यक बैठक बुलाई गई है।

*🗓️ दिनांक:* रविवार, 18 अक्टूबर 2026
*⏰ समय:* शाम 5:00 बजे
*📍 स्थान:* समाज सभाकक्ष, द्वितीय तल, इंदौर

*मुख्य बिंदु:*
• समाज भवन विकास कार्य समीक्षा
• आगामी डांडिया महोत्सव आयोजन
• मेधावी छात्र सम्मान समारोह

आपकी उपस्थिति अनिवार्य है।
*संयोजक:* समाज कार्यकारिणी समिति`,
  },
  {
    id: "bhandara",
    icon: "🍲",
    name: "Feast & Bhandara",
    title: "Community Bhandara (महाप्रसादी भंडारा)",
    text: `*🚩 विशाल महाप्रसादी एवं अन्नकूट भंडारा 🚩*

सर्व समाजजनों को सहर्ष आमंत्रित किया जाता है कि सिद्धेश्वर हनुमान मंदिर प्रांगण में विशाल महाप्रसादी का आयोजन किया जा रहा है।

*🗓️ दिनांक:* मंगलवार, 27 अक्टूबर 2026
*⏰ समय:* दोपहर 12:00 बजे से निरंतर
*📍 स्थान:* सिद्धेश्वर हनुमान मंदिर, एमजी रोड, इंदौर

कृपया सपरिवार पधारकर महाप्रसाद ग्रहण करें एवं पुण्य के भागी बनें।
*आयोजक:* सिद्धेश्वर हनुमान मंदिर सेवा समिति`,
  },
];

export default function InvitationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Rich Text & Card Form State
  const [invitationTitle, setInvitationTitle] = useState("");
  const [invitationBody, setInvitationBody] = useState("");
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImageUrl, setCardImageUrl] = useState<string>("");

  // Real WhatsApp Gateway & 8-Digit Pairing Code State
  const [isQrConnected, setIsQrConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [phoneNumberInput, setPhoneNumberInput] = useState(
    user?.mobileNumber || user?.phone || "9826017177"
  );
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Sync Logged-In User's phone number
  useEffect(() => {
    if (user?.mobileNumber || user?.phone) {
      setPhoneNumberInput(user.mobileNumber || user.phone);
    }
  }, [user]);

  // Contacts & Selection State
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "selected">("all");
  const [loadingContacts, setLoadingContacts] = useState(true);

  // Broadcast Sending Modal State
  const [sendingModalOpen, setSendingModalOpen] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [currentSendingName, setCurrentSendingName] = useState("");
  const [sentLogs, setSentLogs] = useState<{ name: string; success: boolean }[]>([]);
  const [sendingComplete, setSendingComplete] = useState(false);

  // 1. Check Device Status from Gateway
  const fetchDeviceStatus = async (phoneToPair?: string): Promise<boolean> => {
    try {
      const url = phoneToPair
        ? `/api/invitations/device-status?phoneNumber=${encodeURIComponent(phoneToPair)}`
        : `/api/invitations/device-status`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Gateway service unavailable");

      const data = await res.json();
      if (data.isOnline || data.state === "open") {
        setIsQrConnected(true);
        setPairingCode(null);
        setConnectionError(null);
        return true;
      } else {
        setIsQrConnected(false);
        if (
          data.pairingCode &&
          typeof data.pairingCode === "string" &&
          !data.pairingCode.startsWith("2@") &&
          data.pairingCode.length <= 15
        ) {
          setPairingCode(data.pairingCode.trim());
          setConnectionError(null);
        } else if (phoneToPair && data.error) {
          setConnectionError(data.error);
        }
        return false;
      }
    } catch (err: any) {
      console.error("[Device Status] Error:", err);
      setIsQrConnected(false);
      return false;
    } finally {
      setCheckingStatus(false);
    }
  };

  // On Mount: Check current status and fetch contacts
  useEffect(() => {
    fetchDeviceStatus();
    fetchCommunityContacts();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Real WhatsApp Pairing Code Request (Baileys Gateway)
  const handleGeneratePairingCode = async () => {
    const cleanPhone = phoneNumberInput.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Please ensure your logged-in profile has a valid 10-digit mobile number");
      return;
    }

    setGeneratingCode(true);
    setConnectionError(null);

    try {
      const isOnline = await fetchDeviceStatus(cleanPhone);
      if (isOnline) {
        setGeneratingCode(false);
        return;
      }

      // Start live polling every 3 seconds to detect when user confirms in WhatsApp
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        const connected = await fetchDeviceStatus();
        if (connected) {
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      }, 3000);
    } catch (e: any) {
      setConnectionError(
        "Failed to request pairing code. Please ensure Evolution API & msgservice are running."
      );
    } finally {
      setGeneratingCode(false);
    }
  };

  // Copy Pairing Code to Clipboard
  const handleCopyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.replace("-", ""));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Disconnect / Logout Session
  const handleDisconnectSession = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/invitations/device-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      setIsQrConnected(false);
      setPairingCode(null);
      await fetchDeviceStatus();
    } catch (e) {
      console.error("Disconnect error:", e);
    } finally {
      setDisconnecting(false);
    }
  };

  const fetchCommunityContacts = async () => {
    try {
      const res = await fetch("/api/users");
      let fetchedUsers: Contact[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          fetchedUsers = data.map((u: any) => ({
            id: u._id || String(Math.random()),
            name: u.name || "Community Member",
            phone: u.mobileNumber || u.phone || "9826000000",
            avatar: u.avatar,
            city: u.city,
            gotra: u.gotra,
          }));
        }
      }

      // Fallback if no users returned
      if (fetchedUsers.length === 0) {
        fetchedUsers = [
          { id: "u1", name: "Rameshchandra Gupta", phone: "9826017177", city: "Indore", gotra: "Kashyap" },
          { id: "u2", name: "Sunita Jain", phone: "9826012345", city: "Indore", gotra: "Garg" },
          { id: "u3", name: "Vikram Agrawal", phone: "9826098765", city: "Bhopal", gotra: "Bansal" },
          { id: "u4", name: "Pooja Sharma", phone: "9826055555", city: "Ujjain", gotra: "Vashishtha" },
          { id: "u5", name: "Anil Shah", phone: "9826033333", city: "Indore", gotra: "Goyal" },
        ];
      }

      setAllContacts(fetchedUsers);
    } catch (e) {
      console.error("Failed to load contacts for invitations", e);
      setAllContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Preset Template Loader
  const handleSelectTemplate = (tpl: (typeof TEMPLATE_PRESETS)[0]) => {
    setInvitationTitle(tpl.title);
    setInvitationBody(tpl.text);
  };

  // Formatting Helper for WhatsApp Markdown Text
  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    setInvitationBody((prev) => `${prev}${prefix}Text${suffix}`);
  };

  const insertEmoji = (emoji: string) => {
    setInvitationBody((prev) => `${prev} ${emoji} `);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCardImageUrl(URL.createObjectURL(file));
    const compressed = await compressImage(file);
    if (!checkFileSize(compressed, 5)) {
      alert("Selected image exceeds 5MB limit");
      return;
    }
    setCardImageFile(compressed);
  };

  // Contact Selection Toggles
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredContacts = allContacts.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.city && item.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.gotra && item.gotra.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeFilterTab === "selected") return selectedIds.includes(item.id);
    return true;
  });

  const isAllFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((item) => selectedIds.includes(item.id));

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredContacts.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredContacts.map((c) => c.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  // Trigger Broadcast Workflow
  const handleStartBroadcast = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one contact");
      return;
    }
    if (!invitationBody.trim()) {
      alert("Please enter invitation message");
      return;
    }

    if (!isQrConnected) {
      const confirmSend = confirm(
        "WhatsApp Device is offline. Would you like to attempt delivery via server gateway?"
      );
      if (!confirmSend) return;
    }

    setSendingModalOpen(true);
    setSendingProgress(10);
    setSendingComplete(false);
    setSentLogs([]);

    const targets = allContacts.filter((c) => selectedIds.includes(c.id));
    setCurrentSendingName(`Sending to ${targets.length} members...`);

    try {
      const res = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: targets.map((t) => ({ name: t.name, phone: t.phone })),
          title: invitationTitle,
          message: invitationBody,
        }),
      });

      const data = await res.json();
      setSendingProgress(100);
      setSendingComplete(true);

      if (data.logs && Array.isArray(data.logs)) {
        setSentLogs(
          data.logs.map((l: any) => ({
            name: `${l.name} (${l.phone})`,
            success: l.success,
          }))
        );
      } else {
        setSentLogs(
          targets.map((t) => ({
            name: `${t.name} (${t.phone})`,
            success: data.success ?? true,
          }))
        );
      }
    } catch (e: any) {
      console.error("Broadcast failed:", e);
      setSendingProgress(100);
      setSendingComplete(true);
      setSentLogs(
        targets.map((t) => ({
          name: `${t.name} (${t.phone})`,
          success: false,
        }))
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 pb-20 select-none">
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/events"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border-0 no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
                <span>✉️ Invitation (आमंत्रण)</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Design custom card invitations & broadcast directly to verified community WhatsApp contacts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchDeviceStatus()}
              disabled={checkingStatus}
              title="Refresh status"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checkingStatus ? "animate-spin" : ""}`} />
            </button>
            <div
              title={isQrConnected ? "WhatsApp Device Online" : "WhatsApp Device Offline"}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                isQrConnected
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-xs"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              }`}
            >
              {isQrConnected ? (
                <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-600" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-5">
        {/* ── SECTION 1: LINK DEVICE ────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-2xl shadow-xs ${isQrConnected ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"}`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center space-x-1.5">
                  <span>Link Device</span>
                  {isQrConnected && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-md border border-emerald-200">
                      Connected
                    </span>
                  )}
                </h2>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  {isQrConnected
                    ? "WhatsApp is linked and ready to broadcast."
                    : "Link your WhatsApp with an 8-digit pairing code."}
                </p>
              </div>
            </div>

            {isQrConnected && (
              <button
                onClick={handleDisconnectSession}
                disabled={disconnecting}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[11px] rounded-xl transition-all border border-rose-200 cursor-pointer disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            )}
          </div>

          {!isQrConnected ? (
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              {connectionError && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-semibold flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span>{connectionError}</span>
                    <p className="text-[11px] text-amber-800 font-normal">
                      Ensure your WhatsApp Gateway and messaging backend are online.
                    </p>
                  </div>
                </div>
              )}

              {/* 8-Digit Pairing Code Flow (Row by Row) */}
              <div className="space-y-4">
                {/* Step 1: Locked Mobile Number & Code Request */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Mobile Number
                      </label>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Account Number</span>
                      </span>
                    </div>
                    <div className="relative">
                      <PhoneCall className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        value={phoneNumberInput}
                        readOnly
                        disabled
                        placeholder="e.g. 9826017177"
                        className="w-full pl-9 pr-9 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700 outline-hidden cursor-not-allowed select-none"
                      />
                      <Lock className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                    </div>
                  </div>

                  {!pairingCode ? (
                    <button
                      type="button"
                      onClick={handleGeneratePairingCode}
                      disabled={generatingCode}
                      className="w-full py-2.5 bg-whatsapp-green hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {generatingCode ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Requesting Code...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Get Pairing Code</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="p-3 bg-slate-900 text-white rounded-2xl text-center space-y-1.5 shadow-md border border-slate-800">
                        <div className="text-[9px] font-extrabold uppercase text-emerald-400 tracking-widest flex items-center justify-center space-x-1">
                          <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                          <span>WhatsApp Pairing Code</span>
                        </div>
                        <div className="text-2xl font-black tracking-widest text-white font-mono select-all">
                          {pairingCode}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyPairingCode}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg transition-all border-0 cursor-pointer flex items-center justify-center space-x-1 mx-auto"
                        >
                          {codeCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-500 py-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span>Waiting for confirmation...</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => fetchDeviceStatus()}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all border-0 cursor-pointer"
                      >
                        Check Status
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 2: Step-by-step Instructions */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>How to link in WhatsApp:</span>
                  </h3>
                  <ol className="space-y-2 text-xs font-semibold text-slate-700 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>WhatsApp</strong> on your phone</li>
                    <li>Tap <strong>Settings / ⋮</strong> &gt; <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong></li>
                    <li>Tap <strong>"Link with phone number instead"</strong> at the bottom</li>
                    <li>Enter the code: <strong className="text-emerald-700 font-bold font-mono">{pairingCode || "••••-••••"}</strong></li>
                  </ol>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[10.5px] text-emerald-900 font-bold flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Direct pairing. No camera scanning required.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wide flex items-center space-x-2">
                    <span>WhatsApp Linked</span>
                    <span className="text-[9px] bg-white text-emerald-800 px-2 py-0.5 rounded-full font-black">
                      ACTIVE
                    </span>
                  </h3>
                  <p className="text-[10.5px] text-emerald-100 font-medium mt-0.5">
                    Your session is online. Broadcasts will send via this number.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-black/20 px-3.5 py-2 rounded-xl border border-white/20 text-xs font-bold shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>Ready to Send</span>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 2: COMPOSE INVITATION ────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Compose
              </h2>
            </div>

            <span className="text-[10px] text-slate-400 font-bold">
              Formatted Message
            </span>
          </div>

          {/* Quick Template Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Template
            </label>
            <div className="relative">
              <select
                onChange={(e) => {
                  const tpl = TEMPLATE_PRESETS.find((t) => t.id === e.target.value);
                  if (tpl) handleSelectTemplate(tpl);
                }}
                defaultValue=""
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-hidden focus:border-indigo-500 cursor-pointer transition-all appearance-none pr-9"
              >
                <option value="" disabled>
                  -- Select a template (शादी, पूजा, बैठक, भंडारा...) --
                </option>
                {TEMPLATE_PRESETS.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.icon} {tpl.name} ({tpl.title})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Title *
            </label>
            <input
              type="text"
              value={invitationTitle}
              onChange={(e) => setInvitationTitle(e.target.value)}
              placeholder="e.g. Shree Ganesh Saptah & Mahaprasad Bhandara"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Formatting Bar & Message Body */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Message *
            </label>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => insertFormatting("*")}
                title="Bold (*text*)"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 text-xs font-bold border-0 cursor-pointer"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("_")}
                title="Italic (_text_)"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 text-xs font-bold border-0 cursor-pointer"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("~")}
                title="Strikethrough (~text~)"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 text-xs font-bold border-0 cursor-pointer"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n• ")}
                title="Bullet list"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 text-xs font-bold border-0 cursor-pointer"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-slate-300 mx-1" />
              {["🌺", "🪔", "🚩", "🍲", "🎉", "🗓️", "📍", "⏰"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="p-1 rounded-lg hover:bg-white text-xs border-0 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <textarea
              rows={8}
              value={invitationBody}
              onChange={(e) => setInvitationBody(e.target.value)}
              placeholder="Write invitation details with date, time, venue, and host contact numbers..."
              className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 outline-hidden focus:border-indigo-500 font-sans leading-relaxed resize-y"
            />
          </div>

          {/* Optional Card Image */}
          <div className="space-y-2 pt-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Card Image (Optional)
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-all">
                <ImagePlus className="w-4 h-4 text-slate-500" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {cardImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setCardImageUrl("");
                    setCardImageFile(null);
                  }}
                  className="flex items-center space-x-1 text-xs font-bold text-red-500 hover:text-red-700 bg-transparent border-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {cardImageUrl && (
              <div className="relative w-full max-w-sm h-48 rounded-2xl overflow-hidden border border-slate-200 mt-2">
                <Image
                  src={cardImageUrl}
                  alt="Card Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 3: PREVIEW ────────────────────────────────────────────────── */}
        {(invitationTitle || invitationBody) && (
          <div className="bg-emerald-950/90 text-white rounded-3xl p-5 shadow-lg border border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-800">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Preview
                </span>
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono">
                {invitationBody.length} chars
              </span>
            </div>

            <div className="max-w-md bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700/60 space-y-2.5 shadow-inner">
              {cardImageUrl && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-emerald-700">
                  <Image
                    src={cardImageUrl}
                    alt="Card Banner"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {invitationTitle && (
                <div className="text-sm font-black text-emerald-200">
                  *{invitationTitle}*
                </div>
              )}
              <div className="text-xs text-emerald-50 whitespace-pre-wrap font-sans leading-relaxed">
                {invitationBody}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 4: RECIPIENTS ────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Recipients ({selectedIds.length})
                </h2>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Select contacts to receive this broadcast
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveFilterTab("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer transition-all ${
                  activeFilterTab === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "bg-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                All ({allContacts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilterTab("selected")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer transition-all ${
                  activeFilterTab === "selected"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "bg-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Selected ({selectedIds.length})
              </button>
            </div>
          </div>

          {/* Search & Bulk Select Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, or Gotra..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all border-0 cursor-pointer flex items-center justify-center space-x-1.5 shrink-0"
            >
              {isAllFilteredSelected ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Deselect</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select Filtered</span>
                </>
              )}
            </button>
          </div>

          {/* Contacts List */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-50">
            {loadingContacts ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading Contacts...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-bold">
                No matching members found
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleSelect(contact.id)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-emerald-50/70 border-emerald-200 shadow-xs"
                        : "bg-white hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black truncate leading-tight flex items-center space-x-1.5">
                          <span>{contact.name}</span>
                          {contact.gotra && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {contact.gotra}
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                          {contact.phone} {contact.city ? `• ${contact.city}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className="shrink-0 ml-2">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── BROADCAST BUTTON ───────────────────────────────────────────── */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartBroadcast}
              disabled={selectedIds.length === 0 || !invitationBody.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer disabled:opacity-40 active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>
                {selectedIds.length > 0 ? `Broadcast (${selectedIds.length})` : "Broadcast"}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* ── BROADCAST SENDING OVERLAY MODAL ────────────────────────────────────── */}
      {sendingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  {sendingComplete ? "Broadcast Complete 🎉" : "Sending Invitations..."}
                </h3>
              </div>

              {sendingComplete && (
                <button
                  onClick={() => setSendingModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 border-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Progress</span>
                <span>{sendingProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${sendingProgress}%` }}
                />
              </div>
            </div>

            {/* Active sending item */}
            {!sendingComplete && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-3 text-xs font-bold text-emerald-950">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                <span className="truncate">Delivering to: {currentSendingName}...</span>
              </div>
            )}

            {/* Sent Logs Box */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Logs ({sentLogs.length} / {selectedIds.length})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                {sentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between font-semibold text-slate-800"
                  >
                    <span className="truncate mr-2">{log.name}</span>
                    {log.success ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                        Sent ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
                        Failed ✗
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            {sendingComplete && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSendingModalOpen(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl transition-all border-0 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
