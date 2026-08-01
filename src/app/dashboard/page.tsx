"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  Building2,
  Filter,
  UserCheck,
  ChevronRight,
  TrendingUp,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

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
  occupationType?: string;
  profession?: string;
  company?: string;
}

export default function DashboardPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterCity, setFilterCity] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterSex, setFilterSex] = useState("");
  const [filterMarital, setFilterMarital] = useState("");
  const [filterEmployment, setFilterEmployment] = useState("");

  const [showFilters, setShowFilters] = useState(true);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch users for dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  // Helper calculations
  const totalUsers = users.length;
  
  const uniqueCities = Array.from(
    new Set(users.map((u) => u.city?.trim()).filter(Boolean))
  ) as string[];

  const maleCount = users.filter((u) => u.sex === "Male").length;
  const femaleCount = users.filter((u) => u.sex === "Female").length;

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    // City filter
    if (filterCity && u.city?.toLowerCase() !== filterCity.toLowerCase()) {
      return false;
    }
    // Address filter (substring match)
    if (
      filterAddress &&
      !u.address?.toLowerCase().includes(filterAddress.toLowerCase())
    ) {
      return false;
    }
    // Sex filter
    if (filterSex && u.sex !== filterSex) {
      return false;
    }
    // Marital Status filter
    if (filterMarital && u.maritalStatus !== filterMarital) {
      return false;
    }
    // Employment filter
    if (filterEmployment) {
      const isEmployee = u.occupationType === "Salaried" || u.occupationType === "Self-Employed";
      if (filterEmployment === "Employee" && !isEmployee) {
        return false;
      }
      if (filterEmployment === "Unemployee" && isEmployee) {
        return false;
      }
    }
    return true;
  });

  // Avatar colors
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "bg-emerald-100 text-emerald-700",
      "bg-whatsapp-green bg-opacity-10 text-whatsapp-green",
      "bg-teal-100 text-teal-700",
      "bg-indigo-100 text-indigo-700",
      "bg-cyan-100 text-cyan-700",
      "bg-rose-100 text-rose-700",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("");
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100">
        <h2 className="text-base font-extrabold text-slate-800">Platform Dashboard</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
          Jambu Community Circle Insights
        </p>
      </div>

      {/* Collapsible Stats/Data Cards Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full flex justify-between items-center p-4 bg-transparent border-0 cursor-pointer text-left"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span>Platform Statistics</span>
          </div>
          {showStats ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {showStats && (
          <div className="p-4 pt-0 border-t border-slate-50/50 animate-fade-in">
            <div className="grid grid-cols-3 gap-2.5">
              {/* Card 1: Total Members */}
              <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/60 rounded-2xl p-3 border border-emerald-200/60 hover:border-emerald-400/70 shadow-2xs hover:shadow-emerald-200/60 hover:shadow-md flex flex-col justify-between transition-all duration-250 ease-out hover:scale-[1.04] hover:-translate-y-0.5 cursor-default">
                <div className="flex justify-between items-start">
                  <div className="p-1 bg-emerald-500/10 group-hover:bg-emerald-500/20 rounded-lg text-emerald-600 group-hover:text-emerald-700 transition-colors duration-200">
                    <Users className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-500/15 group-hover:bg-emerald-500/25 px-1.5 py-0.5 rounded-full uppercase tracking-wider transition-colors duration-200">
                    Members
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-base font-black text-emerald-950 leading-none group-hover:text-emerald-800 transition-colors duration-200">{totalUsers}</span>
                  <p className="text-[9px] font-bold text-emerald-600 group-hover:text-emerald-700 mt-1 uppercase tracking-wide transition-colors duration-200">Total Users</p>
                </div>
              </div>

              {/* Card 2: Cities Covered */}
              <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-200/60 rounded-2xl p-3 border border-indigo-200/60 hover:border-indigo-400/70 shadow-2xs hover:shadow-indigo-200/60 hover:shadow-md flex flex-col justify-between transition-all duration-250 ease-out hover:scale-[1.04] hover:-translate-y-0.5 cursor-default">
                <div className="flex justify-between items-start">
                  <div className="p-1 bg-indigo-500/10 group-hover:bg-indigo-500/20 rounded-lg text-indigo-600 group-hover:text-indigo-700 transition-colors duration-200">
                    <MapPin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-500/15 group-hover:bg-indigo-500/25 px-1.5 py-0.5 rounded-full uppercase tracking-wider transition-colors duration-200">
                    Locations
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-base font-black text-indigo-950 leading-none group-hover:text-indigo-800 transition-colors duration-200">{uniqueCities.length}</span>
                  <p className="text-[9px] font-bold text-indigo-600 group-hover:text-indigo-700 mt-1 uppercase tracking-wide transition-colors duration-200">Cities</p>
                </div>
              </div>

              {/* Card 3: Gender Ratio */}
              <div className="group bg-gradient-to-br from-pink-50 to-rose-100/40 hover:from-pink-100 hover:to-rose-200/50 rounded-2xl p-3 border border-pink-200/50 hover:border-pink-400/70 shadow-2xs hover:shadow-pink-200/60 hover:shadow-md flex flex-col justify-between transition-all duration-250 ease-out hover:scale-[1.04] hover:-translate-y-0.5 cursor-default">
                <div className="flex justify-between items-start">
                  <div className="p-1 bg-pink-500/10 group-hover:bg-pink-500/20 rounded-lg text-pink-600 group-hover:text-pink-700 transition-colors duration-200">
                    <Users className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <span className="text-[9px] font-bold text-pink-700 bg-pink-500/15 group-hover:bg-pink-500/25 px-1.5 py-0.5 rounded-full uppercase tracking-wider transition-colors duration-200">
                    Genders
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline space-x-0.5 text-pink-950 group-hover:text-pink-800 leading-none transition-colors duration-200">
                    <span className="text-sm font-black">{maleCount}</span>
                    <span className="text-[9px] font-bold text-pink-400">M</span>
                    <span className="text-[9px] font-bold text-pink-300 mx-0.5">/</span>
                    <span className="text-sm font-black">{femaleCount}</span>
                    <span className="text-[9px] font-bold text-pink-400">F</span>
                  </div>
                  <p className="text-[9px] font-bold text-pink-600 group-hover:text-pink-700 mt-1 uppercase tracking-wide transition-colors duration-200">Male / Female</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Filter Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex justify-between items-center p-4 bg-transparent border-0 cursor-pointer text-left"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Search & Filter Parameters</span>
          </div>
          {showFilters ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {showFilters && (
          <div className="p-4 pt-0 border-t border-slate-50/50 space-y-3.5 animate-fade-in">

          <div className="grid grid-cols-2 gap-3">
            {/* City Dropdown */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Filter City
              </label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-850 font-semibold focus:border-whatsapp-green outline-hidden"
              >
                <option value="">All Cities</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Address Search */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Filter Address
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Street / Colony..."
                  value={filterAddress}
                  onChange={(e) => setFilterAddress(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:border-whatsapp-green outline-hidden text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Sex Selection */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Sex
              </label>
              <select
                value={filterSex}
                onChange={(e) => setFilterSex(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-850 font-semibold focus:border-whatsapp-green outline-hidden"
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Marital Selection */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Marital Status
              </label>
              <select
                value={filterMarital}
                onChange={(e) => setFilterMarital(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-850 font-semibold focus:border-whatsapp-green outline-hidden"
              >
                <option value="">All</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </div>

            {/* Employment Status */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Employment
              </label>
              <select
                value={filterEmployment}
                onChange={(e) => setFilterEmployment(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-850 font-semibold focus:border-whatsapp-green outline-hidden"
              >
                <option value="">All</option>
                <option value="Employee">Employee</option>
                <option value="Unemployee">Unemployed</option>
              </select>
            </div>
          </div>

          {/* Reset button if any filter is active */}
          {(filterCity || filterAddress || filterSex || filterMarital || filterEmployment) && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  setFilterCity("");
                  setFilterAddress("");
                  setFilterSex("");
                  setFilterMarital("");
                  setFilterEmployment("");
                }}
                className="text-[9px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer bg-transparent border-0"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Main Members Grid */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">
            Matching Members ({filteredUsers.length})
          </span>
          <span className="text-[9px] text-slate-400 font-semibold">
            Click user card to view profile
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 border-2 border-whatsapp-green border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-semibold">Loading Member Directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">No matching members found</p>
            <p className="text-[10px] text-slate-400 mt-1">Try resetting or softening your filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((member) => (
              <div
                key={member._id}
                onClick={() => router.push(`/profile/${member._id}`)}
                className="bg-white hover:bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex items-start space-x-3.5 cursor-pointer active:scale-[0.99] group"
              >
                {/* Avatar */}
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-11 h-11 rounded-full object-cover shadow-2xs border border-slate-150 shrink-0"
                  />
                ) : (
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-2xs shrink-0 ${getAvatarColor(
                      member.name
                    )}`}
                  >
                    {getInitials(member.name)}
                  </div>
                )}

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-whatsapp-green transition-colors">
                      {member.name}
                    </h4>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>

                  <div className="flex flex-wrap items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider py-0.5">
                    {member.sex && (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded-md inline-flex items-center mr-1.5 mb-1">
                        {member.sex}
                      </span>
                    )}
                    {member.age && (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded-md inline-flex items-center mr-1.5 mb-1">
                        {member.age} Yrs
                      </span>
                    )}
                    {member.maritalStatus && (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded-md inline-flex items-center mr-1.5 mb-1">
                        {member.maritalStatus}
                      </span>
                    )}
                    {member.bloodGroup && (
                      <span className="bg-red-50 text-red-600 border border-red-100/50 px-1.5 py-0.5 rounded-md inline-flex items-center font-black mr-1.5 mb-1">
                        {member.bloodGroup}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-600 space-y-1 pt-1.5 border-t border-slate-50">
                    {/* Gotra / Kuldevi */}
                    {(member.gotra || member.kulDevi) && (
                      <p className="truncate">
                        🧬 <strong className="text-slate-700">Gotra:</strong> {member.gotra || "N/A"} |{" "}
                        <strong className="text-slate-700">KulDevi:</strong> {member.kulDevi || "N/A"}
                      </p>
                    )}

                    {/* Address & City */}
                    {(member.address || member.city) && (
                      <p className="truncate">
                        📍 <strong className="text-slate-700">Addr:</strong>{" "}
                        {member.address ? `${member.address}` : ""}
                        {member.city || member.village ? ` (${[member.city, member.village].filter(Boolean).join(", ")})` : ""}
                      </p>
                    )}

                    {/* Profession & Company */}
                    {(member.profession || member.company || member.occupationType) && (
                      <p className="truncate">
                        💼 <strong className="text-slate-700">Job:</strong>{" "}
                        {member.occupationType === "Salaried" || member.occupationType === "Self-Employed" ? (
                          <>
                            {member.profession || "Business"} at {member.company || "Self-Employed"}
                          </>
                        ) : (
                          member.occupationType || "Homemaker/Unemployed"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
