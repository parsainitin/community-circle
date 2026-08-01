"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnnouncementsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/events");
  }, [router]);

  return (
    <div className="py-16 flex flex-col justify-center items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
      <p className="text-xs text-slate-400 font-semibold">Redirecting to Events & Announcements...</p>
    </div>
  );
}
