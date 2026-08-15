"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Phone, Lock, Key, User, Home, Shield, Award, Heart, Camera, GraduationCap, Briefcase, MapPin, Send, Eye, EyeOff, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";
import CommunityBrand from "@/components/CommunityBrand";

type AuthTab = "signin" | "signup" | "forgot";

export default function AuthPage() {
  const { login, signup, sendResetOtp, forgotPassword, visitorLogin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visitorMobile, setVisitorMobile] = useState("");
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorError, setVisitorError] = useState<string | null>(null);

  // Forgot password specific states
  const [forgotMethod, setForgotMethod] = useState<"otp" | "key">("otp");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetKey, setResetKey] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gotra, setGotra] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [village, setVillage] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("Male");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [bloodGroup, setBloodGroup] = useState("");
  const [usersList, setUsersList] = useState<{ _id: string; name: string; mobileNumber: string }[]>([]);
  const [parentId, setParentId] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [signupStep, setSignupStep] = useState(1);
  const [parentRelationship, setParentRelationship] = useState("");
  const [addressSameAsParent, setAddressSameAsParent] = useState(false);
  const [fetchedParentAddress, setFetchedParentAddress] = useState("");
  const [fetchedParentCity, setFetchedParentCity] = useState("");
  const [fetchedParentVillage, setFetchedParentVillage] = useState("");
  const [fetchedParentGotra, setFetchedParentGotra] = useState("");
  const [kulDevi, setKulDevi] = useState("");
  const [fetchedParentKulDevi, setFetchedParentKulDevi] = useState("");
  const [education, setEducation] = useState("");
  const [institution, setInstitution] = useState("");
  const [occupationType, setOccupationType] = useState("");
  const [profession, setProfession] = useState("");
  const [company, setCompany] = useState("");

  const handleParentChange = async (selectedParentId: string) => {
    setParentId(selectedParentId);
    if (!selectedParentId) {
      setFetchedParentAddress("");
      setFetchedParentCity("");
      setFetchedParentVillage("");
      setFetchedParentGotra("");
      setFetchedParentKulDevi("");
      setParentRelationship("");
      setAddressSameAsParent(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/${selectedParentId}`);
      if (res.ok) {
        const data = await res.json();
        setFetchedParentAddress(data.address || "");
        setFetchedParentCity(data.city || "");
        setFetchedParentVillage(data.village || "");
        setFetchedParentGotra(data.gotra || "");
        setFetchedParentKulDevi(data.kulDevi || "");
        setAddressSameAsParent(true);
        if (data.address) {
          setAddress(data.address);
        }
        if (data.city) {
          setCity(data.city);
        }
        if (data.village) {
          setVillage(data.village);
        }
        if (data.gotra) {
          setGotra(data.gotra);
        }
        if (data.kulDevi) {
          setKulDevi(data.kulDevi);
        }
      }
    } catch (err) {
      console.error("Failed to fetch parent details:", err);
    }
  };

  const handleAddressSameAsParentChange = (checked: boolean) => {
    setAddressSameAsParent(checked);
    if (checked) {
      if (fetchedParentAddress) setAddress(fetchedParentAddress);
      if (fetchedParentCity) setCity(fetchedParentCity);
      if (fetchedParentVillage) setVillage(fetchedParentVillage);
    }
  };

  const handleNextStep = () => {
    setError(null);
    if (signupStep === 1) {
      if (!name.trim()) {
        setError("Please enter your full name");
        return;
      }
    }
    if (signupStep === 2) {
      if (parentId && !parentRelationship) {
        setError("Please select your relationship to the parent");
        return;
      }
    }
    if (signupStep === 3) {
      if (!mobileNumber.trim()) {
        setError("Please enter your mobile number");
        return;
      }
      if (!city.trim()) {
        setError("Please enter your city");
        return;
      }
    }
    if (signupStep === 4) {
      if (!bloodGroup) {
        setError("Please select your blood group");
        return;
      }
    }
    setSignupStep((prev) => prev + 1);
  };

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setUsersList(data || []);
        }
      } catch (e) {
        console.error("Failed to load users list", e);
      }
    };
    fetchUsers();
  }, [activeTab]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(mobileNumber, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Invalid credentials");
    }
  };

  const handleVisitorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVisitorError(null);
    const digits = visitorMobile.trim().replace(/\D/g, "");
    if (digits.length < 10) {
      setVisitorError("Please enter a valid 10-digit mobile number");
      return;
    }
    setVisitorLoading(true);
    const res = await visitorLogin(digits);
    setVisitorLoading(false);
    if (!res.success) {
      setVisitorError(res.error || "Could not start visitor session");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!bloodGroup) {
      setError("Please select your blood group");
      return;
    }
    setLoading(true);
    let finalAvatarUrl = "";
    if (avatarFile) {
      try {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error || "Failed to upload profile picture");
          setLoading(false);
          return;
        }
        finalAvatarUrl = uploadData.url;
      } catch (err: any) {
        setError("Failed to upload profile image");
        setLoading(false);
        return;
      }
    }

    const res = await signup({
      name,
      phone: phone || mobileNumber,
      mobileNumber,
      password,
      gotra,
      kulDevi,
      address,
      city,
      village,
      age: age ? Number(age) : undefined,
      sex,
      maritalStatus,
      bloodGroup,
      avatar: finalAvatarUrl,
      parentId: parentId || undefined,
      parentRelationship: parentRelationship || undefined,
      education: education || undefined,
      institution: institution || undefined,
      occupationType: occupationType || undefined,
      profession: profession || undefined,
      company: company || undefined,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to sign up");
    }
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    const cleanMobile = mobileNumber.trim().replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit registered mobile number.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSendingOtp(true);

    const res = await sendResetOtp(cleanMobile);
    setSendingOtp(false);

    if (res.success) {
      setOtpSent(true);
      setResendCountdown(60);
      setSuccess("OTP sent successfully to your WhatsApp number!");
    } else {
      setError(res.error || "Failed to send OTP. Please check your mobile number.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanMobile = mobileNumber.trim().replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit registered mobile number.");
      return;
    }

    if (forgotMethod === "otp") {
      if (!otpValue.trim() || otpValue.trim().length !== 6) {
        setError("Please enter the 6-digit OTP received on WhatsApp.");
        return;
      }
    } else {
      if (!resetKey.trim()) {
        setError("Please enter the Admin Reset Key provided by your Community Admin.");
        return;
      }
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await forgotPassword(
      cleanMobile,
      newPassword,
      forgotMethod === "otp" ? { otp: otpValue.trim() } : { resetKey: resetKey.trim() }
    );
    setLoading(false);

    if (res.success) {
      setSuccess("Password reset successfully! You can now sign in with your new password.");
      setActiveTab("signin");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setResetKey("");
      setOtpValue("");
      setOtpSent(false);
    } else {
      setError(res.error || "Failed to reset password");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      {/* Brand Header */}
      <CommunityBrand variant="auth" />

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Tab Headers */}
        {activeTab !== "forgot" && (
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => {
                setActiveTab("signin");
                setError(null);
              }}
              className={`flex-1 py-4 text-sm font-semibold transition-all ${
                activeTab === "signin"
                  ? "text-whatsapp-green border-b-2 border-whatsapp-green bg-whatsapp-green/[0.02]"
                  : "text-slate-500 hover:text-slate-700 bg-slate-50/[0.3]"
              }`}
            >
              Sign In (लॉग इन)
            </button>
            <button
              onClick={() => router.push("/signup")}
              className={`flex-1 py-4 text-sm font-semibold transition-all ${
                activeTab === "signup"
                  ? "text-whatsapp-green border-b-2 border-whatsapp-green bg-whatsapp-green/[0.02]"
                  : "text-slate-500 hover:text-slate-700 bg-slate-50/[0.3]"
              }`}
            >
              Sign Up (पंजीकरण)
            </button>
          </div>
        )}

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-whatsapp-green rounded-xl text-xs font-medium border border-green-100 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-whatsapp-green rounded-full shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* SIGN IN VIEW */}
          {activeTab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mobile No. (मोबाइल नं.)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Enter mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Password (पासवर्ड)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("forgot");
                      setError(null);
                    }}
                    className="text-xs font-semibold text-whatsapp-green hover:underline"
                  >
                    Forgot? (भूल गए?)
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-whatsapp-green hover:bg-whatsapp-teal text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 text-sm mt-2 cursor-pointer border-0"
              >
                {loading ? "Signing In..." : "Sign In (लॉग इन)"}
              </button>
            </form>
          )}

          {/* VISITOR / GUEST ACCESS — below signin only */}
          {activeTab === "signin" && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">or Visit as Guest</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* 15-min guest info pill */}
              <div className="flex items-center justify-center space-x-1.5 mb-3">
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  ⏱ Read-only access for 15 minutes — no password needed
                </span>
              </div>

              {visitorError && (
                <div className="mb-3 p-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                  <span>{visitorError}</span>
                </div>
              )}

              <form onSubmit={handleVisitorLogin} className="flex space-x-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Your mobile number"
                    value={visitorMobile}
                    onChange={(e) => setVisitorMobile(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-300 text-xs outline-hidden transition-all text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={visitorLoading}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer border-0 shrink-0"
                >
                  {visitorLoading ? "..." : "Visit"}
                </button>
              </form>
            </div>
          )}

          {/* SIGN UP VIEW */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              
              {/* Step indicator progress bar */}
              <div className="space-y-1.5 select-none pb-2 border-b border-slate-100">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Step {signupStep} of 7</span>
                  <span>{Math.round((signupStep / 7) * 100)}% Complete</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-whatsapp-green transition-all duration-300"
                    style={{ width: `${(signupStep / 7) * 100}%` }}
                  />
                </div>
              </div>

              {/* STEP 1: Basic Profile */}
              {signupStep === 1 && (
                <div className="space-y-4 pt-1">
                  <div className="border-l-2 border-whatsapp-green pl-2.5">
                    <span className="text-xs font-bold text-whatsapp-green uppercase tracking-wide">
                      1. Profile Photo & Name
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center pb-2">
                    <div 
                      onClick={() => document.getElementById("avatar-upload-signup")?.click()}
                      className="relative w-20 h-20 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-full flex flex-col items-center justify-center cursor-pointer group overflow-hidden transition-all"
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                          <span className="text-[9px] text-slate-400 mt-1 font-bold">Add Photo</span>
                        </>
                      )}
                    </div>
                    <input
                      id="avatar-upload-signup"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setError(null);
                        setAvatarUrl(URL.createObjectURL(file));

                        const compressed = await compressImage(file);
                        if (!checkFileSize(compressed, 5)) {
                          setError("Selected file exceeds the maximum allowed size of 5MB");
                          return;
                        }
                        setAvatarFile(compressed);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      What is your Full Name? *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Parent Linkage */}
              {signupStep === 2 && (
                <div className="space-y-4 pt-1">
                  <div className="border-l-2 border-whatsapp-green pl-2.5">
                    <span className="text-xs font-bold text-whatsapp-green uppercase tracking-wide">
                      2. Parent Linkage
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Who is your Parent? (Optional - links your lineage tree)
                    </label>
                    <select
                      value={parentId}
                      onChange={(e) => handleParentChange(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 focus:border-whatsapp-green outline-hidden"
                    >
                      <option value="">No Parent Link</option>
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.mobileNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {parentId && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          Your relationship with Parent? *
                        </label>
                        <select
                          required
                          value={parentRelationship}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParentRelationship(val);
                            // Auto default sex/gender for ease of use
                            if (val === "Son" || val === "Father" || val === "Husband") {
                              setSex("Male");
                            } else if (val === "Daughter" || val === "Mother" || val === "Wife") {
                              setSex("Female");
                            }
                            // Auto default marital status
                            if (val === "Wife" || val === "Husband" || val === "Mother" || val === "Father") {
                              setMaritalStatus("Married");
                            }
                          }}
                          className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 focus:border-whatsapp-green outline-hidden"
                        >
                          <option value="">Select relationship *</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Wife">Wife</option>
                          <option value="Husband">Husband</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                        </select>
                      </div>

                      {fetchedParentAddress && (
                        <div className="flex items-center space-x-2 pt-1.5 select-none">
                          <input
                            type="checkbox"
                            id="same-address-parent"
                            checked={addressSameAsParent}
                            onChange={(e) => handleAddressSameAsParentChange(e.target.checked)}
                            className="w-4 h-4 rounded-sm border-slate-200 text-whatsapp-green focus:ring-whatsapp-green cursor-pointer"
                          />
                          <label htmlFor="same-address-parent" className="text-xs font-semibold text-slate-600 cursor-pointer">
                            Address is same as parent
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* STEP 3: Contact Details */}
              {signupStep === 3 && (
                <div className="space-y-4 pt-1">
                  <div className="border-l-2 border-whatsapp-green pl-2.5">
                    <span className="text-xs font-bold text-whatsapp-green uppercase tracking-wide">
                      3. Contact Information
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Mobile Number (Will be your Login Username) *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Alternate Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="Enter alternate number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Residential Address (Optional)
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                      <textarea
                        placeholder="Enter your address"
                        value={address}
                        disabled={addressSameAsParent}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        className={`w-full pl-11 pr-4 py-2 rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800 resize-none ${
                          addressSameAsParent ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 hover:bg-slate-100/70 focus:bg-white"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        City *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Indore"
                          value={city}
                          disabled={addressSameAsParent}
                          onChange={(e) => setCity(e.target.value)}
                          className={`w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800 font-semibold ${
                            addressSameAsParent ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 hover:bg-slate-100/70 focus:bg-white"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Village
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. Ashta"
                          value={village}
                          disabled={addressSameAsParent}
                          onChange={(e) => setVillage(e.target.value)}
                          className={`w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800 font-semibold ${
                            addressSameAsParent ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 hover:bg-slate-100/70 focus:bg-white"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Demographics & Community */}
              {signupStep === 4 && (
                <div className="space-y-4 pt-1">
                  <div className="border-l-2 border-whatsapp-green pl-2.5">
                    <span className="text-xs font-bold text-whatsapp-green uppercase tracking-wide">
                      4. Personal & Community Details
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 28"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Sex / Gender
                    </label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 focus:border-whatsapp-green outline-hidden"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Marital Status
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 focus:border-whatsapp-green outline-hidden"
                    >
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                      <option>Separated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Blood Group *
                    </label>
                    <select
                      required
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 focus:border-whatsapp-green outline-hidden"
                    >
                      <option value="">Select *</option>
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Gotra
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Gotra"
                      value={gotra}
                      onChange={(e) => setGotra(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      KulDevi
                    </label>
                    <input
                      type="text"
                      placeholder="Enter KulDevi"
                      value={kulDevi}
                      onChange={(e) => setKulDevi(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: Education Details */}
              {signupStep === 5 && (
                <div className="space-y-4 pt-1">
                  <div className="border-l-2 border-whatsapp-green pl-2.5">
                    <span className="text-xs font-bold text-whatsapp-green uppercase tracking-wide">
                      5. Education Details (Optional)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Highest Qualification / Degree
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. B.Tech Computer Science, MBA, Class XII"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Institution / School / University
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Stanford University, Public School"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Job & Professional Details */}
              {signupStep === 6 && (
                <div className="space-y-4 pt-1">
                  <div className="border-l-2 border-whatsapp-green pl-2.5">
                    <span className="text-xs font-bold text-whatsapp-green uppercase tracking-wide">
                      6. Job & Professional Details (Optional)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Occupation Type
                    </label>
                    <select
                      value={occupationType}
                      onChange={(e) => setOccupationType(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 focus:border-whatsapp-green outline-hidden"
                    >
                      <option value="">Select Occupation Type</option>
                      <option value="Salaried">Salaried / Employed</option>
                      <option value="Business Owner">Business Owner / Self-Employed</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Student">Student</option>
                      <option value="Homemaker">Homemaker</option>
                      <option value="Retired">Retired</option>
                      <option value="Unemployed">Unemployed / Looking for Opportunities</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Designation / Job Title
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Software Engineer, Owner, Manager"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Company / Business Name
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Google LLC, Self-Owned Shop"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Security / Passwords */}
              {signupStep === 7 && (
                <div className="space-y-4 pt-1">
                  <div className="border-l-2 border-whatsapp-green pl-2.5">
                    <span className="text-xs font-bold text-whatsapp-green uppercase tracking-wide">
                      7. Security Password
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Create Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Create strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-100 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                {signupStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setSignupStep((prev) => prev - 1)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all text-sm cursor-pointer"
                  >
                    Back
                  </button>
                )}
                {signupStep < 7 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-3 bg-whatsapp-green hover:bg-whatsapp-teal text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] text-sm cursor-pointer border-0"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-whatsapp-green hover:bg-whatsapp-teal text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 text-sm cursor-pointer border-0"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {activeTab === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="border-l-2 border-whatsapp-green pl-2.5 mb-2">
                <span className="text-xs font-bold text-whatsapp-green uppercase tracking-wide">
                  Reset Password (पासवर्ड रीसेट)
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Verify your registered number to securely set a new password.
                </p>
              </div>

              {/* Method Selector Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMethod("otp");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer border-0 ${
                    forgotMethod === "otp"
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMethod("key");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer border-0 ${
                    forgotMethod === "key"
                      ? "bg-white text-amber-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Admin Reset Key</span>
                </button>
              </div>

              {/* Mobile Number Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Registered Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9826017177"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* OTP Method Controls */}
              {forgotMethod === "otp" && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || !mobileNumber.trim()}
                      className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {sendingOtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                          <span>Sending OTP to WhatsApp...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Send 6-Digit OTP on WhatsApp</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Enter 6-Digit OTP *</span>
                        </label>
                        <button
                          type="button"
                          disabled={resendCountdown > 0 || sendingOtp}
                          onClick={handleSendOtp}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 border-0 bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
                        </button>
                      </div>

                      <div className="relative">
                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          placeholder="Enter 6-digit OTP from WhatsApp"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                          className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base font-mono font-bold tracking-widest text-slate-900 outline-hidden transition-all text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Key Method Field */}
              {forgotMethod === "key" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Admin Reset Key *</span>
                    <span className="text-[10px] text-amber-700 font-bold normal-case">Provided by Admin</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600" />
                    <input
                      type="text"
                      required
                      placeholder="Enter Reset Key (e.g. RESET123)"
                      value={resetKey}
                      onChange={(e) => setResetKey(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-amber-50/60 hover:bg-amber-50 focus:bg-white rounded-xl border border-amber-200/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm outline-hidden transition-all text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>New Password *</span>
                  <span className="text-[10px] text-slate-400 font-medium">Min 6 characters</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-whatsapp-green focus:ring-1 focus:ring-whatsapp-green text-sm outline-hidden transition-all text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <div className="mt-1 flex items-center space-x-1 text-[11px] font-semibold">
                    {confirmPassword === newPassword ? (
                      <span className="text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Passwords match</span>
                      </span>
                    ) : (
                      <span className="text-rose-500">Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signin");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all text-sm cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (forgotMethod === "otp" && !otpValue)}
                  className="flex-1 py-3 bg-whatsapp-green hover:bg-whatsapp-teal text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 text-sm cursor-pointer border-0 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
