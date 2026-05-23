"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { prefetchMessages, prefetchUserProfile } from "@/lib/prefetch";
import type { ComponentProps } from "react";

type PrefetchLinkProps = ComponentProps<typeof Link> & {
  prefetchUserId?: string;
  prefetchChat?: boolean;
};

const PREFETCH_DEBOUNCE_MS = 200;

export function PrefetchLink({
  prefetchUserId,
  prefetchChat,
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const qc = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const warmCache = () => {
    if (!prefetchUserId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      prefetchUserProfile(qc, prefetchUserId);
      if (prefetchChat) {
        prefetchMessages(qc, prefetchUserId);
      }
    }, PREFETCH_DEBOUNCE_MS);
  };

  return (
    <Link
      {...props}
      onMouseEnter={(e) => {
        warmCache();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        warmCache();
        onFocus?.(e);
      }}
    />
  );
}
