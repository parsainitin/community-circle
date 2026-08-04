"use client";

import React, { useState, useEffect, useRef } from "react";
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
  hubType: "organization" | "showcase_business" | "tutor_service" | "online_sale";
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
    "all" | "organization" | "showcase_business" | "tutor_service" | "online_sale"
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
    "organization" | "showcase_business" | "tutor_service" | "online_sale"
  >("showcase_business");
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
    type: "organization" | "showcase_business" | "tutor_service" | "online_sale" = "showcase_business"
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
      case "organization":
        return {
          label: "Organization",
          icon: Building2,
          color: "bg-purple-50 text-purple-700 border-purple-200",
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
          Showcase home businesses & food orders, find tutors, connect with organizations, or buy & sell items.
        </p>
      </div>

      {/* Visual Category Hub Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Organizations */}
        <div
          onClick={() => setActiveTab("organization")}
          className={`group rounded-3xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
            activeTab === "organization"
              ? "bg-gradient-to-br from-purple-700 to-indigo-800 text-white border-purple-500 ring-2 ring-purple-400"
              : "bg-gradient-to-br from-purple-50 to-indigo-50/70 hover:from-purple-100 hover:to-indigo-100 text-purple-950 border-purple-200/60"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-2xl ${activeTab === "organization" ? "bg-white/20 text-white" : "bg-purple-600 text-white shadow-xs"}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal("organization");
              }}
              className="text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-2xs active:scale-95 transition-all border-0 cursor-pointer"
            >
              + Create
            </button>
          </div>
          <div className="mt-3">
            <h3 className="text-xs font-black leading-tight">🏛️ Organizations</h3>
            <p className={`text-[10px] font-medium mt-0.5 leading-relaxed ${activeTab === "organization" ? "text-purple-100" : "text-purple-700/80"}`}>
              Clubs, Trusts, Committees & Welfare Groups
            </p>
          </div>
        </div>

        {/* Card 2: Food & Showcase */}
        <div
          onClick={() => setActiveTab("showcase_business")}
          className={`group rounded-3xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
            activeTab === "showcase_business"
              ? "bg-gradient-to-br from-amber-600 to-orange-700 text-white border-amber-500 ring-2 ring-amber-400"
              : "bg-gradient-to-br from-amber-50 to-orange-50/70 hover:from-amber-100 hover:to-orange-100 text-amber-950 border-amber-200/60"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-2xl ${activeTab === "showcase_business" ? "bg-white/20 text-white" : "bg-amber-600 text-white shadow-xs"}`}>
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal("showcase_business");
              }}
              className="text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-2xs active:scale-95 transition-all border-0 cursor-pointer"
            >
              + Create
            </button>
          </div>
          <div className="mt-3">
            <h3 className="text-xs font-black leading-tight">🍳 Food & Showcase</h3>
            <p className={`text-[10px] font-medium mt-0.5 leading-relaxed ${activeTab === "showcase_business" ? "text-amber-100" : "text-amber-700/80"}`}>
              Home Cooking, Catering & Custom Orders
            </p>
          </div>
        </div>

        {/* Card 3: Tutor Services */}
        <div
          onClick={() => setActiveTab("tutor_service")}
          className={`group rounded-3xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
            activeTab === "tutor_service"
              ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-500 ring-2 ring-blue-400"
              : "bg-gradient-to-br from-blue-50 to-indigo-50/70 hover:from-blue-100 hover:to-indigo-100 text-blue-950 border-blue-200/60"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-2xl ${activeTab === "tutor_service" ? "bg-white/20 text-white" : "bg-blue-600 text-white shadow-xs"}`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal("tutor_service");
              }}
              className="text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xs active:scale-95 transition-all border-0 cursor-pointer"
            >
              + Create
            </button>
          </div>
          <div className="mt-3">
            <h3 className="text-xs font-black leading-tight">📚 Tutor Services</h3>
            <p className={`text-[10px] font-medium mt-0.5 leading-relaxed ${activeTab === "tutor_service" ? "text-blue-100" : "text-blue-700/80"}`}>
              Tuition Classes, Coaching & Workshops
            </p>
          </div>
        </div>

        {/* Card 4: Online Sale Marketplace */}
        <div
          onClick={() => setActiveTab("online_sale")}
          className={`group rounded-3xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
            activeTab === "online_sale"
              ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 ring-2 ring-emerald-400"
              : "bg-gradient-to-br from-emerald-50 to-teal-50/70 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 border-emerald-200/60"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-2xl ${activeTab === "online_sale" ? "bg-white/20 text-white" : "bg-emerald-600 text-white shadow-xs"}`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal("online_sale");
              }}
              className="text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95 transition-all border-0 cursor-pointer"
            >
              + Create
            </button>
          </div>
          <div className="mt-3">
            <h3 className="text-xs font-black leading-tight">🛍️ Sale Online Stuffs</h3>
            <p className={`text-[10px] font-medium mt-0.5 leading-relaxed ${activeTab === "online_sale" ? "text-emerald-100" : "text-emerald-700/80"}`}>
              Marketplace, Buy & Sell Pre-owned Items
            </p>
          </div>
        </div>
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
            Be the first to list your organization, food service, tuition class, or products below!
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
                        src={
                          item.owner?.avatar ||
                          "/avatar.jpg"
                        }
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
      )}

      {/* Floating Action Button (FAB) for Creating Hub Listing */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-20 right-5 z-40 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs px-4 py-3 rounded-full shadow-2xl flex items-center space-x-2 border-0 cursor-pointer active:scale-90 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span>Create Hub Listing</span>
      </button>

      {/* ── CREATE HUB LISTING MODAL ─────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-amber-700 font-black text-sm">
                <Plus className="w-5 h-5" />
                <span>Create Hub Listing</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHub} className="space-y-3.5">
              {/* Category Selector Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHubType("showcase_business")}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      hubType === "showcase_business"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] leading-tight">🍳 Food & Showcase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHubType("tutor_service")}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      hubType === "tutor_service"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] leading-tight">📚 Tutor Service</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHubType("online_sale")}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      hubType === "online_sale"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] leading-tight">🛍️ Sale Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHubType("organization")}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      hubType === "organization"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] leading-tight">🏛️ Organization</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    hubType === "showcase_business"
                      ? "e.g. Grandma's Pure Veg Home Catering"
                      : hubType === "tutor_service"
                      ? "e.g. High School Physics & Math Tuitions"
                      : hubType === "online_sale"
                      ? "e.g. iPhone 13 Pro 128GB (Like New)"
                      : "e.g. Jambu Community Youth Welfare Club"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Sub-category & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tag / Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Home Cook, Maths, Electronics"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-amber-500"
                  />
                </div>

                {hubType !== "organization" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Price / Fee (Optional)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full pl-7 pr-2 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {hubType !== "organization" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Price Unit (e.g. per dish, per month, per item)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. per dish / per month / fixed"
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-amber-500"
                  />
                </div>
              )}

              {/* Location & Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    City / Area Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Indore, Vijay Nagar"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    WhatsApp Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9826017177"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Photos Upload */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Upload Product / Showcase Photos
                </label>
                <div className="flex items-center space-x-2 overflow-x-auto py-1">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-amber-500 flex flex-col items-center justify-center cursor-pointer shrink-0"
                  >
                    <ImagePlus className="w-5 h-5 text-slate-400" />
                    <span className="text-[8px] font-bold text-slate-400 mt-1">
                      {uploadingImage ? "Uploading..." : "+ Add"}
                    </span>
                  </button>

                  {uploadedImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded-full cursor-pointer border-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description & Details *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your service, food menu, tutoring subjects, organization goals, or item condition..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 border-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Publishing..." : "Publish Hub Listing"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
