"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;

    const target = getToken() ? "/dashboard" : "/login";
    router.replace(target);

    const fallbackId = window.setTimeout(() => {
      if (window.location.pathname === "/") {
        window.location.replace(target);
      }
    }, 1200);

    return () => window.clearTimeout(fallbackId);
  }, [router]);

  return null;
}
