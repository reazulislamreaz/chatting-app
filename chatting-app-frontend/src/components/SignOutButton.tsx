"use client";

import { useAuth } from "@/context/AuthContext";

interface SignOutButtonProps {
  className?: string;
  variant?: "sidebar" | "card";
}

export function SignOutButton({
  className = "",
  variant = "sidebar",
}: SignOutButtonProps) {
  const { logout } = useAuth();

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={logout}
        className={`group flex w-full items-center gap-4 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 via-white to-white p-4 text-left shadow-card transition hover:border-rose-200 hover:shadow-md sm:p-5 ${className}`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 transition group-hover:bg-rose-200 group-hover:text-rose-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-rose-700">Sign out</span>
          <span className="mt-0.5 block text-sm text-slate-500">
            Log out from this device
          </span>
        </span>
        <svg
          className="h-5 w-5 shrink-0 text-rose-300 transition group-hover:translate-x-0.5 group-hover:text-rose-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 ${className}`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      Sign out
    </button>
  );
}
