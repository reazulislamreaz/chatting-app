"use client";

import { useIsFetching } from "@tanstack/react-query";

/** Thin top bar when React Query refetches in the background (cached pages stay visible). */
export function QueryLoadingBar() {
  const isFetching = useIsFetching();

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-0.5 overflow-hidden"
      aria-hidden={!isFetching}
    >
      <div
        className={`h-full bg-brand-500 transition-opacity duration-300 ${
          isFetching ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-1/3 animate-loading-bar bg-brand-400" />
      </div>
    </div>
  );
}
