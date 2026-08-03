"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  X,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  HelpCircle,
  XCircle,
  Search,
  User,
  Heart,
  Megaphone,
  MessageSquare,
  IndianRupee,
} from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";

interface RsvpUser {
  _id: string;
  name: string;
}

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
    going: (string | RsvpUser)[];
    maybe: (string | RsvpUser)[];
    cant: (string | RsvpUser)[];
  };
  replies?: any[];
}

export default function EventsAndAnnouncementsPage() {
  const { user } = useAuth();
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"events" | "announcements">("events");
  
  // Lists and loading states
  const [events, setEvents] = useState<PostType[]>([]);
  const [announcements, setAnnouncements] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals and notifications
  const [modalType, setModalType] = useState<"event" | "announcement" | null>(null);
  const [creating, setCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Event Creation states
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventFee, setEventFee] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterFileUrl, setPosterFileUrl] = useState("");

  // Announcement Creation & Reply states
  const [announcementContent, setAnnouncementContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchEvents();
    fetchAnnouncements();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/posts?type=event&limit=100");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.posts || []);
      }
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/posts?type=announcement&limit=100");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.posts || []);
      }
    } catch (e) {
      console.error("Failed to load announcements", e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
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

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        " - " +
        date.toLocaleDateString([], { month: "short", day: "numeric" })
      );
    } catch (e) {
      return "";
    }
  };

  const getRsvpId = (u: string | RsvpUser) => (typeof u === "string" ? u : u._id);
  const getRsvpName = (u: string | RsvpUser) => (typeof u === "string" ? u : u.name);

  // RSVP Handler
  const handleRsvp = async (postId: string, status: "going" | "maybe" | "cant") => {
    if (!user) return;
    const previousEvents = [...events];

    setEvents((prev) =>
      prev.map((event) => {
        if (event._id === postId) {
          const rsvps = {
            going: event.rsvps?.going ? [...event.rsvps.going] : [],
            maybe: event.rsvps?.maybe ? [...event.rsvps.maybe] : [],
            cant: event.rsvps?.cant ? [...event.rsvps.cant] : [],
          };

          const isGoing = rsvps.going.some((u) => getRsvpId(u) === user._id);
          const isMaybe = rsvps.maybe.some((u) => getRsvpId(u) === user._id);
          const isCant = rsvps.cant.some((u) => getRsvpId(u) === user._id);
          const currentStatus = isGoing ? "going" : isMaybe ? "maybe" : isCant ? "cant" : null;

          rsvps.going = rsvps.going.filter((u) => getRsvpId(u) !== user._id);
          rsvps.maybe = rsvps.maybe.filter((u) => getRsvpId(u) !== user._id);
          rsvps.cant = rsvps.cant.filter((u) => getRsvpId(u) !== user._id);

          if (currentStatus !== status) {
            const me: RsvpUser = { _id: user._id, name: user.name };
            if (status === "going") rsvps.going.push(me);
            if (status === "maybe") rsvps.maybe.push(me);
            if (status === "cant") rsvps.cant.push(me);
          }

          return { ...event, rsvps };
        }
        return event;
      })
    );

    const statusLabel = status === "going" ? "Going" : status === "maybe" ? "Maybe" : "Can't Go";
    showToast(`RSVP updated to: ${statusLabel}`);

    try {
      const res = await fetch(`/api/posts/${postId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, status }),
      });
      if (!res.ok) setEvents(previousEvents);
    } catch (error) {
      console.error("RSVP error", error);
      setEvents(previousEvents);
    }
  };

  // Like Announcement Handler
  const handleLikeAnnouncement = async (postId: string) => {
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

  // Add Announcement Comment Handler
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
        fetchAnnouncements();
      }
    } catch (err) {
      console.error("Add comment error", err);
    }
  };

  // Create Event Submit
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDesc.trim() || !user) return;

    setCreating(true);

    let finalPosterUrl = "";
    if (posterFile) {
      try {
        const formData = new FormData();
        formData.append("file", posterFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          finalPosterUrl = uploadData.url;
        } else {
          showToast(uploadData.error || "Failed to upload event poster");
        }
      } catch (err) {
        console.error("Failed to upload event poster:", err);
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
            poster: finalPosterUrl || undefined,
            contributionFee: eventFee ? parseFloat(eventFee) : 0,
          },
        }),
      });

      if (res.ok) {
        showToast("New event shared on Wall page!");
        setEventTitle("");
        setEventDate("");
        setEventLocation("");
        setEventFee("");
        setEventDesc("");
        setPosterFile(null);
        setPosterFileUrl("");
        setModalType(null);
        fetchEvents();
      } else {
        showToast("Failed to create event.");
      }
    } catch (e) {
      console.error("Create event error", e);
      showToast("Error creating event.");
    } finally {
      setCreating(false);
    }
  };

  // Create Announcement Submit
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementContent.trim() || !user) return;

    setCreating(true);
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
        showToast("Announcement published successfully!");
        setAnnouncementContent("");
        setModalType(null);
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

  // Filters
  const filteredEvents = events.filter((e) => {
    const titleMatch = e.eventDetails?.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = e.content.toLowerCase().includes(searchQuery.toLowerCase());
    const locMatch = e.eventDetails?.location.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || descMatch || locMatch;
  });

  const filteredAnnouncements = announcements.filter((a) => {
    const contentMatch = a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = a.author?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return contentMatch || authorMatch;
  });

  return (
    <div className="flex flex-col space-y-4 pb-24 relative min-h-[75vh]">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-xs select-none flex">
        <button
          onClick={() => {
            setActiveTab("events");
            setSearchQuery("");
          }}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer border-0 ${
            activeTab === "events"
              ? "bg-whatsapp-green text-white shadow-sm font-extrabold"
              : "bg-transparent text-slate-500 hover:bg-slate-50"
          }`}
        >
          📅 Events
        </button>
        <button
          onClick={() => {
            setActiveTab("announcements");
            setSearchQuery("");
          }}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer border-0 ${
            activeTab === "announcements"
              ? "bg-whatsapp-green text-white shadow-sm font-extrabold"
              : "bg-transparent text-slate-500 hover:bg-slate-50"
          }`}
        >
          📢 Announcements
        </button>
      </div>

      {/* Unified Search Input */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-100/80 flex items-center space-x-2">
        <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 ml-2" />
        <input
          type="text"
          placeholder={
            activeTab === "events"
              ? "Search events by title, location..."
              : "Search announcements by content or author..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-hidden text-xs placeholder-slate-400 text-slate-800 font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="p-1 hover:bg-slate-100 rounded-full shrink-0 text-slate-400 border-0 bg-transparent cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Loader */}
      {loading ? (
        <div className="py-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
        </div>
      ) : activeTab === "events" ? (
        /* ==================== EVENTS SECTION ==================== */
        filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
            {searchQuery ? "No matching events found." : "No upcoming events scheduled. Create one below!"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((evt) => {
              const rsvps = {
                going: evt.rsvps?.going || [],
                maybe: evt.rsvps?.maybe || [],
                cant: evt.rsvps?.cant || [],
              };

              const isGoing = rsvps.going.some((u) => getRsvpId(u) === user?._id);
              const isMaybe = rsvps.maybe.some((u) => getRsvpId(u) === user?._id);
              const isCant = rsvps.cant.some((u) => getRsvpId(u) === user?._id);

              return (
                <div
                  key={evt._id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100/80 shadow-xs flex flex-col p-4.5 select-none hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-12 h-12 bg-whatsapp-green text-white rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm border border-whatsapp-teal/20">
                      <Calendar className="w-5.5 h-5.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-extrabold text-slate-800 leading-tight">
                        {evt.eventDetails?.title}
                      </h3>
                      <div className="flex items-center text-[10px] text-whatsapp-green font-bold mt-1 space-x-1">
                        <Clock className="w-3 h-3 text-whatsapp-green shrink-0" />
                        <span>{formatEventDate(evt.eventDetails?.date)}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-slate-500 font-semibold mt-0.5 space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.eventDetails?.location}</span>
                      </div>
                      {(evt.eventDetails?.contributionFee ?? 0) > 0 && (
                        <div className="flex items-center text-[10px] text-amber-600 font-bold mt-0.5 space-x-1">
                          <IndianRupee className="w-3 h-3 shrink-0" />
                          <span>{evt.eventDetails!.contributionFee} per person</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {evt.eventDetails?.poster && (
                    <div className="mb-3 rounded-2xl overflow-hidden border border-slate-100 max-h-[160px] relative mt-3 select-none">
                      <img
                        src={evt.eventDetails.poster}
                        alt="Event Poster"
                        className="w-full object-cover h-[160px]"
                      />
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed font-medium mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                    {evt.content}
                  </p>

                  <span className="text-[9px] text-slate-400 font-bold mt-2.5 flex items-center space-x-1 select-none">
                    <User className="w-2.5 h-2.5 text-slate-400 inline shrink-0" />
                    <span>Shared by: {evt.author?.name || "System"}</span>
                  </span>

                  <div className="grid grid-cols-3 gap-2 mt-4.5 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleRsvp(evt._id, "going")}
                      className={`py-2 px-1 rounded-xl text-[10px] font-extrabold transition-all border active:scale-95 text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                        isGoing
                          ? "bg-whatsapp-green text-white border-whatsapp-green shadow-xs"
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isGoing ? "text-white" : "text-slate-400"}`} />
                      <span>Going ({rsvps.going.length})</span>
                    </button>

                    <button
                      onClick={() => handleRsvp(evt._id, "maybe")}
                      className={`py-2 px-1 rounded-xl text-[10px] font-extrabold transition-all border active:scale-95 text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                        isMaybe
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <HelpCircle className={`w-3.5 h-3.5 shrink-0 ${isMaybe ? "text-white" : "text-slate-400"}`} />
                      <span>Maybe ({rsvps.maybe.length})</span>
                    </button>

                    <button
                      onClick={() => handleRsvp(evt._id, "cant")}
                      className={`py-2 px-1 rounded-xl text-[10px] font-extrabold transition-all border active:scale-95 text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                        isCant
                          ? "bg-red-500 text-white border-red-500 shadow-xs"
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <XCircle className={`w-3.5 h-3.5 shrink-0 ${isCant ? "text-white" : "text-slate-400"}`} />
                      <span>No ({rsvps.cant.length})</span>
                    </button>
                  </div>

                  {/* Live attendee list */}
                  {(rsvps.going.length > 0 || rsvps.cant.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                      {rsvps.going.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Attending · {rsvps.going.length}</span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {rsvps.going.map((u, i) => (
                              <span key={i} className="text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                                {getRsvpName(u)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {rsvps.cant.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>Declined · {rsvps.cant.length}</span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {rsvps.cant.map((u, i) => (
                              <span key={i} className="text-[9px] font-semibold bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">
                                {getRsvpName(u)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ==================== ANNOUNCEMENTS SECTION ==================== */
        filteredAnnouncements.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
            {searchQuery ? "No matching announcements found." : "No announcements published yet. Add one below!"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((post) => {
              const hasLiked = post.likes.includes(user?._id || "");
              const isCommentsExpanded = expandedComments[post._id] || false;

              return (
                <div
                  key={post._id}
                  className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow select-none"
                >
                  <div className="flex justify-between items-center pb-2 mb-2.5 border-b border-slate-55 animate-fade-in">
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

                    <div className="flex items-center space-x-4 pt-1">
                      <button
                        onClick={() => handleLikeAnnouncement(post._id)}
                        className={`flex items-center space-x-1.5 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all border border-slate-100/50 cursor-pointer ${
                          hasLiked
                            ? "bg-red-50 text-red-500 border-red-200"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                        <span>Like ({post.likes?.length || 0})</span>
                      </button>

                      <button
                        onClick={() =>
                          setExpandedComments((prev) => ({ ...prev, [post._id]: !isCommentsExpanded }))
                        }
                        className={`flex items-center space-x-1.5 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all border border-slate-100/50 cursor-pointer ${
                          isCommentsExpanded
                            ? "bg-whatsapp-light text-whatsapp-green border-whatsapp-teal/20"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Comment ({post.replies?.length || 0})</span>
                      </button>
                    </div>

                    {isCommentsExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-fade-in">
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
        )
      )}

      {/* FAB button */}
      <button
        onClick={() => setModalType(activeTab === "events" ? "event" : "announcement")}
        className="absolute bottom-4 right-4 w-12 h-12 bg-whatsapp-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:bg-whatsapp-teal transition-all z-40 cursor-pointer border-0"
        aria-label="Create Post Button"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Event Modal */}
      {modalType === "event" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">📅 Create Event</h3>
              <button onClick={() => setModalType(null)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer bg-transparent border-0">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual General Meetup"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm focus:border-whatsapp-green outline-hidden text-slate-800 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs focus:border-whatsapp-green outline-hidden text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Community Hall"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs focus:border-whatsapp-green outline-hidden text-slate-800 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Contribution Fee — Per Person <span className="normal-case text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0 = Free"
                    value={eventFee}
                    onChange={(e) => setEventFee(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs focus:border-whatsapp-green outline-hidden text-slate-800 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  required
                  placeholder="Agenda and other details..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs focus:border-whatsapp-green outline-hidden resize-none text-slate-700 leading-normal"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Event Poster (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setPosterFileUrl(URL.createObjectURL(file));
                    const compressed = await compressImage(file);
                    if (!checkFileSize(compressed, 5)) {
                      alert("Selected file exceeds the maximum allowed size of 5MB");
                      return;
                    }
                    setPosterFile(compressed);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-whatsapp-light file:text-whatsapp-green hover:file:bg-slate-100 cursor-pointer"
                />
                {posterFileUrl && (
                  <div className="mt-2.5 relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-xs">
                    <img src={posterFileUrl} alt="Poster Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-whatsapp-green text-white font-bold rounded-xl text-sm shadow-md hover:bg-whatsapp-teal disabled:opacity-50 cursor-pointer border-0 active:scale-95 transition-transform"
              >
                {creating ? "Sharing..." : "Post & Share on Wall"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {modalType === "announcement" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">📢 Create Announcement</h3>
              <button onClick={() => setModalType(null)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer bg-transparent border-0">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Announcement details</label>
                <textarea
                  required
                  placeholder="Share what is happening in the community..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
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
