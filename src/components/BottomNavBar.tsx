"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MessageSquare,
  Users,
  LayoutDashboard,
  Calendar,
  Sparkles,
  PlusCircle,
  Megaphone,
  Edit3,
  X,
  ChevronRight,
  Timer,
  LogOut,
} from "lucide-react";

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { isVisitor, visitorSecondsLeft, logout } = useAuth();

  const navItems = [
    {
      label: "Wall",
      href: "/",
      icon: MessageSquare,
      isModalTrigger: false,
    },
    {
      label: "Directory",
      href: "/directory",
      icon: Users,
      isModalTrigger: false,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isModalTrigger: false,
    },
    {
      label: "Event & Post",
      href: "/event-and-post",
      icon: PlusCircle,
      isModalTrigger: true,
    },
    {
      label: "Hubs",
      href: "/events",
      icon: Calendar,
      isModalTrigger: false,
    },
  ];

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Visitor session banner */}
      {isVisitor && (
        <div className="sticky bottom-[64px] z-50 mx-2 mb-0.5 rounded-2xl bg-amber-500 text-white px-3 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Timer className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold">
              Visitor session — <span className={visitorSecondsLeft <= 60 ? "text-red-200 animate-pulse" : ""}>{fmtTime(visitorSecondsLeft)}</span> left
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1 text-[10px] font-bold bg-white/20 hover:bg-white/30 rounded-full px-2.5 py-1 transition-all cursor-pointer border-0"
          >
            <LogOut className="w-3 h-3" />
            <span>Exit</span>
          </button>
        </div>
      )}

      <nav className="sticky bottom-0 z-50 bg-white border-t border-slate-100 shadow-lg px-1 py-2 select-none">
        <div className="flex justify-around items-center w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              !item.isModalTrigger &&
              (item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href));

            if (item.isModalTrigger) {
              return (
                <button
                  key="event-and-post"
                  onClick={() => !isVisitor && setShowModal(true)}
                  className={`flex flex-col items-center justify-center flex-1 py-1 min-w-0 rounded-xl transition-all duration-150 relative cursor-pointer border-0 bg-transparent ${
                    isVisitor ? "opacity-40" : ""
                  }`}
                  title={isVisitor ? "Not available in visitor mode" : undefined}
                >
                  <div className="flex flex-col items-center transition-transform duration-200 active:scale-95">
                    <div className="p-1.5 rounded-full px-3 mb-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium shadow-sm">
                      <Icon className="w-5.5 h-5.5 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] tracking-wide text-amber-700 font-bold">
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 py-1 min-w-0 rounded-xl transition-all duration-150 relative"
              >
                <div
                  className={`flex flex-col items-center transition-transform duration-200 ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-full px-3 mb-1 transition-all duration-200 ${
                      isActive
                        ? "bg-whatsapp-light text-whatsapp-green font-medium"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-5.5 h-5.5 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[11px] tracking-wide transition-all ${
                      isActive
                        ? "text-whatsapp-green font-semibold"
                        : "text-slate-500 font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── EVENT & POST CREATION POPUP MODAL ──────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-base">
                <Sparkles className="w-5 h-5" />
                <span>Create Event & Post</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Select what you would like to share or schedule for your community:
            </p>

            <div className="space-y-3">
              {/* Option 1: Schedule Event */}
              <button
                onClick={() => {
                  setShowModal(false);
                  router.push("/create-event");
                }}
                className="w-full p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 text-left flex items-center justify-between hover:bg-indigo-100 transition cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-indigo-950 group-hover:text-indigo-700">
                      📅 Schedule Event
                    </h4>
                    <p className="text-[10px] text-indigo-800/80 font-medium">
                      Organize events, RSVPs & accept UPI contributions
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 2: Post Announcement */}
              <button
                onClick={() => {
                  setShowModal(false);
                  router.push("/create-announcement");
                }}
                className="w-full p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left flex items-center justify-between hover:bg-amber-100 transition cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950 group-hover:text-amber-700">
                      📢 Post Announcement
                    </h4>
                    <p className="text-[10px] text-amber-800/80 font-medium">
                      Broadcast notices & news to all community members
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 3: Share Post */}
              <button
                onClick={() => {
                  setShowModal(false);
                  router.push("/create-post");
                }}
                className="w-full p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-left flex items-center justify-between hover:bg-blue-100 transition cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-blue-950 group-hover:text-blue-700">
                      ✍️ Share Post
                    </h4>
                    <p className="text-[10px] text-blue-800/80 font-medium">
                      Share stories, photos, and messages on the Wall
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
