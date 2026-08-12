"use client";

import React from "react";
import { useCommunity } from "@/context/CommunityContext";

interface CommunityBrandProps {
  variant?: "topbar" | "auth";
  className?: string;
  imageClassName?: string;
}

export default function CommunityBrand({ variant = "topbar", className, imageClassName }: CommunityBrandProps) {
  const { community } = useCommunity();

  // Use community logo if provided, otherwise fall back to the default logo
  const logoSrc = community?.logo?.trim() ? community.logo : "/logo.png";
  const altText = community?.name ? `${community.name} logo` : "Community Circle logo";

  if (variant === "auth") {
    return (
      <div className={`flex flex-col items-center mb-6 text-center ${className || ""}`}>
        <img
          src={logoSrc}
          alt={altText}
          className={imageClassName || "h-20 w-auto object-contain max-w-[280px] mb-3"}
          onError={(e) => {
            // If community logo fails to load (broken URL), fall back to default
            (e.target as HTMLImageElement).src = "/logo.png";
          }}
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
      onError={(e) => {
        (e.target as HTMLImageElement).src = "/logo.png";
      }}
    />
  );
}
