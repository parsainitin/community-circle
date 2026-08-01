"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Heart, Calendar, MapPin, Plus, Megaphone, MessageSquare, X } from "lucide-react";

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

  // Comments and accordion toggles
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Fetch posts on load
  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data || []);
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

  // Format time (e.g. 10:45 AM)
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " - " + date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch (e) {
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
        minute: "2-digit"
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
    } catch (error) {
      setPosts(previousPosts);
    }
  };

  // Optimistic RSVP Handler
  const handleRsvp = async (postId: string, status: "going" | "maybe" | "cant") => {
    if (!user) return;
    const previousPosts = [...posts];

    setPosts((prev) =>
      prev.map((post) => {
        if (post._id === postId) {
          const rsvps = {
            going: post.rsvps?.going ? [...post.rsvps.going] : [],
            maybe: post.rsvps?.maybe ? [...post.rsvps.maybe] : [],
            cant: post.rsvps?.cant ? [...post.rsvps.cant] : [],
          };

          const isGoing = rsvps.going.includes(user._id);
          const isMaybe = rsvps.maybe.includes(user._id);
          const isCant = rsvps.cant.includes(user._id);
          const currentStatus = isGoing ? "going" : isMaybe ? "maybe" : isCant ? "cant" : null;

          rsvps.going = rsvps.going.filter((uid) => uid !== user._id);
          rsvps.maybe = rsvps.maybe.filter((uid) => uid !== user._id);
          rsvps.cant = rsvps.cant.filter((uid) => uid !== user._id);

          if (currentStatus !== status) {
            if (status === "going") rsvps.going.push(user._id);
            if (status === "maybe") rsvps.maybe.push(user._id);
            if (status === "cant") rsvps.cant.push(user._id);
          }

          return { ...post, rsvps };
        }
        return post;
      })
    );

    try {
      const res = await fetch(`/api/posts/${postId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, status }),
      });
      if (!res.ok) setPosts(previousPosts);
    } catch (error) {
      setPosts(previousPosts);
    }
  };

  // Optimistic Vote Handler
  const handleVote = async (postId: string, optionIndex: number) => {
    if (!user) return;
    const previousPosts = [...posts];

    setPosts((prev) =>
      prev.map((post) => {
        if (post._id === postId) {
          const pollVotes = post.pollVotes ? [...post.pollVotes] : [];
          const existingVoteIdx = pollVotes.findIndex((v) => v.userId === user._id);

          if (existingVoteIdx > -1) {
            if (pollVotes[existingVoteIdx].optionIndex === optionIndex) {
              pollVotes.splice(existingVoteIdx, 1);
            } else {
              pollVotes[existingVoteIdx] = { userId: user._id, optionIndex };
            }
          } else {
            pollVotes.push({ userId: user._id, optionIndex });
          }

          return { ...post, pollVotes };
        }
        return post;
      })
    );

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, optionIndex }),
      });
      if (!res.ok) setPosts(previousPosts);
    } catch (error) {
      setPosts(previousPosts);
    }
  };



  // Submit Comment Form
  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text || !text.trim() || !user) return;

    // Clear input optimistically
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
        fetchPosts(); // Reload posts to update replies array list nested populated
      }
    } catch (err) {
      console.error("Add comment error", err);
    }
  };

  // Toggle comments accordion open/closed
  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Render Poll Option Results
  const renderPollOption = (post: PostType, option: string, index: number) => {
    const votes = post.pollVotes || [];
    const totalVotes = votes.length;
    const optionVotes = votes.filter((v) => v.optionIndex === index).length;
    const percent = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
    const hasVotedThis = votes.some((v) => v.userId === user?._id && v.optionIndex === index);
    const hasVotedAny = votes.some((v) => v.userId === user?._id);

    return (
      <div
        key={index}
        onClick={() => handleVote(post._id, index)}
        className="relative py-2 px-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer overflow-hidden transition-all duration-150 select-none group"
      >
        {hasVotedAny && (
          <div
            className={`absolute left-0 top-0 bottom-0 transition-all duration-300 -z-10 ${
              hasVotedThis ? "bg-whatsapp-light/70" : "bg-slate-100/50"
            }`}
            style={{ width: `${percent}%` }}
          />
        )}

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                hasVotedThis
                  ? "border-whatsapp-green bg-whatsapp-green text-white"
                  : "border-slate-300 bg-white group-hover:border-slate-400"
              }`}
            >
              {hasVotedThis && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className="text-sm font-medium text-slate-700">{option}</span>
          </div>

          {hasVotedAny && (
            <span className="text-xs font-bold text-slate-500">
              {optionVotes} ({percent}%)
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 relative min-h-[75vh]">
      {/* 📢 COMMUNITY ACTIVITY WALL HEADER */}
      <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-100/80">
        <h2 className="text-sm font-bold text-slate-800">📢 Community Activity Wall</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Real-time updates of new member sign-ups, community events, and catalog listings.
        </p>
      </div>

      {/* Activity feed list */}
      {loading ? (
        <div className="py-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-semibold">
          No community updates yet.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const hasLiked = post.likes.includes(user?._id || "");

            return (
              <div
                key={post._id}
                className="bg-white rounded-3xl p-4.5 border border-slate-100/80 shadow-xs hover:shadow-md transition-shadow select-none"
              >
                {/* Header author and time details */}
                <div className="flex justify-between items-center pb-2 mb-2.5 border-b border-slate-50">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-whatsapp-light flex items-center justify-center font-bold text-xs text-whatsapp-green uppercase">
                      {post.author?.name ? post.author.name.charAt(0) : "S"}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">
                        {post.author?.name || "System"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                        {formatTime(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLike(post._id)}
                    className="flex items-center space-x-1.5 py-1 px-2.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full border border-slate-100 transition-all text-[10px] font-bold active:scale-95"
                    aria-label="Like update"
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                    {post.likes.length > 0 && <span>{post.likes.length}</span>}
                  </button>
                </div>

                {/* EVENT POST TYPE */}
                {post.type === "event" && post.eventDetails && (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 bg-whatsapp-light/20 p-3 rounded-2xl border border-whatsapp-green/10">
                      <div className="w-10 h-10 bg-whatsapp-green text-white rounded-xl flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{post.eventDetails.title}</h4>
                        <div className="flex items-center text-[9px] text-slate-500 mt-0.5 space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{post.eventDetails.location}</span>
                        </div>
                        <div className="text-[9px] font-bold text-whatsapp-green mt-0.5">
                          {formatEventDate(post.eventDetails.date)}
                        </div>
                      </div>
                    </div>

                    {post.eventDetails.poster && (
                      <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-[160px] relative select-none">
                        <img
                          src={post.eventDetails.poster}
                          alt="Event Poster"
                          className="w-full object-cover h-[160px]"
                        />
                      </div>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      {post.content}
                    </p>

                    {/* RSVP Options */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5">
                      {(["going", "maybe", "cant"] as const).map((status) => {
                        const list = post.rsvps?.[status] || [];
                        const isActive = list.includes(user?._id || "");
                        const count = list.length;

                        const labelMap = { going: "Going", maybe: "Maybe", cant: "No" };
                        const colorMap = {
                          going: isActive ? "bg-whatsapp-green text-white border-whatsapp-green" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100",
                          maybe: isActive ? "bg-amber-500 text-white border-amber-500" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100",
                          cant: isActive ? "bg-red-500 text-white border-red-500" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100",
                        };

                        return (
                          <button
                            key={status}
                            onClick={() => handleRsvp(post._id, status)}
                            className={`py-1.5 px-1 rounded-xl text-[10px] font-extrabold transition-all text-center border active:scale-95 cursor-pointer flex items-center justify-center space-x-1 ${colorMap[status]}`}
                          >
                            <span>{labelMap[status]} ({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* POLL POST TYPE */}
                {post.type === "poll" && post.pollDetails && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">📊 {post.content}</h4>
                    <div className="space-y-1.5">
                      {post.pollDetails.options.map((option, idx) =>
                        renderPollOption(post, option, idx)
                      )}
                    </div>
                  </div>
                )}

                {/* TEXT POST TYPE */}
                {post.type === "text" && (
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-semibold">
                    {post.content}
                  </div>
                )}

                {/* ANNOUNCEMENT POST TYPE */}
                {post.type === "announcement" && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-2xl flex items-start space-x-3">
                      <Megaphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block mb-1">
                          Community Announcement
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>
                    </div>

                    {/* Likes & Comments Counter Toggles */}
                    <div className="flex items-center space-x-4 pt-1">
                      {/* Liking */}
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center space-x-1.5 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all border border-slate-100/50 cursor-pointer ${
                          hasLiked
                            ? "bg-red-50 text-red-500 border-red-200"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                        <span>Like ({post.likes?.length || 0})</span>
                      </button>

                      {/* Comment Panel toggle */}
                      <button
                        onClick={() => toggleComments(post._id)}
                        className={`flex items-center space-x-1.5 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all border border-slate-100/50 cursor-pointer ${
                          expandedComments[post._id]
                            ? "bg-whatsapp-light text-whatsapp-green border-whatsapp-teal/20"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Comment ({post.replies?.length || 0})</span>
                      </button>
                    </div>

                    {/* Expandable Comments Section */}
                    {expandedComments[post._id] && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                        {/* Existing Comments List */}
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
                          <p className="text-[10px] text-slate-400 italic text-center py-1">
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
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
