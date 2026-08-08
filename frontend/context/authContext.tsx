"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../utils/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  role: "super_admin" | "admin" | "user";
  profileImage?: string;
  wishlist: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<UserProfile>;
  signup: (userData: { name: string; phone: string; password: string; otp: string }) => Promise<UserProfile>;
  logout: () => void;
  toggleWishlist: (propertyId: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  sendOtp: (phone: string, mode?: string) => Promise<boolean>;
  forgotPassword: (phone: string, otp: string, newPassword: string) => Promise<boolean>;
  updatePhone: (newPhone: string, currentPassword: string) => Promise<boolean>;
  updateProfileImage: (file: File) => Promise<boolean>;
  updateProfile: (data: { name?: string; phone?: string; city?: string; profileImage?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Validate token and load profile on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("isiri_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest("/auth/me");
        setUser({
          id: data._id || data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          city: data.city,
          role: data.role,
          profileImage: data.profileImage,
          wishlist: data.wishlist ? data.wishlist.map((item: any) => typeof item === "string" ? item : item._id || item.id) : [],
        });
      } catch (err: any) {
        // Token might be expired or invalid, just clean up without throwing a console error
        // to avoid Next.js dev overlay for expected authentication flows.
        console.warn("Token verification failed, clearing session.");
        // Clear expired/invalid token
        localStorage.removeItem("isiri_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string): Promise<UserProfile> => {
    setError(null);
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      });

      localStorage.setItem("isiri_token", data.token);
      
      const profile = {
        id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        city: data.user.city,
        role: data.user.role,
        profileImage: data.user.profileImage,
        wishlist: data.user.wishlist || [],
      };
      
      setUser(profile);
      return profile;
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      throw err;
    }
  };

  const signup = async (userData: { name: string; phone: string; password: string; otp: string }): Promise<UserProfile> => {
    setError(null);
    try {
      const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      localStorage.setItem("isiri_token", data.token);
      
      const profile = {
        id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        city: data.user.city,
        role: data.user.role,
        profileImage: data.user.profileImage,
        wishlist: data.user.wishlist || [],
      };

      setUser(profile);
      return profile;
    } catch (err: any) {
      setError(err.message || "Registration failed");
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("isiri_token");
    setUser(null);
    setError(null);
  };

  const toggleWishlist = async (propertyId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const data = await apiRequest(`/properties/wishlist/${propertyId}`, {
        method: "POST",
      });
      
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          wishlist: data.wishlist || [],
        };
      });
      return data.isWishlisted;
    } catch (err) {
      console.error("Error toggling wishlist:", err);
      return false;
    }
  };

  const refreshProfile = async () => {
    try {
      const data = await apiRequest("/auth/me");
      setUser({
        id: data._id || data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        role: data.role,
        profileImage: data.profileImage,
        wishlist: data.wishlist ? data.wishlist.map((item: any) => typeof item === "string" ? item : item._id || item.id) : [],
      });
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  const clearError = () => setError(null);

  const sendOtp = async (phone: string, mode?: string): Promise<boolean> => {
    setError(null);
    try {
      await apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone, mode }),
      });
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      return false;
    }
  };

  const forgotPassword = async (phone: string, otp: string, newPassword: string): Promise<boolean> => {
    setError(null);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ phone, otp, newPassword }),
      });
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
      return false;
    }
  };

  const updatePhone = async (newPhone: string, currentPassword: string): Promise<boolean> => {
    setError(null);
    try {
      await apiRequest("/auth/update-phone", {
        method: "PUT",
        body: JSON.stringify({ newPhone, currentPassword }),
      });
      await refreshProfile();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update phone number");
      return false;
    }
  };

  const updateProfileImage = async (file: File): Promise<boolean> => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      await apiRequest("/auth/update-profile-image", {
        method: "PUT",
        body: formData,
        // Remove Content-Type header so browser sets multipart/form-data boundary
        headers: { "Authorization": `Bearer ${localStorage.getItem("isiri_token")}` }
      });
      await refreshProfile();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update profile image");
      return false;
    }
  };

  const updateProfile = async (data: { name?: string; phone?: string; city?: string; profileImage?: string }): Promise<boolean> => {
    setError(null);
    try {
      await apiRequest("/auth/update-profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      await refreshProfile();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        toggleWishlist,
        refreshProfile,
        clearError,
        sendOtp,
        forgotPassword,
        updatePhone,
        updateProfileImage,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
