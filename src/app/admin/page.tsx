"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Plus, Globe, Users, ChevronDown, ChevronUp, Trash2, LogOut, CheckCircle2, ImagePlus, Pencil, MapPin, ShieldAlert, Heart } from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  mobileNumber: string;
}

interface Community {
  _id: string;
  name: string;
  subdomain: string;
  description?: string;
  logo?: string;
  cities?: string[];
  gotras?: string[];
  kulDevis?: string[];
  upiId?: string;
  modules?: {
    directory?: boolean;
    marketplace?: boolean;
    panchang?: boolean;
    booking?: boolean;
    events?: boolean;
    donations?: boolean;
  };
  admins: AdminUser[];
  isActive: boolean;
  createdAt: string;
}

interface CommunityRequestItem {
  _id: string;
  name: string;
  subdomain: string;
  description?: string;
  adminName: string;
  adminMobile: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function SuperAdminPage() {
  const { user, logout } = useAuth();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [creationRequests, setCreationRequests] = useState<CommunityRequestItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Create community form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubdomain, setNewSubdomain] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUpiId, setNewUpiId] = useState("");
  const [newCities, setNewCities] = useState("Ahmedabad, Rajkot, Surat, Jamnagar, Vadodara, Mumbai, Pune, Delhi");
  const [newGotras, setNewGotras] = useState("Kashyap, Vashishtha, Bharadwaj, Garg, Gautam, Parashar, Shandilya");
  const [newKulDevis, setNewKulDevis] = useState("Ashapura Mata, Meldi Mata, Amba Mata, Harsiddhi Mata, Bahuchar Mata, Chamunda Mata");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);

  // Per-community admin form (keyed by community _id)
  const [expandedAdminForm, setExpandedAdminForm] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminMobile, setAdminMobile] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Edit community form (keyed by community _id)
  const [editingCommunity, setEditingCommunity] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubdomain, setEditSubdomain] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editUpiId, setEditUpiId] = useState("");
  const [editCities, setEditCities] = useState("");
  const [editGotras, setEditGotras] = useState("");
  const [editKulDevis, setEditKulDevis] = useState("");
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const editLogoInputRef = useRef<HTMLInputElement>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCommunities = async () => {
    try {
      const res = await fetch("/api/admin/communities", {
        headers: { "x-caller-mobile": user?.mobileNumber || "" },
      });
      if (res.ok) setCommunities(await res.json());
    } catch {
      setError("Failed to load communities");
    } finally {
      setLoadingList(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/community-requests", {
        headers: { "x-caller-mobile": user?.mobileNumber || "" },
      });
      if (res.ok) setCreationRequests(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (user) {
      fetchCommunities();
      fetchRequests();
    }
  }, [user]);

  const handleApproveRequest = async (reqId: string, provisionNow: boolean = false) => {
    try {
      const res = await fetch(`/api/admin/community-requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerMobile: user?.mobileNumber,
          status: "approved",
          provisionNow,
        }),
      });
      if (res.ok) {
        showToast("Request approved & marked for offline setup!");
        fetchRequests();
        fetchCommunities();
      }
    } catch {}
  };

  const handleRejectRequest = async (reqId: string) => {
    if (!confirm("Reject this community creation request?")) return;
    try {
      const res = await fetch(`/api/admin/community-requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerMobile: user?.mobileNumber,
          status: "rejected",
        }),
      });
      if (res.ok) {
        showToast("Request rejected");
        fetchRequests();
      }
    } catch {}
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      let logoUrl: string | undefined;
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) { setError(d.error || "Logo upload failed"); return; }
        logoUrl = d.url;
      }

      const res = await fetch("/api/admin/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerMobile: user?.mobileNumber,
          name: newName,
          subdomain: newSubdomain,
          description: newDesc,
          logo: logoUrl,
          cities: newCities ? newCities.split(",").map((s) => s.trim()).filter(Boolean) : [],
          gotras: newGotras ? newGotras.split(",").map((s) => s.trim()).filter(Boolean) : [],
          kulDevis: newKulDevis ? newKulDevis.split(",").map((s) => s.trim()).filter(Boolean) : [],
          upiId: newUpiId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setNewName(""); setNewSubdomain(""); setNewDesc(""); setNewUpiId("");
      setLogoFile(null); setLogoPreview(null);
      setShowCreateForm(false);
      showToast(`✅ Community "${data.name}" created!`);
      fetchCommunities();
    } catch {
      setError("Failed to create community");
    } finally {
      setCreating(false);
    }
  };

  const handleAddAdmin = async (communityId: string) => {
    setAddingAdmin(true);
    setAdminError(null);
    try {
      const res = await fetch(`/api/admin/communities/${communityId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerMobile: user?.mobileNumber,
          name: adminName,
          mobileNumber: adminMobile,
          password: adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAdminError(data.error); return; }
      setAdminName(""); setAdminMobile(""); setAdminPassword("");
      setExpandedAdminForm(null);
      showToast(`✅ Admin ${data.name} added!`);
      fetchCommunities();
    } catch {
      setAdminError("Failed to add admin");
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (communityId: string, adminId: string, adminName: string) => {
    if (!confirm(`Remove ${adminName} as admin?`)) return;
    try {
      const res = await fetch(`/api/admin/communities/${communityId}/admins`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerMobile: user?.mobileNumber, adminId }),
      });
      if (res.ok) { showToast("Admin removed"); fetchCommunities(); }
    } catch {}
  };

  const openEditForm = (c: Community) => {
    setEditingCommunity(c._id);
    setEditName(c.name);
    setEditSubdomain(c.subdomain);
    setEditDesc(c.description || "");
    setEditUpiId(c.upiId || "");
    setEditCities((c.cities || []).join(", "));
    setEditGotras((c.gotras || []).join(", "));
    setEditKulDevis((c.kulDevis || []).join(", "));
    setEditLogoPreview(c.logo || null);
    setEditLogoFile(null);
    setEditError(null);
  };

  const handleUpdateCommunity = async (id: string) => {
    setSavingEdit(true);
    setEditError(null);
    try {
      let logoUrl: string | undefined;
      if (editLogoFile) {
        const fd = new FormData();
        fd.append("file", editLogoFile);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) { setEditError(d.error || "Logo upload failed"); return; }
        logoUrl = d.url;
      }

      const res = await fetch(`/api/admin/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerMobile: user?.mobileNumber,
          name: editName,
          subdomain: editSubdomain,
          description: editDesc,
          logo: logoUrl,
          cities: editCities ? editCities.split(",").map((s) => s.trim()).filter(Boolean) : [],
          gotras: editGotras ? editGotras.split(",").map((s) => s.trim()).filter(Boolean) : [],
          kulDevis: editKulDevis ? editKulDevis.split(",").map((s) => s.trim()).filter(Boolean) : [],
          upiId: editUpiId.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error); return; }
      setEditingCommunity(null);
      showToast(`✅ Community "${data.name}" updated!`);
      fetchCommunities();
    } catch {
      setEditError("Failed to update community. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActiveStatus = async (c: Community) => {
    try {
      const res = await fetch(`/api/admin/communities/${c._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerMobile: user?.mobileNumber,
          name: c.name,
          subdomain: c.subdomain,
          isActive: !c.isActive,
        }),
      });
      if (res.ok) {
        showToast(`Community "${c.name}" status updated to ${!c.isActive ? "Active" : "Inactive"}`);
        fetchCommunities();
      }
    } catch {}
  };

  const handleDeleteCommunity = async (c: Community) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone. Its admins will be demoted to regular members.`)) return;
    setDeletingId(c._id);
    try {
      const res = await fetch(`/api/admin/communities/${c._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerMobile: user?.mobileNumber }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      showToast(`Community "${c.name}" deleted`);
      fetchCommunities();
    } catch {
      setError("Failed to delete community");
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 pb-20 select-none">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-slate-800">🏛️ Platform Admin Portal</h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Community Circle · Super Admin</p>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="/community-admin"
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all border-0 flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-xs text-decoration-none"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members & Bulk Upload</span>
            </a>
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-xl transition-all border-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Pending Offline Creation Requests Section */}
        {creationRequests.length > 0 && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <h2 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                  Pending Community Creation Requests ({creationRequests.filter((r) => r.status === "pending").length})
                </h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {creationRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 text-sm">{req.name}</span>
                      <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                        {req.subdomain}.mysocialclan.com
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">
                      Applicant: <strong>{req.adminName}</strong> ({req.adminMobile})
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Requested on {new Date(req.createdAt).toLocaleDateString()} · Status:{" "}
                      <strong className={req.status === "approved" ? "text-emerald-600" : req.status === "rejected" ? "text-red-500" : "text-amber-600"}>
                        {req.status.toUpperCase()}
                      </strong>
                    </span>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                      <button
                        onClick={() => handleApproveRequest(req._id, true)}
                        className="flex-1 sm:flex-none py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs border-0 cursor-pointer transition-all"
                      >
                        Approve & Provision
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req._id)}
                        className="py-1.5 px-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-bold text-xs border-0 cursor-pointer transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Community Accordion */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full flex items-center justify-between p-4 bg-transparent border-0 cursor-pointer text-left"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">Create New Community</h2>
                <p className="text-[10px] text-slate-400 font-medium">Add a tenant & configure Cities, Gotras, KulDevis</p>
              </div>
            </div>
            {showCreateForm
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showCreateForm && (
            <form onSubmit={handleCreateCommunity} className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-4">
              {/* Logo picker */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Community Logo</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shrink-0"
                  >
                    {logoPreview
                      ? <img src={logoPreview} className="w-full h-full object-cover" alt="" />
                      : <><ImagePlus className="w-5 h-5 text-slate-400" /><span className="text-[9px] text-slate-400 font-bold mt-1">Upload</span></>}
                  </button>
                  <div className="text-[10px] text-slate-400 leading-relaxed">
                    {logoPreview
                      ? <span className="text-violet-600 font-bold">Logo selected — tap to change</span>
                      : <span>Square image recommended.<br />PNG, JPG or WebP · max 5 MB</span>}
                  </div>
                </div>
                <input
                  ref={logoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { setError("Logo must be under 5 MB"); return; }
                    setLogoPreview(URL.createObjectURL(file));
                    setLogoFile(file);
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Community Name *</label>
                <input
                  required placeholder="e.g. JBS Community"
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subdomain *</label>
                <div className="flex items-center space-x-2">
                  <input
                    required placeholder="e.g. jbs"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className={`${inputCls} flex-1`}
                  />
                  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap shrink-0">.communitycircle.com</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  placeholder="Optional short description"
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Predefined Cities Dropdown List Config */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Predefined Cities (Comma-separated for profile dropdown)
                </label>
                <input
                  placeholder="e.g. Ahmedabad, Rajkot, Surat, Jamnagar, Vadodara, Mumbai"
                  value={newCities} onChange={(e) => setNewCities(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Predefined Gotras Dropdown List Config */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Predefined Gotras (Comma-separated for profile dropdown)
                </label>
                <input
                  placeholder="e.g. Kashyap, Vashishtha, Bharadwaj, Garg, Gautam"
                  value={newGotras} onChange={(e) => setNewGotras(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Predefined KulDevis Dropdown List Config */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Predefined KulDevis (Comma-separated for profile dropdown)
                </label>
                <input
                  placeholder="e.g. Ashapura Mata, Meldi Mata, Amba Mata, Harsiddhi Mata"
                  value={newKulDevis} onChange={(e) => setNewKulDevis(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Donation UPI ID Config */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  💳 Community UPI ID for Member Donations (e.g. vyanamics@upi)
                </label>
                <input
                  placeholder="e.g. community@upi or 9876543210@ybl"
                  value={newUpiId} onChange={(e) => setNewUpiId(e.target.value)}
                  className={inputCls}
                />
              </div>

              <button
                type="submit" disabled={creating}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm border-0 cursor-pointer transition-all"
              >
                {creating ? "Creating…" : "Create Community →"}
              </button>
            </form>
          )}
        </div>

        {/* Communities List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Communities ({communities.length})
            </span>
          </div>

          {loadingList ? (
            <div className="bg-white rounded-3xl p-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
            </div>
          ) : communities.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">No communities yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first community above.</p>
            </div>
          ) : (
            communities.map((c) => (
              <div key={c._id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Community header */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 bg-violet-100 flex items-center justify-center">
                        {c.logo
                          ? <img src={c.logo} className="w-full h-full object-cover" alt={c.name} />
                          : <Globe className="w-5 h-5 text-violet-600" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">{c.name}</h3>
                        <p className="text-[11px] text-violet-600 font-semibold mt-0.5">
                          🌐 {c.subdomain}.communitycircle.com
                        </p>
                        {c.description && (
                          <p className="text-[10px] text-slate-400 mt-1">{c.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleActiveStatus(c)}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border-0 cursor-pointer transition-all ${
                          c.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                        title="Click to toggle active status"
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => editingCommunity === c._id ? setEditingCommunity(null) : openEditForm(c)}
                        className="p-1.5 text-slate-300 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-all border-0 cursor-pointer bg-transparent"
                        title="Edit community"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCommunity(c)}
                        disabled={deletingId === c._id}
                        className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all border-0 cursor-pointer bg-transparent disabled:opacity-50"
                        title="Delete community"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Configured Dropdown Options Badges */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px]">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Cities ({c.cities?.length || 0})</span>
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1">
                      <ShieldAlert className="w-3 h-3 text-slate-400" />
                      <span>Gotras ({c.gotras?.length || 0})</span>
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1">
                      <Heart className="w-3 h-3 text-slate-400" />
                      <span>KulDevis ({c.kulDevis?.length || 0})</span>
                    </span>
                  </div>

                  {/* Edit community form */}
                  {editingCommunity === c._id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                      {editError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-xs font-semibold leading-relaxed">
                          {editError}
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Community Logo</label>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => editLogoInputRef.current?.click()}
                            className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shrink-0"
                          >
                            {editLogoPreview
                              ? <img src={editLogoPreview} className="w-full h-full object-cover" alt="" />
                              : <ImagePlus className="w-4 h-4 text-slate-400" />}
                          </button>
                          <span className="text-[10px] text-slate-400">Tap to {editLogoPreview ? "change" : "upload"} logo</span>
                        </div>
                        <input
                          ref={editLogoInputRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { setEditError("Logo must be under 5 MB"); return; }
                            setEditLogoPreview(URL.createObjectURL(file));
                            setEditLogoFile(file);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Community Name *</label>
                        <input
                          required value={editName} onChange={(e) => setEditName(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subdomain *</label>
                        <input
                          required value={editSubdomain}
                          onChange={(e) => setEditSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                        <input
                          value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                          className={inputCls}
                        />
                      </div>

                      {/* Edit Cities */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Cities (Comma-separated dropdown options)
                        </label>
                        <input
                          value={editCities} onChange={(e) => setEditCities(e.target.value)}
                          placeholder="e.g. Ahmedabad, Rajkot, Surat, Jamnagar"
                          className={inputCls}
                        />
                      </div>

                      {/* Edit Gotras */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Gotras (Comma-separated dropdown options)
                        </label>
                        <input
                          value={editGotras} onChange={(e) => setEditGotras(e.target.value)}
                          placeholder="e.g. Kashyap, Vashishtha, Bharadwaj"
                          className={inputCls}
                        />
                      </div>

                      {/* Edit KulDevis */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          KulDevis (Comma-separated dropdown options)
                        </label>
                        <input
                          value={editKulDevis} onChange={(e) => setEditKulDevis(e.target.value)}
                          placeholder="e.g. Ashapura Mata, Meldi Mata, Amba Mata"
                          className={inputCls}
                        />
                      </div>

                      {/* Edit UPI ID */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          💳 Community UPI ID for Member Donations
                        </label>
                        <input
                          value={editUpiId} onChange={(e) => setEditUpiId(e.target.value)}
                          placeholder="e.g. community@upi or 9876543210@ybl"
                          className={inputCls}
                        />
                      </div>

                      <div className="flex space-x-2 pt-1">
                        <button
                          type="button" onClick={() => handleUpdateCommunity(c._id)} disabled={savingEdit}
                          className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs border-0 cursor-pointer transition-all"
                        >
                          {savingEdit ? "Saving…" : "Save Changes"}
                        </button>
                        <button
                          type="button" onClick={() => setEditingCommunity(null)}
                          className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs border-0 cursor-pointer transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Community admins list */}
                <div className="bg-slate-50 p-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Community Admins ({c.admins?.length || 0})</span>
                    </span>
                    <button
                      onClick={() => {
                        if (expandedAdminForm === c._id) {
                          setExpandedAdminForm(null);
                        } else {
                          setExpandedAdminForm(c._id);
                          setAdminName(""); setAdminMobile(""); setAdminPassword(""); setAdminError(null);
                        }
                      }}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700 border-0 bg-transparent cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Admin</span>
                    </button>
                  </div>

                  {c.admins && c.admins.length > 0 ? (
                    <div className="space-y-1.5 mb-2">
                      {c.admins.map((adm) => (
                        <div key={adm._id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/60 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{adm.name}</span>
                            <span className="text-slate-400 ml-2 font-mono text-[11px]">{adm.mobileNumber}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveAdmin(c._id, adm._id, adm.name)}
                            className="text-red-400 hover:text-red-600 p-1 border-0 bg-transparent cursor-pointer"
                            title="Remove admin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic mb-2">No admin credentials assigned yet.</p>
                  )}

                  {/* Add admin form for this community */}
                  {expandedAdminForm === c._id && (
                    <div className="bg-white p-3.5 rounded-2xl border border-violet-200 shadow-xs space-y-2.5 mt-2 animate-fade-in">
                      <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">New Admin Credentials</p>
                      {adminError && (
                        <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg">{adminError}</p>
                      )}
                      <input
                        placeholder="Admin Full Name *"
                        value={adminName} onChange={(e) => setAdminName(e.target.value)}
                        className={inputCls}
                      />
                      <input
                        placeholder="Admin Mobile Number *"
                        value={adminMobile} onChange={(e) => setAdminMobile(e.target.value)}
                        className={inputCls}
                      />
                      <input
                        type="password" placeholder="Admin Password *"
                        value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                        className={inputCls}
                      />
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={() => handleAddAdmin(c._id)} disabled={addingAdmin}
                          className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs border-0 cursor-pointer"
                        >
                          {addingAdmin ? "Adding..." : "Save Admin Credentials"}
                        </button>
                        <button
                          onClick={() => setExpandedAdminForm(null)}
                          className="py-2 px-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs border-0 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
