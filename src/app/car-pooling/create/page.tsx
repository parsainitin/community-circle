"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Car,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  IndianRupee,
  MapPin,
  Phone,
  Send,
  Sparkles,
  Package,
} from "lucide-react";

export default function PostCarPoolPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields (Vertical, single-column standard fields with short labels)
  const [tripType, setTripType] = useState<"offer" | "request">("offer");
  const [requestCategory, setRequestCategory] = useState<"passenger" | "parcel">("passenger");
  const [parcelDetails, setParcelDetails] = useState("");
  const [parcelWeight, setParcelWeight] = useState("1 KG");
  const [fromCity, setFromCity] = useState(user?.city || "");
  const [toCity, setToCity] = useState("");
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split("T")[0]);
  const [travelTime, setTravelTime] = useState("07:00 AM");
  const [seats, setSeats] = useState("2");
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [contactPhone, setContactPhone] = useState(user?.mobileNumber || user?.phone || "");
  const [whatsappNumber, setWhatsappNumber] = useState(user?.mobileNumber || user?.phone || "");
  const [notes, setNotes] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCity.trim() || !toCity.trim() || !travelDate.trim()) {
      alert("Please fill in From, To, and Date fields.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (travelDate < todayStr) {
      alert("Travel date cannot be in the past. Please select today or a future date.");
      return;
    }

    if (!user) {
      alert("You must be signed in to post a ride.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/car-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: user._id,
          tripType,
          requestCategory: tripType === "request" ? requestCategory : "passenger",
          parcelDetails: tripType === "request" && requestCategory === "parcel" ? parcelDetails.trim() : undefined,
          parcelWeight: tripType === "request" && requestCategory === "parcel" ? parcelWeight : undefined,
          originCity: fromCity.trim(),
          destinationCity: toCity.trim(),
          travelDate: travelDate.trim(),
          travelTime: travelTime.trim() || undefined,
          availableSeats: Number(seats) || 1,
          pricePerSeat: pricePerSeat ? Number(pricePerSeat) : 0,
          vehicleDetails: vehicleDetails.trim() || undefined,
          pickupLocation: pickupLocation.trim() || undefined,
          dropLocation: dropLocation.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          whatsappNumber: whatsappNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        showToast("🎉 Outstation Ride posted successfully!");
        setTimeout(() => {
          router.push("/car-pooling");
        }, 1000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to post ride");
      }
    } catch (err) {
      console.error("Error creating car pool posting", err);
      alert("Failed to post ride");
    } finally {
      setSubmitting(false);
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

      {/* Top Back Nav & Title */}
      <div className="flex items-center space-x-3 py-1">
        <Link
          href="/car-pooling"
          className="flex items-center justify-center p-2.5 text-slate-700 hover:text-slate-900 bg-white rounded-2xl shadow-xs border border-slate-200 no-underline shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-black text-slate-900">Post Outstation Ride</h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Share inter-city trip details with community members
          </p>
        </div>
      </div>

      {/* Form Container - Light Red / Rose Accent Theme */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        {/* Field 1: Trip Type */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Trip Type</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setTripType("offer")}
              className={`py-2.5 rounded-xl text-xs font-extrabold border-0 cursor-pointer transition-all ${
                tripType === "offer"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              🚘 Offering Ride
            </button>
            <button
              type="button"
              onClick={() => setTripType("request")}
              className={`py-2.5 rounded-xl text-xs font-extrabold border-0 cursor-pointer transition-all ${
                tripType === "request"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              🙋 Seeking Ride / Parcel
            </button>
          </div>
        </div>

        {/* Sub-Field for Ride Request: Passenger vs Send Parcel */}
        {tripType === "request" && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Request Purpose</label>
            <div className="grid grid-cols-2 gap-2 bg-rose-50/70 p-1 rounded-2xl border border-rose-100">
              <button
                type="button"
                onClick={() => setRequestCategory("passenger")}
                className={`py-2 rounded-xl text-xs font-extrabold border-0 cursor-pointer transition-all ${
                  requestCategory === "passenger"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-transparent text-rose-700 hover:text-rose-900"
                }`}
              >
                🙋 Passenger Travel
              </button>
              <button
                type="button"
                onClick={() => setRequestCategory("parcel")}
                className={`py-2 rounded-xl text-xs font-extrabold border-0 cursor-pointer transition-all ${
                  requestCategory === "parcel"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-transparent text-rose-700 hover:text-rose-900"
                }`}
              >
                📦 Send Parcel / Courier
              </button>
            </div>
          </div>
        )}

        {/* Parcel Details & Weight Fields (Shown if Send Parcel is selected) */}
        {tripType === "request" && requestCategory === "parcel" && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Parcel Details *</label>
              <input
                type="text"
                required
                placeholder="e.g. Documents Box / Sealed Bag / Laptop"
                value={parcelDetails}
                onChange={(e) => setParcelDetails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Weight (Max) *</label>
              <select
                value={parcelWeight}
                onChange={(e) => setParcelWeight(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
              >
                <option value="500 gm">500 gm</option>
                <option value="1 KG">1 KG</option>
                <option value="3 KG">3 KG</option>
                <option value="5 KG">5 KG</option>
                <option value="10 KG">10 KG</option>
                <option value="15 KG">15 KG</option>
                <option value="20 KG">20 KG</option>
              </select>
            </div>
          </>
        )}

        {/* Field 2: From */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">From *</label>
          <input
            type="text"
            required
            placeholder="Departure city (e.g. Jaipur)"
            value={fromCity}
            onChange={(e) => setFromCity(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
          />
        </div>

        {/* Field 3: To */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">To *</label>
          <input
            type="text"
            required
            placeholder="Destination city (e.g. Delhi)"
            value={toCity}
            onChange={(e) => setToCity(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
          />
        </div>

        {/* Field 4: Date */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Date *</label>
          <input
            type="date"
            required
            min={new Date().toISOString().split("T")[0]}
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
          />
        </div>

        {/* Field 5: Time */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Time</label>
          <input
            type="text"
            placeholder="Departure time (e.g. 07:30 AM)"
            value={travelTime}
            onChange={(e) => setTravelTime(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
          />
        </div>

        {/* Field 6 & 7: Seats & Price/Seat (Only shown for passenger ride offers/requests, NOT for parcels) */}
        {!(tripType === "request" && requestCategory === "parcel") && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {tripType === "offer" ? "Seats Available *" : "Seats Needed *"}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Price/Seat (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0 for free / friendly contribution"
                value={pricePerSeat}
                onChange={(e) => setPricePerSeat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
              />
            </div>
          </>
        )}

        {/* Field 8: Vehicle (for driver ride offers) */}
        {tripType === "offer" && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Vehicle</label>
            <input
              type="text"
              placeholder="Car Make/Model & Color (e.g. White Creta)"
              value={vehicleDetails}
              onChange={(e) => setVehicleDetails(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
            />
          </div>
        )}

        {/* Field 9: Pickup */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Pickup</label>
          <input
            type="text"
            placeholder="Pickup area or landmark"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
          />
        </div>

        {/* Field 10: Drop */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Drop</label>
          <input
            type="text"
            placeholder="Drop location or landmark"
            value={dropLocation}
            onChange={(e) => setDropLocation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
          />
        </div>

        {/* Field 11: Phone */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Phone</label>
          <input
            type="tel"
            placeholder="Contact phone number"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
          />
        </div>

        {/* Field 12: WhatsApp */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">WhatsApp</label>
          <input
            type="tel"
            placeholder="WhatsApp number for direct messages"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white"
          />
        </div>

        {/* Field 13: Notes */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Notes</label>
          <textarea
            rows={3}
            placeholder="Luggage space, AC ride, preferred route, non-smoking, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500 focus:bg-white resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="pt-3 space-y-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer border-0"
          >
            {submitting
              ? "Publishing Ride..."
              : tripType === "offer"
              ? "Publish Ride Offer"
              : "Publish Ride Request"}
          </button>
          <Link
            href="/car-pooling"
            className="block text-center py-2.5 text-slate-600 hover:text-slate-900 text-xs font-bold no-underline"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
