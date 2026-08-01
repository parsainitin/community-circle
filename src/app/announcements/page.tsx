"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Heart, Megaphone, MessageSquare, Plus, X } from "lucide-react";

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
  replies?: any[];
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  // Announcement Creation Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comments and accordion toggles
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Fetch announcements on load
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/posts?type=announcement");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data || []);
      }
    } catch (e) {
      console.error("Failed to load announcements", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Format time (e.g. 10:45 AM)
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " - " + date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  };

  // Optimistic Like Handler
  const handleLike = async (postId: string) => {
    if (!user) return;
    const previousAnnouncements = [...announcements];

    setAnnouncements((prev) =>
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
      if (!res.ok) setAnnouncements(previousAnnouncements);
    } catch (error) {
      setAnnouncements(previousAnnouncements);
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
        fetchAnnouncements(); // Reload announcements list to show replies
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

  // Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setCreating(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          author: user._id,
          type: "announcement",
        }),
      });

      if (res.ok) {
        showToast("Announcement published successfully!");
        setContent("");
        setModalOpen(false);
        fetchAnnouncements();
      } else {
        showToast("Failed to post announcement.");
      }
    } catch (err) {
      console.error("Create announcement error", err);
      showToast("Error creating announcement.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 relative min-h-[75vh]">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-100/80">
        <h2 className="text-sm font-bold text-slate-800">📢 Announcements Board</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Important announcements and community updates. Share and discuss with other members.
        </p>
      </div>

      {/* Feed list */}
      {loading ? (
        <div className="py-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-semibold bg-white rounded-3xl p-6 border border-slate-100/85 shadow-xs">
          No announcements published yet. Add one using the FAB below!
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((post) => {
            const hasLiked = post.likes.includes(user?._id || "");

            return (
              <div
                key={post._id}
                className="bg-white rounded-3xl p-4.5 border border-slate-100/80 shadow-xs hover:shadow-md transition-shadow select-none"
              >
                {/* Header author details */}
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
                </div>

                {/* Announcement Bubble Details */}
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
              </div>
            );
          })}
        </div>
      )}

      {/* ➕ FLOATING ACTION BUTTON (FAB) FOR CREATING ANNOUNCEMENT */}
      <button
        onClick={() => setModalOpen(true)}
        className="absolute bottom-4 right-4 w-12 h-12 bg-whatsapp-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:bg-whatsapp-teal transition-all z-40 cursor-pointer border-0"
        aria-label="Create Announcement Button"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* CREATE ANNOUNCEMENT MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">📢 Create Announcement</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Announcement details</label>
                <textarea
                  required
                  placeholder="Share what is happening in the community..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs focus:border-whatsapp-green outline-hidden resize-none text-slate-700 leading-normal"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-whatsapp-green text-white font-bold rounded-xl text-sm shadow-md hover:bg-whatsapp-teal disabled:opacity-50 cursor-pointer border-0 active:scale-95 transition-transform"
              >
                {creating ? "Publishing..." : "Post Announcement"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
