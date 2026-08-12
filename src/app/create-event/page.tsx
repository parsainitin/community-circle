"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Calendar, MapPin, DollarSign, Image as ImageIcon, ArrowLeft, Send, Sparkles, QrCode } from "lucide-react";

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [contributionFee, setContributionFee] = useState("");
  const [upiId, setUpiId] = useState("");
  const [poster, setPoster] = useState("");
  const [uploadingPoster, setUploadingPoster] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch community default UPI ID if available
  useEffect(() => {
    fetch("/api/community/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.community?.upiId) {
          setUpiId(data.community.upiId);
        }
      })
      .catch(() => {});
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPoster(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload poster image");
      const data = await res.json();
      setPoster(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload poster image");
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to schedule an event");
      return;
    }

    if (!title.trim() || !date.trim() || !location.trim() || !description.trim()) {
      setError("Please fill in all required event details (Title, Date, Location, Description)");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        author: user._id,
        content: description.trim(),
        type: "event",
        eventDetails: {
          title: title.trim(),
          date: date.trim(),
          location: location.trim(),
          poster: poster || undefined,
          contributionFee: contributionFee ? Number(contributionFee) : 0,
          upiId: upiId ? upiId.trim() : undefined,
          contributions: [],
        },
        rsvps: { going: [], maybe: [], cant: [] },
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Wall
        </button>

        {/* Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur border border-white/20">
              <Calendar className="w-3.5 h-3.5" /> Event Scheduler
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold">Schedule a Community Event</h1>
            <p className="text-indigo-100 text-sm max-w-xl">
              Organize events for your community, collect RSVPs (Accept, Tentative, Decline), and accept direct contributions via UPI!
            </p>
          </div>
          <Sparkles className="absolute right-4 bottom-4 w-32 h-32 text-white/10 pointer-events-none" />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Community Festival & Cultural Evening"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Date & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date & Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. Sunday, Oct 15, 2026 at 5:00 PM"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Community Hall, MG Road, Indore"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Contribution & UPI Details Grid */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-4 sm:p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-4">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Optional Contribution Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contribution Fee per Member (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={contributionFee}
                  onChange={(e) => setContributionFee(e.target.value)}
                  placeholder="0 (Leave empty if free)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UPI ID for Direct Contribution Payments
                </label>
                <div className="relative">
                  <QrCode className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. community@upi or 9826017177@upi"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Event Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the event, schedule, activities, guidelines, and expectations..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Poster Image */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Event Poster / Banner Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingPoster}
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100 transition"
              />
              {uploadingPoster && <span className="text-xs text-indigo-600 animate-pulse">Uploading...</span>}
            </div>
            {poster && (
              <div className="mt-3 relative rounded-xl overflow-hidden max-h-48 border border-slate-200 dark:border-slate-700">
                <img src={poster} alt="Event Banner" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || uploadingPoster}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {submitting ? "Publishing Event..." : "Post Event to Wall"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
