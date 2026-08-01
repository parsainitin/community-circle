"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Search, Heart, X, Phone, Shield, MapPin, User, ChevronRight, UserPlus, Users, Link2, Plus } from "lucide-react";

interface UserType {
  _id: string;
  name: string;
  phone: string;
  mobileNumber: string;
  gotra?: string;
  address?: string;
  age?: number;
  sex?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  avatar?: string;
  familyMembers: string[];
}

interface FamilyTreeNode {
  _id: string;
  name: string;
  phone?: string;
  mobileNumber?: string;
  gotra?: string;
  children?: FamilyTreeNode[];
}

interface FamilyTreeData {
  user: {
    _id: string;
    name: string;
    phone: string;
    mobileNumber: string;
    gotra?: string;
  };
  ancestors: FamilyTreeNode[];
  descendants: FamilyTreeNode[];
}

export default function DirectoryPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string | null>(null);
  
  // Modals state
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [activeProfileUser, setActiveProfileUser] = useState<UserType | null>(null);
  const [familyTree, setFamilyTree] = useState<FamilyTreeData | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);

  // Linkage Form State
  const [linkageModalOpen, setLinkageModalOpen] = useState(false);
  const [linkageSearch, setLinkageSearch] = useState("");
  const [selectedRelativeId, setSelectedRelativeId] = useState("");
  const [relationshipType, setRelationshipType] = useState<"parent" | "child">("parent");
  const [linkageLoading, setLinkageLoading] = useState(false);
  const [linkageSuccess, setLinkageSuccess] = useState<string | null>(null);
  const [linkageError, setLinkageError] = useState<string | null>(null);

  // Linkage Direct Create States
  const [linkageTab, setLinkageTab] = useState<"search" | "create">("search");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberMobile, setNewMemberMobile] = useState("");
  const [newMemberSex, setNewMemberSex] = useState("Male");
  const [newMemberMarital, setNewMemberMarital] = useState("Single");
  const [newMemberAge, setNewMemberAge] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Family Tree
  const fetchFamilyTree = async (userId: string) => {
    setTreeLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/family-tree`);
      if (res.ok) {
        const data = await res.json();
        setFamilyTree(data);
      }
    } catch (e) {
      console.error("Failed to fetch family tree", e);
    } finally {
      setTreeLoading(false);
    }
  };

  // Open Profile View Modal
  const handleOpenProfile = (user: UserType) => {
    setActiveProfileUser(user);
    setFamilyTree(null);
    fetchFamilyTree(user._id);
  };

  // Submit Family Link Request
  const handleLinkFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileUser || !selectedRelativeId || !relationshipType) return;

    setLinkageLoading(true);
    setLinkageError(null);
    setLinkageSuccess(null);

    try {
      const res = await fetch(`/api/users/${activeProfileUser._id}/link-family`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relativeId: selectedRelativeId,
          relationshipType,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLinkageError(data.error || "Failed to link family member");
      } else {
        setLinkageSuccess("Relationship linked successfully!");
        setSelectedRelativeId("");
        setLinkageSearch("");
        // Reload tree & list
        fetchFamilyTree(activeProfileUser._id);
        fetchUsers();
        // Close linkage modal after short delay
        setTimeout(() => {
          setLinkageModalOpen(false);
          setLinkageSuccess(null);
        }, 1500);
      }
    } catch (error: any) {
      setLinkageError(error.message || "An error occurred");
    } finally {
      setLinkageLoading(false);
    }
  };

  // Create and Link New Member Directly
  const handleCreateAndLinkMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileUser) return;
    if (!newMemberName.trim() || !newMemberMobile.trim()) {
      setLinkageError("Name and Mobile Number are required");
      return;
    }

    setLinkageLoading(true);
    setLinkageError(null);
    setLinkageSuccess(null);

    try {
      let parentRelationship = "";
      let parentId = "";

      if (relationshipType === "child") {
        parentId = activeProfileUser._id;
        parentRelationship = newMemberSex === "Female" ? "Daughter" : "Son";
      }

      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMemberName.trim(),
          mobileNumber: newMemberMobile.trim(),
          password: "Community123",
          gotra: activeProfileUser.gotra || "",
          address: activeProfileUser.address || "",
          age: newMemberAge ? Number(newMemberAge) : undefined,
          sex: newMemberSex,
          maritalStatus: newMemberMarital,
          parentId: parentId || undefined,
          parentRelationship: parentRelationship || undefined,
        }),
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok) {
        setLinkageError(signupData.error || "Failed to create new user profile");
        setLinkageLoading(false);
        return;
      }

      const newUserId = signupData._id;

      if (relationshipType === "parent") {
        const linkRes = await fetch(`/api/users/${activeProfileUser._id}/link-family`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            relativeId: newUserId,
            relationshipType: "parent",
          }),
        });

        const linkData = await linkRes.json();
        if (!linkRes.ok) {
          setLinkageError(linkData.error || "User created but failed to establish tree linkage");
          setLinkageLoading(false);
          return;
        }

        const targetRel = newMemberSex === "Female" ? "Mother" : "Father";
        await fetch(`/api/users/${activeProfileUser._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentRelationship: targetRel,
          }),
        });
      }

      setLinkageSuccess("Member registered and linked successfully!");
      setNewMemberName("");
      setNewMemberMobile("");
      setNewMemberAge("");
      setNewMemberSex("Male");
      setNewMemberMarital("Single");

      fetchFamilyTree(activeProfileUser._id);
      fetchUsers();

      setTimeout(() => {
        setLinkageModalOpen(false);
        setLinkageSuccess(null);
      }, 1500);

    } catch (err: any) {
      setLinkageError(err.message || "An error occurred during registration");
    } finally {
      setLinkageLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "bg-red-100 text-red-700",
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-amber-100 text-amber-700",
      "bg-violet-100 text-violet-700",
      "bg-cyan-100 text-cyan-700",
      "bg-rose-100 text-rose-700",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const renderTreeNode = (nodeUser: { _id: string; name: string; avatar?: string }, isActive: boolean) => {
    return (
      <div className="relative group select-none flex flex-col items-center">
        <img
          src={nodeUser.avatar || "/avatar.jpg"}
          alt={nodeUser.name}
          className={`w-11 h-11 rounded-full object-cover shrink-0 shadow-md border-2 transition-transform duration-100 active:scale-95 cursor-pointer ${
            isActive ? "border-whatsapp-green bg-whatsapp-light scale-105" : "border-slate-200 hover:border-slate-400"
          }`}
        />
        
        {/* Hover Tooltip */}
        <div className="absolute bottom-full mb-2.5 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 shadow-md">
          {nodeUser.name}
        </div>
      </div>
    );
  };

  // Filter list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.gotra && u.gotra.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBlood = selectedBloodGroup ? u.bloodGroup === selectedBloodGroup : true;

    return matchesSearch && matchesBlood;
  });

  // Filter candidates for linkage (cannot link user to themselves, or user who is already a parent/child)
  const linkageCandidates = users.filter((u) => {
    if (!activeProfileUser) return false;
    if (u._id === activeProfileUser._id) return false;

    // Check if already in ancestors or descendants
    const isAlreadyAncestor = familyTree?.ancestors.some((anc) => anc._id === u._id);
    const isAlreadyDescendant = familyTree?.descendants.some((desc) => desc._id === u._id);

    if (isAlreadyAncestor || isAlreadyDescendant) return false;

    return u.name.toLowerCase().includes(linkageSearch.toLowerCase());
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="flex flex-col space-y-4 pb-20 select-none">
      {/* 🚨 BLOOD SOS BANNER */}
      <button
        onClick={() => setSosModalOpen(true)}
        className="w-full flex items-center justify-between bg-red-500 hover:bg-red-600 text-white rounded-2xl p-4 shadow-md transition-all active:scale-[0.99] border-0 outline-hidden group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center shrink-0 animate-pulse">
            <Heart className="w-5.5 h-5.5 fill-current" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-extrabold tracking-wide uppercase">🚨 Blood SOS</h3>
            <p className="text-xs text-white/80 font-medium">Find matching donors in your community</p>
          </div>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-xl text-xs font-extrabold relative z-10">
          FILTER
        </div>
      </button>

      {/* SEARCH BAR */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-100/80 flex items-center space-x-2">
        <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 ml-2" />
        <input
          type="text"
          placeholder="Search contacts by name or Gotra..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-hidden text-sm placeholder-slate-400 text-slate-800"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="p-1 hover:bg-slate-100 rounded-full shrink-0 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ACTIVE SOS FILTER ACCORDION */}
      {selectedBloodGroup && (
        <div className="flex items-center justify-between bg-red-50 text-red-700 px-4 py-2.5 rounded-xl border border-red-100 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <AlertCirclePlaceholder />
            <span>Showing only donors with Blood Group: <span className="font-extrabold underline">{selectedBloodGroup}</span></span>
          </div>
          <button
            onClick={() => setSelectedBloodGroup(null)}
            className="text-red-700 hover:text-red-900 font-extrabold tracking-wide uppercase bg-red-100/50 hover:bg-red-100 px-2 py-0.5 rounded-md"
          >
            Clear
          </button>
        </div>
      )}

      {/* CONTACTS CATALOG */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-100/80 overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm font-medium">
            No contacts found
          </div>
        ) : (
          filteredUsers.map((contact) => (
            <div
              key={contact._id}
              onClick={() => handleOpenProfile(contact)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/[0.4] transition-colors"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                {contact.avatar ? (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs border border-slate-100"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs uppercase ${getAvatarColor(
                      contact.name
                    )}`}
                  >
                    {getInitials(contact.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-[14px] font-bold text-slate-800 truncate">{contact.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {contact.gotra ? `Gotra: ${contact.gotra}` : "No Gotra"} &bull; {contact.mobileNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 select-none">
                {contact.bloodGroup && (
                  <span className="bg-red-50 text-red-600 rounded-full font-bold px-2 py-0.5 text-[9px] tracking-wide border border-red-100">
                    {contact.bloodGroup}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* SOS MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 select-none">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-red-500">
                <Heart className="w-5 h-5 fill-current" />
                <h3 className="font-bold text-slate-800 text-base">Blood Donor Lookup</h3>
              </div>
              <button onClick={() => setSosModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Select a blood group to filter the directory and locate community donors immediately.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {bloodGroups.map((bg) => (
                <button
                  key={bg}
                  onClick={() => {
                    setSelectedBloodGroup(bg);
                    setSosModalOpen(false);
                  }}
                  className="py-2 bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  {bg}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setSelectedBloodGroup(null);
                setSosModalOpen(false);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border-0"
            >
              Show All Contacts
            </button>
          </div>
        </div>
      )}

      {/* PROFILE VIEW MODAL */}
      {activeProfileUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto flex flex-col relative select-none">
            {/* Header */}
            <div className="sticky top-0 bg-white z-20 flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">User Profile</h3>
              <button
                onClick={() => {
                  setActiveProfileUser(null);
                  setFamilyTree(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-5 space-y-5">
              <div className="flex items-center space-x-4">
                {activeProfileUser.avatar ? (
                  <img
                    src={activeProfileUser.avatar}
                    alt={activeProfileUser.name}
                    className="w-14 h-14 rounded-full object-cover shrink-0 shadow-xs border border-slate-200"
                  />
                ) : (
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg uppercase shadow-xs shrink-0 ${getAvatarColor(
                      activeProfileUser.name
                    )}`}
                  >
                    {getInitials(activeProfileUser.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-extrabold text-slate-800 truncate">{activeProfileUser.name}</h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {activeProfileUser.mobileNumber}
                  </p>
                  {activeProfileUser.bloodGroup && (
                    <span className="inline-block bg-red-50 text-red-600 rounded-full font-bold px-2 py-0.5 text-[9px] mt-1.5 border border-red-100">
                      Blood Group: {activeProfileUser.bloodGroup}
                    </span>
                  )}
                </div>
              </div>

              {/* Bio Details */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 space-y-3 text-xs text-slate-600">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Phone:</strong> {activeProfileUser.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Gotra:</strong> {activeProfileUser.gotra || "N/A"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <div className="text-slate-400 font-bold">Age</div>
                    <div className="font-extrabold text-slate-700 mt-0.5">{activeProfileUser.age || "N/A"}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <div className="text-slate-400 font-bold">Sex</div>
                    <div className="font-extrabold text-slate-700 mt-0.5">{activeProfileUser.sex || "N/A"}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <div className="text-slate-400 font-bold">Marital</div>
                    <div className="font-extrabold text-slate-700 mt-0.5 truncate">{activeProfileUser.maritalStatus || "N/A"}</div>
                  </div>
                </div>
                {activeProfileUser.address && (
                  <div className="flex items-start space-x-2 pt-1 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span><strong>Address:</strong> {activeProfileUser.address}</span>
                  </div>
                )}
              </div>

              {/* 🌳 FAMILY TREE SECTION */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2 text-whatsapp-green font-bold text-sm">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Family Lineage Tree</span>
                  </div>
                  {/* Link Button */}
                  <button
                    onClick={() => setLinkageModalOpen(true)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-whatsapp-light text-whatsapp-green hover:bg-whatsapp-green hover:text-white rounded-xl text-[10px] font-bold border border-whatsapp-green/20 transition-all cursor-pointer active:scale-95"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Link Relative</span>
                  </button>
                </div>

                {treeLoading ? (
                  <div className="py-8 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-whatsapp-green"></div>
                  </div>
                ) : !familyTree ? (
                  <div className="py-4 text-center text-slate-400 text-xs font-semibold">
                    No family data loaded.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto py-4 bg-slate-50/20 rounded-2xl border border-slate-100 flex items-center justify-center min-h-[160px]">
                    {/* HIERARCHICAL flex tree */}
                    <div className="flex flex-col items-center w-full min-w-[280px] py-2">
                      {/* Ancestors chain */}
                      <div className="flex flex-col items-center">
                        {/* Always show Add Parent option if ancestors list is empty */}
                        {(!familyTree.ancestors || familyTree.ancestors.length === 0) && (
                          <>
                            <button
                              onClick={() => {
                                setRelationshipType("parent");
                                setLinkageModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed flex items-center justify-center text-slate-400 cursor-pointer active:scale-90 transition-transform mb-1.5"
                              title="Link Parent Node"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <div className="w-0.5 h-3.5 bg-slate-350" />
                          </>
                        )}

                        {familyTree.ancestors && familyTree.ancestors.length > 0 && (
                          <div className="flex flex-col items-center">
                            {/* Option to link parent at the very top of ancestors */}
                            <button
                              onClick={() => {
                                setRelationshipType("parent");
                                setLinkageModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed flex items-center justify-center text-slate-400 cursor-pointer active:scale-90 transition-transform mb-1.5"
                              title="Link Parent Node"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <div className="w-0.5 h-3.5 bg-slate-350" />

                            {familyTree.ancestors.slice().reverse().map((anc) => (
                              <React.Fragment key={anc._id}>
                                {renderTreeNode(anc, false)}
                                <div className="w-0.5 h-3.5 bg-slate-355" />
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selected Focus User Node */}
                      {renderTreeNode(familyTree.user, true)}

                      {/* Descendants (Children) */}
                      <div className="w-full flex flex-col items-center mt-1">
                        <div className="w-0.5 h-3.5 bg-slate-355" />
                        <div className="flex relative justify-center pt-3.5 w-full">
                          {/* Horizontal connector bar */}
                          {familyTree.descendants && familyTree.descendants.length > 0 && (
                            <div className="absolute top-0 left-[25%] right-[25%] h-0.5 bg-slate-355" />
                          )}
                          
                          {familyTree.descendants && familyTree.descendants.map((child) => (
                            <div key={child._id} className="flex flex-col items-center px-2 relative min-w-[70px]">
                              {/* Vertical branch line */}
                              <div className="w-0.5 h-3.5 bg-slate-355 absolute -top-3.5" />
                              {renderTreeNode(child, false)}
                            </div>
                          ))}

                          {/* Quick Link Child Option Node */}
                          <div className="flex flex-col items-center px-2 relative min-w-[70px]">
                            {/* Vertical branch line */}
                            <div className="w-0.5 h-3.5 bg-slate-355 absolute -top-3.5" />
                            <button
                              onClick={() => {
                                setRelationshipType("child");
                                setLinkageModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed flex items-center justify-center text-slate-400 cursor-pointer active:scale-90 transition-transform"
                              title="Link Child Node"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RELATIVE LINKAGE DIALOG MODAL */}
      {linkageModalOpen && activeProfileUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-fade-in select-none">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-whatsapp-green font-bold">
                <Link2 className="w-4 h-4 shrink-0" />
                <h3 className="text-slate-800 text-sm">Link Family Relative</h3>
              </div>
              <button onClick={() => setLinkageModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <X className="w-4.5 h-4.5 text-slate-500" />
              </button>
            </div>

            {linkageError && (
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
                {linkageError}
              </div>
            )}
            {linkageSuccess && (
              <div className="p-2.5 bg-green-50 text-whatsapp-green rounded-xl text-[10px] font-bold border border-green-100">
                {linkageSuccess}
              </div>
            )}
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-150 text-xs font-extrabold select-none pb-1">
              <button
                type="button"
                onClick={() => {
                  setLinkageTab("search");
                  setLinkageError(null);
                  setLinkageSuccess(null);
                }}
                className={`flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer ${
                  linkageTab === "search"
                    ? "border-whatsapp-green text-whatsapp-green"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Search Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkageTab("create");
                  setLinkageError(null);
                  setLinkageSuccess(null);
                }}
                className={`flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer ${
                  linkageTab === "create"
                    ? "border-whatsapp-green text-whatsapp-green"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Register & Add New
              </button>
            </div>

            {/* Tab 1: Search Existing */}
            {linkageTab === "search" ? (
              <form onSubmit={handleLinkFamily} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    1. Search Candidate Member
                  </label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 focus-within:bg-white focus-within:border-whatsapp-green">
                    <Search className="w-4 h-4 text-slate-400 shrink-0 mr-1.5" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={linkageSearch}
                      onChange={(e) => setLinkageSearch(e.target.value)}
                      className="w-full bg-transparent border-0 outline-hidden text-xs text-slate-700"
                    />
                  </div>

                  {/* Candidate list dropdown */}
                  {linkageSearch.trim() && (
                    <div className="max-h-24 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 shadow-inner bg-slate-50/30">
                      {linkageCandidates.length === 0 ? (
                        <div className="p-2 text-center text-[10px] text-slate-400">No candidates available</div>
                      ) : (
                        linkageCandidates.map((cand) => (
                          <div
                            key={cand._id}
                            onClick={() => {
                              setSelectedRelativeId(cand._id);
                              setLinkageSearch(`${cand.name} (${cand.mobileNumber})`);
                            }}
                            className={`p-2 text-xs cursor-pointer hover:bg-whatsapp-light/20 transition-all font-semibold ${
                              selectedRelativeId === cand._id ? "bg-whatsapp-light/35 text-whatsapp-green" : "text-slate-600"
                            }`}
                          >
                            {cand.name} ({cand.mobileNumber})
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    2. Select Relationship Type
                  </label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setRelationshipType("parent")}
                      className={`flex-1 py-2 border rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                        relationshipType === "parent"
                          ? "border-whatsapp-green bg-whatsapp-light text-whatsapp-green"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Linked Person is Parent
                    </button>
                    <button
                      type="button"
                      onClick={() => setRelationshipType("child")}
                      className={`flex-1 py-2 border rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                        relationshipType === "child"
                          ? "border-whatsapp-green bg-whatsapp-light text-whatsapp-green"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Linked Person is Child
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={linkageLoading || !selectedRelativeId}
                  className="w-full py-2.5 bg-whatsapp-green text-white font-bold rounded-xl text-xs shadow-md hover:bg-whatsapp-teal disabled:opacity-50 mt-2 active:scale-[0.98] cursor-pointer border-0"
                >
                  {linkageLoading ? "Linking..." : "Link Family Member"}
                </button>
              </form>
            ) : (
              /* Tab 2: Register & Add New */
              <form onSubmit={handleCreateAndLinkMember} className="space-y-3.5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Relationship Role
                  </label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setRelationshipType("parent")}
                      className={`flex-1 py-2 border rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                        relationshipType === "parent"
                          ? "border-whatsapp-green bg-whatsapp-light text-whatsapp-green"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      New Person is Parent
                    </button>
                    <button
                      type="button"
                      onClick={() => setRelationshipType("child")}
                      className={`flex-1 py-2 border rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                        relationshipType === "child"
                          ? "border-whatsapp-green bg-whatsapp-light text-whatsapp-green"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      New Person is Child
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={newMemberMobile}
                      onChange={(e) => setNewMemberMobile(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sex</label>
                    <select
                      value={newMemberSex}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewMemberSex(val);
                        // Auto default marital status
                        if (relationshipType === "parent") {
                          setNewMemberMarital("Married");
                        }
                      }}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Marital</label>
                    <select
                      value={newMemberMarital}
                      onChange={(e) => setNewMemberMarital(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
                    >
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                      <option>Separated</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Age (Years)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={newMemberAge}
                      onChange={(e) => setNewMemberAge(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-2xl text-[9px] text-slate-450 leading-relaxed font-semibold">
                  💡 <strong>Info:</strong> New members will have their Gotra and address auto-synced with <strong>{activeProfileUser.name}</strong>, and get registered with default login password <code>Community123</code>.
                </div>

                <button
                  type="submit"
                  disabled={linkageLoading}
                  className="w-full py-2.5 bg-whatsapp-green text-white font-bold rounded-xl text-xs shadow-md hover:bg-whatsapp-teal disabled:opacity-50 mt-2 active:scale-[0.98] cursor-pointer border-0"
                >
                  {linkageLoading ? "Registering..." : "Register & Link Member"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// SVG helper for AlertCircle
function AlertCirclePlaceholder() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  );
}
