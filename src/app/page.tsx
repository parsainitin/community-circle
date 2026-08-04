"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Heart,
  Calendar,
  MapPin,
  Plus,
  Megaphone,
  MessageSquare,
  X,
  FileText,
  IndianRupee,
  Clock,
  ImagePlus,
  Send,
  User,
} from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";

interface PostType {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    phone?: string;
  };
  type: string;
  likes: string[];
  createdAt: string;
  eventDetails?: {
    title: string;
    date: string;
    location: string;
    poster?: string;
    contributionFee?: number;
  };
  rsvps?: {
    going: string[];
    maybe: string[];
    cant: string[];
  };
  pollDetails?: {
    options: string[];
  };
  pollVotes?: {
    userId: string;
    optionIndex: number;
  }[];
  replies?: any[];
}

export default function WallPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  // Comments and accordion toggles
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Floating Action Button (FAB) & Create Modal State
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [activeModal, setActiveModal] = useState<"event" | "announcement" | "text" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Event Form State
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventFee, setEventFee] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  // Announcement Form State
  const [announcementContent, setAnnouncementContent] = useState("");

  // Text Post Form State
  const [textContent, setTextContent] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts?page=1&limit=10");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        hasMoreRef.current = data.hasMore ?? false;
        pageRef.current = 1;
        setHasMore(data.hasMore ?? false);
      }
    } catch (e) {
      console.error("Failed to fetch posts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          const nextPage = pageRef.current + 1;
          loadingMoreRef.current = true;
          setLoadingMore(true);
          fetch(`/api/posts?page=${nextPage}&limit=10`)
            .then((r) => r.json())
            .then((data) => {
              setPosts((prev) => [...prev, ...(data.posts || [])]);
              hasMoreRef.current = data.hasMore ?? false;
              pageRef.current = nextPage;
              setHasMore(data.hasMore ?? false);
            })
            .catch(console.error)
            .finally(() => {
              loadingMoreRef.current = false;
              setLoadingMore(false);
            });
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        " - " +
        date.toLocaleDateString([], { month: "short", day: "numeric" })
      );
    } catch {
      return "";
    }
  };

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Optimistic Like Handler
  const handleLike = async (postId: string) => {
    if (!user) return;
    const previousPosts = [...posts];

    setPosts((prev) =>
      prev.map((post) => {
        if (post._id === postId) {
          const likes = [...post.likes];
          const index = likes.indexOf(user._id);
          if (index > -1) {
            likes.splice(index, 1);
          } else {
            likes.push(user._id);
          }
          return { ...post, likes };
        }
        return post;
      })
    );

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
      if (!res.ok) setPosts(previousPosts);
    } catch {
      setPosts(previousPosts);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text || !text.trim() || !user) return;

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));

    try {
      const res = await fetch(`/api/posts/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          content: text.trim(),
        }),
      });

      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("Add comment error", err);
    }
  };

  // Submit Event Creation
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDesc.trim() || !user) return;

    setSubmitting(true);
    let posterUrl: string | undefined;

    if (posterFile) {
      try {
        const formData = new FormData();
        formData.append("file", posterFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          posterUrl = uploadData.url;
        }
      } catch (err) {
        console.error("Failed to upload event poster", err);
      }
    }

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: eventDesc.trim(),
          author: user._id,
          type: "event",
          eventDetails: {
            title: eventTitle.trim(),
            date: eventDate.trim() || "TBD",
            location: eventLocation.trim() || "Online",
            poster: posterUrl,
            contributionFee: eventFee ? parseFloat(eventFee) : 0,
          },
        }),
      });

      if (res.ok) {
        showToast("🎉 New Event created & published on Wall!");
        setEventTitle(""); setEventDate(""); setEventLocation(""); setEventFee(""); setEventDesc("");
        setPosterFile(null); setPosterPreview(null);
        setActiveModal(null);
        fetchPosts();
      } else {
        alert("Failed to create event");
      }
    } catch {
      alert("Error creating event");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Announcement Creation
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementContent.trim() || !user) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: announcementContent.trim(),
          author: user._id,
          type: "announcement",
        }),
      });

      if (res.ok) {
        showToast("📢 Announcement published on Wall!");
        setAnnouncementContent("");
        setActiveModal(null);
        fetchPosts();
      } else {
        alert("Failed to post announcement");
      }
    } catch {
      alert("Error creating announcement");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Text Post Creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() || !user) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textContent.trim(),
          author: user._id,
          type: "text",
        }),
      });

      if (res.ok) {
        showToast("💬 Post shared on Wall!");
        setTextContent("");
        setActiveModal(null);
        fetchPosts();
      } else {
        alert("Failed to create post");
      }
    } catch {
      alert("Error creating post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Community Banner — Traditional Brahmin Saffron & Gold Theme */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 rounded-3xl p-4.5 text-white shadow-md border border-amber-500/30 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold tracking-wide drop-shadow-xs">Jambu Community Wall</h2>
          <p className="text-[11px] text-amber-100 font-medium mt-0.5">
            Connect, share announcements & upcoming community events
          </p>
        </div>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center space-y-3">
          <div className="w-7 h-7 border-2 border-whatsapp-green border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Loading Community Feed...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">No community posts yet</p>
          <p className="text-[10px] text-slate-400 mt-1">
            Tap the floating <strong className="text-whatsapp-green">+</strong> button below to create the first event or announcement!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const hasLiked = post.likes?.includes(user?._id || "");
            return (
              <div
                key={post._id}
                className="bg-white rounded-3xl p-4.5 border border-slate-100/90 shadow-xs hover:shadow-sm transition-all overflow-hidden"
              >
                {/* Author Info Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-whatsapp-green text-white font-black text-xs flex items-center justify-center uppercase shadow-xs">
                      {post.author?.name ? post.author.name.charAt(0) : "U"}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 leading-tight">
                        {post.author?.name || "Community Member"}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                        {formatTime(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <span
                    className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      post.type === "event"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : post.type === "announcement"
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {post.type}
                  </span>
                </div>

                {/* Event Card Render */}
                {post.type === "event" && post.eventDetails ? (
                  <div className="mt-3 space-y-3">
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-black text-emerald-950">
                            {post.eventDetails.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1 text-[11px] font-bold text-whatsapp-green">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{formatEventDate(post.eventDetails.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5 text-[11px] font-semibold text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{post.eventDetails.location}</span>
                          </div>
                        </div>

                        {(post.eventDetails.contributionFee ?? 0) > 0 && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-lg border border-amber-200 shrink-0 flex items-center space-x-1">
                            <IndianRupee className="w-3 h-3" />
                            <span>{post.eventDetails.contributionFee}</span>
                          </span>
                        )}
                      </div>

                      {post.eventDetails.poster && (
                        <div className="rounded-xl overflow-hidden max-h-[200px] border border-emerald-200/60 mt-2">
                          <img
                            src={post.eventDetails.poster}
                            alt="Event Poster"
                            className="w-full object-cover h-[200px]"
                          />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {post.content}
                    </p>
                  </div>
                ) : post.type === "announcement" ? (
                  /* Announcement Card Render */
                  <div className="mt-3 bg-amber-50/80 border border-amber-200/60 p-3.5 rounded-2xl space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-amber-700 font-black text-[10px] uppercase tracking-wider">
                      <Megaphone className="w-3.5 h-3.5 shrink-0" />
                      <span>Announcement</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                ) : (
                  /* Regular Text Post */
                  <p className="mt-3 text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}

                {/* Interaction Footer */}
                <div className="flex items-center space-x-4 pt-3 mt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center space-x-1.5 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all border cursor-pointer ${
                      hasLiked
                        ? "bg-red-50 text-red-500 border-red-200"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                    <span>Like ({post.likes?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post._id)}
                    className={`flex items-center space-x-1.5 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all border cursor-pointer ${
                      expandedComments[post._id]
                        ? "bg-whatsapp-light text-whatsapp-green border-whatsapp-teal/20"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Comment ({post.replies?.length || 0})</span>
                  </button>
                </div>

                {/* Expandable Comments Section */}
                {expandedComments[post._id] && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    {post.replies && post.replies.length > 0 ? (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {post.replies.map((reply: any) => (
                          <div
                            key={reply._id}
                            className="bg-slate-50/70 hover:bg-slate-50 p-2.5 rounded-xl text-[11px] leading-relaxed text-slate-600 border border-slate-100/50"
                          >
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-slate-800">
                                {reply.author?.name || "Member"}
                              </span>
                              <span className="text-[8px] text-slate-400 font-medium">
                                {formatTime(reply.createdAt)}
                              </span>
                            </div>
                            <p className="font-medium text-slate-700">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic text-center py-1 font-semibold">
                        No comments yet. Be the first to comment!
                      </p>
                    )}

                    {/* Add Comment Form */}
                    <form
                      onSubmit={(e) => handleAddComment(e, post._id)}
                      className="flex items-center space-x-2 pt-1 border-t border-slate-50"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Write a comment..."
                        value={commentInputs[post._id] || ""}
                        onChange={(e) =>
                          setCommentInputs({ ...commentInputs, [post._id]: e.target.value })
                        }
                        className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 px-3 py-2 text-xs focus:border-whatsapp-green outline-hidden text-slate-800 font-medium"
                      />
                      <button
                        type="submit"
                        className="py-2 px-3.5 bg-whatsapp-green hover:bg-whatsapp-teal text-white font-bold rounded-xl text-[11px] transition-transform active:scale-95 border-0 cursor-pointer shadow-xs"
                      >
                        Post
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {loadingMore && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-whatsapp-green" />
        )}
        {!hasMore && posts.length > 0 && !loading && (
          <p className="text-[10px] font-semibold text-slate-400">You&apos;re all caught up ✓</p>
        )}
      </div>

      {/* ── FLOATING ACTION BUTTON (FAB) & SPEED-DIAL MENU ────────────── */}
      <div className="fixed bottom-20 right-5 z-40 flex flex-col items-end space-y-2 select-none">
        
        {/* Speed Dial Menu Options */}
        {showSpeedDial && (
          <div className="flex flex-col space-y-2 mb-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
            {/* Option 1: Create Event */}
            <button
              onClick={() => {
                setShowSpeedDial(false);
                setActiveModal("event");
              }}
              className="flex items-center space-x-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xl border-0 cursor-pointer active:scale-95 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Event</span>
            </button>

            {/* Option 2: Post Announcement */}
            <button
              onClick={() => {
                setShowSpeedDial(false);
                setActiveModal("announcement");
              }}
              className="flex items-center space-x-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xl border-0 cursor-pointer active:scale-95 transition-all"
            >
              <Megaphone className="w-4 h-4" />
              <span>Post Announcement</span>
            </button>

            {/* Option 3: Share Wall Post */}
            <button
              onClick={() => {
                setShowSpeedDial(false);
                setActiveModal("text");
              }}
              className="flex items-center space-x-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xl border-0 cursor-pointer active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Share Post</span>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setShowSpeedDial(!showSpeedDial)}
          className={`w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center transition-all cursor-pointer border-0 active:scale-90 ${
            showSpeedDial
              ? "bg-slate-900 rotate-45"
              : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 hover:scale-105 shadow-amber-500/30"
          }`}
          title="Add Event or Announcement"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* ── CREATE EVENT MODAL ───────────────────────────────────────── */}
      {activeModal === "event" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-emerald-600 font-black text-sm">
                <Calendar className="w-5 h-5" />
                <span>Create Community Event</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Community Sangeet & Dinner"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Location / Venue *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Town Hall / Zoom"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Contribution Fee (Optional, 0 = Free)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={eventFee}
                    onChange={(e) => setEventFee(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Event Poster (Optional)
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => posterInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-emerald-400 flex flex-col items-center justify-center cursor-pointer overflow-hidden shrink-0"
                  >
                    {posterPreview ? (
                      <img src={posterPreview} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <ImagePlus className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {posterPreview ? "Poster selected — tap to change" : "Upload promotional poster image"}
                  </span>
                </div>
                <input
                  ref={posterInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPosterPreview(URL.createObjectURL(file));
                    const compressed = await compressImage(file);
                    if (!checkFileSize(compressed, 5)) {
                      alert("Poster image must be under 5MB");
                      return;
                    }
                    setPosterFile(compressed);
                  }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Event Description *
                </label>
                <textarea
                  required
                  placeholder="Share agenda, timing breakdown, or guidelines..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Publishing Event..." : "Publish Event on Wall"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE ANNOUNCEMENT MODAL ─────────────────────────────────── */}
      {activeModal === "announcement" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-amber-600 font-black text-sm">
                <Megaphone className="w-5 h-5" />
                <span>Post Community Announcement</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Announcement Details *
                </label>
                <textarea
                  required
                  placeholder="Write announcement message for all community members..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Publishing..." : "Post Announcement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE TEXT POST MODAL ────────────────────────────────────── */}
      {activeModal === "text" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-800 font-black text-sm">
                <FileText className="w-5 h-5 text-whatsapp-green" />
                <span>Share Post on Wall</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  What's on your mind? *
                </label>
                <textarea
                  required
                  placeholder="Share thoughts, news, or updates with your community..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-whatsapp-green resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-whatsapp-green hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Sharing Post..." : "Share Post on Wall"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
