"use client";

import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]",
        className,
      )}
      aria-hidden
    />
  );
}

export function SkeletonCircle({
  size = "h-12 w-12",
  className,
}: SkeletonProps & { size?: string }) {
  return <Skeleton className={cn("rounded-full", size, className)} />;
}
