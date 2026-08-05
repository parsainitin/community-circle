"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Phone,
  Shield,
  Heart,
  MapPin,
  GraduationCap,
  Briefcase,
  Users,
  UserPlus,
  Link2,
  X,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Edit,
  Camera,
} from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";

interface UserType {
  _id: string;
  name: string;
  phone: string;
  mobileNumber: string;
  gotra?: string;
  kulDevi?: string;
  address?: string;
  city?: string;
  village?: string;
  age?: number;
  sex?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  avatar?: string;
  familyMembers: string[];
  education?: string;
  institution?: string;
  occupationType?: string;
  profession?: string;
  company?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
}

interface FamilyTreeNode {
  _id: string;
  name: string;
  phone?: string;
  mobileNumber?: string;
  gotra?: string;
  kulDevi?: string;
  avatar?: string;
  sex?: string;
  city?: string;
  village?: string;
  spouse?: Omit<FamilyTreeNode, "children" | "spouse"> | null;
  children?: FamilyTreeNode[];
}

interface FamilyTreeData {
  user: {
    _id: string;
    name: string;
    phone: string;
    mobileNumber: string;
    gotra?: string;
    kulDevi?: string;
    avatar?: string;
    sex?: string;
    city?: string;
    village?: string;
    spouse?: Omit<FamilyTreeNode, "children" | "spouse"> | null;
  };
  ancestors: FamilyTreeNode[];
  descendants: FamilyTreeNode[];
}

interface TreeNodeComponentProps {
  node: FamilyTreeNode;
  isActive?: boolean;
  profileUserId: string;
  router: any;
  setRelationshipType: (type: "parent" | "child" | "") => void;
  setLinkageTargetUser: (user: { _id: string; name: string; gotra?: string; kulDevi?: string; address?: string; city?: string; village?: string } | null) => void;
  setLinkageModalOpen: (open: boolean) => void;
  renderTreeNode: (node: any, isActive: boolean) => React.ReactNode;
}

const TreeNodeComponent = ({
  node,
  isActive = false,
  profileUserId,
  router,
  setRelationshipType,
  setLinkageTargetUser,
  setLinkageModalOpen,
  renderTreeNode,
}: TreeNodeComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node couple / person */}
      <div className="relative flex flex-col items-center">
        {/* Render node avatar(s) */}
        {renderTreeNode(node, isActive)}
        
        {/* Expand / Collapse Button if they have children */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="absolute -bottom-2 z-10 w-5 h-5 rounded-full bg-white border border-slate-200 hover:border-whatsapp-green flex items-center justify-center text-slate-500 shadow-sm cursor-pointer hover:text-whatsapp-green active:scale-90 transition-all"
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Children branches (recursive) */}
      {hasChildren && isExpanded && (
        <div className="w-full flex flex-col items-center mt-1">
          {/* Vertical line down from parent */}
          <div className="w-0.5 h-3.5 bg-slate-355" />
          
          <div className="flex relative justify-center pt-3.5 min-w-max flex-nowrap px-4">
            {/* Horizontal connector bar linking siblings */}
            {node.children!.length > 0 && (
              <div className="absolute top-0 left-[15%] right-[15%] h-0.5 bg-slate-355" />
            )}
            
            {node.children!.map((child) => (
              <div
                key={child._id}
                className="flex flex-col items-center px-2 relative min-w-[100px]"
              >
                {/* Vertical branch line for this child */}
                <div className="w-0.5 h-3.5 bg-slate-355 absolute -top-3.5" />
                
                {/* Recursive call */}
                <TreeNodeComponent
                  node={child}
                  profileUserId={profileUserId}
                  router={router}
                  setRelationshipType={setRelationshipType}
                  setLinkageTargetUser={setLinkageTargetUser}
                  setLinkageModalOpen={setLinkageModalOpen}
                  renderTreeNode={renderTreeNode}
                />
              </div>
            ))}

            {/* Quick Link Child Option Node */}
            <div className="flex flex-col items-center px-2 relative min-w-[100px]">
              <div className="w-0.5 h-3.5 bg-slate-355 absolute -top-3.5" />
              <button
                onClick={() => {
                  setRelationshipType("child");
                  setLinkageTargetUser({
                    _id: node._id,
                    name: node.name,
                    gotra: node.gotra,
                    kulDevi: node.kulDevi,
                    city: node.city,
                    village: node.village,
                  });
                  setLinkageModalOpen(true);
                }}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed flex items-center justify-center text-slate-400 cursor-pointer active:scale-90 transition-transform"
                title={`Link Child to ${node.name}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* If they have no children, show a quick link child button under the node */}
      {!hasChildren && (
        <div className="w-full flex flex-col items-center mt-1">
          <div className="w-0.5 h-3.5 bg-slate-355" />
          <button
            onClick={() => {
              setRelationshipType("child");
              setLinkageTargetUser({
                _id: node._id,
                name: node.name,
                gotra: node.gotra,
                kulDevi: node.kulDevi,
                city: node.city,
                village: node.village,
              });
              setLinkageModalOpen(true);
            }}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed flex items-center justify-center text-slate-400 cursor-pointer active:scale-90 transition-transform"
            title={`Link Child to ${node.name}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function UserProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user: currentUser, updateUser } = useAuth();

  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Lineage Tree state
  const [familyTree, setFamilyTree] = useState<FamilyTreeData | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [showAncestors, setShowAncestors] = useState(false);
  const [linkageTargetUser, setLinkageTargetUser] = useState<{ _id: string; name: string; gotra?: string; kulDevi?: string; address?: string; city?: string; village?: string } | null>(null);

  // Relative linkage states
  const [linkageModalOpen, setLinkageModalOpen] = useState(false);
  const [linkageTab, setLinkageTab] = useState<"search" | "create">("search");
  const [relationshipType, setRelationshipType] = useState<"parent" | "child" | "">("");

  // Edit Profile States
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit Avatar States
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUpdating, setAvatarUpdating] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editGotra, setEditGotra] = useState("");
  const [editKulDevi, setEditKulDevi] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editSex, setEditSex] = useState("Male");
  const [editMarital, setEditMarital] = useState("Single");
  const [editBloodGroup, setEditBloodGroup] = useState("");
  const [editEducation, setEditEducation] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editOccupationType, setEditOccupationType] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editLatitude, setEditLatitude] = useState<number | undefined>(undefined);
  const [editLongitude, setEditLongitude] = useState<number | undefined>(undefined);
  const [editGoogleMapsUrl, setEditGoogleMapsUrl] = useState<string>("");
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");

  const handleGetGeoLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setEditLatitude(lat);
        setEditLongitude(lng);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setEditGoogleMapsUrl(mapsUrl);
        setGpsSuccessMsg(`GPS Location updated! (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setLocatingGps(false);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const foundCity = addr.city || addr.town || addr.village || addr.suburb || addr.county;
            if (foundCity && !editCity) {
              setEditCity(foundCity);
            }
            if (data.display_name && !editAddress) {
              setEditAddress(data.display_name);
            }
          }
        } catch {}
      },
      (err) => {
        setLocatingGps(false);
        alert("Failed to retrieve GPS location. Please check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [communityCities, setCommunityCities] = useState<string[]>([]);
  const [communityGotras, setCommunityGotras] = useState<string[]>([]);
  const [communityKulDevis, setCommunityKulDevis] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/community/current")
      .then((r) => r.json())
      .then((d) => {
        if (d.community) {
          if (d.community.cities && d.community.cities.length > 0) setCommunityCities(d.community.cities);
          if (d.community.gotras && d.community.gotras.length > 0) setCommunityGotras(d.community.gotras);
          if (d.community.kulDevis && d.community.kulDevis.length > 0) setCommunityKulDevis(d.community.kulDevis);
        }
      })
      .catch(() => {});
  }, []);

  const canEditProfile = () => {
    if (!currentUser || !profileUser) return false;
    if (currentUser._id === profileUser._id) return true;

    if (familyTree) {
      // Check if current logged-in user matches any ancestor node
      const inAncestors = familyTree.ancestors.some(
        (anc) => anc._id === currentUser._id || anc.spouse?._id === currentUser._id
      );
      if (inAncestors) return true;

      // Check if current logged-in user matches any descendant node recursively
      const checkInTree = (node: any): boolean => {
        if (node._id === currentUser._id || node.spouse?._id === currentUser._id) return true;
        if (node.children && node.children.length > 0) {
          return node.children.some((child: any) => checkInTree(child));
        }
        return false;
      };
      const inDescendants = familyTree.descendants.some((dec) => checkInTree(dec));
      if (inDescendants) return true;

      // Check if spouse of B
      if (familyTree.user.spouse?._id === currentUser._id) return true;
    }
    return false;
  };
  
  // Tab 1: Search Linkage
  const [linkageSearch, setLinkageSearch] = useState("");
  const [allUsersList, setAllUsersList] = useState<UserType[]>([]);
  const [selectedRelativeId, setSelectedRelativeId] = useState("");

  // Tab 2: Create relative linkage
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberMobile, setNewMemberMobile] = useState("");
  const [newMemberAge, setNewMemberAge] = useState("");
  const [newMemberSex, setNewMemberSex] = useState("Male");
  const [newMemberMarital, setNewMemberMarital] = useState("Single");
  const [newMemberCity, setNewMemberCity] = useState("");
  const [newMemberVillage, setNewMemberVillage] = useState("");

  const [linkageLoading, setLinkageLoading] = useState(false);
  const [linkageError, setLinkageError] = useState<string | null>(null);
  const [linkageSuccess, setLinkageSuccess] = useState<string | null>(null);

  // Load profile user and tree
  useEffect(() => {
    if (!id) return;
    
    const fetchProfileData = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProfileUser(data);
          setLinkageTargetUser(data);
        } else {
          console.error("Failed to load user profile");
        }
      } catch (err) {
        console.error("Error fetching user profile", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchFamilyTreeData = async () => {
      setTreeLoading(true);
      try {
        const res = await fetch(`/api/users/${id}/family-tree`);
        if (res.ok) {
          const data = await res.json();
          setFamilyTree(data);
        }
      } catch (e) {
        console.error("Failed to load lineage tree", e);
      } finally {
        setTreeLoading(false);
      }
    };

    fetchProfileData();
    fetchFamilyTreeData();
  }, [id]);

  const handleOpenEditModal = () => {
    if (!profileUser) return;
    setEditName(profileUser.name || "");
    setEditMobile(profileUser.mobileNumber || "");
    setEditGotra(profileUser.gotra || "");
    setEditKulDevi(profileUser.kulDevi || "");
    setEditAddress(profileUser.address || "");
    setEditCity(profileUser.city || "");
    setEditVillage(profileUser.village || "");
    setEditAge(profileUser.age ? String(profileUser.age) : "");
    setEditSex(profileUser.sex || "Male");
    setEditMarital(profileUser.maritalStatus || "Single");
    setEditBloodGroup(profileUser.bloodGroup || "");
    setEditEducation(profileUser.education || "");
    setEditInstitution(profileUser.institution || "");
    setEditOccupationType(profileUser.occupationType || "");
    setEditProfession(profileUser.profession || "");
    setEditCompany(profileUser.company || "");
    setEditLatitude(profileUser.latitude);
    setEditLongitude(profileUser.longitude);
    setEditGoogleMapsUrl(profileUser.googleMapsUrl || "");
    setGpsSuccessMsg(
      profileUser.latitude && profileUser.longitude
        ? `📍 Current GPS Pin (${profileUser.latitude.toFixed(4)}, ${profileUser.longitude.toFixed(4)})`
        : ""
    );
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser) return;
    if (!editName.trim()) {
      setEditError("Name is required");
      return;
    }
    if (!editMobile.trim()) {
      setEditError("Mobile number is required");
      return;
    }
    if (!editCity.trim()) {
      setEditError("City is required");
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/users/${profileUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          mobileNumber: editMobile.trim(),
          phone: editMobile.trim(),
          gotra: editGotra.trim(),
          kulDevi: editKulDevi.trim(),
          address: editAddress.trim(),
          city: editCity.trim(),
          village: editVillage.trim(),
          age: editAge ? Number(editAge) : undefined,
          sex: editSex,
          maritalStatus: editMarital,
          bloodGroup: editBloodGroup || undefined,
          education: editEducation.trim() || undefined,
          institution: editInstitution.trim() || undefined,
          occupationType: editOccupationType || undefined,
          profession: editProfession.trim() || undefined,
          company: editCompany.trim() || undefined,
          latitude: editLatitude,
          longitude: editLongitude,
          googleMapsUrl: editGoogleMapsUrl || (editLatitude && editLongitude ? `https://www.google.com/maps?q=${editLatitude},${editLongitude}` : undefined),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update profile details");
        setEditLoading(false);
        return;
      }

      setProfileUser(data);

      if (currentUser && currentUser._id === profileUser._id) {
        updateUser(data);
      }

      setEditModalOpen(false);

      // Refresh family tree
      const treeRes = await fetch(`/api/users/${id}/family-tree`);
      if (treeRes.ok) {
        const treeData = await treeRes.json();
        setFamilyTree(treeData);
      }
    } catch (err: any) {
      setEditError(err.message || "An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileUser) return;

    setAvatarUpdating(true);
    try {
      const compressed = await compressImage(file);
      if (!checkFileSize(compressed, 5)) {
        alert("Selected file exceeds the maximum allowed size of 5MB");
        setAvatarUpdating(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", compressed);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        alert(uploadData.error || "Failed to upload avatar");
        setAvatarUpdating(false);
        return;
      }

      const updateRes = await fetch(`/api/users/${profileUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: uploadData.url }),
      });

      const updateData = await updateRes.json();

      if (updateRes.ok) {
        setProfileUser(updateData);
        if (currentUser && currentUser._id === profileUser._id) {
          updateUser({ avatar: uploadData.url });
        }
        // Refresh family tree
        const treeRes = await fetch(`/api/users/${id}/family-tree`);
        if (treeRes.ok) {
          const treeData = await treeRes.json();
          setFamilyTree(treeData);
        }
      } else {
        alert("Failed to save avatar details to profile");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update profile picture");
    } finally {
      setAvatarUpdating(false);
    }
  };

  // Load all users for Search tab candidate dropdown
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setAllUsersList(data || []);
        }
      } catch (err) {
        console.error("Failed to load users for search linkage candidates", err);
      }
    };
    if (linkageModalOpen && linkageTab === "search") {
      fetchAllUsers();
    }
  }, [linkageModalOpen, linkageTab]);

  useEffect(() => {
    if (linkageModalOpen) {
      const target = linkageTargetUser || profileUser;
      setNewMemberCity(target?.city || profileUser?.city || "");
      setNewMemberVillage(target?.village || profileUser?.village || "");
      setNewMemberName("");
      setNewMemberMobile("");
      setNewMemberAge("");
      setNewMemberSex("Male");
      setNewMemberMarital("Single");
    }
  }, [linkageModalOpen, linkageTargetUser, profileUser]);

  // Filter candidates for relative linkage
  const linkageCandidates = allUsersList.filter((u) => {
    if (!profileUser) return false;
    const targetId = linkageTargetUser?._id || profileUser._id;
    if (u._id === targetId) return false;

    // Filter out candidates already present in the ancestors or descendants tree to avoid cycle
    if (familyTree) {
      const isAncestor = familyTree.ancestors.some((anc) => anc._id === u._id);
      const isDescendant = familyTree.descendants.some((dec) => dec._id === u._id);
      if (isAncestor || isDescendant) return false;
    }

    return (
      u.name.toLowerCase().includes(linkageSearch.toLowerCase()) ||
      u.mobileNumber.includes(linkageSearch)
    );
  });

  const fetchFamilyTree = async (userId: string) => {
    setTreeLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/family-tree`);
      if (res.ok) {
        const data = await res.json();
        setFamilyTree(data);
      }
    } catch (e) {
      console.error("Failed to load lineage tree", e);
    } finally {
      setTreeLoading(false);
    }
  };

  // Submit Family Link Request (Search Tab)
  const handleLinkFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser || !selectedRelativeId || !relationshipType) return;

    setLinkageLoading(true);
    setLinkageError(null);
    setLinkageSuccess(null);

    try {
      const targetId = linkageTargetUser?._id || profileUser._id;
      const res = await fetch(`/api/users/${targetId}/link-family`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relativeId: selectedRelativeId,
          relationshipType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLinkageError(data.error || "Failed to establish family linkage");
        setLinkageLoading(false);
        return;
      }

      setLinkageSuccess("Linage tree linked successfully!");
      setLinkageSearch("");
      setSelectedRelativeId("");
      setRelationshipType("");

      // Refresh family tree
      fetchFamilyTree(profileUser._id);

      setTimeout(() => {
        setLinkageModalOpen(false);
        setLinkageSuccess(null);
      }, 1500);
    } catch (err: any) {
      setLinkageError(err.message || "An error occurred during linkage setup");
    } finally {
      setLinkageLoading(false);
    }
  };

  // Submit Register & Link Member Request (Create Tab)
  const handleCreateAndLinkMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser || !relationshipType) return;
    if (!newMemberName.trim()) {
      setLinkageError("Name is required");
      return;
    }
    if (relationshipType !== "child" && !newMemberMobile.trim()) {
      setLinkageError("Mobile Number is required");
      return;
    }
    if (!newMemberCity.trim()) {
      setLinkageError("City is required");
      return;
    }

    setLinkageLoading(true);
    setLinkageError(null);
    setLinkageSuccess(null);

    try {
      let parentRelationship = "";
      let parentId = "";

      if (relationshipType === "child") {
        parentId = linkageTargetUser?._id || profileUser._id;
        parentRelationship = newMemberSex === "Female" ? "Daughter" : "Son";
      }

      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMemberName.trim(),
          mobileNumber: newMemberMobile.trim() || undefined,
          password: undefined, // default on backend
          gotra: linkageTargetUser?.gotra || profileUser.gotra || "",
          kulDevi: linkageTargetUser?.kulDevi || profileUser.kulDevi || "",
          address: linkageTargetUser?.address || profileUser.address || "",
          city: newMemberCity.trim(),
          village: newMemberVillage.trim(),
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
        const targetId = linkageTargetUser?._id || profileUser._id;
        const linkRes = await fetch(`/api/users/${targetId}/link-family`, {
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
        await fetch(`/api/users/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentRelationship: targetRel,
          }),
        });
      }

      setLinkageSuccess("New profile registered and linked successfully!");
      setNewMemberName("");
      setNewMemberMobile("");
      setNewMemberAge("");
      setNewMemberSex("Male");
      setNewMemberMarital("Single");
      setRelationshipType("");

      // Refresh family tree
      fetchFamilyTree(profileUser._id);

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

  const renderTreeNode = (
    node: {
      _id: string;
      name: string;
      avatar?: string;
      sex?: string;
      spouse?: Omit<FamilyTreeNode, "children" | "spouse"> | null;
    },
    isActive: boolean
  ) => {
    const hasSpouse = !!node.spouse;

    const renderSingleAvatar = (
      id: string,
      name: string,
      avatar?: string,
      sex?: string
    ) => {
      const highlight = profileUser?._id === id;
      return (
        <div className="relative group select-none flex flex-col items-center">
          <img
            src={
              avatar ||
              (sex === "Female"
                ? "/avatar_female.jpg"
                : sex === "Male"
                ? "/avatar_male.jpg"
                : "/avatar.jpg")
            }
            alt={name}
            onClick={() => {
              if (profileUser?._id !== id) {
                router.push(`/profile/${id}`);
              }
            }}
            className={`w-11 h-11 rounded-full object-cover shrink-0 shadow-md border-2 transition-transform duration-100 active:scale-95 cursor-pointer ${
              highlight
                ? "border-whatsapp-green bg-whatsapp-light scale-105"
                : "border-slate-200 hover:border-slate-400"
            }`}
          />
          {/* Hover Tooltip */}
          <div className="absolute bottom-full mb-2.5 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 shadow-md">
            {name} {highlight ? "(Current)" : "(View Profile)"}
          </div>
        </div>
      );
    };

    if (hasSpouse && node.spouse) {
      return (
        <div className="flex items-center space-x-1.5 bg-slate-50/70 hover:bg-slate-100/50 p-1.5 rounded-full border border-slate-200/60 shadow-xs transition-colors">
          {renderSingleAvatar(node._id, node.name, node.avatar, node.sex)}
          <Heart className="w-3 h-3 text-rose-500 fill-rose-400 shrink-0" />
          {renderSingleAvatar(
            node.spouse._id,
            node.spouse.name,
            node.spouse.avatar,
            node.spouse.sex
          )}
        </div>
      );
    }

    return renderSingleAvatar(node._id, node.name, node.avatar, node.sex);
  };

  if (loadingProfile) {
    return (
      <div className="flex justify-center items-center py-12 min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="bg-white rounded-3xl p-6 text-center select-none shadow-xs border border-slate-100">
        <h3 className="text-sm font-extrabold text-slate-800 mb-2">Profile Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">This profile may have been removed or does not exist.</p>
        <button
          onClick={() => router.push("/directory")}
          className="px-4 py-2 bg-whatsapp-green text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer border-0"
        >
          Go back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* Dynamic Profile Header / App Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex items-center space-x-3">
        <button
          onClick={() => router.push("/directory")}
          className="p-2 hover:bg-slate-100 rounded-full cursor-pointer flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-slate-800 truncate">Member Profile</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {profileUser.name} Details
          </p>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-5">
        <div className="flex items-center space-x-4">
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          <div className="relative">
            {profileUser.avatar ? (
              <img
                src={profileUser.avatar}
                alt={profileUser.name}
                className="w-14 h-14 rounded-full object-cover shrink-0 shadow-xs border border-slate-200"
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg uppercase shadow-xs shrink-0 ${getAvatarColor(
                  profileUser.name
                )}`}
              >
                {getInitials(profileUser.name)}
              </div>
            )}
            {canEditProfile() && (
              <button
                disabled={avatarUpdating}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-whatsapp-green text-white p-1 rounded-full shadow-md hover:bg-whatsapp-teal transition-transform active:scale-90 cursor-pointer border border-white"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
            {avatarUpdating && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center rounded-full">
                <div className="w-4 h-4 border-2 border-whatsapp-green border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-extrabold text-slate-800 truncate">{profileUser.name}</h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">{profileUser.mobileNumber}</p>
            {profileUser.bloodGroup && (
              <span className="inline-block bg-red-50 text-red-600 rounded-full font-bold px-2 py-0.5 text-[9px] mt-1.5 border border-red-100">
                Blood Group: {profileUser.bloodGroup}
              </span>
            )}
            {canEditProfile() && (
              <button
                onClick={handleOpenEditModal}
                className="flex items-center space-x-1 px-2.5 py-1 bg-whatsapp-light text-whatsapp-green hover:bg-whatsapp-green hover:text-white rounded-xl text-[10px] font-bold border border-whatsapp-green/20 transition-all cursor-pointer active:scale-95 mt-2 max-w-max"
              >
                <Edit className="w-3 h-3" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Bio Details */}
        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 space-y-3 text-xs text-slate-600">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <strong>Phone:</strong> {profileUser.phone}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <strong>Gotra:</strong> {profileUser.gotra || "N/A"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <strong>KulDevi:</strong> {profileUser.kulDevi || "N/A"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 font-bold">Age</div>
              <div className="font-extrabold text-slate-700 mt-0.5">{profileUser.age || "N/A"}</div>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 font-bold">Sex</div>
              <div className="font-extrabold text-slate-700 mt-0.5">{profileUser.sex || "N/A"}</div>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 font-bold">Marital</div>
              <div className="font-extrabold text-slate-700 mt-0.5 truncate">
                {profileUser.maritalStatus || "N/A"}
              </div>
            </div>
          </div>
          {(profileUser.address || profileUser.city || profileUser.village) && (
            <div className="flex items-start justify-between space-x-2 pt-1 border-t border-slate-100">
              <div className="flex items-start space-x-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span className="min-w-0">
                  <strong>Address:</strong> {profileUser.address || "N/A"}
                  {(profileUser.city || profileUser.village) && (
                    <span className="text-slate-500 font-semibold ml-1">
                      ({[profileUser.city, profileUser.village].filter(Boolean).join(", ")})
                    </span>
                  )}
                </span>
              </div>
              {(profileUser.googleMapsUrl || (profileUser.latitude && profileUser.longitude)) && (
                <a
                  href={profileUser.googleMapsUrl || `https://www.google.com/maps?q=${profileUser.latitude},${profileUser.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black border border-indigo-200/80 transition-all flex items-center space-x-1 shrink-0 cursor-pointer text-decoration-none"
                  title="Open in Google Maps"
                >
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  <span>Map Pin</span>
                </a>
              )}
            </div>
          )}
          {(profileUser.education || profileUser.profession || profileUser.occupationType) && (
            <div className="border-t border-slate-100 pt-2.5 space-y-2 mt-2">
              {(profileUser.education || profileUser.institution) && (
                <div className="flex items-start space-x-2">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Education:</strong> {profileUser.education || "N/A"}
                    {profileUser.institution && ` at ${profileUser.institution}`}
                  </span>
                </div>
              )}
              {(profileUser.profession || profileUser.occupationType || profileUser.company) && (
                <div className="flex items-start space-x-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Job / Profession:</strong> {profileUser.profession || profileUser.occupationType || "N/A"}
                    {profileUser.company && ` at ${profileUser.company}`}
                    {profileUser.profession && profileUser.occupationType && ` (${profileUser.occupationType})`}
                  </span>
                </div>
              )}
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
              onClick={() => {
                setLinkageTargetUser(profileUser);
                setLinkageModalOpen(true);
              }}
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
            <div className="py-4 text-center text-slate-400 text-xs font-semibold">No family data loaded.</div>
          ) : (
            <div className="w-full overflow-x-auto py-4 bg-slate-50/20 rounded-2xl border border-slate-100 min-h-[160px]">
              {/* HIERARCHICAL flex tree */}
              <div className="flex flex-col items-center min-w-max mx-auto py-2">
                {/* Ancestors chain */}
                <div className="flex flex-col items-center">
                  {/* Always show Add Parent option if ancestors list is empty */}
                  {(!familyTree.ancestors || familyTree.ancestors.length === 0) && (
                    <>
                      <button
                        onClick={() => {
                          setRelationshipType("parent");
                          setLinkageTargetUser(profileUser);
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
                      <button
                        onClick={() => setShowAncestors(!showAncestors)}
                        className="flex items-center space-x-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-605 rounded-full text-[9px] font-extrabold transition-all mb-2 cursor-pointer active:scale-95 border border-slate-200/40"
                      >
                        {showAncestors ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            <span>Hide Ancestors ({familyTree.ancestors.length})</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            <span>Show Ancestors ({familyTree.ancestors.length})</span>
                          </>
                        )}
                      </button>

                      {showAncestors && (
                        <div className="flex flex-col items-center animate-fade-in">
                          {/* Option to link parent at the very top of ancestors */}
                          <button
                            onClick={() => {
                              setRelationshipType("parent");
                              // Set target to the topmost ancestor to allow extending tree further up
                              const topAncestor = familyTree.ancestors[familyTree.ancestors.length - 1];
                              setLinkageTargetUser(topAncestor);
                              setLinkageModalOpen(true);
                            }}
                            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed flex items-center justify-center text-slate-400 cursor-pointer active:scale-90 transition-transform mb-1.5"
                            title="Link Parent Node"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <div className="w-0.5 h-3.5 bg-slate-350" />

                          {familyTree.ancestors
                            .slice()
                            .reverse()
                            .map((anc) => (
                              <React.Fragment key={anc._id}>
                                {renderTreeNode(anc, false)}
                                <div className="w-0.5 h-3.5 bg-slate-355" />
                              </React.Fragment>
                            ))}
                        </div>
                      )}
                      {!showAncestors && <div className="w-0.5 h-3.5 bg-slate-350" />}
                    </div>
                  )}
                </div>

                {/* Recursive collapsible tree representation */}
                <TreeNodeComponent
                  node={{
                    ...familyTree.user,
                    children: familyTree.descendants
                  }}
                  isActive={true}
                  profileUserId={profileUser._id}
                  router={router}
                  setRelationshipType={setRelationshipType}
                  setLinkageTargetUser={setLinkageTargetUser}
                  setLinkageModalOpen={setLinkageModalOpen}
                  renderTreeNode={renderTreeNode}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RELATIVE LINKAGE DIALOG MODAL */}
      {linkageModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-fade-in select-none">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-whatsapp-green font-bold">
                <Link2 className="w-4 h-4 shrink-0" />
                <h3 className="text-slate-800 text-sm">Link Relative to {linkageTargetUser?.name || "Member"}</h3>
              </div>
              <button
                onClick={() => setLinkageModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
              >
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
                        <div className="p-2 text-center text-[10px] text-slate-400 font-medium">No candidates available</div>
                      ) : (
                        linkageCandidates.map((cand) => (
                          <div
                            key={cand._id}
                            onClick={() => {
                              setSelectedRelativeId(cand._id);
                              setLinkageSearch(`${cand.name} (${cand.mobileNumber})`);
                            }}
                            className={`p-2 text-xs cursor-pointer hover:bg-whatsapp-light/20 transition-all font-semibold ${
                              selectedRelativeId === cand._id
                                ? "bg-whatsapp-light/35 text-whatsapp-green"
                                : "text-slate-600"
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
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Full Name *
                    </label>
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
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      {relationshipType === "child" ? "Mobile Number" : "Mobile Number *"}
                    </label>
                    <input
                      type="tel"
                      required={relationshipType !== "child"}
                      placeholder={relationshipType === "child" ? "Optional" : "e.g. 9876543210"}
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
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={newMemberAge}
                      onChange={(e) => setNewMemberAge(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indore"
                      value={newMemberCity}
                      onChange={(e) => setNewMemberCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Village
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ashta"
                      value={newMemberVillage}
                      onChange={(e) => setNewMemberVillage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-2xl text-[9px] text-slate-450 leading-relaxed font-semibold">
                  💡 <strong>Info:</strong> New members will have their Gotra, KulDevi, and address auto-synced with{" "}
                  <strong>{profileUser.name}</strong>, and get registered with default login password{" "}
                  <code>Community123</code>.
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

      {/* EDIT PROFILE DIALOG MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-fade-in select-none max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-whatsapp-green font-bold">
                <Edit className="w-4 h-4 shrink-0" />
                <h3 className="text-slate-800 text-sm">Edit Profile: {profileUser?.name}</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer bg-transparent border-0"
              >
                <X className="w-4.5 h-4.5 text-slate-500" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter mobile"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Gotra
                  </label>
                  {communityGotras.length > 0 ? (
                    <select
                      value={editGotra}
                      onChange={(e) => setEditGotra(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800 cursor-pointer"
                    >
                      <option value="">— Select Gotra —</option>
                      {communityGotras.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                      {editGotra && !communityGotras.includes(editGotra) && (
                        <option value={editGotra}>{editGotra}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Kashyap"
                      value={editGotra}
                      onChange={(e) => setEditGotra(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    KulDevi
                  </label>
                  {communityKulDevis.length > 0 ? (
                    <select
                      value={editKulDevi}
                      onChange={(e) => setEditKulDevi(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800 cursor-pointer"
                    >
                      <option value="">— Select KulDevi —</option>
                      {communityKulDevis.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                      {editKulDevi && !communityKulDevis.includes(editKulDevi) && (
                        <option value={editKulDevi}>{editKulDevi}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Bijasan"
                      value={editKulDevi}
                      onChange={(e) => setEditKulDevi(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                    />
                  )}
                </div>
              </div>

              {/* Location Fields */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Residential Address
                </label>
                <textarea
                  placeholder="Enter address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    City *
                  </label>
                  {communityCities.length > 0 ? (
                    <select
                      required
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800 cursor-pointer"
                    >
                      <option value="">— Select City —</option>
                      {communityCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      {editCity && !communityCities.includes(editCity) && (
                        <option value={editCity}>{editCity}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indore"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Village
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ashta"
                    value={editVillage}
                    onChange={(e) => setEditVillage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                  />
                </div>
              </div>

              {/* GPS Geo Location Capture */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-[11px]">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>GPS Map Pin Location</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetGeoLocation}
                    disabled={locatingGps}
                    className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-[10px] rounded-xl shadow-xs transition-all flex items-center space-x-1 cursor-pointer border-0 disabled:opacity-50"
                  >
                    {locatingGps ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3" />
                        <span>{editLatitude ? "📍 Re-pin GPS Location" : "📍 Pin My GPS Location"}</span>
                      </>
                    )}
                  </button>
                </div>

                {gpsSuccessMsg ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-200 text-[10px] font-bold">
                    <span>{gpsSuccessMsg}</span>
                    {editGoogleMapsUrl && (
                      <a
                        href={editGoogleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline hover:text-indigo-800 ml-2"
                      >
                        Preview Map
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Pin your exact GPS location so community members can locate your address on Google Maps via Directory.
                  </p>
                )}
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="Age"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Sex
                  </label>
                  <select
                    value={editSex}
                    onChange={(e) => setEditSex(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:border-whatsapp-green outline-hidden font-semibold"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Blood Group
                  </label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:border-whatsapp-green outline-hidden font-semibold"
                  >
                    <option value="">N/A</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>O+</option>
                    <option>O-</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Marital Status
                </label>
                <select
                  value={editMarital}
                  onChange={(e) => setEditMarital(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:border-whatsapp-green outline-hidden font-semibold"
                >
                  <option>Single</option>
                  <option>Married</option>
                  <option>Divorced</option>
                  <option>Widowed</option>
                  <option>Separated</option>
                </select>
              </div>

              {/* Education & Profession */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Highest Education
                  </label>
                  <input
                    type="text"
                    placeholder="Degree/Qualification"
                    value={editEducation}
                    onChange={(e) => setEditEducation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Institution
                  </label>
                  <input
                    type="text"
                    placeholder="College/University"
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Occupation
                  </label>
                  <select
                    value={editOccupationType}
                    onChange={(e) => setEditOccupationType(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-800 focus:border-whatsapp-green outline-hidden font-semibold"
                  >
                    <option value="">Select Occupation</option>
                    <option value="Salaried">Salaried</option>
                    <option value="Self-Employed">Business / Self-Employed</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired</option>
                    <option value="Homemaker">Homemaker</option>
                    <option value="Unemployed">Unemployed</option>
                  </select>
                </div>

                <div className="col-span-1 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={editProfession}
                    onChange={(e) => setEditProfession(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                  />
                </div>

                <div className="col-span-1 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="Company/Business"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green text-xs font-semibold outline-hidden text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="w-full py-2.5 bg-whatsapp-green text-white font-bold rounded-xl text-xs shadow-md hover:bg-whatsapp-teal disabled:opacity-50 mt-2 active:scale-[0.98] cursor-pointer border-0"
              >
                {editLoading ? "Saving Changes..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
