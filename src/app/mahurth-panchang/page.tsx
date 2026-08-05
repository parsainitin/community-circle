"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Sun,
  Moon,
  Clock,
  Sparkles,
  Heart,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
  Compass,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface ShadiMuhuratResult {
  date: string;
  day: string;
  tithi: string;
  nakshatra: string;
  shubhLagna: string;
  timing: string;
  suitability: string;
  notes: string;
}

interface PanchangData {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  vikramSamvat: number;
  sakaSamvat: number;
  paksha: string;
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  abhijitMuhurat: string;
  rahuKaal: string;
  dayChoghadiya: { time: string; name: string; type: "shubh" | "ashubh" | "neutral" }[];
}

export default function MahurthPanchangPage() {
  const [activeTab, setActiveTab] = useState<"panchang" | "shadi_muhurat">("panchang");

  // Selected date for Today's Panchang
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [panchangLoading, setPanchangLoading] = useState<boolean>(true);
  const [panchangData, setPanchangData] = useState<PanchangData | null>(null);

  // Form fields for Shadi Muhurat
  const [groomName, setGroomName] = useState("");
  const [groomDob, setGroomDob] = useState("");
  const [brideName, setBrideName] = useState("");
  const [brideDob, setBrideDob] = useState("");
  const [targetMonth, setTargetMonth] = useState("2026-11"); // YYYY-MM
  const [searching, setSearching] = useState(false);
  const [muhuratResults, setMuhuratResults] = useState<ShadiMuhuratResult[] | null>(null);
  const [gunaScore, setGunaScore] = useState<number | null>(null);

  // Fetch real Panchang data from astronomy API endpoint
  const fetchPanchang = async (dateStr: string) => {
    setPanchangLoading(true);
    try {
      const res = await fetch(`/api/panchang?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setPanchangData(data);
      }
    } catch (e) {
      console.error("Failed to fetch Panchang", e);
    } finally {
      setPanchangLoading(false);
    }
  };

  useEffect(() => {
    fetchPanchang(selectedDate);
  }, [selectedDate]);

  // Generate Shadi Muhurat calculation based on real astronomy API
  const handleFetchShadiMuhurat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groomName || !brideName || !targetMonth) {
      alert("Please fill in Groom Name, Bride Name, and Target Month");
      return;
    }

    setSearching(true);
    try {
      const res = await fetch("/api/panchang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groomName,
          groomDob,
          brideName,
          brideDob,
          targetMonth,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGunaScore(data.gunaScore);
        setMuhuratResults(data.muhuratResults || []);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to calculate Shadi Muhurats");
      }
    } catch (e) {
      console.error("Error searching Shadi Muhurat", e);
      alert("Error searching Shadi Muhurat");
    } finally {
      setSearching(false);
    }
  };

  const getWhatsAppShareUrl = (result: ShadiMuhuratResult) => {
    const text = encodeURIComponent(
      `💍 *Shadi Muhurat Recommendation*\n\n` +
        `👰 Bride: ${brideName || "Bride"}\n` +
        `🤵 Groom: ${groomName || "Groom"}\n` +
        `🗓️ Date: ${result.date} (${result.day})\n` +
        `✨ Tithi & Nakshatra: ${result.tithi} • ${result.nakshatra}\n` +
        `⏰ Auspicious Lagna Timing: ${result.timing}\n` +
        `🌟 Suitability: ${result.suitability}\n` +
        `💖 Guna Milan Score: ${gunaScore || "30"}/36 (Auspicious Match)\n\n` +
        `Calculated via Community Circle Mahurth & Panchang Engine.`
    );
    return `https://wa.me/?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 select-none">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/events"
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-black tracking-wide flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Mahurth & Panchang</span>
              </h1>
              <p className="text-[10px] text-amber-100 font-medium">
                Real Astronomy Panchang & Shadi Muhurat Engine
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-xs border border-slate-200 flex space-x-1">
          <button
            onClick={() => setActiveTab("panchang")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === "panchang"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Today's Panchang (आज का पंचांग)</span>
          </button>

          <button
            onClick={() => setActiveTab("shadi_muhurat")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === "shadi_muhurat"
                ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Shadi Muhurat (विवाह मुहूर्त)</span>
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 1: TODAY'S PANCHANG                                       */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "panchang" && (
          <div className="space-y-4">
            {/* Date Selection Bar */}
            <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-700">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold">Select Date:</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:border-amber-500 cursor-pointer"
              />
            </div>

            {panchangLoading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-xs">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-amber-600" />
                <span className="text-xs text-slate-400 font-semibold">
                  Calculating Real Astronomical Panchang...
                </span>
              </div>
            ) : panchangData ? (
              <>
                {/* Panchang Summary Header Card */}
                <div className="bg-gradient-to-br from-amber-700 via-amber-600 to-orange-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute right-3 top-3 opacity-10">
                    <Compass className="w-32 h-32 text-white" />
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider">
                          Vikram Samvat {panchangData.vikramSamvat} • Saka Samvat {panchangData.sakaSamvat}
                        </span>
                        <h2 className="text-lg font-black mt-0.5">
                          {panchangData.formattedDate}
                        </h2>
                      </div>
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-extrabold backdrop-blur-xs">
                        {panchangData.paksha}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-500/40 text-xs">
                      <div>
                        <span className="text-[10px] text-amber-200 font-medium block">Tithi (तिथि)</span>
                        <span className="font-extrabold text-sm">{panchangData.tithi}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-200 font-medium block">Nakshatra (नक्षत्र)</span>
                        <span className="font-extrabold text-sm">{panchangData.nakshatra}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-200 font-medium block">Yoga (योग)</span>
                        <span className="font-extrabold text-sm">{panchangData.yoga}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-200 font-medium block">Karana (करण)</span>
                        <span className="font-extrabold text-sm">{panchangData.karana}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sun & Moon Timings (stacked vertically one by one) */}
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3.5">
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
                      <Sun className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        Sun Timings (सूर्योदय एवं सूर्यास्त)
                      </span>
                      <div className="flex space-x-6 mt-1 text-xs font-black text-slate-800">
                        <span>Sunrise: {panchangData.sunrise}</span>
                        <span>Sunset: {panchangData.sunset}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3.5">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                      <Moon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        Moon Timings (चंद्रोदय एवं चंद्रास्त)
                      </span>
                      <div className="flex space-x-6 mt-1 text-xs font-black text-slate-800">
                        <span>Moonrise: {panchangData.moonrise}</span>
                        <span>Moonset: {panchangData.moonset}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shubh & Ashubh Muhurat Timings */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Important Muhurat Timings for {selectedDate}</span>
                  </h3>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                    {/* Shubh Muhurat */}
                    <div className="space-y-2 pb-3 border-b border-slate-100">
                      <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Auspicious Timings (शुभ मुहूर्त)</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Abhijit Muhurat</span>
                          <span className="font-bold text-slate-800">{panchangData.abhijitMuhurat}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Brahma Muhurat</span>
                          <span className="font-bold text-slate-800">04:32 AM – 05:18 AM</span>
                        </div>
                      </div>
                    </div>

                    {/* Ashubh Timings */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Inauspicious Period (अशुभ समय)</span>
                      </span>
                      <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-rose-600 block font-bold">Rahu Kaal (राहु काल)</span>
                          <span className="font-bold text-rose-950">{panchangData.rahuKaal}</span>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                          Avoid New Beginnings
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day Choghadiya Grid */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>Day Choghadiya (दिन का चौघड़िया)</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {panchangData.dayChoghadiya.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-center text-xs ${
                          item.type === "shubh"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                            : item.type === "ashubh"
                            ? "bg-rose-50 border-rose-200 text-rose-950"
                            : "bg-amber-50 border-amber-200 text-amber-950"
                        }`}
                      >
                        <span className="text-[9px] font-bold opacity-70 block">{item.time}</span>
                        <span className="font-extrabold block mt-0.5">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 2: SHADI MUHURAT FINDER                                   */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "shadi_muhurat" && (
          <div className="space-y-4">
            {/* Form Input Card */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 space-y-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Calculate Shadi Muhurat & Guna Milan</span>
                </h2>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Enter Groom and Bride details to compute real auspicious marriage dates
                </p>
              </div>

              <form onSubmit={handleFetchShadiMuhurat} className="space-y-3.5">
                {/* Groom Details (stacked vertically one by one) */}
                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
                    🤵 Groom Details (वर का विवरण)
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Groom Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Groom Date of Birth
                    </label>
                    <input
                      type="date"
                      value={groomDob}
                      onChange={(e) => setGroomDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Bride Details (stacked vertically one by one) */}
                <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">
                    👰 Bride Details (वधू का विवरण)
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Bride Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pooja Verma"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Bride Date of Birth
                    </label>
                    <input
                      type="date"
                      value={brideDob}
                      onChange={(e) => setBrideDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-rose-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Targeted Month Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Targeted Marriage Month & Year *
                  </label>
                  <input
                    type="month"
                    required
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-black text-slate-800 outline-hidden focus:border-rose-500 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={searching}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 border-0 cursor-pointer disabled:opacity-50"
                >
                  {searching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Computing Real Astronomical Muhurats...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Find Shadi Muhurat Dates</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Muhurat & Compatibility Results */}
            {muhuratResults && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Guna Milan Score Banner */}
                {gunaScore !== null && (
                  <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white rounded-3xl p-4 shadow-md flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs">
                        <Award className="w-6 h-6 text-amber-200" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider block">
                          Ashtakoot Guna Milan Score
                        </span>
                        <h3 className="text-base font-black">
                          {gunaScore} / 36 Gunas Matched
                        </h3>
                      </div>
                    </div>
                    <span className="bg-white/25 px-3 py-1 rounded-full text-xs font-extrabold">
                      {gunaScore >= 28 ? "Uttam Match (उत्तम)" : "Shubh Match (शुभ)"}
                    </span>
                  </div>
                )}

                {/* List of Auspicious Dates */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                      Auspicious Vivah Dates for {targetMonth} ({muhuratResults.length})
                    </h3>
                  </div>

                  {muhuratResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200 space-y-3 hover:border-rose-300 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <h4 className="text-sm font-black text-slate-900">
                            {result.date} ({result.day})
                          </h4>
                        </div>
                        <span className="text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {result.suitability}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold">Tithi</span>
                          <span>{result.tithi}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold">Nakshatra</span>
                          <span>{result.nakshatra}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold">Shubh Lagna</span>
                          <span>{result.shubhLagna}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold">Auspicious Timing</span>
                          <span className="text-rose-700 font-extrabold">{result.timing}</span>
                        </div>
                      </div>

                      {result.notes && (
                        <p className="text-[11px] text-slate-500 font-medium bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                          💡 {result.notes}
                        </p>
                      )}

                      {/* WhatsApp Share Button */}
                      <div className="pt-1 flex justify-end">
                        <a
                          href={getWhatsAppShareUrl(result)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer no-underline border-0"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share Muhurat on WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
