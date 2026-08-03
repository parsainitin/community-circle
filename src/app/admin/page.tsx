"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Plus, Globe, Users, ChevronDown, ChevronUp, Trash2, LogOut, CheckCircle2, ImagePlus, Pencil } from "lucide-react";

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
  admins: AdminUser[];
  isActive: boolean;
  createdAt: string;
}

export default function SuperAdminPage() {
  const { user, logout } = useAuth();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Create community form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubdomain, setNewSubdomain] = useState("");
  const [newDesc, setNewDesc] = useState("");
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

  useEffect(() => {
    if (user) fetchCommunities();
  }, [user]);

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
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setNewName(""); setNewSubdomain(""); setNewDesc("");
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
      setAdminError(null);
      setExpandedAdminForm(null);
      showToast(`✅ Admin "${data.name}" added!`);
      fetchCommunities();
    } catch {
      setAdminError("Failed to add admin. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-slate-800">🏛️ Platform Admin Portal</h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Community Circle · Super Admin</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-xl transition-all border-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* Toast */}
        {toast && (
          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Create Community */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => { setShowCreateForm(!showCreateForm); setError(null); }}
            className="w-full flex items-center justify-between p-4 bg-transparent border-0 cursor-pointer text-left"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                <Plus className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-sm font-bold text-slate-700">Create New Community</span>
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
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${c.isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
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
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Community Name *</label>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subdomain *</label>
                        <div className="flex items-center space-x-2">
                          <input
                            value={editSubdomain}
                            onChange={(e) => setEditSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            className={`${inputCls} flex-1`}
                          />
                          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap shrink-0">.communitycircle.com</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                        <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={inputCls} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingCommunity(null)}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs border-0 cursor-pointer transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateCommunity(c._id)}
                          disabled={savingEdit || !editName.trim() || !editSubdomain.trim()}
                          className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs border-0 cursor-pointer transition-all"
                        >
                          {savingEdit ? "Saving…" : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-semibold">
                      <Users className="w-3.5 h-3.5" />
                      <span>{c.admins.length} Admin{c.admins.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Created {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>

                {/* Admins list */}
                {c.admins.length > 0 && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {c.admins.map((admin) => (
                      <div key={admin._id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{admin.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{admin.mobileNumber}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAdmin(c._id, admin._id, admin.name)}
                          className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all border-0 cursor-pointer bg-transparent"
                          title="Remove admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Admin toggle */}
                <div className="border-t border-slate-100">
                  <button
                    onClick={() => {
                      setExpandedAdminForm(expandedAdminForm === c._id ? null : c._id);
                      setAdminName(""); setAdminMobile(""); setAdminPassword(""); setAdminError(null);
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-3 text-xs font-bold text-violet-600 hover:bg-violet-50 bg-transparent border-0 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Admin</span>
                  </button>

                  {expandedAdminForm === c._id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                      {adminError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-xs font-semibold leading-relaxed">
                          {adminError}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                          <input
                            placeholder="Admin name"
                            value={adminName} onChange={(e) => setAdminName(e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile *</label>
                          <input
                            type="tel" placeholder="10-digit mobile"
                            value={adminMobile} onChange={(e) => setAdminMobile(e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password *</label>
                        <input
                          type="password" placeholder="Temporary password"
                          value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <button
                        onClick={() => handleAddAdmin(c._id)}
                        disabled={addingAdmin || !adminName || !adminMobile || !adminPassword}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs border-0 cursor-pointer transition-all"
                      >
                        {addingAdmin ? "Adding…" : "Add Admin →"}
                      </button>
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
