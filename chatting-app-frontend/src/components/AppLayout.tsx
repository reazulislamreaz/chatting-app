"use client";

import { Sidebar } from "./Sidebar";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-[100dvh] bg-wa-panel md:bg-slate-100">
        <Sidebar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-[4.25rem] md:pb-0 md:p-0 lg:p-3">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:rounded-2xl md:border md:border-surface-border md:bg-white md:shadow-soft lg:rounded-2xl">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
