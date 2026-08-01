"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Plus, X, MessageSquare, Briefcase, Sparkles, User, Calendar, MapPin, CheckCircle, Store, Camera } from "lucide-react";
import Image from "next/image";
import { compressImage, checkFileSize } from "@/lib/imageCompression";

interface BusinessType {
  _id: string;
  owner: {
    _id: string;
    name: string;
  };
  title: string;
  description: string;
  catalogImages: string[];
  createdAt: string;
}

interface JobType {
  _id: string;
  postedBy: {
    _id: string;
    name: string;
  };
  title: string;
  description: string;
  applicants: string[];
  createdAt: string;
}

type ViewMode = "businesses" | "jobs";
type ActiveModal = "postJob" | "postBusiness" | null;

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("businesses");
  const [businesses, setBusinesses] = useState<BusinessType[]>([]);
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);

  // FAB Menu States
  const [fabOpen, setFabOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const fabMenuRef = useRef<HTMLDivElement>(null);

  // Forms States
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [bizTitle, setBizTitle] = useState("");
  const [bizDesc, setBizDesc] = useState("");
  const [bizFile, setBizFile] = useState<File | null>(null);
  const [bizFileUrl, setBizFileUrl] = useState("");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Close FAB menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabMenuRef.current && !fabMenuRef.current.contains(event.target as Node)) {
        setFabOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bizRes, jobsRes] = await Promise.all([
        fetch("/api/businesses"),
        fetch("/api/jobs"),
      ]);

      if (bizRes.ok) {
        const bizData = await bizRes.json();
        setBusinesses(bizData || []);
      }
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData || []);
      }
    } catch (e) {
      console.error("Failed to fetch opportunities data", e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Handle Job Application (Optimistic UI)
  const handleApplyJob = async (jobId: string) => {
    if (!user) return;
    const targetJob = jobs.find((j) => j._id === jobId);
    if (!targetJob) return;

    // Check if already applied
    if (targetJob.applicants.includes(user._id)) return;

    // Save previous state for rollback
    const previousJobs = [...jobs];

    // Optimistic state update
    setJobs((prev) =>
      prev.map((job) => {
        if (job._id === jobId) {
          return { ...job, applicants: [...job.applicants, user._id] };
        }
        return job;
      })
    );
    showToast("Application submitted successfully!");

    try {
      const updatedApplicants = [...targetJob.applicants, user._id];
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicants: updatedApplicants }),
      });

      if (!res.ok) {
        setJobs(previousJobs);
        showToast("Failed to apply for the job.");
      }
    } catch (error) {
      console.error("Job application error", error);
      setJobs(previousJobs);
      showToast("An error occurred during application.");
    }
  };

  // Submit Job Posting Form
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDesc.trim() || !user) return;

    setActiveModal(null);
    setLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle.trim(),
          description: jobDesc.trim(),
          postedBy: user._id,
          applicants: [],
        }),
      });

      if (res.ok) {
        showToast("Job opportunity posted successfully!");
        setJobTitle("");
        setJobDesc("");
        // Reload feeds
        fetchData();
      } else {
        showToast("Failed to post job listing.");
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to post job", e);
      setLoading(false);
    }
  };

  // Submit Business Listing Form
  const handlePostBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizTitle.trim() || !bizDesc.trim() || !user) return;

    setActiveModal(null);
    setLoading(true);

    let catalogImages = ["/catalog_item.jpg"];
    if (bizFile) {
      try {
        const formData = new FormData();
        formData.append("file", bizFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          catalogImages = [uploadData.url];
        } else {
          showToast(uploadData.error || "Failed to upload catalog image");
        }
      } catch (err) {
        console.error("Failed to upload business image", err);
      }
    }

    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bizTitle.trim(),
          description: bizDesc.trim(),
          owner: user._id,
          catalogImages,
        }),
      });

      if (res.ok) {
        showToast("Business catalog registered successfully!");
        setBizTitle("");
        setBizDesc("");
        setBizFile(null);
        setBizFileUrl("");
        fetchData();
      } else {
        showToast("Failed to register business catalog.");
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to post business", e);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 relative min-h-[75vh]">
      {/* 🔔 TOAST MESSAGE POPUP */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 🔄 TOP TOGGLE SWITCH (Businesses vs Jobs) */}
      <div className="flex bg-slate-200/60 p-1.5 rounded-2xl max-w-xs mx-auto w-full select-none shadow-xs border border-slate-100">
        <button
          onClick={() => setViewMode("businesses")}
          className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center space-x-1.5 border-0 cursor-pointer ${
            viewMode === "businesses"
              ? "bg-white text-whatsapp-green shadow-xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Businesses</span>
        </button>
        <button
          onClick={() => setViewMode("jobs")}
          className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center space-x-1.5 border-0 cursor-pointer ${
            viewMode === "jobs"
              ? "bg-white text-whatsapp-green shadow-xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Jobs Feed</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
        </div>
      ) : (
        <>
          {/* 🏪 BUSINESS CATALOG GRID */}
          {viewMode === "businesses" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100/80">
                <h3 className="text-sm font-bold text-slate-800">Community Marketplace</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Explore catalog products of community shops</p>
              </div>

              {businesses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  No businesses registered yet. Click the FAB button to add one!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {businesses.map((biz) => (
                    <div
                      key={biz._id}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-100/80 shadow-xs flex flex-col group select-none hover:shadow-md transition-shadow"
                    >
                      {/* Catalog Image */}
                      <div className="relative aspect-square bg-slate-50 border-b border-slate-100">
                        <Image
                          src={biz.catalogImages?.[0] || "/catalog_item.jpg"}
                          alt={biz.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {/* Catalog Info */}
                      <div className="p-3.5 flex flex-col flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">
                          {biz.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate flex items-center space-x-1">
                          <User className="w-2.5 h-2.5 text-slate-400 inline" />
                          <span>Owner: {biz.owner?.name}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed flex-1 line-clamp-2">
                          {biz.description}
                        </p>
                        {/* Contact Owner Button */}
                        <button
                          onClick={() => showToast(`Messaged ${biz.owner?.name || "Owner"} successfully!`)}
                          className="mt-3.5 w-full py-2 bg-whatsapp-green hover:bg-whatsapp-teal text-white rounded-xl text-[10px] font-bold shadow-xs active:scale-[0.97] transition-all flex items-center justify-center space-x-1 cursor-pointer border-0"
                        >
                          <MessageSquare className="w-3 h-3 fill-current" />
                          <span>Message Owner</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 💼 JOBS LIST BOARD */}
          {viewMode === "jobs" && (
            <div className="space-y-3.5">
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100/80">
                <h3 className="text-sm font-bold text-slate-800">Job Board</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Explore local openings and project listings</p>
              </div>

              {jobs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  No job vacancies posted yet. Click the FAB button to post one!
                </div>
              ) : (
                jobs.map((job) => {
                  const hasApplied = job.applicants.includes(user?._id || "");
                  return (
                    <div
                      key={job._id}
                      className="bg-white rounded-3xl p-4.5 border border-slate-100/80 shadow-xs flex flex-col space-y-3 select-none hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start min-w-0">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-extrabold text-slate-800 truncate leading-tight">
                            {job.title}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                            Posted by: {job.postedBy?.name}
                          </span>
                        </div>
                        {hasApplied && (
                          <span className="bg-green-50 text-whatsapp-green rounded-full px-2.5 py-0.5 text-[8.5px] font-extrabold border border-green-100 flex items-center space-x-1 shrink-0">
                            <CheckCircle className="w-2.5 h-2.5" />
                            <span>Applied</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {job.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {/* Applicants metrics */}
                        <div className="text-[9px] font-bold text-slate-400">
                          Applicants: <span className="text-slate-600">{job.applicants.length}</span>
                        </div>

                        {/* Quick-Apply Button */}
                        <button
                          onClick={() => handleApplyJob(job._id)}
                          disabled={hasApplied}
                          className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all border active:scale-95 cursor-pointer ${
                            hasApplied
                              ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-whatsapp-green hover:bg-whatsapp-teal text-white border-whatsapp-green shadow-xs"
                          }`}
                        >
                          {hasApplied ? "Applied" : "Apply"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ➕ FLOATING ACTION BUBBLE (FAB) */}
      <div className="absolute bottom-4 right-4 z-40" ref={fabMenuRef}>
        {/* Floating Menu Popover options */}
        {fabOpen && (
          <div className="absolute right-0 bottom-14 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 w-44 flex flex-col space-y-1.5 animate-fade-in select-none">
            <button
              onClick={() => {
                setActiveModal("postJob");
                setFabOpen(false);
              }}
              className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 rounded-xl transition-all font-bold text-xs text-slate-700 text-left border-0 cursor-pointer"
            >
              <Briefcase className="w-4.5 h-4.5 text-slate-500" />
              <span>Post a Job</span>
            </button>
            <button
              onClick={() => {
                setActiveModal("postBusiness");
                setFabOpen(false);
              }}
              className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 rounded-xl transition-all font-bold text-xs text-slate-700 text-left border-0 cursor-pointer"
            >
              <Store className="w-4.5 h-4.5 text-slate-500" />
              <span>Add Business</span>
            </button>
          </div>
        )}

        {/* Circular Toggle Button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-12 h-12 bg-whatsapp-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:bg-whatsapp-teal transition-all cursor-pointer border-0 ${
            fabOpen ? "rotate-45" : ""
          }`}
          aria-label="Add listing menu"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 💼 POST JOB OVERLAY MODAL */}
      {activeModal === "postJob" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">💼 Post a Job</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handlePostJob} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Executive"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm focus:border-whatsapp-green outline-hidden text-slate-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description & Requirements</label>
                <textarea
                  required
                  placeholder="Job specifications, location, salary, experience..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs focus:border-whatsapp-green outline-hidden resize-none text-slate-700 leading-normal"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-whatsapp-green text-white font-bold rounded-xl text-sm shadow-md hover:bg-whatsapp-teal cursor-pointer border-0 active:scale-95 transition-transform">
                Post Job Opportunity
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🏪 REGISTER BUSINESS OVERLAY MODAL */}
      {activeModal === "postBusiness" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">🏪 Add Business</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handlePostBusiness} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Farms"
                  value={bizTitle}
                  onChange={(e) => setBizTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm focus:border-whatsapp-green outline-hidden text-slate-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description & Catalog Details</label>
                <textarea
                  required
                  placeholder="Describe your services, store address, catalog items, timings..."
                  value={bizDesc}
                  onChange={(e) => setBizDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs focus:border-whatsapp-green outline-hidden resize-none text-slate-700 leading-normal"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Catalog Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setBizFileUrl(URL.createObjectURL(file));
                    const compressed = await compressImage(file);
                    if (!checkFileSize(compressed, 5)) {
                      alert("Selected file exceeds the maximum allowed size of 5MB");
                      return;
                    }
                    setBizFile(compressed);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-whatsapp-light file:text-whatsapp-green hover:file:bg-slate-100 cursor-pointer"
                />
                {bizFileUrl && (
                  <div className="mt-2.5 relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-xs">
                    <img src={bizFileUrl} alt="Catalog Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-2.5 bg-whatsapp-green text-white font-bold rounded-xl text-sm shadow-md hover:bg-whatsapp-teal cursor-pointer border-0 active:scale-95 transition-transform">
                Register Business Catalog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
