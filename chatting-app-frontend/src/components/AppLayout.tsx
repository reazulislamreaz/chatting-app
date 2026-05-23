"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatDetail =
    pathname.startsWith("/chat/") && pathname !== "/chat";

  return (
    <ProtectedRoute>
      <div className="flex h-[100dvh] bg-wa-panel md:bg-slate-100">
        <Sidebar />
        <main
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-0 md:p-0 lg:p-3 ${
            isChatDetail ? "pb-0" : "pb-[4.25rem]"
          }`}
        >
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:rounded-2xl md:border md:border-surface-border md:bg-white md:shadow-soft lg:rounded-2xl">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
