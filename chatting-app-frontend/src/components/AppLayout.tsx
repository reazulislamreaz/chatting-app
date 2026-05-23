"use client";

import { Sidebar } from "./Sidebar";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-[100dvh] bg-wa-panel">
        <Sidebar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-[4.25rem] md:pb-0">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
