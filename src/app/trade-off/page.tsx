"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Plus,
  ArrowLeftRight,
  Package,
  Wrench,
  Car,
  Share2,
  Calendar,
  MapPin,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  Layers,
  Sparkles,
  Tag,
} from "lucide-react";

interface TradeOffItem {
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
  tradeType: "offer" | "request";
  category: "goods" | "services" | "vehicles" | "crowd_sharing";
  title: string;
  description: string;
  itemCondition?: string;
  pricingModel?: string;
  availableDate?: string;
  location?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
}

export default function TradeOffPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<TradeOffItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState<
    "all" | "goods" | "services" | "vehicles" | "crowd_sharing"
  >("all");
  const [tradeTypeFilter, setTradeTypeFilter] = useState<"all" | "offer" | "request">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Collapsible States
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});

  const toggleItemCollapse = (id: string) => {
    setCollapsedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.append("category", activeCategory);
      if (tradeTypeFilter !== "all") params.append("tradeType", tradeTypeFilter);
      if (searchQuery.trim()) params.append("query", searchQuery.trim());

      const res = await fetch(`/api/trade-off?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch trade-off listings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeCategory, tradeTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      const res = await fetch(`/api/trade-off/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("🗑️ Listing deleted");
        setItems((prev) => prev.filter((i) => i._id !== id));
      } else {
        alert("Failed to delete listing");
      }
    } catch (err) {
      console.error("Error deleting listing", err);
    }
  };

  const formatWhatsAppUrl = (
    waNumber?: string,
    itemTitle?: string,
    tradeType?: string,
    ownerName?: string
  ) => {
    if (!waNumber) return "#";
    const digits = waNumber.replace(/\D/g, "");
    if (!digits) return "#";
    const formatted = digits.length === 10 ? `91${digits}` : digits;
    const action = tradeType === "offer" ? "borrowing / accepting offer for" : "offering help with";
    const msg = encodeURIComponent(
      `Namaste ${ownerName || ""}! I saw your Trade-Off post for "${itemTitle || "listing"}" on Community Circle and would like to connect for ${action}.`
    );
    return `https://wa.me/${formatted}?text=${msg}`;
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "services":
        return <Wrench className="w-3.5 h-3.5 shrink-0 text-indigo-600" />;
      case "vehicles":
        return <Car className="w-3.5 h-3.5 shrink-0 text-indigo-600" />;
      case "crowd_sharing":
        return <Share2 className="w-3.5 h-3.5 shrink-0 text-indigo-600" />;
      default:
        return <Package className="w-3.5 h-3.5 shrink-0 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-4 pb-24 relative select-none max-w-2xl mx-auto px-1 sm:px-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & CTA Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/events"
            className="flex items-center justify-center p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-1.5">
              <ArrowLeftRight className="w-4 h-4 text-purple-600" />
              <span>Trade-Off & Borrowing</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Lend, borrow, share vehicles & crowd resources
            </p>
          </div>
        </div>

        <Link
          href="/trade-off/create"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-2xl shadow-xs flex items-center space-x-1.5 no-underline shrink-0 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Post Trade-Off</span>
          <span className="sm:hidden">Post</span>
        </Link>
      </div>

      {/* 4-Column Equal Grid Filter Tabs (No Scrollbar) */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveCategory("all")}
          className={`py-2 rounded-xl text-[11px] font-black border-0 cursor-pointer flex items-center justify-center space-x-1 transition-all ${
            activeCategory === "all"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">All</span>
        </button>

        <button
          onClick={() => setActiveCategory("goods")}
          className={`py-2 rounded-xl text-[11px] font-black border-0 cursor-pointer flex items-center justify-center space-x-1 transition-all ${
            activeCategory === "goods"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Package className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Goods</span>
        </button>

        <button
          onClick={() => setActiveCategory("services")}
          className={`py-2 rounded-xl text-[11px] font-black border-0 cursor-pointer flex items-center justify-center space-x-1 transition-all ${
            activeCategory === "services"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Services</span>
        </button>

        <button
          onClick={() => setActiveCategory("crowd_sharing")}
          className={`py-2 rounded-xl text-[11px] font-black border-0 cursor-pointer flex items-center justify-center space-x-1 transition-all ${
            activeCategory === "crowd_sharing"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Crowd</span>
        </button>
      </div>

      {/* Trade Type Filter Pills */}
      <div className="flex items-center space-x-2 px-1">
        <button
          onClick={() => setTradeTypeFilter("all")}
          className={`text-[10px] font-extrabold px-3 py-1 rounded-xl border cursor-pointer ${
            tradeTypeFilter === "all"
              ? "bg-purple-100 text-purple-800 border-purple-300"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Types
        </button>
        <button
          onClick={() => setTradeTypeFilter("offer")}
          className={`text-[10px] font-extrabold px-3 py-1 rounded-xl border cursor-pointer ${
            tradeTypeFilter === "offer"
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          🤝 Offering to Lend / Share
        </button>
        <button
          onClick={() => setTradeTypeFilter("request")}
          className={`text-[10px] font-extrabold px-3 py-1 rounded-xl border cursor-pointer ${
            tradeTypeFilter === "request"
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          🙋 Seeking / Need to Borrow
        </button>
      </div>

      {/* Single-Column Collapsible Search Card */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-3">
        <div
          onClick={() => setFilterCollapsed((prev) => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <h4 className="text-xs font-extrabold text-slate-700 flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Filter Trade-Off Items</span>
            {searchQuery && <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />}
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
          <form onSubmit={handleSearchSubmit} className="space-y-3 pt-1 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Search Keyword</label>
              <input
                type="text"
                placeholder="Item name, drill machine, tools, scooter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:border-purple-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="text-[10px] font-extrabold text-white bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-xl border-0 cursor-pointer"
              >
                Apply Filter
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchItems();
                  }}
                  className="text-[10px] font-extrabold text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border-0 cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Trade-Off Listings Feed */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-bold animate-pulse">
          Loading community trade-off posts...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 space-y-3">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Trade-Off Listings Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Be the first member to offer or request tools, goods, services, or crowd sharing!
          </p>
          <Link
            href="/trade-off/create"
            className="inline-block bg-purple-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xs no-underline"
          >
            + Post Trade-Off Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isOwner = user?._id === item.owner?._id;
            const isCollapsed = collapsedItems[item._id] ?? false;
            const waUrl = formatWhatsAppUrl(
              item.whatsappNumber || item.contactPhone || item.owner?.mobileNumber,
              item.title,
              item.tradeType,
              item.owner?.name
            );

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow select-none space-y-3"
              >
                {/* Card Header: Owner Info & Category Badge */}
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
                      onClick={() => toggleItemCollapse(item._id)}
                      className="flex items-center space-x-1 text-[10px] font-extrabold text-purple-700 hover:text-purple-900 bg-purple-50 px-2 py-1 rounded-xl border border-purple-100 cursor-pointer"
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
                        item.tradeType === "offer"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span>{item.tradeType === "offer" ? "🤝 Offer" : "🙋 Need"}</span>
                    </span>

                    {isOwner && (
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg border-0 bg-transparent cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Category Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-black text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg shrink-0 flex items-center space-x-1 capitalize">
                    {getCategoryIcon(item.category)}
                    <span>{item.category.replace("_", " ")}</span>
                  </span>
                </div>

                {/* Key Attributes: Pricing / Condition / Date */}
                <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600">
                  {item.pricingModel && (
                    <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-0.5 rounded-xl font-bold flex items-center space-x-1">
                      <Tag className="w-3 h-3 shrink-0" />
                      <span>{item.pricingModel}</span>
                    </span>
                  )}

                  {item.itemCondition && (
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-xl">
                      Condition: {item.itemCondition}
                    </span>
                  )}

                  {item.availableDate && (
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-xl flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>Avail: {item.availableDate}</span>
                    </span>
                  )}
                </div>

                {/* Collapsible Details Body */}
                {!isCollapsed && (
                  <div className="space-y-2.5 pt-1 border-t border-slate-100">
                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                      {item.description}
                    </p>

                    {item.location && (
                      <div className="text-[11px] text-slate-600 font-semibold flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Location: {item.location}</span>
                      </div>
                    )}

                    {/* WhatsApp & Call Actions */}
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
                        <span>WhatsApp Connect</span>
                      </a>

                      {(item.contactPhone || item.owner?.mobileNumber) && (
                        <a
                          href={`tel:${item.contactPhone || item.owner?.mobileNumber}`}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs shadow-xs active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer no-underline border border-slate-200/60"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Call Member</span>
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
