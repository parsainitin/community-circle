"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import TopAppBar from "./TopAppBar";
import BottomNavBar from "./BottomNavBar";
import { MessageSquare } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 w-full max-w-md mx-auto border-x border-slate-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-whatsapp-green text-white rounded-full flex items-center justify-center shadow-md animate-pulse">
            <MessageSquare className="w-9 h-9 fill-current" />
          </div>
          <div className="text-whatsapp-green font-semibold tracking-wide text-sm">
            Loading Jambu Community Circle...
          </div>
        </div>
      </div>
    );
  }

  const isAuthPage = pathname === "/auth";

  // If not logged in and not on auth page, the AuthProvider will redirect.
  // We render nothing in the transition period.
  if (!user && !isAuthPage) {
    return null;
  }

  // Auth pages should not show the TopAppBar or BottomNavBar
  if (isAuthPage) {
    return (
      <div className="w-full max-w-md bg-slate-50 flex flex-col min-h-screen shadow-xl relative border-x border-slate-200">
        <main className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-slate-50">
          {children}
        </main>
      </div>
    );
  }

  // Normal pages with TopAppBar and BottomNavBar
  return (
    <div className="w-full max-w-md bg-whatsapp-bg flex flex-col min-h-screen shadow-xl relative border-x border-slate-200">
      <TopAppBar />
      <main className="flex-1 overflow-y-auto bg-[#efeae2] relative pb-2 bg-[radial-gradient(#FBEAEB_1px,transparent_1px)] [background-size:16px_16px] [background-opacity:0.2]">
        <div className="p-4 min-h-full">
          {children}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}
