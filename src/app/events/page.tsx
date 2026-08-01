"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Plus, X, Calendar, MapPin, Clock, CheckCircle, HelpCircle, XCircle, Search, User, Camera } from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";

interface PostType {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
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
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Creation States
  const [modalOpen, setModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterFileUrl, setPosterFileUrl] = useState("");

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        // Filter posts where type is "event"
        const eventPosts = (data || []).filter((p: PostType) => p.type === "event");
        setEvents(eventPosts);
      }
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Optimistic RSVP Handler
  const handleRsvp = async (postId: string, status: "going" | "maybe" | "cant") => {
    if (!user) return;
    const previousEvents = [...events];

    // Optimistically update state
    setEvents((prev) =>
      prev.map((event) => {
        if (event._id === postId) {
          const rsvps = {
            going: event.rsvps?.going ? [...event.rsvps.going] : [],
            maybe: event.rsvps?.maybe ? [...event.rsvps.maybe] : [],
            cant: event.rsvps?.cant ? [...event.rsvps.cant] : [],
          };

          // Find current status
          const isGoing = rsvps.going.includes(user._id);
          const isMaybe = rsvps.maybe.includes(user._id);
          const isCant = rsvps.cant.includes(user._id);
          const currentStatus = isGoing ? "going" : isMaybe ? "maybe" : isCant ? "cant" : null;

          // Clear previous status
          rsvps.going = rsvps.going.filter((uid) => uid !== user._id);
          rsvps.maybe = rsvps.maybe.filter((uid) => uid !== user._id);
          rsvps.cant = rsvps.cant.filter((uid) => uid !== user._id);

          // Apply new status if toggled to a different one
          if (currentStatus !== status) {
            if (status === "going") rsvps.going.push(user._id);
            if (status === "maybe") rsvps.maybe.push(user._id);
            if (status === "cant") rsvps.cant.push(user._id);
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

  // Submit Event Form
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
          },
        }),
      });

      if (res.ok) {
        showToast("New event shared on Wall page!");
        setEventTitle("");
        setEventDate("");
        setEventLocation("");
        setEventDesc("");
        setPosterFile(null);
        setPosterFileUrl("");
        setModalOpen(false);
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

  // Filter events
  const filteredEvents = events.filter((e) => {
    const titleMatch = e.eventDetails?.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = e.content.toLowerCase().includes(searchQuery.toLowerCase());
    const locMatch = e.eventDetails?.location.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || descMatch || locMatch;
  });

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
        <h2 className="text-sm font-bold text-slate-800">Events Board</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Stay up to date with upcoming meetups, webinars, and workshops.</p>
      </div>

      {/* Search inputs */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-100/80 flex items-center space-x-2">
        <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 ml-2" />
        <input
          type="text"
          placeholder="Search events by title, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-hidden text-xs placeholder-slate-400 text-slate-800"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-slate-100 rounded-full shrink-0 text-slate-400 border-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Events Board feed */}
      {loading ? (
        <div className="py-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-semibold">
          {searchQuery ? "No matching events found." : "No upcoming events scheduled. Add one using the FAB below!"}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((evt) => {
            const rsvps = {
              going: evt.rsvps?.going || [],
              maybe: evt.rsvps?.maybe || [],
              cant: evt.rsvps?.cant || [],
            };

            const isGoing = rsvps.going.includes(user?._id || "");
            const isMaybe = rsvps.maybe.includes(user?._id || "");
            const isCant = rsvps.cant.includes(user?._id || "");

            return (
              <div
                key={evt._id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100/80 shadow-xs flex flex-col p-4.5 select-none hover:shadow-md transition-shadow"
              >
                {/* Event Header Card */}
                <div className="flex items-start space-x-3.5">
                  {/* Calendar Icon Badge */}
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
                  </div>
                </div>

                {/* Event Poster Banner */}
                {evt.eventDetails?.poster && (
                  <div className="mb-3 rounded-2xl overflow-hidden border border-slate-100 max-h-[160px] relative mt-3 select-none">
                    <img
                      src={evt.eventDetails.poster}
                      alt="Event Poster"
                      className="w-full object-cover h-[160px]"
                    />
                  </div>
                )}

                {/* Description details */}
                <p className="text-xs text-slate-600 leading-relaxed font-medium mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                  {evt.content}
                </p>

                {/* Shared metadata */}
                <span className="text-[9px] text-slate-400 font-bold mt-2.5 flex items-center space-x-1 select-none">
                  <User className="w-2.5 h-2.5 text-slate-400 inline shrink-0" />
                  <span>Shared by: {evt.author.name}</span>
                </span>

                {/* RSVP Option Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4.5 border-t border-slate-100 pt-3">
                  {/* Accept Option */}
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

                  {/* Tentative Option */}
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

                  {/* Decline Option */}
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
              </div>
            );
          })}
        </div>
      )}

      {/* ➕ FLOATING ACTION BUTTON (FAB) */}
      <button
        onClick={() => setModalOpen(true)}
        className="absolute bottom-4 right-4 w-12 h-12 bg-whatsapp-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:bg-whatsapp-teal transition-all z-40 cursor-pointer border-0"
        aria-label="Create Event Button"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* CREATE EVENT MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">📅 Create Event</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
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

                    if (!checkFileSize(file, 5)) {
                      alert("Image exceeds the maximum allowed size of 5MB");
                      return;
                    }

                    setPosterFileUrl(URL.createObjectURL(file));
                    const compressed = await compressImage(file);
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
    </div>
  );
}
