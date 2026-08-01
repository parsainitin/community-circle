"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Users, Briefcase, Calendar, Megaphone, LayoutDashboard } from "lucide-react";

export default function BottomNavBar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Wall",
      href: "/",
      icon: MessageSquare,
    },
    {
      label: "Directory",
      href: "/directory",
      icon: Users,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Listing",
      href: "/opportunities",
      icon: Briefcase,
    },
    {
      label: "Events",
      href: "/events",
      icon: Calendar,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-50 bg-white border-t border-slate-100 shadow-lg px-2 py-2 select-none">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Exact match for '/' and startsWith for other routes
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 py-1 px-3 rounded-xl transition-all duration-150 relative"
            >
              {/* Active Background Pill Effect (similar to modern WhatsApp / Android M3) */}
              <div
                className={`flex flex-col items-center transition-transform duration-200 ${
                  isActive ? "scale-105" : "scale-100"
                }`}
              >
                <div
                  className={`p-1.5 rounded-full px-5 mb-1 transition-all duration-200 ${
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
  );
}
