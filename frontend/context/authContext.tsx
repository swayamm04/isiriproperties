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
  wishlist: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (userData: { name: string; email: string; phone: string; city: string; password: string }) => Promise<UserProfile>;
  logout: () => void;
  toggleWishlist: (propertyId: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
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
          wishlist: data.wishlist ? data.wishlist.map((item: any) => typeof item === "string" ? item : item._id || item.id) : [],
        });
      } catch (err) {
        console.error("Token verification failed:", err);
        // Clear expired/invalid token
        localStorage.removeItem("isiri_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setError(null);
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("isiri_token", data.token);
      
      const profile = {
        id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        city: data.user.city,
        role: data.user.role,
        wishlist: data.user.wishlist || [],
      };
      
      setUser(profile);
      return profile;
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      throw err;
    }
  };

  const signup = async (userData: { name: string; email: string; phone: string; city: string; password: string }): Promise<UserProfile> => {
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
        wishlist: data.wishlist ? data.wishlist.map((item: any) => typeof item === "string" ? item : item._id || item.id) : [],
      });
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  const clearError = () => setError(null);

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
