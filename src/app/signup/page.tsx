"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, Camera, CheckCircle2 } from "lucide-react";
import { compressImage, checkFileSize } from "@/lib/imageCompression";

// Per-step display metadata
const STEPS = [
  {
    emoji: "�‍👩‍👧",
    title: "Family tree linkage",
    hint: "Link to an existing member to build your family tree (optional)",
    accent: "#f97316",
    bg: "#fff7ed",
  },
  {
    emoji: "👋",
    title: "What's your name?",
    hint: "Your name is how the Jambu community will know you",
    accent: "#DB5461",
    bg: "#FBEAEB",
  },
  {
    emoji: "📍",
    title: "Where do you live?",
    hint: "Your city connects you with nearby community members",
    accent: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    emoji: "📱",
    title: "Your contact info",
    hint: "Your mobile number will be your login username",
    accent: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    emoji: "🙋",
    title: "About yourself",
    hint: "A little about you helps the community know you better",
    accent: "#ec4899",
    bg: "#fdf2f8",
  },
  {
    emoji: "🧬",
    title: "Community identity",
    hint: "Gotra and KulDevi connect your lineage within the circle",
    accent: "#06b6d4",
    bg: "#ecfeff",
  },
  {
    emoji: "🎓",
    title: "Education journey",
    hint: "Optional — share your academic background",
    accent: "#6366f1",
    bg: "#eef2ff",
  },
  {
    emoji: "💼",
    title: "Professional life",
    hint: "Optional — let others know about your work",
    accent: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    emoji: "🔐",
    title: "Lock it up!",
    hint: "Create a strong password to secure your account",
    accent: "#10b981",
    bg: "#ecfdf5",
  },
];

const TOTAL = STEPS.length;

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [village, setVillage] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [parentId, setParentId] = useState("");
  const [parentRelationship, setParentRelationship] = useState("");
  const [usersList, setUsersList] = useState<{ _id: string; name: string; mobileNumber: string; role?: string }[]>([]);
  const [addressSameAsParent, setAddressSameAsParent] = useState(false);
  const [fetchedParent, setFetchedParent] = useState({ address: "", city: "", village: "", gotra: "", kulDevi: "" });
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("Male");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [bloodGroup, setBloodGroup] = useState("");
  const [gotra, setGotra] = useState("");
  const [kulDevi, setKulDevi] = useState("");
  const [education, setEducation] = useState("");
  const [institution, setInstitution] = useState("");
  const [occupationType, setOccupationType] = useState("");
  const [profession, setProfession] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        const filtered = (d || []).filter((u: { role?: string }) => !["admin", "super-admin"].includes(u.role || ""));
        setUsersList(filtered);
      })
      .catch(() => {});
  }, []);

  // Pre-fill password with last 5 digits of mobile when the user reaches step 8
  useEffect(() => {
    if (step === 8 && mobileNumber.trim().length >= 5 && !password) {
      const defaultPwd = mobileNumber.trim().slice(-5);
      setPassword(defaultPwd);
      setConfirmPassword(defaultPwd);
    }
  }, [step]);

  const handleParentChange = async (id: string) => {
    setParentId(id);
    if (!id) {
      setFetchedParent({ address: "", city: "", village: "", gotra: "", kulDevi: "" });
      setAddressSameAsParent(false);
      return;
    }
    try {
      const res = await fetch(`/api/users/${id}`);
      if (res.ok) {
        const d = await res.json();
        const p = {
          address: d.address || "",
          city: d.city || "",
          village: d.village || "",
          gotra: d.gotra || "",
          kulDevi: d.kulDevi || "",
        };
        setFetchedParent(p);
        if (p.address) setAddress(p.address);
        if (p.city) setCity(p.city);
        if (p.village) setVillage(p.village);
        if (p.gotra) setGotra(p.gotra);
        if (p.kulDevi) setKulDevi(p.kulDevi);
        setAddressSameAsParent(true);
      }
    } catch {}
  };

  const navigate = (newStep: number, dir: "forward" | "back") => {
    setError(null);
    setDirection(dir);
    setStep(newStep);
    setAnimKey((k) => k + 1);
  };

  const validate = (): boolean => {
    if (step === 0 && parentId && !parentRelationship) { setError("Please select your relationship"); return false; }
    if (step === 1 && !name.trim()) { setError("Please enter your full name"); return false; }
    if (step === 2 && !city.trim()) { setError("Please enter your city"); return false; }
    if (step === 3) {
      if (!mobileNumber.trim()) { setError("Please enter your mobile number"); return false; }
      if (!/^[0-9]{10}$/.test(mobileNumber.trim())) { setError("Mobile number must be 10 digits"); return false; }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address"); return false; }
    }
    if (step === 5 && !bloodGroup) { setError("Please select your blood group"); return false; }
    if (step === 8) {
      if (!password) { setError("Please create a password"); return false; }
      if (password !== confirmPassword) { setError("Passwords do not match"); return false; }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validate()) return;
    if (step === 3) {
      setLoading(true);
      try {
        const params = new URLSearchParams({ mobileNumber: mobileNumber.trim() });
        if (email.trim()) params.set("email", email.trim());
        const res = await fetch(`/api/auth/check?${params}`);
        const data = await res.json();
        if (data.mobileExists) { setError("This mobile number is already registered"); setLoading(false); return; }
        if (data.emailExists) { setError("This email address is already registered"); setLoading(false); return; }
      } catch {
        // allow proceed on network error — server will re-validate
      }
      setLoading(false);
    }
    if (step < TOTAL - 1) {
      navigate(step + 1, "forward");
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) navigate(step - 1, "back");
    else router.push("/auth");
  };

  const handleSubmit = async () => {
    setLoading(true);
    let finalAvatarUrl = "";
    if (avatarFile) {
      try {
        const fd = new FormData();
        fd.append("file", avatarFile);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (r.ok) finalAvatarUrl = d.url;
      } catch {}
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
      email: email.trim() || undefined,
    });
    setLoading(false);
    if (res.success) {
      setDone(true);
    } else {
      setError(res.error || "Failed to create account");
    }
  };

  // ── Success screen ────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 text-center">
        <div className="text-7xl wizard-icon-pop mb-5">🎉</div>
        <h1 className="text-2xl font-black text-slate-800 wizard-fade-up">Welcome, {name}!</h1>
        <p className="text-sm text-slate-500 font-medium mt-2 mb-8 wizard-fade-up">
          You're now part of the Jambu Community Circle.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-4 text-white rounded-2xl font-extrabold text-base shadow-xl active:scale-95 transition-transform border-0 cursor-pointer wizard-fade-up"
          style={{ backgroundColor: "#DB5461" }}
        >
          Enter Community →
        </button>
      </div>
    );
  }

  const meta = STEPS[step];
  const progress = ((step + 1) / TOTAL) * 100;
  const inputBase = "w-full px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 text-sm font-semibold outline-hidden transition-all duration-150 text-slate-800 placeholder-slate-300";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: meta.bg }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 select-none">
        <button
          onClick={handleBack}
          className="p-2 rounded-full bg-white/70 hover:bg-white border-0 transition-colors cursor-pointer shadow-xs"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-xs font-bold text-slate-400">{step + 1} / {TOTAL}</span>
        <button
          onClick={() => router.push("/auth")}
          className="text-xs font-bold bg-transparent border-0 cursor-pointer px-1"
          style={{ color: meta.accent }}
        >
          Sign In
        </button>
      </div>

      {/* ── Progress bar + dots ── */}
      <div className="px-5 pb-2 select-none">
        <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: meta.accent }}
          />
        </div>
        <div className="flex justify-between mt-2.5">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 mx-0.5 rounded-full transition-all duration-300"
              style={{ backgroundColor: i <= step ? meta.accent : "#e2e8f0" }}
            />
          ))}
        </div>
      </div>

      {/* ── Animated step content ── */}
      <div
        key={animKey}
        className={`flex-1 flex flex-col px-5 pt-2 pb-4 ${
          direction === "forward" ? "wizard-slide-forward" : "wizard-slide-back"
        }`}
      >
        {/* Hero icon + heading */}
        <div className="flex flex-col items-center py-5 select-none">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-4 shadow-md wizard-icon-pop"
            style={{ backgroundColor: `${meta.accent}22` }}
          >
            {meta.emoji}
          </div>
          <h1 className="text-xl font-black text-slate-800 text-center leading-snug wizard-fade-up">
            {meta.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium text-center mt-1.5 max-w-xs leading-relaxed wizard-fade-up">
            {meta.hint}
          </p>
        </div>

        {/* Error pill */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-semibold flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step fields ── */}
        <div className="space-y-4">

          {/* Step 0: Family */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Parent Member</label>
                <select
                  value={parentId} onChange={(e) => handleParentChange(e.target.value)}
                  className={`${inputBase} cursor-pointer`}
                >
                  <option value="">— Skip (No Parent Link) —</option>
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Your Relationship *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Son", "Daughter", "Wife", "Husband", "Father", "Mother"].map((r) => (
                        <button
                          key={r} type="button"
                          onClick={() => {
                            setParentRelationship(r);
                            if (r === "Son" || r === "Father" || r === "Husband") setSex("Male");
                            else if (r === "Daughter" || r === "Mother" || r === "Wife") setSex("Female");
                            if (["Wife", "Husband", "Father", "Mother"].includes(r)) setMaritalStatus("Married");
                          }}
                          className="py-3 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer"
                          style={{
                            borderColor: parentRelationship === r ? meta.accent : "#e2e8f0",
                            backgroundColor: parentRelationship === r ? `${meta.accent}18` : "white",
                            color: parentRelationship === r ? meta.accent : "#64748b",
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  {fetchedParent.address && (
                    <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-2xl border border-slate-100">
                      <input
                        type="checkbox" checked={addressSameAsParent}
                        onChange={(e) => {
                          setAddressSameAsParent(e.target.checked);
                          if (e.target.checked) {
                            setAddress(fetchedParent.address);
                            setCity(fetchedParent.city);
                            setVillage(fetchedParent.village);
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-600">Same address as parent</span>
                    </label>
                  )}
                </>
              )}
            </>
          )}

          {/* Step 1: Name + Photo */}
          {step === 1 && (
            <>
              <div className="flex flex-col items-center pb-1">
                <div
                  onClick={() => document.getElementById("av-upload")?.click()}
                  className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 transition-colors shadow-xs"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-slate-400" />
                      <span className="text-[9px] text-slate-400 mt-1 font-bold">Add Photo</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-2">Profile photo (optional)</span>
                <input
                  id="av-upload" type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAvatarUrl(URL.createObjectURL(file));
                    const compressed = await compressImage(file);
                    if (!checkFileSize(compressed, 5)) { setError("Image must be under 5MB"); return; }
                    setAvatarFile(compressed);
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name *</label>
                <input
                  type="text" autoFocus required placeholder="e.g. Ramesh Kumar Sharma"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className={inputBase}
                  style={{ borderColor: name ? meta.accent : undefined }}
                />
              </div>
            </>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">City *</label>
                <input
                  type="text" autoFocus required placeholder="e.g. Indore, Bhopal, Mumbai"
                  value={city} onChange={(e) => setCity(e.target.value)}
                  className={inputBase}
                  style={{ borderColor: city ? meta.accent : undefined }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Village / Town</label>
                <input
                  type="text" placeholder="e.g. Ashta (optional)"
                  value={village} onChange={(e) => setVillage(e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Address</label>
                <textarea
                  rows={2} placeholder="Street, Colony... (optional)"
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  className={`${inputBase} resize-none`}
                />
              </div>
            </>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Mobile Number *{" "}
                  <span className="normal-case text-slate-400 font-normal">(used as login username)</span>
                </label>
                <input
                  type="tel" autoFocus required placeholder="e.g. 9876543210"
                  value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
                  className={inputBase}
                  style={{ borderColor: mobileNumber ? meta.accent : undefined }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Alternate Phone</label>
                <input
                  type="tel" placeholder="Optional"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email" placeholder="Optional — e.g. name@gmail.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className={inputBase}
                  style={{ borderColor: email.trim() ? meta.accent : undefined }}
                />
              </div>
            </>
          )}

          {/* Step 4: Personal */}
          {step === 4 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Age</label>
                  <input
                    type="number" placeholder="Years" min="1" max="120"
                    value={age} onChange={(e) => setAge(e.target.value)}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Gender</label>
                  <select
                    value={sex} onChange={(e) => setSex(e.target.value)}
                    className={`${inputBase} cursor-pointer`}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Marital Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Single", "Married", "Divorced", "Widowed", "Separated"].map((s) => (
                    <button
                      key={s} type="button" onClick={() => setMaritalStatus(s)}
                      className="py-3 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer"
                      style={{
                        borderColor: maritalStatus === s ? meta.accent : "#e2e8f0",
                        backgroundColor: maritalStatus === s ? `${meta.accent}18` : "white",
                        color: maritalStatus === s ? meta.accent : "#64748b",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 5: Community Identity */}
          {step === 5 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Blood Group *</label>
                <div className="grid grid-cols-4 gap-2">
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <button
                      key={bg} type="button" onClick={() => setBloodGroup(bg)}
                      className="py-3.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer"
                      style={{
                        borderColor: bloodGroup === bg ? "#ef4444" : "#e2e8f0",
                        backgroundColor: bloodGroup === bg ? "#fef2f2" : "white",
                        color: bloodGroup === bg ? "#ef4444" : "#64748b",
                      }}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Gotra</label>
                <input
                  type="text" placeholder="Enter Gotra (optional)"
                  value={gotra} onChange={(e) => setGotra(e.target.value)}
                  className={inputBase}
                  style={{ borderColor: gotra ? meta.accent : undefined }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">KulDevi</label>
                <input
                  type="text" placeholder="Enter KulDevi (optional)"
                  value={kulDevi} onChange={(e) => setKulDevi(e.target.value)}
                  className={inputBase}
                  style={{ borderColor: kulDevi ? meta.accent : undefined }}
                />
              </div>
            </>
          )}

          {/* Step 6: Education */}
          {step === 6 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Highest Qualification</label>
                <input
                  type="text" autoFocus placeholder="e.g. B.Tech, MBA, Class XII"
                  value={education} onChange={(e) => setEducation(e.target.value)}
                  className={inputBase}
                  style={{ borderColor: education ? meta.accent : undefined }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Institution / University</label>
                <input
                  type="text" placeholder="e.g. IIT Delhi, Public School"
                  value={institution} onChange={(e) => setInstitution(e.target.value)}
                  className={inputBase}
                  style={{ borderColor: institution ? meta.accent : undefined }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold text-center">Both fields are optional — skip if not applicable</p>
            </>
          )}

          {/* Step 7: Profession */}
          {step === 7 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Occupation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "Salaried", l: "💼 Salaried" },
                    { v: "Business Owner", l: "🏪 Business" },
                    { v: "Freelancer", l: "🧑‍💻 Freelancer" },
                    { v: "Student", l: "📚 Student" },
                    { v: "Homemaker", l: "🏠 Homemaker" },
                    { v: "Retired", l: "🌅 Retired" },
                    { v: "Unemployed", l: "🔍 Job Seeking" },
                  ].map((o) => (
                    <button
                      key={o.v} type="button" onClick={() => setOccupationType(o.v)}
                      className="py-3 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer text-left px-3"
                      style={{
                        borderColor: occupationType === o.v ? meta.accent : "#e2e8f0",
                        backgroundColor: occupationType === o.v ? `${meta.accent}18` : "white",
                        color: occupationType === o.v ? meta.accent : "#64748b",
                      }}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Designation / Job Title</label>
                <input
                  type="text" placeholder="e.g. Software Engineer, Owner"
                  value={profession} onChange={(e) => setProfession(e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Company / Business</label>
                <input
                  type="text" placeholder="e.g. Google, Self-Owned Shop"
                  value={company} onChange={(e) => setCompany(e.target.value)}
                  className={inputBase}
                />
              </div>
            </>
          )}

          {/* Step 8: Password + review */}
          {step === 8 && (
            <>
              {/* Default password hint */}
              <div className="flex items-start space-x-2.5 bg-amber-50 border border-amber-200/70 rounded-2xl px-3.5 py-3">
                <span className="text-base mt-0.5">💡</span>
                <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                  We&apos;ve pre-filled your password with the <strong>last 5 digits of your mobile number</strong>{mobileNumber.trim().length >= 5 ? <> (<span className="font-black tracking-widest">{mobileNumber.trim().slice(-5)}</span>)</> : ""}. You can change it to anything stronger below.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Create Password *</label>
                <input
                  type="password" autoFocus required placeholder="Strong password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={inputBase}
                  style={{ borderColor: password ? meta.accent : undefined }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password *</label>
                <input
                  type="password" required placeholder="Re-enter password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputBase}
                  style={{
                    borderColor: confirmPassword
                      ? confirmPassword === password ? "#10b981" : "#ef4444"
                      : undefined,
                  }}
                />
                {confirmPassword && confirmPassword === password && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" /><span>Passwords match</span>
                  </p>
                )}
              </div>
              {/* Quick summary */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your details</p>
                {([["Name", name], ["City", city], ["Mobile", mobileNumber], ["Blood Group", bloodGroup]] as [string, string][])
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">{k}</span>
                      <span className="text-slate-700 font-bold">{v}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <div className="px-5 pb-8 pt-3 space-y-2.5">
        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="w-full py-4 text-white rounded-2xl font-extrabold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 border-0 cursor-pointer"
          style={{ backgroundColor: meta.accent }}
        >
          {loading
            ? "Creating Account…"
            : step === TOTAL - 1
            ? "🎉 Join the Community!"
            : `Continue  →`}
        </button>
        {step > 0 && (
          <button
            type="button" onClick={handleBack}
            className="w-full py-3 bg-white/70 hover:bg-white text-slate-500 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] border border-slate-100 cursor-pointer"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
