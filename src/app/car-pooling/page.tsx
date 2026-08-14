"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Car,
  ArrowLeft,
  Plus,
  MapPin,
  Calendar,
  Clock,
  Users,
  IndianRupee,
  Phone,
  Filter,
  Trash2,
  ArrowRight,
  Layers,
  User,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";

interface RideItem {
  _id: string;
  owner: {
    _id: string;
    name: string;
    mobileNumber: string;
    phone?: string;
    avatar?: string;
    city?: string;
    gotra?: string;
  };
  tripType: "offer" | "request";
  requestCategory?: "passenger" | "parcel";
  parcelDetails?: string;
  parcelWeight?: string;
  originCity: string;
  destinationCity: string;
  travelDate: string;
  travelTime?: string;
  availableSeats: number;
  pricePerSeat?: number;
  vehicleDetails?: string;
  pickupLocation?: string;
  dropLocation?: string;
  notes?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
}

function formatWhatsAppUrl(
  waNumber?: string,
  tripType?: string,
  fromCity?: string,
  toCity?: string,
  date?: string,
  ownerName?: string
) {
  if (!waNumber) return "#";
  const digits = waNumber.replace(/\D/g, "");
  if (!digits) return "#";
  const formatted = digits.length === 10 ? `91${digits}` : digits;

  const actionText = tripType === "offer" ? "book a seat on your ride" : "offer a seat for your ride request";
  const msg = encodeURIComponent(
    `Hello ${ownerName || ""}, I saw your Outstation Car Pool posting on Community Circle (${fromCity} to ${toCity} on ${date}) and would like to ${actionText}.`
  );
  return `https://wa.me/${formatted}?text=${msg}`;
}

export default function CarPoolingPage() {
  const { user } = useAuth();

  // Ride listings state
  const [rides, setRides] = useState<RideItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "offer" | "request">("all");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // Collapsible state for ride cards
  const [collapsedRides, setCollapsedRides] = useState<Record<string, boolean>>({});
  const toggleRideCollapse = (id: string) => {
    setCollapsedRides((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchRides = async () => {
    setLoading(true);
    try {
      let url = "/api/car-pool?";
      const params: string[] = [];

      if (activeTab !== "all") {
        params.push(`tripType=${activeTab}`);
      }

      if (searchFrom.trim()) {
        params.push(`originCity=${encodeURIComponent(searchFrom.trim())}`);
      }
      if (searchTo.trim()) {
        params.push(`destinationCity=${encodeURIComponent(searchTo.trim())}`);
      }
      if (searchQuery.trim()) {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }

      url += params.join("&");

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRides(data.rides || []);
      }
    } catch (e) {
      console.error("Failed to load carpool listings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [activeTab, searchFrom, searchTo, searchQuery]);

  const handleDeleteRide = async (id: string) => {
    if (!confirm("Are you sure you want to delete this car pool post?")) return;
    try {
      const res = await fetch(`/api/car-pool/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Ride posting deleted");
        fetchRides();
      }
    } catch (err) {
      console.error("Error deleting ride", err);
    }
  };

  return (
    <div className="space-y-4 pb-24 relative select-none max-w-2xl mx-auto px-1 sm:px-0">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Back Nav & Post Ride Button Link */}
      <div className="flex items-center justify-between py-1">
        <Link
          href="/events"
          className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 text-xs font-bold no-underline bg-white px-3 py-2 rounded-2xl shadow-xs border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hubs</span>
        </Link>
        <Link
          href="/car-pooling/create"
          className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-2xl shadow-md transition-transform active:scale-95 border-0 cursor-pointer no-underline"
        >
          <Plus className="w-4 h-4" />
          <span>Post Ride</span>
        </Link>
      </div>

      {/* Hero Header - Light Red / Rose Theme */}
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-800 rounded-3xl p-5 text-white shadow-md border border-rose-400/30 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="p-2.5 bg-white/15 rounded-2xl">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-wide">🚘 Outstation Car Pooling</h2>
            <p className="text-[11px] text-rose-100 font-medium mt-0.5 leading-relaxed">
              Share inter-city rides, lower travel costs, and travel comfortably with verified community members.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs - Displayed all at once in 3 columns */}
      <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-xs">
        <button
          onClick={() => setActiveTab("all")}
          className={`py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all border-0 cursor-pointer flex items-center justify-center space-x-1 ${
            activeTab === "all"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>All</span>
        </button>

        <button
          onClick={() => setActiveTab("offer")}
          className={`py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all border-0 cursor-pointer flex items-center justify-center space-x-1 ${
            activeTab === "offer"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Car className="w-3.5 h-3.5 shrink-0" />
          <span>Offers</span>
        </button>

        <button
          onClick={() => setActiveTab("request")}
          className={`py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all border-0 cursor-pointer flex items-center justify-center space-x-1 ${
            activeTab === "request"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>Requests</span>
        </button>
      </div>

      {/* Single-Column Route Search Filters (Collapsible) */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-3">
        <div
          onClick={() => setFilterCollapsed((prev) => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <h4 className="text-xs font-extrabold text-slate-700 flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Filter Outstation Route</span>
            {(searchFrom || searchTo || searchQuery) && (
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" title="Filter active" />
            )}
          </h4>
          <button
            type="button"
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 border-0 bg-transparent cursor-pointer flex items-center"
          >
            {filterCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {!filterCollapsed && (
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div className="space-y-2">
              {/* Vertical Field 1: From */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">From</label>
                <input
                  type="text"
                  placeholder="Origin city (e.g. Jaipur)"
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Vertical Field 2: To */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">To</label>
                <input
                  type="text"
                  placeholder="Destination city (e.g. Delhi)"
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Vertical Field 3: General Keyword Search */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Keyword</label>
                <input
                  type="text"
                  placeholder="Vehicle, pickup point, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            {(searchFrom || searchTo || searchQuery) && (
              <button
                onClick={() => {
                  setSearchFrom("");
                  setSearchTo("");
                  setSearchQuery("");
                }}
                className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border-0 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rides Feed */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-100">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-rose-600" />
          <span className="text-xs text-slate-400 font-semibold">Loading Outstation Rides...</span>
        </div>
      ) : rides.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl p-6 border border-slate-100 space-y-3">
          <Car className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-600 font-bold">No outstation ride postings found.</p>
          <p className="text-[11px] text-slate-400 font-medium max-w-sm mx-auto">
            Be the first to post a carpool offer or request for inter-city travel!
          </p>
          <Link
            href="/car-pooling/create"
            className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-xs border-0 cursor-pointer no-underline"
          >
            <Plus className="w-4 h-4" />
            <span>Post a Ride</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((item) => {
            const isOwner = user?._id === item.owner?._id;
            const isCollapsed = collapsedRides[item._id] ?? false;
            const waUrl = formatWhatsAppUrl(
              item.whatsappNumber || item.contactPhone || item.owner?.mobileNumber,
              item.tripType,
              item.originCity,
              item.destinationCity,
              item.travelDate,
              item.owner?.name
            );

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow select-none space-y-3.5"
              >
                {/* Header: Owner Info & Trip Type Badge & Collapse Toggle */}
                <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      <img
                        src={item.owner?.avatar || "/avatar.jpg"}
                        alt={item.owner?.name || "Member"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">
                        {item.owner?.name || "Community Member"}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        {item.owner?.city ? `${item.owner.city} • ` : ""}
                        {item.owner?.gotra ? `Gotra: ${item.owner.gotra}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => toggleRideCollapse(item._id)}
                      className="flex items-center space-x-1 text-[10px] font-extrabold text-rose-700 hover:text-rose-900 bg-rose-50 px-2 py-1 rounded-xl border border-rose-100 cursor-pointer"
                    >
                      <span>{isCollapsed ? "Show Details" : "Hide Details"}</span>
                      {isCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>

                    <span
                      className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border flex items-center space-x-1 ${
                        item.tripType === "offer"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : item.requestCategory === "parcel"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {item.tripType === "offer" ? (
                        <>
                          <Car className="w-3 h-3 shrink-0" />
                          <span>Ride Offer</span>
                        </>
                      ) : item.requestCategory === "parcel" ? (
                        <>
                          <Package className="w-3 h-3 shrink-0" />
                          <span>Send Parcel</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3 shrink-0" />
                          <span>Ride Needed</span>
                        </>
                      )}
                    </span>

                    {isOwner && (
                      <button
                        onClick={() => handleDeleteRide(item._id)}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg border-0 bg-transparent cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Route Header: From -> To */}
                <div className="bg-rose-50/50 rounded-2xl p-3 border border-rose-100/70 flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {item.originCity}
                    </span>
                    <ArrowRight className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-xs font-black text-slate-900 truncate">
                      {item.destinationCity}
                    </span>
                  </div>

                  {item.requestCategory !== "parcel" && item.pricePerSeat !== undefined && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-black shrink-0 flex items-center space-x-0.5 ml-2">
                      {item.pricePerSeat > 0 ? (
                        <>
                          <IndianRupee className="w-3 h-3" />
                          <span>{item.pricePerSeat}/seat</span>
                        </>
                      ) : (
                        <span>Free Share</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Key Details: Date, Time, Seats (Seats hidden for parcels) */}
                <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-xl flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-rose-600" />
                    <span>{item.travelDate}</span>
                  </span>

                  {item.travelTime && (
                    <span className="bg-slate-100 px-2.5 py-1 rounded-xl flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-rose-600" />
                      <span>{item.travelTime}</span>
                    </span>
                  )}

                  {item.requestCategory !== "parcel" && (
                    <span className="bg-slate-100 px-2.5 py-1 rounded-xl flex items-center space-x-1">
                      <Users className="w-3 h-3 text-rose-600" />
                      <span>
                        {item.availableSeats} {item.availableSeats === 1 ? "seat" : "seats"}{" "}
                        {item.tripType === "offer" ? "available" : "needed"}
                      </span>
                    </span>
                  )}
                </div>

                {/* COLLAPSIBLE DETAILS BODY */}
                {!isCollapsed && (
                  <div className="space-y-3 pt-1 border-t border-slate-100">
                    {/* Parcel Info */}
                    {item.parcelDetails && (
                      <div className="text-xs text-amber-800 font-semibold bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Parcel: {item.parcelDetails}</span>
                        </div>
                        {item.parcelWeight && (
                          <span className="text-[10px] font-black bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-lg shrink-0 ml-1">
                            Max: {item.parcelWeight}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Vehicle Info */}
                    {item.vehicleDetails && (
                      <div className="text-xs text-slate-700 font-semibold bg-rose-50/60 px-3 py-2 rounded-xl border border-rose-100 flex items-center space-x-2">
                        <Car className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Vehicle: {item.vehicleDetails}</span>
                      </div>
                    )}

                    {/* Pickup & Drop Points */}
                    {(item.pickupLocation || item.dropLocation) && (
                      <div className="space-y-1 text-[11px] text-slate-600 font-medium">
                        {item.pickupLocation && (
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Pickup: {item.pickupLocation}</span>
                          </div>
                        )}
                        {item.dropLocation && (
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Drop: {item.dropLocation}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {item.notes}
                      </p>
                    )}

                    {/* Actions: WhatsApp & Call */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer no-underline"
                      >
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                        <span>WhatsApp Inquiry</span>
                      </a>

                      {(item.contactPhone || item.owner?.mobileNumber) && (
                        <a
                          href={`tel:${item.contactPhone || item.owner?.mobileNumber}`}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs shadow-xs active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer no-underline border border-slate-200/60"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Call {item.contactPhone || item.owner?.mobileNumber}</span>
                        </a>
                      )}
                    </div>
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
