"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Plus,
  PlusCircle,
  PackagePlus,
  Trash2,
  Package,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AddPropertyPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Check if current user is admin or property manager
  const isManagerOrAdmin =
    user?.role === "admin" ||
    user?.role === "super-admin" ||
    user?.isPropertyManager === true;

  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("Marriage Garden & Hall");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [contactPhone, setContactPhone] = useState(user?.mobileNumber || user?.phone || "");
  const [description, setDescription] = useState("");
  const [packages, setPackages] = useState<
    Array<{ name: string; pricePerDay: string; description: string }>
  >([{ name: "", pricePerDay: "", description: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddPackageRow = () => {
    setPackages((prev) => [...prev, { name: "", pricePerDay: "", description: "" }]);
  };

  const handleRemovePackageRow = (index: number) => {
    setPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePackageChange = (
    index: number,
    field: "name" | "pricePerDay" | "description",
    value: string
  ) => {
    setPackages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim() || !propertyType.trim()) {
      setErrorMsg("Property Name and Type are required.");
      return;
    }

    const validPackages = packages
      .filter((p) => p.name.trim() && p.pricePerDay)
      .map((p) => ({
        name: p.name.trim(),
        pricePerDay: parseInt(p.pricePerDay) || 0,
        description: p.description.trim() || undefined,
      }));

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyName: propertyName.trim(),
          propertyType: propertyType.trim(),
          location: location.trim() || undefined,
          capacity: capacity ? parseInt(capacity) : undefined,
          pricePerDay: pricePerDay ? parseInt(pricePerDay) : undefined,
          contactPhone: contactPhone.trim() || user?.mobileNumber || undefined,
          description: description.trim() || undefined,
          packages: validPackages,
          owner: user?._id,
        }),
      });

      if (res.ok) {
        router.push("/bookings");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to create property.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !isManagerOrAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            Only Property Managers & Community Admins can add new properties.
          </p>
          <Link
            href="/bookings"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-700 transition-all no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Property Bookings</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 select-none">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-800 text-white px-4 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center space-x-3">
          <Link
            href="/bookings"
            className="p-2 -ml-1 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer shrink-0"
            title="Back to Bookings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center space-x-2 leading-snug">
              <Building2 className="w-5 h-5 text-indigo-200 shrink-0" />
              <span>Add New Property</span>
            </h1>
            <p className="text-xs text-indigo-100/90 font-normal mt-0.5">
              List a community hall, garden, or facility for member bookings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-indigo-800 tracking-wider pb-2 border-b border-slate-100 flex items-center space-x-1.5">
              <span>Property Info</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Property Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maharaja Agrasen Bhavan & Lawn"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Property Type *
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white cursor-pointer transition-all"
              >
                <option value="Marriage Garden & Hall">Marriage Garden & Hall</option>
                <option value="Community Hall">Community Hall</option>
                <option value="Guest House & AC Rooms">Guest House & AC Rooms</option>
                <option value="Pooja & Cultural Bhavan">Pooja & Cultural Bhavan</option>
                <option value="Meeting / Conference Room">Meeting / Conference Room</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Vijay Nagar, Indore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Guest Capacity
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Price / Day (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-emerald-800 outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Manager Contact Phone
              </label>
              <input
                type="tel"
                placeholder="e.g. 9826017177"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe rooms, AC, lawn area, kitchen setup, parking..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white resize-none transition-all"
              />
            </div>
          </div>

          {/* Dynamic Packages Builder Section */}
          <div className="pt-4 border-t border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-black uppercase text-indigo-800 tracking-wider">
                  Packages
                </h2>
              </div>

              <button
                type="button"
                onClick={handleAddPackageRow}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center space-x-1.5 border-0 cursor-pointer shadow-2xs"
              >
                <PackagePlus className="w-4 h-4 text-indigo-600" />
                <span>Add Package</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Define package options with daily pricing (e.g. "Marriage Hall + Dinner", "Lawn + Stage").
            </p>

            <div className="space-y-3">
              {packages.map((pkg, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                      Package #{idx + 1}
                    </span>
                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePackageRow(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center space-x-1 border-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                        Package Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Marriage Hall + Dinner"
                        value={pkg.name}
                        onChange={(e) => handlePackageChange(idx, "name", e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                        Price / Day (₹) *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={pkg.pricePerDay}
                        onChange={(e) => handlePackageChange(idx, "pricePerDay", e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-emerald-800 outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                        Details
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Main AC Hall + Catering Space + Basic Lighting"
                        value={pkg.description}
                        onChange={(e) => handlePackageChange(idx, "description", e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-[11px] font-medium text-slate-700 outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <Link
              href="/bookings"
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition-all no-underline"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center space-x-2 border-0 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>{submitting ? "Saving..." : "Save Property"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
