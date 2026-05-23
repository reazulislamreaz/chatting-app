"use client";

import { usePathname } from "next/navigation";
import { ChatListPanel } from "./ChatListPanel";

export function ChatShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDetail =
    pathname.startsWith("/chat/") && pathname !== "/chat";

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col md:flex-row">
      <aside
        className={`${
          isDetail ? "hidden md:flex" : "flex"
        } h-full w-full shrink-0 flex-col border-surface-border bg-white md:w-[min(100%,22rem)] md:border-r lg:w-96`}
      >
        <ChatListPanel />
      </aside>

      <section
        className={`${
          !isDetail ? "hidden md:flex" : "flex"
        } min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white`}
      >
        {children}
      </section>
    </div>
  );
}
