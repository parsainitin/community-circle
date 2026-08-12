"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Edit3, ArrowLeft, Send, Sparkles, Image as ImageIcon, X } from "lucide-react";

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();
      setImage(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to share a post");
      return;
    }

    if (!content.trim() && !image) {
      setError("Please enter post text or upload an image");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        author: user._id,
        content: content.trim(),
        type: image ? "image" : "text",
        eventDetails: image ? { poster: image, title: "", date: "", location: "" } : undefined,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to share post");
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to share post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-amber-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Wall
        </button>

        {/* Page Header */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur border border-white/20">
              <Edit3 className="w-3.5 h-3.5" /> Share Post
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold">Share Thoughts & Updates</h1>
            <p className="text-amber-100 text-sm max-w-xl">
              Post updates, stories, photos, or thoughts to connect with your community members on the Wall.
            </p>
          </div>
          <Sparkles className="absolute right-4 bottom-4 w-32 h-32 text-white/10 pointer-events-none" />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
          {/* Post Content */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Post Message / Story <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share an update, story, or message with your community..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Add Photo / Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 transition"
              />
              {uploadingImage && <span className="text-xs text-amber-600 animate-pulse font-semibold">Uploading...</span>}
            </div>
            {image && (
              <div className="mt-3 relative rounded-2xl overflow-hidden max-h-64 border border-slate-200 group">
                <img src={image} alt="Upload" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              <Send className="w-4 h-4" /> {submitting ? "Publishing Post..." : "Share Post to Wall"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
