"use client";

import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/components/QueryProvider";
import { QueryLoadingBar } from "@/components/QueryLoadingBar";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { CallProvider } from "@/context/CallContext";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { ActiveCallBar } from "@/components/ActiveCallBar";
import { MessageSoundUnlock } from "@/components/MessageSoundUnlock";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <QueryLoadingBar />
    <AuthProvider>
      <CallProvider>
      <ChatProvider>
        {children}
        <MessageSoundUnlock />
        <IncomingCallModal />
        <ActiveCallBar />
        <Toaster
          position="top-center"
          containerClassName="!top-4 sm:!top-6"
          toastOptions={{
            duration: 4000,
            className:
              "!rounded-xl !px-4 !py-3 !text-sm !font-medium !shadow-lg !max-w-[min(100vw-2rem,24rem)]",
            style: {
              background: "#ffffff",
              color: "#111827",
              border: "1px solid #d1d7db",
            },
            success: {
              iconTheme: {
                primary: "#00a884",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#e11d48",
                secondary: "#ffffff",
              },
            },
          }}
        />
      </ChatProvider>
      </CallProvider>
    </AuthProvider>
    </QueryProvider>
  );
}
