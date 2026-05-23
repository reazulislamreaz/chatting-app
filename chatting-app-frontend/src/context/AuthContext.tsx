"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, setToken, clearToken, getToken } from "@/lib/api";
import { getQueryClient } from "@/lib/queryClient";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { User, AuthResponse, ApiResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await api<ApiResponse<User>>("/auth/me");
      setUser(res.data);
      connectSocket();
    } catch {
      setUser(null);
      clearToken();
      disconnectSocket();
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api<ApiResponse<AuthResponse>>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    setToken(res.data.token);
    setUser(res.data.user);
    connectSocket();
    router.push("/dashboard");
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api<ApiResponse<AuthResponse>>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ name, email, password }),
    });
    setToken(res.data.token);
    setUser(res.data.user);
    connectSocket();
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearToken();
    setUser(null);
    disconnectSocket();
    getQueryClient().clear();
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
