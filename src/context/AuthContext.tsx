"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UserType {
  _id: string;
  name: string;
  phone: string;
  mobileNumber: string;
  role?: "super-admin" | "admin" | "member";
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
}

interface AuthContextProps {
  user: UserType | null;
  loading: boolean;
  login: (mobileNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: any) => Promise<{ success: boolean; pendingApproval?: boolean; error?: string }>;
  forgotPassword: (mobileNumber: string, newPassword: string, resetKey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<UserType>) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage for active session on load
    const storedUser = localStorage.getItem("cc_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("cc_user");
      }
    }
    setLoading(false);
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

  const forgotPassword = async (mobileNumber: string, newPassword: string, resetKey: string) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, newPassword, resetKey }),
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
    localStorage.removeItem("cc_user");
    setUser(null);
    router.replace("/auth");
  };

  const updateUser = (userData: Partial<UserType>) => {
    if (user) {
      const updated = { ...user, ...userData };
      localStorage.setItem("cc_user", JSON.stringify(updated));
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, forgotPassword, logout, updateUser }}>
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
