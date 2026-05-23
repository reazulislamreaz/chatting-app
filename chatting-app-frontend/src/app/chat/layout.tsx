import { AppLayout } from "@/components/AppLayout";
import { ChatShell } from "@/components/ChatShell";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <ChatShell>{children}</ChatShell>
    </AppLayout>
  );
}
