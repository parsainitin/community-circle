"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Heart,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Key,
  MapPin,
  MessageSquare,
  Building2,
  Users,
  CheckCircle2,
  ShieldAlert,
  Award,
  FileText,
  Sparkles,
  BookOpen,
  Info,
  Phone,
} from "lucide-react";

interface DonationType {
  _id: string;
  amount: number;
  donor: {
    _id: string;
    name: string;
    gotra?: string;
    kulDevi?: string;
  };
  transactionId: string;
  createdAt: string;
}

interface FAQItem {
  id: string;
  category: "password" | "approval" | "location" | "whatsapp" | "hubs" | "tree";
  categoryLabel: string;
  icon: any;
  question: string;
  steps: string[];
  tip?: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: "faq-reset-password",
    category: "password",
    categoryLabel: "🔐 Password & Login",
    icon: Key,
    question: "How do I reset my password if I forget it?",
    steps: [
      "Navigate to the Login / Auth page (/auth).",
      "Click or tap on the 'Forgot Password?' tab located next to Sign In.",
      "Enter your registered Mobile Number and your new desired Password.",
      "Enter the Admin Password Reset Key provided by your Community Admin (e.g. RESET123 or obtain key from your admin).",
      "Tap 'Reset' to save your new password and sign in immediately.",
    ],
    tip: "If you don't have the Admin Reset Key, contact any member tagged with the green Admin badge in the Directory.",
  },
  {
    id: "faq-pending-approval",
    category: "approval",
    categoryLabel: "⏳ Account Approval",
    icon: ShieldAlert,
    question: "Why does my account show 'Pending Approval' after sign up?",
    steps: [
      "To ensure community privacy and prevent unauthorized access, all new registrations undergo verification.",
      "Your signup request is automatically sent to your Community Admin's approval queue.",
      "Once your admin reviews and approves your details, your account status turns to 'Approved'.",
      "You will then be able to log in using your registered mobile number and password.",
    ],
    tip: "Approvals usually take a few hours. You can message your Community Admin on WhatsApp via the Directory if urgent.",
  },
  {
    id: "faq-gps-location",
    category: "location",
    categoryLabel: "📍 GPS Location Pin",
    icon: MapPin,
    question: "How to pin my exact GPS location on Google Maps?",
    steps: [
      "During signup (or when editing your profile), go to Step 2: 'Where do you live?'.",
      "Tap the '📍 Use GPS Location' button and allow location permission on your browser or mobile phone.",
      "Your exact GPS latitude and longitude coordinates will be captured automatically.",
      "A Map Pin icon 📍 will appear next to your contact in the Directory so community members can navigate to your address on Google Maps.",
    ],
    tip: "Make sure location services/GPS are enabled on your device for accurate coordinates.",
  },
  {
    id: "faq-whatsapp-chat",
    category: "whatsapp",
    categoryLabel: "💬 WhatsApp & Contacts",
    icon: MessageSquare,
    question: "How do I chat directly with a community member on WhatsApp?",
    steps: [
      "Open the Directory tab from the bottom navigation bar.",
      "Search for the member by name, city, gotra, or blood group.",
      "On the right side of their contact card, tap the green circular WhatsApp icon.",
      "WhatsApp will automatically launch with a prefilled message addressed to that member.",
    ],
  },
  {
    id: "faq-hubs-listing",
    category: "hubs",
    categoryLabel: "🏢 Community Hubs",
    icon: Building2,
    question: "How to showcase my home business, tutor service, or sale items on Hubs?",
    steps: [
      "Tap the 'Hubs' tab in the bottom navigation bar.",
      "Select a Hub category: 🏛️ Organizations, 🍳 Food & Showcase, 📚 Tutor Services, or 🛍️ Sale Online Stuffs.",
      "Tap the '+ Create' button on the category card or floating action button.",
      "Fill in your listing title, description, pricing/unit, upload photos, and tap Publish!",
    ],
    tip: "Listing your items on Hubs allows members to place direct WhatsApp orders with you!",
  },
  {
    id: "faq-family-tree",
    category: "tree",
    categoryLabel: "🌳 Family Lineage Tree",
    icon: Users,
    question: "How to build and link my Family Tree?",
    steps: [
      "Tap your profile avatar in the top app bar to open your Profile page.",
      "Switch to the 'Family Lineage' tab.",
      "Tap 'Link Relative' or select your parent during signup to automatically connect your family tree nodes.",
      "You can add parents, children, and spouses to visualize your generations.",
    ],
  },
  {
    id: "faq-contact-admin",
    category: "approval",
    categoryLabel: "📞 Contact Community Admin",
    icon: Phone,
    question: "How to contact my Community Admin for support?",
    steps: [
      "Open the Directory page.",
      "Look for contacts with a green 'Admin' badge next to their name.",
      "Tap their WhatsApp button or Phone icon to message or call your Community Admin directly for password keys or account help.",
    ],
  },
];

export default function HelpSupportPage() {
  const { user } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState<"support" | "donate">("support");

  // Support / FAQ States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-reset-password");

  // Donation States
  const [amount, setAmount] = useState("500");
  const [customAmount, setCustomAmount] = useState("");
  const [donations, setDonations] = useState<DonationType[]>([]);
  const [loadingReport, setLoadingReport] = useState(true);

  // GPay Sheet States
  const [showGPaySheet, setShowGPaySheet] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [savedTxId, setSavedTxId] = useState("");

  const presetAmounts = ["100", "500", "1000", "5000"];

  useEffect(() => {
    fetchDonationReport();
  }, []);

  const fetchDonationReport = async () => {
    try {
      const res = await fetch("/api/donations");
      if (res.ok) {
        const data = await res.json();
        setDonations(data || []);
      }
    } catch (e) {
      console.error("Failed to load donation report", e);
    } finally {
      setLoadingReport(false);
    }
  };

  const getActiveAmount = () => {
    return customAmount ? Number(customAmount) : Number(amount);
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const payVal = getActiveAmount();
    if (!payVal || payVal <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }
    setShowGPaySheet(true);
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    const txId = `GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000 + Math.random() * 90000)}`;

    setTimeout(async () => {
      try {
        const res = await fetch("/api/donations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donorId: user?._id || "anonymous-user-id",
            amount: getActiveAmount(),
            transactionId: txId,
            status: "success",
          }),
        });

        if (res.ok) {
          setSavedTxId(txId);
          setPaymentSuccess(true);
          fetchDonationReport();
        } else {
          alert("Payment completed but logging failed. Please reach out to support.");
        }
      } catch (err) {
        console.error("Save donation error", err);
      } finally {
        setProcessing(false);
      }
    }, 2000);
  };

  const toggleAccordion = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  // Filter FAQs
  const filteredFaqs = FAQ_LIST.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      faq.question.toLowerCase().includes(q) ||
      faq.categoryLabel.toLowerCase().includes(q) ||
      faq.steps.some((step) => step.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex flex-col space-y-4 pb-24 relative min-h-[75vh] select-none">
      {/* 📢 HERO HEADER */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 rounded-3xl p-5 text-white shadow-md border border-amber-500/30 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black tracking-wide flex items-center space-x-2 text-white">
            <span>Help & Support Hub</span>
            <Sparkles className="w-4 h-4 text-amber-200" />
          </h2>
          <p className="text-xs text-amber-100 font-bold mt-0.5 leading-relaxed max-w-xs">
            Step-by-step guides for all platform features, FAQs & community welfare donations.
          </p>
        </div>
        <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
          <HelpCircle className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* 🔀 MAIN TOP SEGMENTED TABS */}
      <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-xs flex">
        <button
          onClick={() => setActiveMainTab("support")}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center space-x-1.5 ${
            activeMainTab === "support"
              ? "bg-rose-700 text-white shadow-xs"
              : "bg-transparent text-slate-500 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>💡 Help & FAQs</span>
        </button>
        <button
          onClick={() => setActiveMainTab("donate")}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center space-x-1.5 ${
            activeMainTab === "donate"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-transparent text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Heart className="w-4 h-4 fill-current" />
          <span>🤝 Community Welfare</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: HELP & FAQS (SUPPORT TAB)                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeMainTab === "support" && (
        <div className="space-y-4">
          {/* Search Input Bar */}
          <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-100 flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            <input
              type="text"
              placeholder="Search help topics (e.g. reset password, GPS pin, hubs...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-hidden text-xs placeholder-slate-400 text-slate-800 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-lg border-0 cursor-pointer transition-all shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex overflow-x-auto no-scrollbar space-x-1.5 pb-1">
            {[
              { id: "all", label: "All Questions" },
              { id: "password", label: "🔐 Password" },
              { id: "approval", label: "⏳ Approval" },
              { id: "location", label: "📍 GPS Pin" },
              { id: "whatsapp", label: "💬 WhatsApp" },
              { id: "hubs", label: "🏢 Hubs" },
              { id: "tree", label: "🌳 Family Tree" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedCategory(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  selectedCategory === chip.id
                    ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Collapsible FAQ Cards */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-100">
                <Info className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No matching help topics found</h4>
                <p className="text-[11px] text-slate-400">Try searching for keywords like "password", "location", "tree", or "hubs".</p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const IconComponent = faq.icon;
                const isExpanded = expandedFaqId === faq.id;

                return (
                  <div
                    key={faq.id}
                    className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                      isExpanded
                        ? "border-rose-500 shadow-md ring-1 ring-rose-400/30"
                        : "border-slate-200/90 shadow-xs hover:border-slate-300"
                    }`}
                  >
                    {/* Collapsible Header */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full p-4 flex items-start justify-between text-left cursor-pointer border-0 bg-transparent space-x-3"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                            isExpanded ? "bg-rose-700 text-white shadow-xs" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <IconComponent className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block mb-0.5">
                            {faq.categoryLabel}
                          </span>
                          <h3 className="text-xs font-black text-slate-900 leading-snug">
                            {faq.question}
                          </h3>
                        </div>
                      </div>
                      <div className={`p-1 rounded-full shrink-0 transition-transform ${isExpanded ? "bg-rose-50 text-rose-700 rotate-180" : "text-slate-400"}`}>
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </button>

                    {/* Collapsible Content — Step by Step Guidance */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-3">
                        <div className="space-y-2.5">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block pt-1">
                            📌 Step-by-Step Guidance:
                          </span>
                          {faq.steps.map((stepText, idx) => (
                            <div key={idx} className="flex items-start space-x-2.5 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-2xs">
                              <span className="w-5 h-5 rounded-full bg-rose-700 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                                {stepText}
                              </p>
                            </div>
                          ))}
                        </div>

                        {faq.tip && (
                          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-800 font-bold flex items-start space-x-2">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Pro Tip:</strong> {faq.tip}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: COMMUNITY DONATIONS & WELFARE                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeMainTab === "donate" && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-amber-200/80 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-amber-100">
              <Heart className="w-6 h-6 fill-amber-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-black text-slate-900">जंबू कम्युनिटी सर्कल सहयोग</h2>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                प्लेटफ़ॉर्म को विज्ञापन-मुक्त, सुरक्षित और तेज़ रखने में सहयोग करें।
              </p>
            </div>
          </div>

          {/* Request Note */}
          <div className="bg-amber-50/90 border border-amber-200/80 p-4.5 rounded-3xl leading-relaxed text-xs text-slate-800 font-bold space-y-2 shadow-xs">
            <p className="text-xs font-black text-amber-950 border-b border-amber-200/80 pb-1 mb-1 uppercase tracking-wider">
              प्रिय जंबू कम्युनिटी सर्कल सदस्यों,
            </p>
            <p className="text-slate-800 font-semibold leading-relaxed">
              इस डिजिटल सर्कल को बिना किसी विज्ञापन के चलाने और हमारे कम्युनिटी डेटाबेस सर्वर को सुरक्षित व तेज रखने के लिए, हम आपसे आर्थिक सहयोग का विनम्र अनुरोध करते हैं।
            </p>
            <p className="text-slate-800 font-semibold leading-relaxed">
              आपका योगदान सीधे तौर पर हमारे डेटाबेस स्टोरेज, एपीआई इंटीग्रेशन और हमारे पारिवारिक इतिहास (Lineages) व बाजार कनेक्शनों (Marketplace) को सुरक्षित रखने के लिए मदद करता है! ❤️
            </p>
          </div>

          {/* Donation Form Card */}
          {!paymentSuccess ? (
            <form onSubmit={handleStartPayment} className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Select Amount (INR)</h3>
              
              {/* Presets */}
              <div className="grid grid-cols-4 gap-2.5">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(preset);
                      setCustomAmount("");
                    }}
                    className={`py-2 px-1 text-center font-black text-xs rounded-xl border transition-all active:scale-95 cursor-pointer ${
                      amount === preset && !customAmount
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Custom Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter custom amount..."
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-hidden focus:border-whatsapp-green focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-whatsapp-green hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer border-0"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Donate ₹{getActiveAmount()} via Google Pay / UPI</span>
              </button>
            </form>
          ) : (
            /* SUCCESS STATE */
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-emerald-900">सहयोग के लिए हार्दिक धन्यवाद!</h3>
              <p className="text-xs text-emerald-700 font-medium leading-relaxed max-w-xs mx-auto">
                आपका ₹{getActiveAmount()} का दान सफलतापूर्वक प्राप्त हुआ है।
              </p>
              <div className="bg-white/80 p-3 rounded-2xl border border-emerald-200/60 text-[11px] text-emerald-800 font-mono font-bold">
                TXN ID: {savedTxId}
              </div>
              <button
                onClick={() => setPaymentSuccess(false)}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer border-0"
              >
                Make Another Contribution
              </button>
            </div>
          )}

          {/* TRANSPARENCY LOG & DONORS REPORT */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-4.5 h-4.5 text-amber-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Community Donor Roll</h3>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {donations.length} Contributions
              </span>
            </div>

            {loadingReport ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">Loading transparency log...</div>
            ) : donations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">Be the first member to contribute!</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                {donations.map((d) => (
                  <div key={d._id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{d.donor?.name || "Anonymous Member"}</span>
                      {d.donor?.gotra && <span className="text-[10px] text-slate-400 block font-medium">Gotra: {d.donor.gotra}</span>}
                    </div>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      +₹{d.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💳 GOOGLE PAY MODAL SIMULATION */}
      {showGPaySheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-slate-900 text-white rounded-lg font-black text-xs flex items-center justify-center">G</div>
                <span className="font-extrabold text-slate-800 text-sm">Google Pay UPI</span>
              </div>
              <button
                onClick={() => setShowGPaySheet(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="text-center space-y-1 py-2">
              <span className="text-xs text-slate-400 font-semibold block">Paying Jambu Community Welfare Fund</span>
              <span className="text-2xl font-black text-slate-800">₹{getActiveAmount()}.00</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Account</span>
                <span className="font-mono text-slate-700">UPI ID: jambu.welfare@upi</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Payer</span>
                <span className="font-bold text-slate-700">{user?.name || "Member"}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing UPI Payment...</span>
                </>
              ) : (
                <span>Pay ₹{getActiveAmount()} & Confirm</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
