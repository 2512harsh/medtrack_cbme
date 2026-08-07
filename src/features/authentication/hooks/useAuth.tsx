"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { UserSummary, UserRole } from "@/types";
import { login as loginService, logout as logoutService, getCurrentUser, getDashboardRoute } from "../services/auth";

interface AuthContextType {
  user: UserSummary | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  userRole: UserRole | null;
  dashboardRoute: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_COOKIE = "medtrack_token";

function setTokenCookie(token: string): void {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
}

function clearTokenCookie(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; SameSite=Lax; Max-Age=0`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("medtrack_token");
      if (token) {
        setTokenCookie(token);
        const currentUser = await getCurrentUser(token);
        if (currentUser) {
          setUser(currentUser);
        } else {
          localStorage.removeItem("medtrack_token");
          clearTokenCookie();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser, token } = await loginService(email, password);
      localStorage.setItem("medtrack_token", token);
      setTokenCookie(token);
      setUser(loggedInUser);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await logoutService();
    localStorage.removeItem("medtrack_token");
    clearTokenCookie();
    setUser(null);
    setIsLoading(false);
  };

  const userRole = user?.role || null;
  const dashboardRoute = userRole ? getDashboardRoute(userRole) : "/login";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        userRole,
        dashboardRoute,
      }}
    >
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