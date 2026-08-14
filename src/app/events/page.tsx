"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Plus,
  X,
  Building2,
  UtensilsCrossed,
  GraduationCap,
  ShoppingBag,
  Phone,
  MapPin,
  IndianRupee,
  ImagePlus,
  Send,
  User,
  ExternalLink,
  Layers,
  Sparkles,
  CalendarCheck,
  Landmark,
  Megaphone,
  Briefcase,
  Car,
  ArrowLeftRight,
} from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";

interface HubItem {
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
  hubType:
    | "mahurth_panchang"
    | "bookings"
    | "organization"
    | "shopping"
    | "training"
    | "banking"
    | "car_pooling"
    | "classified"
    | "showcase_business"
    | "tutor_service"
    | "online_sale";
  title: string;
  category?: string;
  description: string;
  price?: number;
  priceUnit?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  location?: string;
  images: string[];
  createdAt: string;
}

export default function HubsPage() {
  const { user } = useAuth();

  // Active Category Filter Tab
  const [activeTab, setActiveTab] = useState<
    | "all"
    | "mahurth_panchang"
    | "bookings"
    | "organization"
    | "shopping"
    | "training"
    | "banking"
    | "car_pooling"
    | "classified"
    | "showcase_business"
    | "tutor_service"
    | "online_sale"
  >("all");

  // Hub items list state
  const [hubs, setHubs] = useState<HubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [hubType, setHubType] = useState<
    | "mahurth_panchang"
    | "bookings"
    | "organization"
    | "shopping"
    | "training"
    | "banking"
    | "car_pooling"
    | "classified"
    | "showcase_business"
    | "tutor_service"
    | "online_sale"
  >("organization");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("");
  const [location, setLocation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchHubs = async () => {
    setLoading(true);
    try {
      let url = `/api/hubs?hubType=${activeTab}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHubs(data.hubs || []);
      }
    } catch (e) {
      console.error("Failed to load hubs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, [activeTab, searchQuery]);

  // Pre-fill phone & whatsapp when user opens modal
  const handleOpenModal = (
    type:
      | "mahurth_panchang"
      | "bookings"
      | "organization"
      | "shopping"
      | "training"
      | "banking"
      | "car_pooling"
      | "classified"
      | "showcase_business"
      | "tutor_service"
      | "online_sale" = "organization"
  ) => {
    setHubType(type);
    setTitle("");
    setCategory("");
    setDescription("");
    setPrice("");
    setPriceUnit("");
    setLocation(user?.city || "");
    setContactPhone(user?.mobileNumber || user?.phone || "");
    setWhatsappNumber(user?.mobileNumber || user?.phone || "");
    setUploadedImages([]);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file);
        if (!checkFileSize(compressed, 5)) {
          alert(`Image ${file.name} exceeds 5MB limit`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", compressed);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        }
      }
      setUploadedImages((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/hubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: user._id,
          hubType,
          title: title.trim(),
          category: category.trim() || undefined,
          description: description.trim(),
          price: price ? parseFloat(price) : undefined,
          priceUnit: priceUnit.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          whatsappNumber: whatsappNumber.trim() || undefined,
          location: location.trim() || undefined,
          images: uploadedImages,
        }),
      });

      if (res.ok) {
        showToast("🎉 Published on Community Hubs!");
        setModalOpen(false);
        fetchHubs();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to publish hub listing");
      }
    } catch (err) {
      console.error("Error creating hub listing", err);
      alert("Error publishing hub listing");
    } finally {
      setSubmitting(false);
    }
  };

  const formatWhatsAppUrl = (waNumber?: string, hubTitle?: string, ownerName?: string) => {
    if (!waNumber) return "#";
    const digits = waNumber.replace(/\D/g, "");
    if (!digits) return "#";
    const formatted = digits.length === 10 ? `91${digits}` : digits;
    const msg = encodeURIComponent(
      `Hello ${ownerName || ""}, I saw your listing "${hubTitle || "Hub Listing"}" on Community Circle Hubs and would like to place an order / inquire for details.`
    );
    return `https://wa.me/${formatted}?text=${msg}`;
  };

  const getHubTypeBadge = (type: string) => {
    switch (type) {
      case "mahurth_panchang":
        return {
          label: "Mahurth & Panchang",
          icon: Sparkles,
          color: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "bookings":
        return {
          label: "Bookings",
          icon: CalendarCheck,
          color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "organization":
        return {
          label: "Organizations",
          icon: Building2,
          color: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "shopping":
        return {
          label: "Shoping",
          icon: ShoppingBag,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "training":
        return {
          label: "Training",
          icon: GraduationCap,
          color: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "banking":
        return {
          label: "Banking",
          icon: Landmark,
          color: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "car_pooling":
        return {
          label: "Car Pooling",
          icon: Car,
          color: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "classified":
        return {
          label: "Car Pooling",
          icon: Car,
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "showcase_business":
        return {
          label: "Food & Showcase",
          icon: UtensilsCrossed,
          color: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "tutor_service":
        return {
          label: "Tutor Service",
          icon: GraduationCap,
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "online_sale":
        return {
          label: "Online Sale",
          icon: ShoppingBag,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          label: "Listing",
          icon: Layers,
          color: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  return (
    <div className="space-y-4 pb-24 relative select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 rounded-3xl p-4.5 text-white shadow-md border border-amber-500/30">
        <h2 className="text-base font-black tracking-wide">Community Hubs</h2>
        <p className="text-[11px] text-amber-100 font-medium mt-0.5 leading-relaxed">
          Explore Panchang & Mahurth, Bookings, Organizations, Shoping, Training, Banking, and Car Pooling.
        </p>
      </div>

      {/* Visual Category Hub Cards - Horizontal layout */}
      <div className="space-y-2.5">
        {/* Card 1: Mahurth & Panchang (Always 1st Card) */}
        <Link
          href="/mahurth-panchang"
          className="group rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex items-center space-x-3.5 bg-gradient-to-r from-amber-50/90 to-orange-50/70 hover:from-amber-100 hover:to-orange-100 text-amber-950 border-amber-200/60 no-underline"
        >
          <div className="p-3 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 bg-amber-600 text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black leading-tight tracking-wide">🗓️ Mahurth & Panchang</h3>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-600 text-white shrink-0">
                View Panchang & Muhurat →
              </span>
            </div>
            <p className="text-[10px] text-amber-800/80 font-medium mt-0.5 leading-relaxed">
              Today's Panchang, Shubh Timings & Shadi Muhurat Finder
            </p>
          </div>
        </Link>

        {/* Card 2: Invitation (आमंत्रण) */}
        <Link
          href="/invitations"
          className="group rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex items-center space-x-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-100/60 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 border-emerald-300/70 no-underline"
        >
          <div className="p-3 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 bg-emerald-600 text-white shadow-xs">
            <Send className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black leading-tight tracking-wide">✉️ Invitation (आमंत्रण)</h3>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                Send WhatsApp Invitations →
              </span>
            </div>
            <p className="text-[10px] text-emerald-800/80 font-medium mt-0.5 leading-relaxed">
              Design & Broadcast Digital Cards to Community Members
            </p>
          </div>
        </Link>

        {/* Card 3: Bookings */}
        <Link
          href="/bookings"
          className="group rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex items-center space-x-3.5 bg-gradient-to-r from-indigo-50/90 to-blue-50/70 hover:from-indigo-100 hover:to-blue-100 text-indigo-950 border-indigo-200/60 no-underline"
        >
          <div className="p-3 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 bg-indigo-600 text-white shadow-xs">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black leading-tight tracking-wide">📅 Bookings</h3>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white shrink-0">
                View & Manage →
              </span>
            </div>
            <p className="text-[10px] text-indigo-800/80 font-medium mt-0.5 leading-relaxed">
              Property Booked/Free Days Calendar & Management
            </p>
          </div>
        </Link>

        {/* Card 4: Organizations */}
        <div
          onClick={() => setActiveTab("organization")}
          className={`group rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex items-center space-x-3.5 ${
            activeTab === "organization"
              ? "bg-gradient-to-r from-purple-700 to-indigo-800 text-white border-purple-500 ring-2 ring-purple-400"
              : "bg-gradient-to-r from-purple-50/90 to-indigo-50/70 hover:from-purple-100 hover:to-indigo-100 text-purple-950 border-purple-200/60"
          }`}
        >
          <div
            className={`p-3 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${
              activeTab === "organization" ? "bg-white/20 text-white" : "bg-purple-600 text-white shadow-xs"
            }`}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black leading-tight tracking-wide">🏛️ Organizations</h3>
              {activeTab === "organization" && (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white/25 text-white shrink-0">
                  Active
                </span>
              )}
            </div>
            <p
              className={`text-[10px] font-medium mt-0.5 leading-relaxed ${
                activeTab === "organization" ? "text-purple-100" : "text-purple-700/80"
              }`}
            >
              Clubs, Trusts, Committees & Welfare Groups
            </p>
          </div>
        </div>

        {/* Card 5: Listing (Business & Jobs) */}
        <Link
          href="/opportunities"
          className="group rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex items-center space-x-3.5 bg-gradient-to-r from-teal-50/90 to-cyan-50/70 hover:from-teal-100 hover:to-cyan-100 text-teal-950 border-teal-200/60 no-underline"
        >
          <div className="p-3 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 bg-teal-600 text-white shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black leading-tight tracking-wide">💼 Listing (Business & Jobs)</h3>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-600 text-white shrink-0">
                Explore Listings →
              </span>
            </div>
            <p className="text-[10px] text-teal-800/80 font-medium mt-0.5 leading-relaxed">
              Business Catalogs, Services & Job Opportunities
            </p>
          </div>
        </Link>

        {/* Card 3: Shoping */}
        <div
          onClick={() => setActiveTab("shopping")}
          className={`group rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex items-center space-x-3.5 ${
            activeTab === "shopping"
              ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500 ring-2 ring-emerald-400"
              : "bg-gradient-to-r from-emerald-50/90 to-teal-50/70 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 border-emerald-200/60"
          }`}
        >
          <div
            className={`p-3 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${
              activeTab === "shopping" ? "bg-white/20 text-white" : "bg-emerald-600 text-white shadow-xs"
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black leading-tight tracking-wide">🛍️ Shoping</h3>
              {activeTab === "shopping" && (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white/25 text-white shrink-0">
                  Active
                </span>
              )}
            </div>
            <p
              className={`text-[10px] font-medium mt-0.5 leading-relaxed ${
                activeTab === "shopping" ? "text-emerald-100" : "text-emerald-700/80"
              }`}
            >
              Community Stores, Products & Local Vendors
            </p>
          </div>
        </div>

        {/* Card 4: Trade-Off (Borrowing, Goods, Services, Crowd Sharing) */}
        <Link
          href="/trade-off"
          className="group rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex items-center space-x-3.5 bg-gradient-to-r from-purple-50/90 to-indigo-50/70 hover:from-purple-100 hover:to-indigo-100 text-purple-950 border-purple-200/60 no-underline"
        >
          <div className="p-3 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 bg-purple-600 text-white shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black leading-tight tracking-wide">🔄 Trade-Off</h3>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-600 text-white shrink-0">
                Explore Trade-Off →
              </span>
            </div>
            <p className="text-[10px] text-purple-800/80 font-medium mt-0.5 leading-relaxed">
              Borrow & Offer Goods, Services, Vehicles & Crowd Sharing
            </p>
          </div>
        </Link>

        {/* Card 5: Banking */}
        <div
          onClick={() => setActiveTab("banking")}
          className={`group rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex items-center space-x-3.5 ${
            activeTab === "banking"
              ? "bg-gradient-to-r from-rose-600 to-pink-700 text-white border-rose-500 ring-2 ring-rose-400"
              : "bg-gradient-to-r from-rose-50/90 to-pink-50/70 hover:from-rose-100 hover:to-pink-100 text-rose-950 border-rose-200/60"
          }`}
        >
          <div
            className={`p-3 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${
              activeTab === "banking" ? "bg-white/20 text-white" : "bg-rose-600 text-white shadow-xs"
            }`}
          >
            <Landmark className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black leading-tight tracking-wide">🏦 Banking</h3>
              {activeTab === "banking" && (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white/25 text-white shrink-0">
                  Active
                </span>
              )}
            </div>
            <p
              className={`text-[10px] font-medium mt-0.5 leading-relaxed ${
                activeTab === "banking" ? "text-rose-100" : "text-rose-700/80"
              }`}
            >
              Financial Services, Loans & Community Credit
            </p>
          </div>
        </div>

        {/* Card 6: Car Pooling */}
        <Link
          href="/car-pooling"
          className="group rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex items-center space-x-3.5 bg-gradient-to-r from-rose-50/90 via-red-50/70 to-rose-100/60 hover:from-rose-100 hover:to-red-100 text-rose-950 border-rose-300/70 no-underline"
        >
          <div className="p-3 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-105 bg-rose-600 text-white shadow-xs">
            <Car className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black leading-tight tracking-wide">🚗 Car Pooling</h3>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white shrink-0">
                Explore Outstation Rides →
              </span>
            </div>
            <p className="text-[10px] text-rose-800/80 font-medium mt-0.5 leading-relaxed">
              Outstation Rideshare, Inter-city Travel & Seat Offerings
            </p>
          </div>
        </Link>
      </div>

      {/* Search Input Bar & Filter Indicator */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-100 flex items-center space-x-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        <input
          type="text"
          placeholder={
            activeTab === "all"
              ? "Search all hubs by title, service, category..."
              : `Search in ${getHubTypeBadge(activeTab).label}...`
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-hidden text-xs placeholder-slate-400 text-slate-800 font-medium"
        />
        {activeTab !== "all" && (
          <button
            onClick={() => setActiveTab("all")}
            className="text-[9px] font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-lg border-0 cursor-pointer transition-all shrink-0"
          >
            Show All
          </button>
        )}
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="p-1 hover:bg-slate-100 rounded-full shrink-0 text-slate-400 border-0 bg-transparent cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Hub Items Grid / Feed */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-100">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-amber-600" />
          <span className="text-xs text-slate-400 font-semibold">Loading Hub Listings...</span>
        </div>
      ) : hubs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl p-6 border border-slate-100 space-y-2">
          <p className="text-xs text-slate-500 font-bold">
            {searchQuery ? "No matching hub listings found." : "No hub listings published in this category yet."}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            Be the first to create a listing in Mahurth & Panchang, Bookings, Organizations, Shoping, Training, Banking, or Car Pooling!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hubs.map((item) => {
            const badge = getHubTypeBadge(item.hubType);
            const BadgeIcon = badge.icon;
            const waUrl = formatWhatsAppUrl(
              item.whatsappNumber || item.contactPhone || item.owner?.mobileNumber,
              item.title,
              item.owner?.name
            );

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow select-none space-y-3"
              >
                {/* Header Badge & Owner Info */}
                <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      <img
                        src={item.owner?.avatar || "/avatar.jpg"}
                        alt={item.owner?.name || "Owner"}
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

                  <span
                    className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border flex items-center space-x-1 ${badge.color}`}
                  >
                    <BadgeIcon className="w-3 h-3 shrink-0" />
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Listing Images Carousel / Thumbnail */}
                {item.images && item.images.length > 0 && (
                  <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
                    {item.images.map((imgUrl, i) => (
                      <div
                        key={i}
                        className="w-full max-h-[220px] rounded-2xl overflow-hidden border border-slate-100 shrink-0 select-none"
                      >
                        <img
                          src={imgUrl}
                          alt={item.title}
                          className="w-full h-[220px] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Title & Price Header */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-black text-slate-800 leading-snug">
                      {item.title}
                    </h3>

                    {item.price !== undefined && item.price > 0 && (
                      <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ml-2 flex items-center space-x-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>
                          {item.price} {item.priceUnit ? `/${item.priceUnit}` : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {item.category && (
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100/60 whitespace-pre-wrap">
                  {item.description}
                </p>

                {/* Location Footer */}
                {item.location && (
                  <div className="flex items-center text-[10px] text-slate-500 font-semibold space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                )}

                {/* Action Buttons: WhatsApp Order/Inquiry & Call */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-transform active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer no-underline"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span>WhatsApp Order / Inquiry</span>
                  </a>

                  {(item.contactPhone || item.owner?.mobileNumber) && (
                    <a
                      href={`tel:${item.contactPhone || item.owner?.mobileNumber}`}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs shadow-xs transition-transform active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer no-underline border border-slate-200/60"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Call {item.contactPhone || item.owner?.mobileNumber}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}    </div>
  );
}
