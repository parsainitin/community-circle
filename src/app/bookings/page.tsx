"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  XCircle,
  MapPin,
  Users,
  IndianRupee,
  Phone,
  UserCheck,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface BookedSlot {
  date: string; // YYYY-MM-DD
  bookedBy: string;
  contactPhone?: string;
  notes?: string;
}

interface Property {
  _id: string;
  propertyName: string;
  propertyType: string;
  location?: string;
  capacity?: number;
  pricePerDay?: number;
  contactPhone?: string;
  description?: string;
  bookedDates: BookedSlot[];
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calendar Month & Year State
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth());

  // Add Property Modal State
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState("Community Hall");
  const [newPropLocation, setNewPropLocation] = useState("");
  const [newPropCapacity, setNewPropCapacity] = useState("");
  const [newPropPrice, setNewPropPrice] = useState("");
  const [newPropPhone, setNewPropPhone] = useState("");
  const [newPropDesc, setNewPropDesc] = useState("");
  const [submittingProperty, setSubmittingProperty] = useState(false);

  // Manage Booking Date Modal State
  const [manageBookingModalOpen, setManageBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingAction, setBookingAction] = useState<"book" | "free">("book");
  const [bookedByName, setBookedByName] = useState("");
  const [bookedByPhone, setBookedByPhone] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        const propList = data.properties || [];
        setProperties(propList);
        if (propList.length > 0) {
          if (
            !selectedPropertyId ||
            !propList.some((p: Property) => p._id === selectedPropertyId)
          ) {
            setSelectedPropertyId(propList[0]._id);
          }
        } else {
          setSelectedPropertyId("");
        }
      }
    } catch (e) {
      console.error("Failed to fetch properties", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const selectedProperty =
    properties.find((p) => p._id === selectedPropertyId) ||
    properties[0] ||
    null;

  // Helper for generating calendar grid for current year & month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const formatDateStr = (dayNum: number) => {
    const m = (currentMonth + 1).toString().padStart(2, "0");
    const d = dayNum.toString().padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  };

  const isDateBooked = (dateStr: string) => {
    if (!selectedProperty || !selectedProperty.bookedDates) return null;
    return selectedProperty.bookedDates.find((b) => b.date === dateStr) || null;
  };

  // Open Manage Booking modal pre-selected for date
  const handleDayClick = (dateStr: string) => {
    if (!selectedProperty) return;
    const booking = isDateBooked(dateStr);
    setBookingDate(dateStr);
    if (booking) {
      setBookingAction("free");
      setBookedByName(booking.bookedBy);
      setBookedByPhone(booking.contactPhone || "");
      setBookingNotes(booking.notes || "");
    } else {
      setBookingAction("book");
      setBookedByName(user?.name || "");
      setBookedByPhone(user?.mobileNumber || user?.phone || "");
      setBookingNotes("");
    }
    setManageBookingModalOpen(true);
  };

  // Create New Property
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim() || !newPropType.trim()) return;

    setSubmittingProperty(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyName: newPropName.trim(),
          propertyType: newPropType.trim(),
          location: newPropLocation.trim() || undefined,
          capacity: newPropCapacity ? parseInt(newPropCapacity) : undefined,
          pricePerDay: newPropPrice ? parseInt(newPropPrice) : undefined,
          contactPhone: newPropPhone.trim() || user?.mobileNumber || undefined,
          description: newPropDesc.trim() || undefined,
          owner: user?._id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast("🏢 Property Added Successfully!");
        setAddPropertyModalOpen(false);
        setNewPropName("");
        setNewPropLocation("");
        setNewPropCapacity("");
        setNewPropPrice("");
        setNewPropPhone("");
        setNewPropDesc("");
        if (data.property) {
          setSelectedPropertyId(data.property._id);
        }
        fetchProperties();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create property");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding property");
    } finally {
      setSubmittingProperty(false);
    }
  };

  // Submit Manage Booking (Book or Free date)
  const handleSaveBookingDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !selectedPropertyId) return;

    setSubmittingBooking(true);
    try {
      const res = await fetch("/api/properties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          action: bookingAction,
          date: bookingDate,
          bookedBy: bookedByName.trim() || "Community Member",
          contactPhone: bookedByPhone.trim(),
          notes: bookingNotes.trim(),
        }),
      });

      if (res.ok) {
        showToast(
          bookingAction === "book"
            ? `🔴 Date ${bookingDate} Booked!`
            : `🟢 Date ${bookingDate} Marked Free!`
        );
        setManageBookingModalOpen(false);
        fetchProperties();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update booking status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating booking");
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-800 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/events"
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-black tracking-wide flex items-center space-x-1.5">
                <Building2 className="w-4.5 h-4.5 text-indigo-200" />
                <span>Property Bookings & Calendar</span>
              </h1>
              <p className="text-[10px] text-indigo-100 font-medium">
                Check Booked & Free Days or Add New Property
              </p>
            </div>
          </div>

          <button
            onClick={() => setAddPropertyModalOpen(true)}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold rounded-xl border border-white/30 backdrop-blur-xs flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-xs">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" />
            <span className="text-xs text-slate-400 font-semibold">
              Loading Properties...
            </span>
          </div>
        ) : properties.length === 0 ? (
          <div className="py-14 px-6 bg-white rounded-3xl text-center border border-slate-200 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-800">
              No Properties Added Yet
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              There are currently no properties listed. Click the button below to add your community property (Community Hall, Marriage Garden, Guest House) and manage its booking days!
            </p>
            <button
              onClick={() => setAddPropertyModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs border-0 cursor-pointer active:scale-95 transition-all inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Property</span>
            </button>
          </div>
        ) : (
          <>
            {/* PROPERTY SELECTOR CARDS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Select Property (संपत्ति चुनें)
                </h2>
                <span className="text-[10px] text-indigo-600 font-extrabold">
                  {properties.length} Registered Properties
                </span>
              </div>

              <div className="flex space-x-3 overflow-x-auto no-scrollbar py-1">
                {properties.map((prop) => {
                  const isSelected = prop._id === selectedPropertyId;
                  const bookedCount = prop.bookedDates?.length || 0;

                  return (
                    <div
                      key={prop._id}
                      onClick={() => setSelectedPropertyId(prop._id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer shrink-0 w-64 flex flex-col justify-between select-none ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400"
                          : "bg-white text-slate-800 border-slate-200 hover:border-indigo-300 shadow-xs"
                      }`}
                    >
                      <div>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {prop.propertyType}
                        </span>
                        <h3 className="text-xs font-black mt-1.5 leading-snug line-clamp-1">
                          {prop.propertyName}
                        </h3>
                      </div>

                      <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-[10px]">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 opacity-70" />
                          <span className="truncate max-w-[110px] font-medium">
                            {prop.location || "Location"}
                          </span>
                        </div>

                        <span className="font-extrabold">
                          {bookedCount} Booked Days
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SELECTED PROPERTY HEADER & DETAILS CARD */}
            {selectedProperty && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {selectedProperty.propertyType}
                    </span>
                    <h2 className="text-base font-black text-slate-900 mt-1">
                      {selectedProperty.propertyName}
                    </h2>
                    {selectedProperty.location && (
                      <p className="text-xs text-slate-500 font-medium flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{selectedProperty.location}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-bold text-slate-700 shrink-0">
                    {selectedProperty.pricePerDay && (
                      <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>{selectedProperty.pricePerDay} / day</span>
                      </div>
                    )}

                    {selectedProperty.capacity && (
                      <div className="bg-slate-100 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cap: {selectedProperty.capacity}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedProperty.description && (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {selectedProperty.description}
                  </p>
                )}

                {/* MANAGER CONTACT & ACTION BAR */}
                <div className="flex justify-between items-center pt-1">
                  {selectedProperty.contactPhone && (
                    <a
                      href={`tel:${selectedProperty.contactPhone}`}
                      className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer no-underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Manager: {selectedProperty.contactPhone}</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setBookingDate(new Date().toISOString().split("T")[0]);
                      setBookingAction("book");
                      setBookedByName(user?.name || "");
                      setBookedByPhone(user?.mobileNumber || user?.phone || "");
                      setBookingNotes("");
                      setManageBookingModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center space-x-1.5 border-0 cursor-pointer ml-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Manage Booking Date</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── CALENDAR VIEW: BOOKED vs FREE DAYS ────────────────────────── */}
            {selectedProperty && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                {/* Calendar Month Navigation Header */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-indigo-600" />
                      <span>
                        Booking Status: {monthNames[currentMonth]} {currentYear}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Tap any date to mark as Booked (🔴) or Free (🟢)
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border-0 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black px-2 min-w-[110px] text-center">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border-0 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Color Legend Bar */}
                <div className="flex items-center justify-around bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs font-extrabold">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-600 shadow-xs" />
                    <span className="text-rose-700">🔴 Booked Day (बुक है)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs" />
                    <span className="text-emerald-700">🟢 Free Day (उपलब्ध है)</span>
                  </div>
                </div>

                {/* Calendar Grid (Weekdays + Days) */}
                <div>
                  <div className="grid grid-cols-7 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {/* Empty leading slots */}
                    {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-14 rounded-2xl bg-slate-50/50" />
                    ))}

                    {/* Month Days */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const dateStr = formatDateStr(dayNum);
                      const booking = isDateBooked(dateStr);

                      return (
                        <div
                          key={dateStr}
                          onClick={() => handleDayClick(dateStr)}
                          className={`h-14 rounded-2xl p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer select-none border ${
                            booking
                              ? "bg-rose-50 border-rose-300 hover:bg-rose-100 text-rose-950"
                              : "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100 text-emerald-950"
                          }`}
                        >
                          <div className="w-full flex justify-between items-center">
                            <span className="text-xs font-black leading-none">{dayNum}</span>
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                booking ? "bg-rose-600" : "bg-emerald-500"
                              }`}
                            />
                          </div>

                          <span className="text-[9px] font-extrabold leading-tight truncate w-full px-0.5">
                            {booking ? booking.bookedBy : "Free Day"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LIST OF BOOKED DATES FOR SELECTED PROPERTY */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Booked Dates List for {selectedProperty?.propertyName}
                  </h4>

                  {!selectedProperty?.bookedDates || selectedProperty.bookedDates.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs font-bold text-slate-400">
                      🟢 All dates are currently free and available for booking!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedProperty.bookedDates.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                {item.date}
                              </span>
                              <span className="font-bold text-slate-800">
                                Booked by: {item.bookedBy}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-[10px] text-slate-500 font-medium">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDayClick(item.date)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer border-0"
                          >
                            Manage
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODAL 1: ADD NEW PROPERTY ─────────────────────────────────── */}
      {addPropertyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-indigo-700 font-black text-sm">
                <Plus className="w-5 h-5" />
                <span>Add New Property (नई संपत्ति जोड़ें)</span>
              </div>
              <button
                onClick={() => setAddPropertyModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharaja Agrasen Bhavan & Lawn"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Property Type *
                </label>
                <select
                  value={newPropType}
                  onChange={(e) => setNewPropType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-800 outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Marriage Garden & Hall">Marriage Garden & Hall</option>
                  <option value="Community Hall">Community Hall</option>
                  <option value="Guest House & AC Rooms">Guest House & AC Rooms</option>
                  <option value="Pooja & Cultural Bhavan">Pooja & Cultural Bhavan</option>
                  <option value="Meeting / Conference Room">Meeting / Conference Room</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vijay Nagar, Indore"
                    value={newPropLocation}
                    onChange={(e) => setNewPropLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Capacity (Guests)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={newPropCapacity}
                    onChange={(e) => setNewPropCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Price Per Day (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={newPropPrice}
                    onChange={(e) => setNewPropPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Manager Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9826017177"
                    value={newPropPhone}
                    onChange={(e) => setNewPropPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description & Amenities
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe rooms, AC, lawn area, kitchen setup, parking..."
                  value={newPropDesc}
                  onChange={(e) => setNewPropDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingProperty}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer"
                >
                  <span>{submittingProperty ? "Saving Property..." : "Add Property"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: MANAGE BOOKING DATE FOR PROPERTY ─────────────────── */}
      {manageBookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Manage Booking Status
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">
                  Property: {selectedProperty?.propertyName}
                </p>
              </div>
              <button
                onClick={() => setManageBookingModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBookingDate} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Date (तिथि चुनें) *
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-800 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Action (स्थिति बदलें) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingAction("book")}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                      bookingAction === "book"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>🔴 Mark Booked (बुक करें)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingAction("free")}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                      bookingAction === "free"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>🟢 Mark Free (खाली करें)</span>
                  </button>
                </div>
              </div>

              {bookingAction === "book" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Booked By Member Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Jain"
                      value={bookedByName}
                      onChange={(e) => setBookedByName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Contact Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9826012345"
                      value={bookedByPhone}
                      onChange={(e) => setBookedByPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Function / Event Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Marriage Saptapadi, Reception, Meeting"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className={`w-full py-3 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer ${
                    bookingAction === "book"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  <span>
                    {submittingBooking
                      ? "Saving..."
                      : bookingAction === "book"
                      ? "Save Booking Date"
                      : "Mark Date as Free"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
