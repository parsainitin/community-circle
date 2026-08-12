"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Send,
  User,
  CheckCircle2,
  HelpCircle,
  XCircle,
  QrCode,
  DollarSign,
  Users,
  Check,
  ExternalLink,
  Edit3,
} from "lucide-react";

interface UserSummary {
  _id: string;
  name: string;
  phone?: string;
  mobileNumber?: string;
  avatar?: string;
}

interface ContributionItem {
  userId: UserSummary | string;
  amount: number;
  transactionId?: string;
  paidAt?: string;
}

interface PostType {
  _id: string;
  content: string;
  author: UserSummary;
  type: string;
  likes: string[];
  createdAt: string;
  eventDetails?: {
    title: string;
    date: string;
    location: string;
    poster?: string;
    contributionFee?: number;
    upiId?: string;
    contributions?: ContributionItem[];
  };
  rsvps?: {
    going: (UserSummary | string)[];
    maybe: (UserSummary | string)[];
    cant: (UserSummary | string)[];
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

function getWhatsAppUrl(mobileNumber?: string) {
  if (!mobileNumber) return "";
  const digits = mobileNumber.replace(/\D/g, "");
  if (!digits) return "";
  const formatted = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${formatted}`;
}

export default function WallPage() {
  const { user } = useAuth();
  const router = useRouter();
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

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Contribution Modal State
  const [contributePost, setContributePost] = useState<PostType | null>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submittingContrib, setSubmittingContrib] = useState(false);

  // RSVP / Organizer Details Modal State
  const [organizerModalPost, setOrganizerModalPost] = useState<PostType | null>(null);
  const [organizerTab, setOrganizerTab] = useState<"accepted" | "tentative" | "declined" | "contributions">("accepted");

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
    if (!dateString) return "";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const previousPosts = [...posts];

    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          const likes = p.likes || [];
          const hasLiked = likes.includes(user._id);
          return {
            ...p,
            likes: hasLiked ? likes.filter((id) => id !== user._id) : [...likes, user._id],
          };
        }
        return p;
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

  // RSVP Action Handler (Accept, Tentative, Decline)
  const handleRsvp = async (postId: string, status: "going" | "maybe" | "cant") => {
    if (!user) {
      alert("Please log in to RSVP for events");
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, status }),
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
        const label = status === "going" ? "Accepted (Going)" : status === "maybe" ? "Tentative (Maybe)" : "Declined";
        showToast(`RSVP status updated: ${label}`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update RSVP");
      }
    } catch (err) {
      console.error("RSVP error", err);
    }
  };

  // Submit Contribution Payment
  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contributePost) return;

    const fee = contributePost.eventDetails?.contributionFee || 0;
    const amountToPay = contribAmount ? Number(contribAmount) : fee;

    if (!amountToPay || amountToPay <= 0) {
      alert("Please enter a valid contribution amount");
      return;
    }

    try {
      setSubmittingContrib(true);
      const res = await fetch(`/api/posts/${contributePost._id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          amount: amountToPay,
          transactionId: transactionId.trim(),
        }),
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setPosts((prev) => prev.map((p) => (p._id === contributePost._id ? updatedPost : p)));
        setContributePost(null);
        setContribAmount("");
        setTransactionId("");
        showToast("🎉 Contribution recorded & RSVP automatically set to Accepted (Going)!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit contribution");
      }
    } catch (err) {
      console.error("Contribution error", err);
    } finally {
      setSubmittingContrib(false);
    }
  };

  // Helper to extract list of members from RSVP array
  const extractMemberList = (arr?: (UserSummary | string)[]): UserSummary[] => {
    if (!arr) return [];
    return arr.filter((item): item is UserSummary => typeof item === "object" && item !== null && "_id" in item);
  };

  return (
    <div className="space-y-5 pb-24 relative select-none max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Community Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 rounded-3xl p-5 text-white shadow-md border border-amber-500/30 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-wide drop-shadow-xs">Jambu Community Wall</h2>
          <p className="text-xs text-amber-100 font-medium mt-1">
            Connect, share announcements, schedule community events & collect contributions
          </p>
        </div>
      </div>

      {/* ── DEDICATED SEPARATE PAGE NAVIGATION CARDS ────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => router.push("/create-post")}
          className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all text-left flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition">Share Post</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Post stories & updates</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/create-event")}
          className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all text-left flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition">Schedule Event</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Events & UPI Payments</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/create-announcement")}
          className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all text-left flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 transition">Announcement</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Broadcast notice to all</p>
          </div>
        </button>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center space-y-3">
          <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Loading Community Feed...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-700">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">No community posts yet</p>
          <p className="text-[10px] text-slate-400 mt-1">
            Tap <strong>Schedule Event</strong> or <strong>Share Post</strong> above to create your first post!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const hasLiked = post.likes?.includes(user?._id || "");

            // RSVP list extraction
            const goingUsers = extractMemberList(post.rsvps?.going);
            const maybeUsers = extractMemberList(post.rsvps?.maybe);
            const cantUsers = extractMemberList(post.rsvps?.cant);

            const isUserGoing = goingUsers.some((u) => u._id === user?._id);
            const isUserMaybe = maybeUsers.some((u) => u._id === user?._id);
            const isUserCant = cantUsers.some((u) => u._id === user?._id);

            // Contributions count & total amount
            const contributionsList = post.eventDetails?.contributions || [];
            const totalCollected = contributionsList.reduce((sum, c) => sum + (c.amount || 0), 0);

            return (
              <div
                key={post._id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all overflow-hidden space-y-3"
              >
                {/* Author Info Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-xs">
                      {post.author?.name ? post.author.name.charAt(0) : "U"}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
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
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        : post.type === "announcement"
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {post.type}
                  </span>
                </div>

                {/* ── EVENT CARD CONTENT ─────────────────────────────────── */}
                {post.type === "event" && post.eventDetails ? (
                  <div className="space-y-3">
                    <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="text-sm sm:text-base font-black text-indigo-950 dark:text-indigo-100">
                            {post.eventDetails.title}
                          </h3>
                          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{post.eventDetails.date}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{post.eventDetails.location}</span>
                          </div>
                        </div>

                        {/* Contribution Fee Tag */}
                        {(post.eventDetails.contributionFee ?? 0) > 0 && (
                          <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center space-x-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span>{post.eventDetails.contributionFee} Fee</span>
                          </div>
                        )}
                      </div>

                      {post.eventDetails.poster && (
                        <div className="rounded-xl overflow-hidden max-h-[240px] border border-indigo-200/60 dark:border-indigo-800 mt-2">
                          <img
                            src={post.eventDetails.poster}
                            alt="Event Poster"
                            className="w-full object-cover max-h-[240px]"
                          />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* ── EVENT RSVP CONTROL BAR ───────────────────────────── */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-500" /> Member Attendance RSVP:
                        </span>
                        <button
                          onClick={() => {
                            setOrganizerModalPost(post);
                            setOrganizerTab("accepted");
                          }}
                          className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View All ({goingUsers.length} Accept, {maybeUsers.length} Tentative, {cantUsers.length} Decline) &rarr;
                        </button>
                      </div>

                      {/* 3 RSVP Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleRsvp(post._id, "going")}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                            isUserGoing
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept ({goingUsers.length})
                        </button>

                        <button
                          onClick={() => handleRsvp(post._id, "maybe")}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                            isUserMaybe
                              ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" /> Tentative ({maybeUsers.length})
                        </button>

                        <button
                          onClick={() => handleRsvp(post._id, "cant")}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                            isUserCant
                              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Decline ({cantUsers.length})
                        </button>
                      </div>

                      {/* Pay Contribution Button */}
                      {(post.eventDetails.contributionFee ?? 0) > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Contribution Fee: <strong className="text-emerald-600 font-bold">₹{post.eventDetails.contributionFee}</strong>
                            {post.eventDetails.upiId && <span className="text-[10px] text-slate-400 block">UPI: {post.eventDetails.upiId}</span>}
                          </div>
                          <button
                            onClick={() => {
                              setContributePost(post);
                              setContribAmount(String(post.eventDetails?.contributionFee || ""));
                            }}
                            className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold shadow-sm hover:from-emerald-700 hover:to-teal-700 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Pay Contribution & Accept
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : post.type === "announcement" ? (
                  /* Announcement Card Render */
                  <div className="mt-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-300 font-black text-xs uppercase tracking-wider">
                      <Megaphone className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Community Announcement</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                ) : (
                  /* Regular Text / Image Post */
                  <div className="space-y-3">
                    <p className="mt-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                    {post.eventDetails?.poster && (
                      <div className="rounded-xl overflow-hidden max-h-[300px] border border-slate-200 dark:border-slate-700">
                        <img src={post.eventDetails.poster} alt="Attachment" className="w-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {/* Interaction Footer (Likes & Comments) */}
                <div className="flex items-center space-x-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center space-x-1.5 text-xs font-bold py-1.5 px-3 rounded-xl transition-all border cursor-pointer ${
                      hasLiked
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-200 dark:border-rose-800"
                        : "bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100 border-slate-200/60 dark:border-slate-700"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                    <span>Like ({post.likes?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post._id)}
                    className={`flex items-center space-x-1.5 text-xs font-bold py-1.5 px-3 rounded-xl transition-all border cursor-pointer ${
                      expandedComments[post._id]
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                        : "bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100 border-slate-200/60 dark:border-slate-700"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Comment ({post.replies?.length || 0})</span>
                  </button>
                </div>

                {/* Expandable Comments Section */}
                {expandedComments[post._id] && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
                    {post.replies && post.replies.length > 0 ? (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {post.replies.map((reply: any) => (
                          <div
                            key={reply._id}
                            className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl text-xs leading-relaxed text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {reply.author?.name || "Member"}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {formatTime(reply.createdAt)}
                              </span>
                            </div>
                            <p className="font-medium">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-2 font-medium">
                        No comments yet. Be the first to comment!
                      </p>
                    )}

                    {/* Add Comment Form */}
                    <form
                      onSubmit={(e) => handleAddComment(e, post._id)}
                      className="flex items-center space-x-2 pt-1"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Write a comment..."
                        value={commentInputs[post._id] || ""}
                        onChange={(e) =>
                          setCommentInputs({ ...commentInputs, [post._id]: e.target.value })
                        }
                        className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                      <button
                        type="submit"
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
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
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
        )}
        {!hasMore && posts.length > 0 && !loading && (
          <p className="text-xs font-semibold text-slate-400">You&apos;re all caught up ✓</p>
        )}
      </div>

      {/* ── PAY CONTRIBUTION MODAL ────────────────────────────────────── */}
      {contributePost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                <DollarSign className="w-5 h-5" />
                <span>Pay Event Contribution</span>
              </div>
              <button
                onClick={() => setContributePost(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 space-y-2">
              <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                {contributePost.eventDetails?.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Fee: <strong>₹{contributePost.eventDetails?.contributionFee}</strong>
              </p>
              {contributePost.eventDetails?.upiId && (
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">UPI ID: <strong className="text-emerald-700 dark:text-emerald-300">{contributePost.eventDetails.upiId}</strong></span>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(contributePost.eventDetails.upiId)}&pn=EventContribution&am=${contributePost.eventDetails.contributionFee}&cu=INR`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    Open UPI App <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitContribution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contribution Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Reference / UTR Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 329019238120 or UPI Ref ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingContrib}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> {submittingContrib ? "Confirming..." : "Submit Contribution & Accept RSVP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ORGANIZER RSVP & CONTRIBUTIONS DASHBOARD MODAL ─────────────── */}
      {organizerModalPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Event RSVP & Contribution Dashboard
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {organizerModalPost.eventDetails?.title}
                </p>
              </div>
              <button
                onClick={() => setOrganizerModalPost(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Summary Bar */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">Accepted</span>
                <span className="text-base font-black text-emerald-900 dark:text-emerald-100">
                  {extractMemberList(organizerModalPost.rsvps?.going).length}
                </span>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">Tentative</span>
                <span className="text-base font-black text-amber-900 dark:text-amber-100">
                  {extractMemberList(organizerModalPost.rsvps?.maybe).length}
                </span>
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">Declined</span>
                <span className="text-base font-black text-rose-900 dark:text-rose-100">
                  {extractMemberList(organizerModalPost.rsvps?.cant).length}
                </span>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block">Collected</span>
                <span className="text-base font-black text-indigo-900 dark:text-indigo-100">
                  ₹{(organizerModalPost.eventDetails?.contributions || []).reduce((sum, c) => sum + (c.amount || 0), 0)}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setOrganizerTab("accepted")}
                className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition cursor-pointer ${
                  organizerTab === "accepted"
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Accepted ({extractMemberList(organizerModalPost.rsvps?.going).length})
              </button>

              <button
                onClick={() => setOrganizerTab("tentative")}
                className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition cursor-pointer ${
                  organizerTab === "tentative"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Tentative ({extractMemberList(organizerModalPost.rsvps?.maybe).length})
              </button>

              <button
                onClick={() => setOrganizerTab("declined")}
                className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition cursor-pointer ${
                  organizerTab === "declined"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Declined ({extractMemberList(organizerModalPost.rsvps?.cant).length})
              </button>

              <button
                onClick={() => setOrganizerTab("contributions")}
                className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition cursor-pointer ${
                  organizerTab === "contributions"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Contributions (₹{(organizerModalPost.eventDetails?.contributions || []).reduce((sum, c) => sum + (c.amount || 0), 0)})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[200px] max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {organizerTab === "accepted" && (
                extractMemberList(organizerModalPost.rsvps?.going).length > 0 ? (
                  extractMemberList(organizerModalPost.rsvps?.going).map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{m.name}</h5>
                          <span className="text-[10px] text-slate-500">{m.mobileNumber || m.phone || "No phone"}</span>
                        </div>
                      </div>
                      {(m.mobileNumber || m.phone) && (
                        <a
                          href={getWhatsAppUrl(m.mobileNumber || m.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-lg hover:underline"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-8 font-medium">No accepted members yet.</p>
                )
              )}

              {organizerTab === "tentative" && (
                extractMemberList(organizerModalPost.rsvps?.maybe).length > 0 ? (
                  extractMemberList(organizerModalPost.rsvps?.maybe).map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{m.name}</h5>
                          <span className="text-[10px] text-slate-500">{m.mobileNumber || m.phone || "No phone"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-8 font-medium">No tentative members.</p>
                )
              )}

              {organizerTab === "declined" && (
                extractMemberList(organizerModalPost.rsvps?.cant).length > 0 ? (
                  extractMemberList(organizerModalPost.rsvps?.cant).map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{m.name}</h5>
                          <span className="text-[10px] text-slate-500">{m.mobileNumber || m.phone || "No phone"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-8 font-medium">No declined members.</p>
                )
              )}

              {organizerTab === "contributions" && (
                (organizerModalPost.eventDetails?.contributions || []).length > 0 ? (
                  (organizerModalPost.eventDetails?.contributions || []).map((c, idx) => {
                    const contributor = typeof c.userId === "object" && c.userId !== null ? c.userId : null;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                            {contributor?.name ? contributor.name.charAt(0) : "C"}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {contributor?.name || "Contributor Member"}
                            </h5>
                            {c.transactionId && (
                              <span className="text-[10px] text-slate-500 block">Ref: {c.transactionId}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">₹{c.amount}</span>
                          {c.paidAt && <span className="text-[9px] text-slate-400">{formatTime(c.paidAt)}</span>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-8 font-medium">No contributions received yet.</p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
