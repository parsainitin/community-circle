"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

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
}

interface AuthContextProps {
  user: UserType | null;
  loading: boolean;
  login: (mobileNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: any) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (mobileNumber: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
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
      const isAuthPage = pathname === "/auth";
      if (!user && !isAuthPage) {
        router.replace("/auth");
      } else if (user && isAuthPage) {
        router.replace("/");
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
      router.replace("/");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "An error occurred during sign in" };
    }
  };

  const signup = async (userData: any) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      // Automatically sign in upon successful sign up
      localStorage.setItem("cc_user", JSON.stringify(data));
      setUser(data);
      router.replace("/");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "An error occurred during sign up" };
    }
  };

  const forgotPassword = async (mobileNumber: string, newPassword: string) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, newPassword }),
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
