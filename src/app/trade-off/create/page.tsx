"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  ArrowLeftRight,
  Package,
  Wrench,
  Car,
  Share2,
  Calendar,
  MapPin,
  Phone,
  Send,
  Tag,
} from "lucide-react";

export default function PostTradeOffPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields (Vertical single-column standard fields with short labels)
  const [tradeType, setTradeType] = useState<"offer" | "request">("offer");
  const [category, setCategory] = useState<"goods" | "services" | "vehicles" | "crowd_sharing">("goods");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricingModel, setPricingModel] = useState("Free Borrow");
  const [itemCondition, setItemCondition] = useState("Good Condition");
  const [availableDate, setAvailableDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState(user?.city || "");
  const [contactPhone, setContactPhone] = useState(user?.mobileNumber || user?.phone || "");
  const [whatsappNumber, setWhatsappNumber] = useState(user?.mobileNumber || user?.phone || "");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in Title and Description.");
      return;
    }

    if (availableDate) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (availableDate < todayStr) {
        alert("Available date cannot be in the past. Please select today or a future date.");
        return;
      }
    }

    if (!user) {
      alert("You must be signed in to post a trade-off listing.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trade-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: user._id,
          tradeType,
          category,
          title: title.trim(),
          description: description.trim(),
          itemCondition: itemCondition.trim() || undefined,
          pricingModel: pricingModel.trim() || undefined,
          availableDate: availableDate ? availableDate.trim() : undefined,
          location: location.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          whatsappNumber: whatsappNumber.trim() || undefined,
        }),
      });

      if (res.ok) {
        showToast("🎉 Trade-Off listing posted successfully!");
        setTimeout(() => {
          router.push("/trade-off");
        }, 1000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to post trade-off listing");
      }
    } catch (err) {
      console.error("Error creating trade-off post", err);
      alert("Failed to post trade-off listing");
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
          href="/trade-off"
          className="flex items-center justify-center p-2.5 text-slate-700 hover:text-slate-900 bg-white rounded-2xl shadow-xs border border-slate-200 no-underline shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-black text-slate-900">Post Trade-Off Listing</h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Lend, borrow, share vehicles & crowd resources with neighbors
          </p>
        </div>
      </div>

      {/* Form Container - Purple / Indigo Theme */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        {/* Field 1: Trade Type */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Listing Purpose</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setTradeType("offer")}
              className={`py-2.5 rounded-xl text-xs font-extrabold border-0 cursor-pointer transition-all ${
                tradeType === "offer"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              🤝 Offering (Lend / Help)
            </button>
            <button
              type="button"
              onClick={() => setTradeType("request")}
              className={`py-2.5 rounded-xl text-xs font-extrabold border-0 cursor-pointer transition-all ${
                tradeType === "request"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              🙋 Seeking (Borrow / Need)
            </button>
          </div>
        </div>

        {/* Field 2: Category */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setCategory("goods")}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${
                category === "goods"
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>Goods</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory("services")}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${
                category === "services"
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Services</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory("vehicles")}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${
                category === "vehicles"
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Car className="w-3.5 h-3.5 shrink-0" />
              <span>Vehicles</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory("crowd_sharing")}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${
                category === "crowd_sharing"
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Crowd Share</span>
            </button>
          </div>
        </div>

        {/* Field 3: Title */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Item / Service Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Bosch Drill Machine / Scooter for 2 Days / Lawn Mower"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-purple-500 focus:bg-white"
          />
        </div>

        {/* Field 4: Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Description *</label>
          <textarea
            required
            rows={3}
            placeholder="Describe the item condition, rules, or what help you need..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-purple-500 focus:bg-white resize-none"
          />
        </div>

        {/* Field 5: Terms / Pricing */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Terms / Pricing Model</label>
          <select
            value={pricingModel}
            onChange={(e) => setPricingModel(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-purple-500 focus:bg-white"
          >
            <option value="Free Borrow / Community Share">Free Borrow / Community Share</option>
            <option value="Security Deposit Required">Security Deposit Required</option>
            <option value="Token Nominal Fee">Token Nominal Fee</option>
            <option value="Exchange / Barter">Exchange / Barter</option>
          </select>
        </div>

        {/* Field 6: Condition */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Condition</label>
          <input
            type="text"
            placeholder="e.g. Like New, Excellent, Working Fine, N/A"
            value={itemCondition}
            onChange={(e) => setItemCondition(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-purple-500 focus:bg-white"
          />
        </div>

        {/* Field 7: Available Date (Past date validation enforced) */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Available Date *</label>
          <input
            type="date"
            required
            min={new Date().toISOString().split("T")[0]}
            value={availableDate}
            onChange={(e) => setAvailableDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-purple-500 focus:bg-white"
          />
        </div>

        {/* Field 8: Location */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Pickup Area / Location</label>
          <input
            type="text"
            placeholder="e.g. Block A, Society Park, Jaipur"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-purple-500 focus:bg-white"
          />
        </div>

        {/* Field 9: Phone & WhatsApp */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Contact Number</label>
          <input
            type="tel"
            placeholder="Mobile number for calls/WhatsApp"
            value={contactPhone}
            onChange={(e) => {
              setContactPhone(e.target.value);
              setWhatsappNumber(e.target.value);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden focus:border-purple-500 focus:bg-white"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer border-0 flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? "Publishing Listing..." : "Publish Trade-Off Listing"}</span>
        </button>
      </form>
    </div>
  );
}
