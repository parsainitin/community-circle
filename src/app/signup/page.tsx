"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, Camera, CheckCircle2, User, Search, ShieldCheck } from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";

// 3-Step Simplified Signup Process
const STEPS = [
  {
    emoji: "👋",
    title: "Basic Info (मूल जानकारी)",
    hint: "Enter your full name and mobile number to register",
    accent: "#ea580c",
    bg: "#fff7ed",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "Family Linkage (परिवार संबंध)",
    hint: "Link to an existing family member in the community (optional)",
    accent: "#d97706",
    bg: "#fef3c7",
  },
  {
    emoji: "📸",
    title: "Profile Photo (फ़ोटो)",
    hint: "Upload a profile photo so your community can recognize you",
    accent: "#db2777",
    bg: "#fce7f3",
  },
];

const TOTAL = STEPS.length;

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");

  // Parent Member Search States
  const [parentId, setParentId] = useState("");
  const [parentRelationship, setParentRelationship] = useState("");
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const [parentSearchResults, setParentSearchResults] = useState<{ _id: string; name: string; mobileNumber: string; city?: string }[]>([]);
  const [isSearchingParent, setIsSearchingParent] = useState(false);
  const [selectedParentObj, setSelectedParentObj] = useState<{ _id: string; name: string; mobileNumber: string; city?: string } | null>(null);

  // Debounced parent member search
  useEffect(() => {
    if (!parentSearchQuery.trim()) {
      setParentSearchResults([]);
      setIsSearchingParent(false);
      return;
    }
    setIsSearchingParent(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/community/members?search=${encodeURIComponent(parentSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setParentSearchResults((data.members || []).slice(0, 8));
        }
      } catch (e) {
        console.error("Failed to search parent members:", e);
      } finally {
        setIsSearchingParent(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [parentSearchQuery]);

  const handleNextStep = async () => {
    setError(null);
    if (step === 0) {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      const cleanMobile = mobileNumber.replace(/\D/g, "");
      if (cleanMobile.length !== 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
      // Check if mobile number is already taken
      try {
        const params = new URLSearchParams({ mobileNumber: cleanMobile });
        const res = await fetch(`/api/auth/check?${params}`);
        if (res.ok) {
          const checkData = await res.json();
          if (checkData.mobileNumberExists) {
            setError("This mobile number is already registered. Please login.");
            return;
          }
        }
      } catch {}
    } else if (step === 1) {
      if (parentId && !parentRelationship) {
        setError("Please select your relationship with the linked parent member.");
        return;
      }
    }

    if (step < TOTAL - 1) {
      setDirection("forward");
      setAnimKey((k) => k + 1);
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (step > 0) {
      setDirection("back");
      setAnimKey((k) => k + 1);
      setStep((s) => s - 1);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!checkFileSize(file, 10)) {
      setError("Selected photo exceeds 10MB limit.");
      return;
    }

    try {
      const compressed = await compressImage(file, 10);
      setAvatarFile(compressed);
      setAvatarUrl(URL.createObjectURL(compressed));
    } catch {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    let finalAvatarUrl = "";
    if (avatarFile) {
      try {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const r = await fetch("/api/upload", { method: "POST", body: formData });
        const d = await r.json();
        if (r.ok) finalAvatarUrl = d.url;
      } catch {}
    }

    const res = await signup({
      name: name.trim(),
      mobileNumber: mobileNumber.replace(/\D/g, ""),
      phone: mobileNumber.replace(/\D/g, ""),
      avatar: finalAvatarUrl,
      parentId: parentId || undefined,
      parentRelationship: parentRelationship || undefined,
    });

    setLoading(false);
    if (res.success) {
      if (res.pendingApproval) {
        setIsPendingApproval(true);
      } else {
        setDone(true);
      }
    } else {
      setError(res.error || "Failed to create account");
    }
  };

  // ── Pending Approval screen ───────────────────────────────────────
  if (isPendingApproval) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50/80 via-slate-50 to-orange-50/60 p-6 text-center select-none">
        <div className="w-20 h-20 bg-amber-100/80 text-amber-600 rounded-3xl flex items-center justify-center text-4xl mb-5 shadow-sm border border-amber-200/50">
          ⏳
        </div>
        <h1 className="text-2xl font-black text-slate-800">Registration Submitted!</h1>
        <p className="text-sm text-slate-600 font-medium mt-2 max-w-xs leading-relaxed">
          Thank you, <strong className="text-slate-900">{name}</strong>! Your registration is currently <strong className="text-amber-700">pending approval</strong> by your community admin.
        </p>
        <div className="my-6 p-4 bg-white/90 rounded-2xl border border-amber-200/80 text-xs text-slate-700 font-medium max-w-xs text-left space-y-2 shadow-sm">
          <div className="flex items-start space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Your login password will be generated by your admin and sent to you via <strong className="text-slate-900">WhatsApp or SMS</strong> upon approval.
            </span>
          </div>
        </div>
        <button
          onClick={() => router.push("/auth/signin")}
          className="w-full max-w-xs py-3.5 bg-slate-900 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:bg-slate-800 transition-all cursor-pointer border-0 active:scale-98"
        >
          Go to Login Screen
        </button>
      </div>
    );
  }

  // ── Success screen ─────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50/80 via-slate-50 to-teal-50/60 p-6 text-center select-none">
        <div className="w-20 h-20 bg-emerald-100/80 text-emerald-600 rounded-3xl flex items-center justify-center text-4xl mb-5 shadow-sm border border-emerald-200/50">
          🎉
        </div>
        <h1 className="text-2xl font-black text-slate-800">Welcome to Community Circle!</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-xs font-medium">
          Your profile for <strong className="text-slate-800">{name}</strong> has been created successfully.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 w-full max-w-xs py-3.5 bg-emerald-600 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:bg-emerald-700 transition-all cursor-pointer border-0 active:scale-98"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const currentMeta = STEPS[step];
  const progressPercent = Math.round(((step + 1) / TOTAL) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/50 flex flex-col justify-between selection:bg-orange-500/20 font-sans">
      {/* Top Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={step > 0 ? handlePrevStep : () => router.push("/auth/signin")}
          className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <span className="text-[11px] font-extrabold tracking-widest text-orange-600 uppercase">
            Step {step + 1} of {TOTAL}
          </span>
          <h2 className="text-sm font-black text-slate-900 mt-0.5">{currentMeta.title}</h2>
        </div>
        <div className="w-10" />
      </div>

      {/* Progress Bar */}
      <div className="px-5 max-w-md mx-auto w-full">
        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden border border-slate-200/50">
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 flex flex-col justify-center px-5 py-6 max-w-md mx-auto w-full">
        <div className="bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
          {/* Step Banner */}
          <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-100">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border border-slate-100"
              style={{ backgroundColor: currentMeta.bg, color: currentMeta.accent }}
            >
              {currentMeta.emoji}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">{currentMeta.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{currentMeta.hint}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold animate-fade-in">
              {error}
            </div>
          )}

          {/* STEP 0: Basic Information */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Full Name (पूरा नाम) <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Mobile No. (मोबाइल नं.) <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-500">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium tracking-wide"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">This will be your login username (लॉगिन उपयोगकर्ता नाम).</p>
              </div>
            </div>
          )}

          {/* STEP 1: Family Tree Linkage */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Search Parent / Head (अभिभावक खोजें)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search member by name or mobile..."
                    value={parentSearchQuery}
                    onChange={(e) => setParentSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Selected Parent Card */}
              {selectedParentObj && (
                <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-orange-900">{selectedParentObj.name}</p>
                    <p className="text-[11px] text-orange-700/80 font-medium">📱 {selectedParentObj.mobileNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedParentObj(null);
                      setParentId("");
                      setParentRelationship("");
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-bold cursor-pointer border-0 bg-transparent"
                  >
                    Remove (हटाएं)
                  </button>
                </div>
              )}

              {/* Search Results Dropdown */}
              {!selectedParentObj && parentSearchQuery && (
                <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-lg">
                  {isSearchingParent ? (
                    <div className="p-3 text-xs text-slate-500 text-center font-medium">Searching members...</div>
                  ) : parentSearchResults.length > 0 ? (
                    parentSearchResults.map((m) => (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => {
                          setSelectedParentObj(m);
                          setParentId(m._id);
                          setParentSearchQuery("");
                          setParentSearchResults([]);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-orange-50/60 flex items-center justify-between text-xs cursor-pointer transition-colors border-0"
                      >
                        <span className="font-bold text-slate-800">{m.name}</span>
                        <span className="text-slate-500 text-[11px] font-medium">{m.mobileNumber}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-slate-500 text-center font-medium">No matching members found</div>
                  )}
                </div>
              )}

              {/* Parent Relationship Dropdown */}
              {parentId && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Relationship (संबंध) <span className="text-orange-500">*</span>
                  </label>
                  <select
                    value={parentRelationship}
                    onChange={(e) => setParentRelationship(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-orange-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="">— Select Relationship (संबंध चुनें) —</option>
                    <option value="Son">Son (पुत्र)</option>
                    <option value="Daughter">Daughter (पुत्री)</option>
                    <option value="Wife">Wife (पत्नी)</option>
                    <option value="Husband">Husband (पति)</option>
                    <option value="Father">Father (पिता)</option>
                    <option value="Mother">Mother (माता)</option>
                  </select>
                </div>
              )}

              {!parentId && (
                <p className="text-[11px] text-slate-500 text-center italic font-medium">
                  Linkage is optional (ऐच्छिक). You can skip this step if you are registering as a primary family head.
                </p>
              )}
            </div>
          )}

          {/* STEP 2: Profile Photo */}
          {step === 2 && (
            <div className="space-y-5 text-center animate-fade-in">
              <div className="relative w-28 h-28 mx-auto">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover border-2 border-orange-500 shadow-md"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-9 h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-800">
                  {avatarFile ? avatarFile.name : "No photo selected (कोई फ़ोटो नहीं चुनी गई)"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Upload a clear face photo (अपनी साफ़ फ़ोटो अपलोड करें). Max 10MB.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center space-x-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer border-0"
              >
                &larr; Back (पीछे)
              </button>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={handleNextStep}
              className={`py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer border-0 flex items-center justify-center space-x-2 active:scale-98 ${
                step > 0 ? "w-2/3" : "w-full"
              }`}
            >
              {loading ? (
                <span>Registering...</span>
              ) : step === TOTAL - 1 ? (
                <span>Submit Registration (पंजीकरण जमा करें)</span>
              ) : (
                <span>Continue (आगे बढ़ें) &rarr;</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center text-[11px] text-slate-400 font-medium">
        CommunityCircle &copy; {new Date().getFullYear()} — Empowering Connections
      </div>
    </div>
  );
}
