"use client";

import React, { useEffect, useState } from "react";

interface CommunityProfile {
  name: string;
  subdomain: string;
  logo?: string;
  description?: string;
}

interface CommunityBrandProps {
  variant?: "topbar" | "auth";
  className?: string;
  imageClassName?: string;
}

export default function CommunityBrand({ variant = "topbar", className, imageClassName }: CommunityBrandProps) {
  const [community, setCommunity] = useState<CommunityProfile | null>(null);

  useEffect(() => {
    fetch("/api/community/current")
      .then((res) => res.json())
      .then((data) => setCommunity(data.community))
      .catch(() => setCommunity(null));
  }, []);

  const logoSrc = community?.logo || "/logo.png";
  const altText = community?.name ? `${community.name} logo` : "MySocialClan logo";

  if (variant === "auth") {
    return (
      <div className={`flex flex-col items-center mb-6 text-center ${className || ""}`}>
        <img
          src={logoSrc}
          alt={altText}
          className={imageClassName || "h-20 w-auto object-contain max-w-[280px] mb-3"}
        />
        {community && <h1 className="text-lg font-black text-slate-800">{community.name}</h1>}
        <p className="text-xs text-slate-500 mt-1 max-w-xs font-semibold">
          {community?.description || "Connect · Engage · Belong"}
        </p>
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={altText}
      className={imageClassName || "h-11 w-auto object-contain max-w-[200px]"}
    />
  );
}
