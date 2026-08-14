"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  Plus,
  PlusCircle,
  PackagePlus,
  Sparkles,
  CheckCircle2,
  XCircle,
  MapPin,
  Users,
  IndianRupee,
  Phone,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Package,
  Layers,
  Trash2,
  Edit3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface PropertyPackage {
  _id?: string;
  name: string;
  pricePerDay: number;
  description?: string;
}

interface BookedSlot {
  date: string; // YYYY-MM-DD
  bookedBy: string;
  contactPhone?: string;
  notes?: string;
  packageName?: string;
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
  packages?: PropertyPackage[];
  bookedDates: BookedSlot[];
}

function getWhatsAppUrl(mobileNumber?: string, message?: string) {
  if (!mobileNumber) return "";
  const digits = mobileNumber.replace(/\D/g, "");
  if (!digits) return "";
  const formatted = digits.length === 10 ? `91${digits}` : digits;
  const encodedMsg = message ? encodeURIComponent(message) : "";
  return `https://wa.me/${formatted}${encodedMsg ? `?text=${encodedMsg}` : ""}`;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [expandedPropIds, setExpandedPropIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if current user is admin or property manager
  const isManagerOrAdmin =
    user?.role === "admin" ||
    user?.role === "super-admin" ||
    user?.isPropertyManager === true;

  // Calendar Month & Year State
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth());

  // Add Property Modal State
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState("Marriage Garden & Hall");
  const [newPropLocation, setNewPropLocation] = useState("");
  const [newPropCapacity, setNewPropCapacity] = useState("");
  const [newPropPrice, setNewPropPrice] = useState("");
  const [newPropPhone, setNewPropPhone] = useState("");
  const [newPropDesc, setNewPropDesc] = useState("");
  const [newPropPackages, setNewPropPackages] = useState<
    Array<{ name: string; pricePerDay: string; description: string }>
  >([{ name: "", pricePerDay: "", description: "" }]);
  const [submittingProperty, setSubmittingProperty] = useState(false);

  // Manage / Edit Property Packages Modal State
  const [managePackagesModalOpen, setManagePackagesModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string>("");
  const [editingPropertyName, setEditingPropertyName] = useState<string>("");
  const [editPropPackages, setEditPropPackages] = useState<
    Array<{ name: string; pricePerDay: string; description: string }>
  >([]);
  const [submittingPackages, setSubmittingPackages] = useState(false);

  // Manage Booking Date Modal State
  const [targetPropertyId, setTargetPropertyId] = useState<string>("");
  const [manageBookingModalOpen, setManageBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingAction, setBookingAction] = useState<"book" | "free">("book");
  const [bookedByName, setBookedByName] = useState("");
  const [bookedByPhone, setBookedByPhone] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [selectedPackageName, setSelectedPackageName] = useState<string>("");
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
        // Expand first property by default if none expanded yet
        if (propList.length > 0 && expandedPropIds.length === 0) {
          setExpandedPropIds([propList[0]._id]);
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

  const toggleExpand = (propId: string) => {
    setExpandedPropIds((prev) =>
      prev.includes(propId)
        ? prev.filter((id) => id !== propId)
        : [...prev, propId]
    );
  };

  // Helper for generating calendar grid
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
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

  const isDateBooked = (prop: Property, dateStr: string) => {
    if (!prop || !prop.bookedDates) return null;
    return prop.bookedDates.find((b) => b.date === dateStr) || null;
  };

  // Handle Day Click
  const handleDayClick = (prop: Property, dateStr: string) => {
    const booking = isDateBooked(prop, dateStr);
    if (isManagerOrAdmin) {
      setTargetPropertyId(prop._id);
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
    } else {
      if (booking) {
        alert(
          `🔴 Date ${dateStr} is Booked for "${booking.notes || "Event"}" by ${booking.bookedBy}.`
        );
      } else {
        const phone = prop.contactPhone;
        if (phone) {
          const msg = `Namaste! I would like to inquire about booking "${prop.propertyName}" for date ${dateStr}. Please share availability and details.`;
          window.open(getWhatsAppUrl(phone, msg), "_blank");
        } else {
          alert(`🟢 Date ${dateStr} is Available! Please connect with the manager to request booking.`);
        }
      }
    }
  };

  // Dynamic Package Builder Handlers
  const handleAddPackageRow = (target: "new" | "edit") => {
    if (target === "new") {
      setNewPropPackages((prev) => [...prev, { name: "", pricePerDay: "", description: "" }]);
    } else {
      setEditPropPackages((prev) => [...prev, { name: "", pricePerDay: "", description: "" }]);
    }
  };

  const handleRemovePackageRow = (index: number, target: "new" | "edit") => {
    if (target === "new") {
      setNewPropPackages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setEditPropPackages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePackageChange = (
    index: number,
    field: "name" | "pricePerDay" | "description",
    value: string,
    target: "new" | "edit"
  ) => {
    if (target === "new") {
      setNewPropPackages((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    } else {
      setEditPropPackages((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    }
  };

  const openManagePackagesModal = (prop: Property) => {
    setEditingPropertyId(prop._id);
    setEditingPropertyName(prop.propertyName);
    if (prop.packages && prop.packages.length > 0) {
      setEditPropPackages(
        prop.packages.map((pkg) => ({
          name: pkg.name || "",
          pricePerDay: pkg.pricePerDay ? pkg.pricePerDay.toString() : "",
          description: pkg.description || "",
        }))
      );
    } else {
      setEditPropPackages([{ name: "", pricePerDay: "", description: "" }]);
    }
    setManagePackagesModalOpen(true);
  };

  const handleSavePackages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPropertyId) return;

    const validPackages = editPropPackages
      .filter((p) => p.name.trim() && p.pricePerDay)
      .map((p) => ({
        name: p.name.trim(),
        pricePerDay: parseInt(p.pricePerDay) || 0,
        description: p.description.trim() || undefined,
      }));

    setSubmittingPackages(true);
    try {
      const res = await fetch("/api/properties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: editingPropertyId,
          action: "updatePackages",
          packages: validPackages,
        }),
      });

      if (res.ok) {
        showToast("📦 Property Packages Updated!");
        setManagePackagesModalOpen(false);
        fetchProperties();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update packages");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating property packages");
    } finally {
      setSubmittingPackages(false);
    }
  };

  // Create New Property
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim() || !newPropType.trim()) return;

    const validPackages = newPropPackages
      .filter((p) => p.name.trim() && p.pricePerDay)
      .map((p) => ({
        name: p.name.trim(),
        pricePerDay: parseInt(p.pricePerDay) || 0,
        description: p.description.trim() || undefined,
      }));

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
          packages: validPackages,
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
        setNewPropPackages([{ name: "", pricePerDay: "", description: "" }]);
        if (data.property) {
          setExpandedPropIds((prev) => [...prev, data.property._id]);
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
    if (!bookingDate || !targetPropertyId) return;

    const todayStr = new Date().toISOString().split("T")[0];
    if (bookingAction === "book" && bookingDate < todayStr) {
      alert("Booking date cannot be in the past. Please select today or a future date.");
      return;
    }

    setSubmittingBooking(true);
    try {
      const res = await fetch("/api/properties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: targetPropertyId,
          action: bookingAction,
          date: bookingDate,
          bookedBy: bookedByName.trim() || "Community Member",
          contactPhone: bookedByPhone.trim(),
          notes: bookingNotes.trim(),
          packageName: selectedPackageName || undefined,
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

  const getTargetProperty = () => properties.find((p) => p._id === targetPropertyId);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-800 text-white px-4 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <Link
              href="/events"
              className="p-2 -ml-1 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer shrink-0"
              title="Back to Events"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 leading-snug">
                  <Building2 className="w-5 h-5 text-indigo-200 shrink-0" />
                  <span className="truncate">Property Bookings</span>
                </h1>
                {isManagerOrAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-300/30 text-emerald-100 text-[10px] font-semibold whitespace-nowrap">
                    Manager Access
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-100/90 font-normal truncate mt-0.5">
                Select a property to view availability & book
              </p>
            </div>
          </div>

          {isManagerOrAdmin && (
            <Link
              href="/bookings/add"
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 active:bg-white/35 text-white text-xs font-bold rounded-xl border border-white/25 backdrop-blur-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs shrink-0 whitespace-nowrap no-underline"
            >
              <PlusCircle className="w-4 h-4 text-indigo-200" />
              <span>Add Property</span>
            </Link>
          )}
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
              No Properties Listed Yet
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              {isManagerOrAdmin
                ? "Click below to add a property (Community Hall, Lawn, Guest House) and manage its bookings!"
                : "There are currently no community properties listed for booking."}
            </p>
            {isManagerOrAdmin && (
              <Link
                href="/bookings/add"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs border-0 cursor-pointer active:scale-95 transition-all inline-flex items-center space-x-1.5 no-underline"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add New Property</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Community Properties ({properties.length})
              </h2>
              <span className="text-[10px] text-slate-400 font-bold">
                Tap header to Expand / Collapse
              </span>
            </div>

            {/* COLLAPSIBLE ACCORDION LIST */}
            {properties.map((prop) => {
              const isExpanded = expandedPropIds.includes(prop._id);
              const bookedCount = prop.bookedDates?.length || 0;

              return (
                <div
                  key={prop._id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                >
                  {/* COLLAPSED HEADER BAR */}
                  <div
                    onClick={() => toggleExpand(prop._id)}
                    className={`p-4 cursor-pointer flex items-center justify-between transition-colors select-none ${
                      isExpanded
                        ? "bg-gradient-to-r from-indigo-50/80 to-blue-50/50 border-b border-slate-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div
                        className={`p-3 rounded-2xl shrink-0 transition-transform ${
                          isExpanded
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider bg-indigo-100 text-indigo-800">
                            {prop.propertyType}
                          </span>
                          {prop.location && (
                            <span className="text-[10px] font-medium text-slate-500 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{prop.location}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-black text-slate-900 mt-1 truncate">
                          {prop.propertyName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-2">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-black text-rose-600 block">
                          🔴 {bookedCount} Booked
                        </span>
                        {prop.pricePerDay && (
                          <span className="text-[10px] text-slate-500 font-semibold block">
                            ₹{prop.pricePerDay}/day
                          </span>
                        )}
                      </div>

                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED CONTENT BODY */}
                  {isExpanded && (
                    <div className="p-5 space-y-4 animate-in fade-in duration-200">
                      {/* PROPERTY DETAILS & WHATSAPP ACTION BAR */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-700">
                          {prop.pricePerDay && (
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                              <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-bold">Price</span>
                                <span>₹{prop.pricePerDay} / day</span>
                              </div>
                            </div>
                          )}

                          {prop.capacity && (
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-bold">Capacity</span>
                                <span>{prop.capacity} Guests</span>
                              </div>
                            </div>
                          )}

                          {prop.location && (
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2 col-span-2 sm:col-span-1">
                              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                              <div className="truncate">
                                <span className="text-[9px] text-slate-400 block uppercase font-bold">Location</span>
                                <span className="truncate block">{prop.location}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {prop.description && (
                          <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/70">
                            {prop.description}
                          </p>
                        )}

                        {/* WHATSAPP & MANAGER CALL ACTION BUTTONS */}
                        <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                            {prop.contactPhone && (
                              <>
                                {/* WhatsApp Connect Icon Button */}
                                <a
                                  href={getWhatsAppUrl(
                                    prop.contactPhone,
                                    `Namaste! I am interested in booking "${prop.propertyName}" for an event. Please share availability and booking details.`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center space-x-1.5 no-underline border-0 cursor-pointer"
                                  title="Chat with Property Manager on WhatsApp"
                                >
                                  <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                  </svg>
                                  <span>WhatsApp Manager</span>
                                </a>

                                {/* Call Manager Link */}
                                <a
                                  href={`tel:${prop.contactPhone}`}
                                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1.5 no-underline border-0 cursor-pointer"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>Call: {prop.contactPhone}</span>
                                </a>
                              </>
                            )}
                          </div>

                          {/* Manage Date Action Button for Property Managers & Admins */}
                          {isManagerOrAdmin && (
                            <button
                              onClick={() => {
                                setTargetPropertyId(prop._id);
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
                          )}
                        </div>
                      </div>

                      {/* ── PROPERTY PACKAGES & DAILY RATES ────────────────── */}
                      <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
                                <span>Packages</span>
                              </h4>
                              <p className="text-[10px] text-slate-500 font-medium">
                                View available package options and daily rates
                              </p>
                            </div>
                          </div>

                          {isManagerOrAdmin && (
                            <button
                              onClick={() => openManagePackagesModal(prop)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-transform active:scale-95 flex items-center space-x-1.5 border-0 cursor-pointer"
                            >
                              <PackagePlus className="w-4 h-4 text-indigo-200" />
                              <span>Manage Packages</span>
                            </button>
                          )}
                        </div>

                        {(!prop.packages || prop.packages.length === 0) ? (
                          <div className="p-3 bg-white/90 rounded-xl border border-dashed border-indigo-200 text-center text-xs text-slate-500 font-medium">
                            Standard Base Rate: <span className="font-extrabold text-slate-800">₹{prop.pricePerDay || 0} / day</span>
                            {isManagerOrAdmin && (
                              <div className="mt-1 text-[11px] text-indigo-600 font-bold">
                                💡 Click "Manage Packages" to define custom packages (e.g. Marriage Hall + Dinner)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {prop.packages.map((pkg, pIdx) => (
                              <div
                                key={pIdx}
                                className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-1.5"
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-xs font-black text-slate-900 flex items-center space-x-1.5 min-w-0">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span className="truncate">{pkg.name}</span>
                                  </span>
                                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80 shrink-0 whitespace-nowrap">
                                    ₹{pkg.pricePerDay.toLocaleString("en-IN")} / day
                                  </span>
                                </div>
                                {pkg.description && (
                                  <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                                    {pkg.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ── CALENDAR VIEW: BOOKED vs FREE DAYS ────────────────── */}
                      <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                        {/* Calendar Month Navigation Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                              <CalendarIcon className="w-4 h-4 text-indigo-600" />
                              <span>
                                {monthNames[currentMonth]} {currentYear} Booking Calendar
                              </span>
                            </h4>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={handlePrevMonth}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border-0 cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black px-1.5 min-w-[90px] text-center">
                              {monthNames[currentMonth]} {currentYear}
                            </span>
                            <button
                              onClick={handleNextMonth}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border-0 cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Color Legend Bar */}
                        <div className="flex items-center justify-around bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px] font-extrabold">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-600 shadow-xs" />
                            <span className="text-rose-700">🔴 Booked Day (बुक है)</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
                            <span className="text-emerald-700">🟢 Free Day (उपलब्ध है)</span>
                          </div>
                        </div>

                        {/* Calendar Grid */}
                        <div>
                          <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                            <span>Sun</span>
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                          </div>

                          <div className="grid grid-cols-7 gap-1 text-center">
                            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                              <div key={`empty-${idx}`} className="h-12 rounded-xl bg-slate-50/50" />
                            ))}

                            {Array.from({ length: daysInMonth }).map((_, idx) => {
                              const dayNum = idx + 1;
                              const dateStr = formatDateStr(dayNum);
                              const booking = isDateBooked(prop, dateStr);

                              return (
                                <div
                                  key={dateStr}
                                  onClick={() => handleDayClick(prop, dateStr)}
                                  className={`h-12 rounded-xl p-1 flex flex-col justify-between items-center transition-all cursor-pointer select-none border ${
                                    booking
                                      ? "bg-rose-50 border-rose-300 hover:bg-rose-100 text-rose-950"
                                      : "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100 text-emerald-950"
                                  }`}
                                >
                                  <div className="w-full flex justify-between items-center px-0.5">
                                    <span className="text-xs font-black leading-none">{dayNum}</span>
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        booking ? "bg-rose-600" : "bg-emerald-500"
                                      }`}
                                    />
                                  </div>

                                  <span className="text-[8.5px] font-extrabold leading-tight truncate w-full px-0.5">
                                    {booking ? booking.bookedBy : "Free"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* LIST OF BOOKED DATES */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                            Booked Dates List for {prop.propertyName}
                          </h5>

                          {!prop.bookedDates || prop.bookedDates.length === 0 ? (
                            <div className="p-3 bg-slate-50 rounded-xl text-center text-xs font-bold text-slate-400">
                              🟢 All dates are currently free and available for booking!
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {prop.bookedDates.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-[11px]">
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

                                  {isManagerOrAdmin && (
                                    <button
                                      onClick={() => handleDayClick(prop, item.date)}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer border-0"
                                    >
                                      Manage
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL 1: ADD NEW PROPERTY (For Managers & Admins) ─────────────────────────────── */}
      {addPropertyModalOpen && isManagerOrAdmin && (
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

              {/* Dynamic Packages Builder Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Packages
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddPackageRow("new")}
                    className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 border-0 cursor-pointer bg-indigo-50 px-2 py-1 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Package</span>
                  </button>
                </div>

                {newPropPackages.map((pkg, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-indigo-700">Package #{idx + 1}</span>
                      {newPropPackages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePackageRow(idx, "new")}
                          className="text-rose-500 hover:text-rose-700 p-0.5 border-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="e.g. Marriage Hall + Dinner"
                        value={pkg.name}
                        onChange={(e) => handlePackageChange(idx, "name", e.target.value, "new")}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-800"
                      />
                      <input
                        type="number"
                        placeholder="Price / Day (₹)"
                        value={pkg.pricePerDay}
                        onChange={(e) => handlePackageChange(idx, "pricePerDay", e.target.value, "new")}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Optional details (e.g. AC Main Hall + Catering Space)"
                      value={pkg.description}
                      onChange={(e) => handlePackageChange(idx, "description", e.target.value, "new")}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700"
                    />
                  </div>
                ))}
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

      {/* ── MODAL 2: MANAGE BOOKING DATE (For Managers & Admins) ─────────────────── */}
      {manageBookingModalOpen && isManagerOrAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Manage Booking Status
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">
                  Property: {getTargetProperty()?.propertyName}
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
                  min={new Date().toISOString().split("T")[0]}
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
                  {getTargetProperty()?.packages && getTargetProperty()!.packages!.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Select Package (पैकेज चुनें)
                      </label>
                      <select
                        value={selectedPackageName}
                        onChange={(e) => setSelectedPackageName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-hidden focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Standard Booking --</option>
                        {getTargetProperty()!.packages!.map((pkg, idx) => (
                          <option key={idx} value={pkg.name}>
                            {pkg.name} (₹{pkg.pricePerDay.toLocaleString("en-IN")}/day)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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

      {/* ── MODAL 3: MANAGE PROPERTY PACKAGES (For Managers & Admins) ─────────────── */}
      {managePackagesModalOpen && isManagerOrAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Manage Packages</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold">
                  Property: {editingPropertyName}
                </p>
              </div>
              <button
                onClick={() => setManagePackagesModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackages} className="space-y-3">
              <div className="space-y-3">
                {editPropPackages.map((pkg, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider">
                        Package #{idx + 1}
                      </span>
                      {editPropPackages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePackageRow(idx, "edit")}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center space-x-1 border-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                          Package Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Marriage Hall + Dinner"
                          value={pkg.name}
                          onChange={(e) => handlePackageChange(idx, "name", e.target.value, "edit")}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                          Price / Day (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 50000"
                          value={pkg.pricePerDay}
                          onChange={(e) => handlePackageChange(idx, "pricePerDay", e.target.value, "edit")}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-emerald-800 outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                        Description & Details
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Includes main AC hall, lawn, sound & dining space"
                        value={pkg.description}
                        onChange={(e) => handlePackageChange(idx, "description", e.target.value, "edit")}
                        className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-[11px] font-medium text-slate-700 outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddPackageRow("edit")}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Package</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingPackages}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer"
                >
                  <span>{submittingPackages ? "Saving Packages..." : "Save All Packages"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
