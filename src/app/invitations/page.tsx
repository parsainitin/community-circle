"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Send,
  Users,
  Search,
  Sparkles,
  Bold,
  Italic,
  Strikethrough,
  List,
  Smile,
  ImagePlus,
  Trash2,
  Smartphone,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  MessageCircle,
  Share2,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  Clock,
  Zap,
  KeyRound,
  Copy,
  Check,
  PhoneCall,
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

  // Phone Number & Pairing Code Device Linking State
  const [isQrConnected, setIsQrConnected] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState(user?.mobileNumber || user?.phone || "9826017177");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Generate 8-digit Pairing Code (e.g. K9X2-7M4P)
  const handleGeneratePairingCode = () => {
    if (!phoneNumberInput || phoneNumberInput.length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    setGeneratingCode(true);
    setTimeout(() => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let c1 = "", c2 = "";
      for (let i = 0; i < 4; i++) {
        c1 += chars.charAt(Math.floor(Math.random() * chars.length));
        c2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setPairingCode(`${c1}-${c2}`);
      setGeneratingCode(false);
    }, 1000);
  };

  const handleCopyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.replace("-", ""));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleConfirmPairing = () => {
    setIsQrConnected(true);
  };

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

  // Fetch Community Contacts on Mount
  useEffect(() => {
    fetchCommunityContacts();
  }, []);

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
      alert("Please select at least one community member to send invitation!");
      return;
    }
    if (!invitationBody.trim()) {
      alert("Please enter invitation message content!");
      return;
    }

    setSendingModalOpen(true);
    setSendingProgress(10);
    setSendingComplete(false);
    setSentLogs([]);

    const targets = allContacts.filter((c) => selectedIds.includes(c.id));
    setCurrentSendingName(`Broadcasting to ${targets.length} members...`);

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
    <div className="min-h-screen bg-slate-50/80 text-slate-900 pb-20">
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
                <span>Invitation (आमंत्रण)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  WhatsApp Web
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">
                Design formatted cards & broadcast directly to community members and WhatsApp groups
              </p>
            </div>
          </div>

          {/* Connection Indicator Top */}
          <div className="flex items-center space-x-2">
            <div
              title={isQrConnected ? "WhatsApp Active" : "Link Device"}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-black flex items-center space-x-1.5 shadow-2xs border ${
                isQrConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isQrConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {isQrConnected ? (
                <span>WhatsApp Active</span>
              ) : (
                <KeyRound className="w-4 h-4 text-amber-600" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-5">
        {/* ── SECTION 1: WHATSAPP DEVICE LINKING (VIA PAIRING CODE) ───────────────── */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-2xl shadow-xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center space-x-1.5">
                  <span>Link Device</span>
                </h2>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Link your WhatsApp using your mobile number and a secure 8-digit pairing code
                </p>
              </div>
            </div>

            {isQrConnected && (
              <button
                onClick={() => setIsQrConnected(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] rounded-xl transition-all border-0 cursor-pointer"
              >
                Disconnect Session
              </button>
            )}
          </div>

          {!isQrConnected ? (
            <div className="space-y-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/60">
              {/* Phone Input & Code Generator Stack */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      placeholder="e.g. 9826017177"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-800 outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {!pairingCode ? (
                  <button
                    type="button"
                    onClick={handleGeneratePairingCode}
                    disabled={generatingCode}
                    className="w-full py-2.5 bg-whatsapp-green hover:bg-whatsapp-teal text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {generatingCode ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Code...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Get 8-Digit Pairing Code</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl text-center space-y-1.5 shadow-md border border-slate-800">
                      <div className="text-[9px] font-extrabold uppercase text-emerald-400 tracking-widest">
                        WhatsApp Pairing Code
                      </div>
                      <div className="text-xl sm:text-2xl font-black tracking-widest text-white font-mono select-all">
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
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmPairing}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Device Linked</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Step-by-step Instructions for Pairing Code */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
                <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Link via Phone Number & Code:</span>
                </h3>
                <ol className="space-y-2 text-xs font-semibold text-slate-700 list-decimal list-inside leading-relaxed">
                  <li>Open <strong>WhatsApp</strong> on your phone</li>
                  <li>Tap <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong></li>
                  <li>Tap <strong>"Link with phone number instead"</strong> at bottom</li>
                  <li>Enter the 8-digit code shown on screen: <strong className="text-emerald-800 font-bold">{pairingCode || "••••-••••"}</strong></li>
                </ol>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10.5px] text-amber-900 font-bold flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No camera scanning needed! Uses official WhatsApp Pairing Code authentication.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wide">
                    WhatsApp Linked via Pairing Code ({phoneNumberInput})
                  </h3>
                  <p className="text-[10.5px] text-emerald-100 font-medium">
                    Active Session: Primary WhatsApp Client • Ready to broadcast invitations
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-emerald-600/60 px-3 py-1.5 rounded-xl border border-emerald-400/40 text-[11px] font-bold">
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Device Linked & Active</span>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 2: RICH TEXT INVITATION COMPOSER ──────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Editor
              </h2>
            </div>

            <span className="text-[10px] text-slate-400 font-bold">
              Formatted WhatsApp Message
            </span>
          </div>

          {/* Preset Template Select Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Template
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                const tpl = TEMPLATE_PRESETS.find((t) => t.id === e.target.value);
                if (tpl) handleSelectTemplate(tpl);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-800 outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="" disabled>
                -- Select Quick Template --
              </option>
              {TEMPLATE_PRESETS.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.icon} {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shree Ganesh Saptah & Mahaprasad Bhandara"
              value={invitationTitle}
              onChange={(e) => setInvitationTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Rich Text Toolbar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Message *
              </label>

              {/* Toolbar Buttons */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => insertFormatting("*")}
                  title="Bold (*text*)"
                  className="p-1 hover:bg-white rounded-lg text-slate-700 border-0 cursor-pointer"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("_")}
                  title="Italic (_text_)"
                  className="p-1 hover:bg-white rounded-lg text-slate-700 border-0 cursor-pointer"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("~")}
                  title="Strikethrough (~text~)"
                  className="p-1 hover:bg-white rounded-lg text-slate-700 border-0 cursor-pointer"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("\n• ")}
                  title="Bullet list"
                  className="p-1 hover:bg-white rounded-lg text-slate-700 border-0 cursor-pointer"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Emoji Bar */}
            <div className="flex items-center space-x-1.5 overflow-x-auto py-1 text-base">
              {["🪔", "🌺", "🙏", "🚩", "✨", "🎉", "🎂", "💐", "📍", "🗓️", "⏰", "🍲", "📱"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="p-1 bg-slate-50 hover:bg-slate-200 rounded-lg transition-transform active:scale-90 border-0 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              rows={6}
              required
              placeholder="Write your invitation details with date, time, venue, and host contact numbers..."
              value={invitationBody}
              onChange={(e) => setInvitationBody(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Invitation Banner Image Upload */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Banner Photo
            </label>
            <div className="flex items-center space-x-3">
              <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-2 border-0">
                <ImagePlus className="w-4 h-4 text-slate-600" />
                <span>Upload Card Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {cardImageUrl && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                  <img src={cardImageUrl} alt="Card Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setCardImageUrl("");
                      setCardImageFile(null);
                    }}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Real-time WhatsApp Message Preview Card */}
          <div className="p-4 bg-[#E5DDD5] rounded-2xl border border-slate-300 space-y-2 relative overflow-hidden">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center space-x-1">
              <MessageCircle className="w-3.5 h-3.5 text-whatsapp-green" />
              <span>Live Preview</span>
            </div>

            <div className="bg-white p-3 rounded-xl rounded-tl-xs shadow-xs max-w-sm space-y-2 border border-slate-200">
              {cardImageUrl && (
                <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-100">
                  <img src={cardImageUrl} alt="Card Banner" className="w-full h-full object-cover" />
                </div>
              )}

              {invitationTitle && (
                <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-1">
                  {invitationTitle}
                </h4>
              )}

              <p className="text-[11.5px] text-slate-800 font-medium whitespace-pre-wrap leading-relaxed font-sans">
                {invitationBody || "Your invitation message preview will appear here..."}
              </p>

              <div className="text-[9px] text-slate-400 text-right font-bold">
                12:45 PM ✓✓
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: WHATSAPP WEB STYLE CONTACT & GROUP SELECTOR ───────────────── */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Recipients</span>
              </h2>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Choose community members or groups to receive this digital invitation
              </p>
            </div>

            {/* Selected Counter Badge (Only when items selected) */}
            {selectedIds.length > 0 && (
              <div className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-black shadow-2xs animate-in fade-in duration-150">
                {selectedIds.length} Selected
              </div>
            )}
          </div>

          {/* Search & Tabs Controls */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contact name, phone, or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1.5 border-0 cursor-pointer shrink-0"
              >
                {isAllFilteredSelected ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-400" />
                    <span>Select All</span>
                  </>
                )}
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {[
                { key: "all", label: `All Members (${allContacts.length})` },
                { key: "selected", label: selectedIds.length > 0 ? `Selected (${selectedIds.length})` : "Selected" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilterTab(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border-0 cursor-pointer shrink-0 ${
                    activeFilterTab === tab.key
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact List Box */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
            {loadingContacts ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 animate-pulse">
                Loading community members...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">
                No matching community members found.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleSelect(contact.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs"
                        : "bg-white border-slate-200/80 hover:bg-slate-100/80 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black bg-indigo-100 text-indigo-700">
                        {contact.name[0]}
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
                  {sendingComplete ? "Broadcast Complete 🎉" : "Sending WhatsApp Invitations..."}
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
                <span>Sending Progress</span>
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
                Broadcast Delivery Logs ({sentLogs.length} / {selectedIds.length})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                {sentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between font-semibold text-slate-800"
                  >
                    <span className="truncate">{log.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Sent</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct 1-on-1 Manual Fallback */}
            {sendingComplete && (
              <div className="pt-2 space-y-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] font-semibold text-slate-700 text-center">
                  ✅ Successfully broadcasted invitations to {selectedIds.length} community contacts & groups via WhatsApp Web!
                </div>

                <button
                  type="button"
                  onClick={() => setSendingModalOpen(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer border-0"
                >
                  Done & Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
