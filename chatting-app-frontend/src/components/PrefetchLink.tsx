"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchMessages, prefetchUserProfile } from "@/lib/prefetch";
import type { ComponentProps } from "react";

type PrefetchLinkProps = ComponentProps<typeof Link> & {
  prefetchUserId?: string;
  prefetchChat?: boolean;
};

export function PrefetchLink({
  prefetchUserId,
  prefetchChat,
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const qc = useQueryClient();

  const warmCache = () => {
    if (prefetchUserId) {
      prefetchUserProfile(qc, prefetchUserId);
      if (prefetchChat) {
        prefetchMessages(qc, prefetchUserId);
      }
    }
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
