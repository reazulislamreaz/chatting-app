"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { prefetchChats } from "@/lib/prefetch";
import { Avatar } from "./Avatar";
import { SignOutButton } from "./SignOutButton";

const navItems = [
  {
    href: "/dashboard",
    label: "Profile",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/feed",
    label: "Feed",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
      </svg>
    ),
  },
  {
    href: "/users",
    label: "Discover",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/chat",
    label: "Chat",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

function NavLink({
  href,
  label,
  icon,
  isActive,
  compact,
  onWarm,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  compact?: boolean;
  onWarm?: () => void;
}) {
  const warmProps = {
    onMouseEnter: onWarm,
    onFocus: onWarm,
  };

  if (compact) {
    return (
      <Link
        href={href}
        {...warmProps}
        className={`flex min-w-0 w-full flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[10px] font-medium transition-all xs:gap-1 xs:py-2 ${
          isActive ? "text-brand-600" : "text-slate-500"
        }`}
      >
        <span
          className={`rounded-xl p-1.5 xs:p-2 ${
            isActive ? "bg-brand-50 text-brand-600" : "text-slate-400"
          }`}
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      {...warmProps}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? "bg-brand-50 text-brand-800 shadow-sm"
          : "text-slate-600 hover:bg-wa-panel hover:text-slate-900"
      }`}
    >
      <span className={isActive ? "text-brand-600" : "text-slate-400"}>{icon}</span>
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isChatDetail = pathname.startsWith("/chat/") && pathname !== "/chat";

  const warmRoute = (href: string) => {
    if (href === "/chat") prefetchChats(queryClient);
  };

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-surface-border bg-white md:flex lg:w-72 xl:w-80">
        <div className="border-b border-surface-border bg-brand-700 p-4 text-white lg:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight lg:text-xl">ChatFlow</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
            <Avatar name={user?.name || "U"} src={user?.profilePicture} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-brand-100">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 lg:p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <NavLink
                key={item.href}
                {...item}
                isActive={isActive}
                onWarm={() => warmRoute(item.href)}
              />
            );
          })}
        </nav>

        <div className="border-t border-surface-border p-3 lg:p-4">
          <SignOutButton />
        </div>
      </aside>

      {!isChatDetail && (
        <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-white/95 backdrop-blur-lg safe-bottom md:hidden">
          <div className="grid w-full grid-cols-6 gap-0 px-0.5 py-1.5 xs:gap-0.5 xs:px-1 xs:py-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NavLink
                  key={item.href}
                  {...item}
                  isActive={isActive}
                  compact
                  onWarm={() => warmRoute(item.href)}
                />
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
