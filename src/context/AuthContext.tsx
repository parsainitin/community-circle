"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const VISITOR_SESSION_KEY = "cc_visitor_session";
const VISITOR_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface UserType {
  _id: string;
  name: string;
  phone: string;
  mobileNumber: string;
  role?: "super-admin" | "admin" | "member" | "visitor";
  status?: "pending" | "approved" | "rejected";
  communityId?: string;
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
  education?: string;
  institution?: string;
  occupationType?: string;
  profession?: string;
  company?: string;
  isPropertyManager?: boolean;
  isVisitor?: boolean;
  visitorExpiresAt?: number;
}

interface AuthContextProps {
  user: UserType | null;
  loading: boolean;
  isVisitor: boolean;
  visitorSecondsLeft: number;
  login: (mobileNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  visitorLogin: (mobileNumber: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: any) => Promise<{ success: boolean; pendingApproval?: boolean; error?: string }>;
  sendResetOtp: (mobileNumber: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  forgotPassword: (
    mobileNumber: string,
    newPassword: string,
    resetKeyOrOptions?: string | { otp?: string; resetKey?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<UserType>) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitorSecondsLeft, setVisitorSecondsLeft] = useState(0);
  const visitorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isVisitor = !!(user?.isVisitor);

  // Clear any running visitor countdown
  const clearVisitorTimer = () => {
    if (visitorTimerRef.current) {
      clearInterval(visitorTimerRef.current);
      visitorTimerRef.current = null;
    }
  };

  // Start a countdown for the visitor session
  const startVisitorCountdown = (expiresAt: number) => {
    clearVisitorTimer();
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setVisitorSecondsLeft(remaining);
      if (remaining <= 0) {
        clearVisitorTimer();
        // Auto-logout visitor
        localStorage.removeItem(VISITOR_SESSION_KEY);
        localStorage.removeItem("cc_user");
        setUser(null);
        router.replace("/auth");
      }
    };
    tick();
    visitorTimerRef.current = setInterval(tick, 1000);
  };

  useEffect(() => {
    // Check for regular user session
    const storedUser = localStorage.getItem("cc_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as UserType;
        setUser(parsed);
        if (parsed.isVisitor && parsed.visitorExpiresAt) {
          if (Date.now() < parsed.visitorExpiresAt) {
            startVisitorCountdown(parsed.visitorExpiresAt);
          } else {
            // Session expired — clean up
            localStorage.removeItem("cc_user");
            localStorage.removeItem(VISITOR_SESSION_KEY);
          }
        }
      } catch (e) {
        localStorage.removeItem("cc_user");
      }
    }
    setLoading(false);

    return () => clearVisitorTimer();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === "/auth" || pathname === "/signup";
      const isAdminPage = pathname.startsWith("/admin") || pathname.startsWith("/community-admin");

      if (!user && !isAuthPage) {
        router.replace("/auth");
      } else if (user) {
        if (user.role === "super-admin" && !isAdminPage) {
          router.replace("/admin");
        } else if (user.role !== "super-admin" && pathname.startsWith("/admin")) {
          router.replace("/");
        } else if (isAuthPage) {
          router.replace(user.role === "super-admin" ? "/admin" : "/");
        }
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (mobileNumber: string, password: string) => {
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      localStorage.setItem("cc_user", JSON.stringify(data));
      setUser(data);
      router.replace(data.role === "super-admin" ? "/admin" : "/");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "An error occurred during sign in" };
    }
  };

  const visitorLogin = async (mobileNumber: string) => {
    try {
      const res = await fetch("/api/auth/visitor-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Visitor login failed" };
      }

      localStorage.setItem("cc_user", JSON.stringify(data));
      localStorage.setItem(VISITOR_SESSION_KEY, String(data.visitorExpiresAt));
      setUser(data);
      startVisitorCountdown(data.visitorExpiresAt);
      router.replace("/");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "An error occurred during visitor access" };
    }
  };

  const signup = async (userData: any) => {
    try {
      localStorage.removeItem("cc_user");
      setUser(null);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      // New member registrations require admin approval — do NOT log in session
      if (data.role !== "super-admin" && data.status !== "approved") {
        return { success: true, pendingApproval: true };
      }

      localStorage.setItem("cc_user", JSON.stringify(data));
      setUser(data);
      router.replace(data.role === "super-admin" ? "/admin" : "/");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "An error occurred during sign up" };
    }
  };

  const sendResetOtp = async (mobileNumber: string) => {
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Failed to send OTP" };
      }

      return { success: true, message: data.message };
    } catch (e: any) {
      return { success: false, error: e.message || "An error occurred while sending OTP" };
    }
  };

  const forgotPassword = async (
    mobileNumber: string,
    newPassword: string,
    resetKeyOrOptions?: string | { otp?: string; resetKey?: string }
  ) => {
    try {
      let payload: any = { mobileNumber, newPassword };
      if (typeof resetKeyOrOptions === "string") {
        payload.resetKey = resetKeyOrOptions;
      } else if (resetKeyOrOptions && typeof resetKeyOrOptions === "object") {
        if (resetKeyOrOptions.otp) payload.otp = resetKeyOrOptions.otp;
        if (resetKeyOrOptions.resetKey) payload.resetKey = resetKeyOrOptions.resetKey;
      }

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Password reset failed" };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "An error occurred during password reset" };
    }
  };

  const logout = () => {
    clearVisitorTimer();
    localStorage.removeItem("cc_user");
    localStorage.removeItem(VISITOR_SESSION_KEY);
    setUser(null);
    router.replace("/auth");
  };

  const updateUser = (userData: Partial<UserType>) => {
    if (user && !user.isVisitor) {
      const updated = { ...user, ...userData };
      localStorage.setItem("cc_user", JSON.stringify(updated));
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isVisitor, visitorSecondsLeft, login, visitorLogin, signup, sendResetOtp, forgotPassword, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
