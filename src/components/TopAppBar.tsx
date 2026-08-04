"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Phone, ShieldAlert, Camera, Heart, UserCheck } from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";
import CommunityBrand from "@/components/CommunityBrand";

export default function TopAppBar() {
  const { user, logout, updateUser } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "super-admin")) {
      fetch(`/api/community/members?status=pending`, {
        headers: { "x-caller-mobile": user.mobileNumber },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.pendingCount !== undefined) setPendingCount(d.pendingCount);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleEditAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUpdating(true);
    try {
      const compressed = await compressImage(file);
      if (!checkFileSize(compressed, 5)) {
        alert("Selected file exceeds the maximum allowed size of 5MB");
        setUpdating(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", compressed);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        alert(uploadData.error || "Failed to upload avatar");
        setUpdating(false);
        return;
      }

      // Update user document
      const updateRes = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: uploadData.url }),
      });

      if (updateRes.ok) {
        updateUser({ avatar: uploadData.url });
      } else {
        alert("Failed to save avatar details to profile");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update profile picture");
    } finally {
      setUpdating(false);
    }
  };
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-3 shadow-xs border-b border-slate-100 select-none">
      <div className="flex items-center">
        <CommunityBrand />
      </div>
      <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
        {/* Support Platform donation link */}
        <Link
          href="/donate"
          className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors active:scale-95 duration-100 flex items-center justify-center border border-red-100 bg-red-50/50"
          aria-label="Support Us / Donate"
        >
          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
        </Link>

        {/* User profile picture trigger */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="relative w-9 h-9 overflow-hidden rounded-full border border-slate-100 active:scale-95 duration-100 cursor-pointer shadow-xs focus:outline-hidden"
          aria-label="User Menu"
        >
          <img
            src={user?.avatar || (user?.sex === "Female" ? "/avatar_female.jpg" : user?.sex === "Male" ? "/avatar_male.jpg" : "/avatar.jpg")}
            alt="User Profile"
            className="w-full h-full object-cover"
          />
          {pendingCount > 0 && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
          {updating && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 transition-all transform origin-top-right">
            {/* Header info */}
            <div className="flex flex-col items-center pb-3 border-b border-slate-100 space-y-2">
              <div className="relative group cursor-pointer w-14 h-14 rounded-full overflow-hidden border border-slate-200 shadow-xs">
                <img
                  src={user?.avatar || (user?.sex === "Female" ? "/avatar_female.jpg" : user?.sex === "Male" ? "/avatar_male.jpg" : "/avatar.jpg")}
                  alt="User Avatar Preview"
                  className="w-full h-full object-cover"
                />
                <div
                  onClick={() => document.getElementById("avatar-edit-dropdown")?.click()}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <input
                  id="avatar-edit-dropdown"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEditAvatar}
                />
              </div>

              <div className="text-center w-full">
                <div className="flex items-center justify-center space-x-1.5">
                  <User className="w-4 h-4 text-whatsapp-green shrink-0" />
                  <span className="text-sm font-bold text-slate-800 truncate max-w-[150px]">
                    {user?.name || "Guest User"}
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500 truncate max-w-[150px]">
                    {user?.mobileNumber || "N/A"}
                  </span>
                </div>
                {user?.gotra && (
                  <div className="flex items-center justify-center space-x-1.5 mt-0.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500 truncate max-w-[150px]">
                      Gotra: {user.gotra}
                    </span>
                  </div>
                )}
                {user?.kulDevi && (
                  <div className="flex items-center justify-center space-x-1.5 mt-0.5">
                    <Heart className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500 truncate max-w-[150px]">
                      KulDevi: {user.kulDevi}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-1">
              {(user?.role === "admin" || user?.role === "super-admin") && (
                <Link
                  href={user.role === "super-admin" ? "/admin" : "/community-admin"}
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-whatsapp-green hover:bg-emerald-50 rounded-xl transition-colors font-bold"
                >
                  <div className="flex items-center space-x-2.5">
                    <UserCheck className="w-4 h-4 text-whatsapp-green" />
                    <span>{user.role === "super-admin" ? "Super Admin Portal" : "Member Approvals"}</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
