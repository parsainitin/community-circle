"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CommunityProfile {
  _id?: string;
  name: string;
  subdomain: string;
  logo?: string;
  description?: string;
  upiId?: string;
  gotras?: string[];
  kulDevis?: string[];
  cities?: string[];
}

interface CommunityContextProps {
  community: CommunityProfile | null;
  communityLoading: boolean;
  refreshCommunity: () => Promise<void>;
}

const CommunityContext = createContext<CommunityContextProps | undefined>(undefined);

const COMMUNITY_CACHE_KEY = "cc_community";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CachedCommunity {
  data: CommunityProfile;
  fetchedAt: number;
}

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [community, setCommunity] = useState<CommunityProfile | null>(() => {
    // Hydrate synchronously from localStorage so logo is available immediately
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(COMMUNITY_CACHE_KEY);
      if (!raw) return null;
      const cached: CachedCommunity = JSON.parse(raw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data;
    } catch {
      /* ignore */
    }
    return null;
  });

  const [communityLoading, setCommunityLoading] = useState(true);

  const fetchCommunity = useCallback(async () => {
    try {
      const res = await fetch("/api/community/current");
      if (!res.ok) return;
      const data = await res.json();
      const profile: CommunityProfile | null = data.community || null;
      setCommunity(profile);
      if (profile) {
        // Cache in localStorage (only branding fields — not the big member arrays)
        const toCache: CachedCommunity = {
          data: {
            _id: (profile as any)._id,
            name: profile.name,
            subdomain: profile.subdomain,
            logo: profile.logo,
            description: profile.description,
            upiId: profile.upiId,
          },
          fetchedAt: Date.now(),
        };
        localStorage.setItem(COMMUNITY_CACHE_KEY, JSON.stringify(toCache));
      }
    } catch {
      /* keep previous state */
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  const refreshCommunity = useCallback(async () => {
    localStorage.removeItem(COMMUNITY_CACHE_KEY);
    await fetchCommunity();
  }, [fetchCommunity]);

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  return (
    <CommunityContext.Provider value={{ community, communityLoading, refreshCommunity }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used within a CommunityProvider");
  return ctx;
}
