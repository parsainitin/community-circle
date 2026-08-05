"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Search, Heart, X, Phone, Shield, MapPin, User, ChevronRight, UserPlus, Users, Link2, Plus, GraduationCap, Briefcase } from "lucide-react";

interface UserType {
  _id: string;
  name: string;
  phone: string;
  mobileNumber: string;
  gotra?: string;
  kulDevi?: string;
  address?: string;
  city?: string;
  village?: string;
  age?: number;
  sex?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  avatar?: string;
  familyMembers: string[];
  education?: string;
  institution?: string;
  occupationType?: string;
  profession?: string;
  company?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
}

function getWhatsAppUrl(mobileNumber?: string) {
  if (!mobileNumber) return "";
  const digits = mobileNumber.replace(/\D/g, "");
  if (!digits) return "";
  const formatted = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${formatted}`;
}

interface FamilyTreeNode {
  _id: string;
  name: string;
  phone?: string;
  mobileNumber?: string;
  gotra?: string;
  kulDevi?: string;
  children?: FamilyTreeNode[];
}

interface FamilyTreeData {
  user: {
    _id: string;
    name: string;
    phone: string;
    mobileNumber: string;
    gotra?: string;
    kulDevi?: string;
  };
  ancestors: FamilyTreeNode[];
  descendants: FamilyTreeNode[];
}

export default function DirectoryPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string | null>(null);

  const VISIBLE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(VISIBLE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [linkageError, setLinkageError] = useState<string | null>(null);

  // Linkage Direct Create States
  const [linkageTab, setLinkageTab] = useState<"search" | "create">("search");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberMobile, setNewMemberMobile] = useState("");
  const [newMemberSex, setNewMemberSex] = useState("Male");
  const [newMemberMarital, setNewMemberMarital] = useState("Single");
  const [newMemberAge, setNewMemberAge] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset visible count when search or blood filter changes
  useEffect(() => {
    setVisibleCount(VISIBLE_SIZE);
  }, [searchQuery, selectedBloodGroup]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount((c) => c + VISIBLE_SIZE); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoading(false);
    }
  };

  // Open Profile View Modal
  const handleOpenProfile = (user: UserType) => {
    router.push(`/profile/${user._id}`);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "bg-red-100 text-red-700",
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-amber-100 text-amber-700",
      "bg-violet-100 text-violet-700",
      "bg-cyan-100 text-cyan-700",
      "bg-rose-100 text-rose-700",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  // Filter list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.gotra && u.gotra.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBlood = selectedBloodGroup ? u.bloodGroup === selectedBloodGroup : true;

    return matchesSearch && matchesBlood;
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="flex flex-col space-y-4 pb-20 select-none">
      {/* 🚨 BLOOD SOS BANNER */}
      <button
        onClick={() => setSosModalOpen(true)}
        className="w-full flex items-center justify-between bg-red-500 hover:bg-red-600 text-white rounded-2xl p-4 shadow-md transition-all active:scale-[0.99] border-0 outline-hidden group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center shrink-0 animate-pulse">
            <Heart className="w-5.5 h-5.5 fill-current" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-extrabold tracking-wide uppercase">🚨 Blood SOS</h3>
            <p className="text-xs text-white/80 font-medium">Find matching donors in your community</p>
          </div>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-xl text-xs font-extrabold relative z-10">
          FILTER
        </div>
      </button>

      {/* SEARCH BAR */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-100/80 flex items-center space-x-2">
        <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 ml-2" />
        <input
          type="text"
          placeholder="Search contacts by name or Gotra..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-hidden text-sm placeholder-slate-400 text-slate-800"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="p-1 hover:bg-slate-100 rounded-full shrink-0 text-slate-400 border-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ACTIVE SOS FILTER ACCORDION */}
      {selectedBloodGroup && (
        <div className="flex items-center justify-between bg-red-50 text-red-700 px-4 py-2.5 rounded-xl border border-red-100 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <AlertCirclePlaceholder />
            <span>Showing only donors with Blood Group: <span className="font-extrabold underline">{selectedBloodGroup}</span></span>
          </div>
          <button
            onClick={() => setSelectedBloodGroup(null)}
            className="text-red-700 hover:text-red-900 font-extrabold tracking-wide uppercase bg-red-100/50 hover:bg-red-100 px-2 py-0.5 rounded-md"
          >
            Clear
          </button>
        </div>
      )}

      {/* CONTACTS CATALOG */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-100/80 overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm font-medium">
            No contacts found
          </div>
        ) : (
          filteredUsers.slice(0, visibleCount).map((contact) => (
            <div
              key={contact._id}
              onClick={() => handleOpenProfile(contact)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/[0.4] transition-colors"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={
                      contact.avatar ||
                      (contact.sex === "Female"
                        ? "/avatar_female.jpg"
                        : contact.sex === "Male"
                        ? "/avatar_male.jpg"
                        : "/avatar.jpg")
                    }
                    alt={contact.name}
                    className="w-11 h-11 rounded-full object-cover shadow-xs border border-slate-100 bg-slate-50"
                  />
                  {contact.bloodGroup && (
                    <span className="absolute -bottom-1 -right-1 bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded-full text-[8px] tracking-tighter border-2 border-white shadow-xs leading-none">
                      {contact.bloodGroup}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[14px] font-bold text-slate-800 truncate">{contact.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {contact.gotra ? `Gotra: ${contact.gotra}` : "No Gotra"} &bull; {contact.mobileNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 select-none">
                {(contact.googleMapsUrl || (contact.latitude && contact.longitude)) && (
                  <a
                    href={
                      contact.googleMapsUrl ||
                      `https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer"
                    title={`Open ${contact.name}'s location on Google Maps`}
                  >
                    <MapPin className="w-4 h-4 text-white" />
                  </a>
                )}
                {contact.mobileNumber && (
                  <a
                    href={getWhatsAppUrl(contact.mobileNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer"
                    title={`Chat with ${contact.name} on WhatsApp`}
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </a>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 ml-1" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sentinel: load more on scroll */}
      <div ref={sentinelRef} className="flex justify-center py-3">
        {!loading && visibleCount < filteredUsers.length && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-whatsapp-green" />
        )}
        {!loading && visibleCount >= filteredUsers.length && filteredUsers.length > VISIBLE_SIZE && (
          <p className="text-[10px] font-semibold text-slate-400">All {filteredUsers.length} contacts shown</p>
        )}
      </div>

      {/* SOS MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 select-none">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-red-500">
                <Heart className="w-5 h-5 fill-current" />
                <h3 className="font-bold text-slate-800 text-base">Blood Donor Lookup</h3>
              </div>
              <button onClick={() => setSosModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Select a blood group to filter the directory and locate community donors immediately.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {bloodGroups.map((bg) => (
                <button
                  key={bg}
                  onClick={() => {
                    setSelectedBloodGroup(bg);
                    setSosModalOpen(false);
                  }}
                  className="py-2 bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  {bg}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setSelectedBloodGroup(null);
                setSosModalOpen(false);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border-0"
            >
              Show All Contacts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// SVG helper for AlertCircle
function AlertCirclePlaceholder() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  );
}
