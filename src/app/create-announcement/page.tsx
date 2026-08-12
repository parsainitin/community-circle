"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Megaphone, ArrowLeft, Send, Sparkles, Image as ImageIcon } from "lucide-react";

export default function CreateAnnouncementPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [banner, setBanner] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBanner(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload announcement banner");
      const data = await res.json();
      setBanner(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload announcement banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to post an announcement");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Please fill in both Announcement Title and Content");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const fullContent = `📢 **${title.trim()}**\n\n${content.trim()}`;

      const payload = {
        author: user._id,
        content: fullContent,
        type: "announcement",
        eventDetails: banner ? { poster: banner, title: title.trim(), date: "", location: "" } : undefined,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to post announcement");
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to post announcement");
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
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Wall
        </button>

        {/* Page Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur border border-white/20">
              <Megaphone className="w-3.5 h-3.5" /> Community Announcement
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold">Post an Announcement</h1>
            <p className="text-amber-100 text-sm max-w-xl">
              Broadcast important news, alerts, updates, or community notices directly to all members on the Wall.
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
              Announcement Title / Headline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Important Notice: Annual General Meeting Scheduled"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Announcement Details <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write full details of the announcement here..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Banner / Attachment Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingBanner}
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 dark:file:bg-amber-950 dark:file:text-amber-300 hover:file:bg-amber-100 transition"
              />
              {uploadingBanner && <span className="text-xs text-amber-600 animate-pulse">Uploading...</span>}
            </div>
            {banner && (
              <div className="mt-3 relative rounded-xl overflow-hidden max-h-48 border border-slate-200 dark:border-slate-700">
                <img src={banner} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || uploadingBanner}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {submitting ? "Publishing Announcement..." : "Post Announcement to Wall"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
