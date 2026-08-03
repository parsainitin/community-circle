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
            className="p-1 hover:bg-slate-100 rounded-full shrink-0 text-slate-400"
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
                {contact.avatar ? (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs border border-slate-100"
                  />
                ) : (
                  <img
                    src={contact.sex === "Female" ? "/avatar_female.jpg" : contact.sex === "Male" ? "/avatar_male.jpg" : "/avatar.jpg"}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs border border-slate-100 bg-slate-50"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="text-[14px] font-bold text-slate-800 truncate">{contact.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {contact.gotra ? `Gotra: ${contact.gotra}` : "No Gotra"} &bull; {contact.mobileNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 select-none">
                {contact.bloodGroup && (
                  <span className="bg-red-50 text-red-600 rounded-full font-bold px-2 py-0.5 text-[9px] tracking-wide border border-red-100">
                    {contact.bloodGroup}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300" />
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
