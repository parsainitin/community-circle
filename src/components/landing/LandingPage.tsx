"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  ShieldCheck,
  Users,
  Sparkles,
  CheckCircle2,
  Plus,
  ChevronRight,
  ChevronLeft,
  ImagePlus,
  Building2,
  Calendar,
  ShoppingBag,
  Heart,
  Landmark,
  Megaphone,
  Lock,
  ArrowRight,
  ExternalLink,
  Check,
  AlertCircle,
  X,
  Smartphone,
  Star,
} from "lucide-react";

interface CommunityPublic {
  _id: string;
  name: string;
  subdomain: string;
  description?: string;
  logo?: string;
  cities?: string[];
  createdAt: string;
}

export default function LandingPage() {
  const [communities, setCommunities] = useState<CommunityPublic[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  // Modal & Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Subdomain
  const [subdomain, setSubdomain] = useState("");
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  // Step 2: Community Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cities, setCities] = useState("Ahmedabad, Rajkot, Surat, Vadodara, Mumbai, Pune");
  const [gotras, setGotras] = useState("Kashyap, Vashishtha, Bharadwaj, Garg, Gautam");
  const [kulDevis, setKulDevis] = useState("Ashapura Mata, Meldi Mata, Amba Mata, Harsiddhi Mata");
  const [upiId, setUpiId] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Admin Account
  const [adminName, setAdminName] = useState("");
  const [adminMobile, setAdminMobile] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Step 4: Modules Configuration
  const [modules, setModules] = useState({
    directory: true,
    marketplace: true,
    panchang: true,
    booking: true,
    events: true,
    donations: true,
  });

  // Step 5: Submission & Result
  const [submitting, setSubmitting] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [createdCommunityUrl, setCreatedCommunityUrl] = useState<string | null>(null);
  const [createdCommunityName, setCreatedCommunityName] = useState<string | null>(null);

  // Load public communities for live showcase
  useEffect(() => {
    fetch("/api/communities/public")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCommunities(data);
      })
      .catch(() => {})
      .finally(() => setLoadingCommunities(false));
  }, []);

  // Debounced subdomain availability check
  useEffect(() => {
    if (step !== 1) return;
    const clean = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!clean) {
      setSubdomainAvailable(null);
      setSubdomainError(null);
      return;
    }

    setCheckingSubdomain(true);
    setSubdomainError(null);

    const timer = setTimeout(() => {
      fetch(`/api/communities/check-subdomain?subdomain=${clean}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.available) {
            setSubdomainAvailable(true);
            setSubdomainError(null);
          } else {
            setSubdomainAvailable(false);
            setSubdomainError(data.error || "Subdomain is unavailable");
          }
        })
        .catch(() => {
          setSubdomainAvailable(false);
          setSubdomainError("Network error checking availability");
        })
        .finally(() => setCheckingSubdomain(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomain, step]);

  const handleLogoUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo image must be under 5MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRegisterCommunity = async () => {
    setSubmitting(true);
    setCreationError(null);

    try {
      let logoUrl: string | undefined = undefined;

      // Upload logo if selected
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload logo image");
        }
        logoUrl = uploadData.url;
      }

      // Register community API call
      const res = await fetch("/api/communities/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subdomain: subdomain.trim().toLowerCase(),
          description,
          logo: logoUrl,
          cities: cities.split(",").map((s) => s.trim()).filter(Boolean),
          gotras: gotras.split(",").map((s) => s.trim()).filter(Boolean),
          kulDevis: kulDevis.split(",").map((s) => s.trim()).filter(Boolean),
          upiId: upiId.trim(),
          modules,
          adminName,
          adminMobile,
          adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Community registration failed");
      }

      const domainHost = window.location.host;
      const isLocalhost = domainHost.includes("localhost");
      const targetUrl = isLocalhost
        ? `http://${data.community.subdomain}.localhost:3000`
        : `https://${data.community.subdomain}.mysocialclan.com`;

      setCreatedCommunityUrl(targetUrl);
      setCreatedCommunityName(data.community.name);
      setStep(5);
    } catch (err: any) {
      setCreationError(err.message || "An error occurred creating community");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowWizard(false);
    setStep(1);
    setSubdomain("");
    setName("");
    setDescription("");
    setLogoFile(null);
    setLogoPreview(null);
    setAdminName("");
    setAdminMobile("");
    setAdminPassword("");
    setCreationError(null);
  };

  const moduleItems = [
    {
      key: "directory" as const,
      title: "Private Directory & Verification",
      desc: "Verified member profiles with family relationships, Gotra, KulDevi & occupation filters.",
      icon: Users,
    },
    {
      key: "marketplace" as const,
      title: "Marketplace & Business Hub",
      desc: "Community member listings, business directory, and job opportunity postings.",
      icon: ShoppingBag,
    },
    {
      key: "panchang" as const,
      title: "Mahurth & Panchang Calendar",
      desc: "Daily tithi, auspicious mahurths, choghadiya, and festival calendars.",
      icon: Calendar,
    },
    {
      key: "booking" as const,
      title: "Venue & Property Bookings",
      desc: "Community hall, room, and event space reservation portal with instant approval.",
      icon: Landmark,
    },
    {
      key: "events" as const,
      title: "Announcements & Event Hubs",
      desc: "Broadcast official updates, manage event RSVPs, and share member posts.",
      icon: Megaphone,
    },
    {
      key: "donations" as const,
      title: "Direct Member UPI Donations",
      desc: "Collect community contributions directly via UPI with zero gateway transaction fees.",
      icon: Heart,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                MySocialClan
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                SaaS Platform
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="/admin"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-2"
            >
              Super Admin Portal
            </a>
            <button
              onClick={() => {
                setShowWizard(true);
                setStep(1);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 border-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Clan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Closed Social Network Platform for Communities & Institutions</span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Launch Your Private Community Network in{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Minutes
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            MySocialClan provides high-trust private social networks for clans, communities, alumni, and institutions — with verified member directories, events, bookings, and mahurth calendars under your own custom subdomain.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setShowWizard(true);
                setStep(1);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer border-0 active:scale-95"
            >
              <span>Build Community Subdomain</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <a
              href="#showcase"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-sm transition-all text-decoration-none flex items-center justify-center space-x-2"
            >
              <span>Explore Live Communities</span>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Modules Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-900">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Powerful Modules Included</h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Configure exactly which features your community needs from your admin control panel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {moduleItems.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.key}
                className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 hover:border-emerald-500/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{m.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Communities Gallery Showcase */}
      <section id="showcase" className="max-w-6xl mx-auto px-4 py-16 border-t border-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center space-x-1 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Multi-Tenant Network</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Active Communities</h2>
          </div>
          <button
            onClick={() => {
              setShowWizard(true);
              setStep(1);
            }}
            className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer bg-transparent border-0"
          >
            <span>Launch your community</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loadingCommunities ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : communities.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto">
            <Globe className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Public Communities Registered Yet</h3>
            <p className="text-xs text-slate-400 mb-4">Be the first clan to register your custom subdomain on MySocialClan!</p>
            <button
              onClick={() => {
                setShowWizard(true);
                setStep(1);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs border-0 cursor-pointer"
            >
              Create Community
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {communities.map((c) => {
              const originHost = typeof window !== "undefined" ? window.location.host : "mysocialclan.com";
              const isLocalhost = originHost.includes("localhost");
              const fullDomain = isLocalhost
                ? `${c.subdomain}.localhost:3000`
                : `${c.subdomain}.mysocialclan.com`;
              const fullUrl = isLocalhost ? `http://${fullDomain}` : `https://${fullDomain}`;

              return (
                <div
                  key={c._id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-3.5 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
                        {c.logo ? (
                          <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-white">{c.name}</h3>
                        <p className="text-[11px] font-mono text-emerald-400 font-semibold">{fullDomain}</p>
                      </div>
                    </div>

                    {c.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{c.description}</p>
                    )}
                  </div>

                  <a
                    href={fullUrl}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 text-decoration-none"
                  >
                    <span>Visit Clan Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 MySocialClan Platform · Closed Community Infrastructure</p>
      </footer>

      {/* --- CREATE COMMUNITY MODAL WIZARD --- */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                  Step {step} of 4 · Community Setup
                </span>
                <h2 className="text-base font-black text-white mt-0.5">Create Your Community Domain</h2>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-slate-800 h-1">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            <div className="p-6 space-y-5">
              {/* STEP 1: SUBDOMAIN SELECTION */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white mb-1">Choose Community Subdomain</h3>
                    <p className="text-xs text-slate-400">
                      Your community members will access your portal via this custom domain address.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Subdomain Address *
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. jain, jbs, sharma"
                        value={subdomain}
                        onChange={(e) =>
                          setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                        }
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-mono text-white placeholder-slate-600 outline-none focus:border-emerald-500 transition-all pr-40"
                      />
                      <span className="absolute right-4 text-xs font-semibold text-slate-500 pointer-events-none">
                        .mysocialclan.com
                      </span>
                    </div>

                    {/* Status feedback */}
                    <div className="mt-2.5 min-h-[20px]">
                      {checkingSubdomain && (
                        <p className="text-xs text-slate-400 flex items-center space-x-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Checking availability...</span>
                        </p>
                      )}
                      {!checkingSubdomain && subdomainAvailable === true && (
                        <p className="text-xs text-emerald-400 font-semibold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Subdomain <strong>{subdomain}.mysocialclan.com</strong> is available!</span>
                        </p>
                      )}
                      {!checkingSubdomain && subdomainAvailable === false && (
                        <p className="text-xs text-red-400 font-semibold flex items-center space-x-1.5">
                          <AlertCircle className="w-4 h-4" />
                          <span>{subdomainError || "Subdomain is unavailable"}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={!subdomainAvailable || checkingSubdomain}
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-2xl font-bold text-xs shadow-lg shadow-emerald-500/20 border-0 cursor-pointer transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Next: Community Details</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              )}

              {/* STEP 2: COMMUNITY BASIC INFO */}
              {step === 2 && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div>
                    <h3 className="text-sm font-extrabold text-white mb-1">Community Information</h3>
                    <p className="text-xs text-slate-400">
                      Configure public branding and profile dropdown fields for <strong>{subdomain}.mysocialclan.com</strong>.
                    </p>
                  </div>

                  {/* Logo Picker */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Community Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 hover:border-emerald-500 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shrink-0"
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImagePlus className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                      <div className="text-xs text-slate-400">
                        {logoPreview ? (
                          <span className="text-emerald-400 font-semibold">Logo uploaded! Tap box to change.</span>
                        ) : (
                          <span>Square image (PNG, JPG, WebP · max 5MB)</span>
                        )}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleLogoUpload(f);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Community Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jain Community Circle"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Short tagline or purpose of this clan"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-600 outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Predefined Cities (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={cities}
                      onChange={(e) => setCities(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Gotras Dropdown Options
                    </label>
                    <input
                      type="text"
                      value={gotras}
                      onChange={(e) => setGotras(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      KulDevis Dropdown Options
                    </label>
                    <input
                      type="text"
                      value={kulDevis}
                      onChange={(e) => setKulDevis(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      UPI ID for Donations (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. community@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="py-3 px-4 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs border-0 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      disabled={!name.trim()}
                      onClick={() => setStep(3)}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-xl font-bold text-xs border-0 cursor-pointer"
                    >
                      Next: Admin Credentials
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ADMIN CREDENTIALS */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white mb-1">Create First Community Admin</h3>
                    <p className="text-xs text-slate-400">
                      These credentials will be used to log in as Community Admin on <strong>{subdomain}.mysocialclan.com</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Shah"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Admin Mobile Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={adminMobile}
                      onChange={(e) => setAdminMobile(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Set strong password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="py-3 px-4 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs border-0 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      disabled={!adminName.trim() || !adminMobile.trim() || !adminPassword.trim()}
                      onClick={() => setStep(4)}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-xl font-bold text-xs border-0 cursor-pointer"
                    >
                      Next: Configure Modules
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: MODULE SELECTION CHECKBOXES */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white mb-1">Select Enabled Modules</h3>
                    <p className="text-xs text-slate-400">
                      Choose which modules are enabled for members of <strong>{name}</strong>.
                    </p>
                  </div>

                  {creationError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold">
                      {creationError}
                    </div>
                  )}

                  <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
                    {[
                      { key: "directory" as const, label: "Private Directory & Verification", icon: Users },
                      { key: "marketplace" as const, label: "Marketplace & Opportunities", icon: ShoppingBag },
                      { key: "panchang" as const, label: "Mahurth & Panchang Calendar", icon: Calendar },
                      { key: "booking" as const, label: "Venue & Property Bookings", icon: Landmark },
                      { key: "events" as const, label: "Announcements & Events Hub", icon: Megaphone },
                      { key: "donations" as const, label: "Direct UPI Member Donations", icon: Heart },
                    ].map((mod) => {
                      const Icon = mod.icon;
                      const isChecked = modules[mod.key];
                      return (
                        <label
                          key={mod.key}
                          onClick={() => setModules({ ...modules, [mod.key]: !isChecked })}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                              : "bg-slate-950 border-slate-800 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl ${isChecked ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold">{mod.label}</span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isChecked ? "bg-emerald-500 border-emerald-400 text-slate-950" : "border-slate-700 bg-slate-900"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setStep(3)}
                      className="py-3.5 px-4 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs border-0 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      disabled={submitting}
                      onClick={handleRegisterCommunity}
                      className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 rounded-xl font-black text-xs shadow-lg shadow-emerald-500/20 border-0 cursor-pointer transition-all flex items-center justify-center space-x-2"
                    >
                      {submitting ? (
                        <span>Deploying Community Portal...</span>
                      ) : (
                        <>
                          <span>Create Community Now</span>
                          <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: SUCCESS MODAL RESULT (OFFLINE PROVISIONING NOTICE) */}
              {step === 5 && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </div>

                  <h3 className="text-xl font-black text-white">Community Request Submitted!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    Your request for <strong>{createdCommunityName}</strong> has been successfully received.
                  </p>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-3">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Requested Subdomain URL</div>
                      <div className="text-xs font-mono text-emerald-400 font-bold overflow-hidden text-ellipsis">
                        {subdomain}.mysocialclan.com
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-start space-x-2 text-xs text-slate-400 leading-relaxed">
                      <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Our platform team will provision your <strong>dedicated database & subdomain hosting</strong> offline and notify you at <strong>{adminMobile}</strong> as soon as your deployment is live!
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={resetForm}
                      className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs border-0 cursor-pointer transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Done & Return to Homepage
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
