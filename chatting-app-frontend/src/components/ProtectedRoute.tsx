"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AppLoadingScreen } from "@/components/AppLoadingScreen";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasToken = Boolean(getToken());

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (!hasToken) {
    return null;
  }

  if (loading) {
    return <AppLoadingScreen />;
  }

  if (!user) return null;

  return <>{children}</>;
}
