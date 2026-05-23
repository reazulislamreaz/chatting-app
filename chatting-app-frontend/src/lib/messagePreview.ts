import { getCallLogLabel } from "@/lib/callLabel";
import type { CallLogStatus } from "@/types";

interface PreviewMessage {
  messageType?: "text" | "call";
  content?: string;
  imageUrl?: string;
  voiceUrl?: string;
  callStatus?: CallLogStatus;
  callDuration?: number;
  senderId?: string;
}

export function getMessagePreview(
  message: (PreviewMessage & { isDeleted?: boolean }) | null | undefined,
  isOwn = false,
  viewerId?: string,
): string {
  if (!message) return "No messages yet";

  if (message.isDeleted) {
    return isOwn ? "You: deleted a message" : "Message deleted";
  }

  if (message.messageType === "call" && message.callStatus) {
    const callerIsViewer =
      viewerId !== undefined
        ? message.senderId === viewerId
        : isOwn;
    const label = getCallLogLabel(
      message.callStatus,
      callerIsViewer,
      message.callDuration ?? 0,
    );
    return isOwn ? `You: ${label}` : label;
  }

  const prefix = isOwn ? "You: " : "";
  if (message.voiceUrl) {
    const caption = message.content?.trim();
    if (caption) return `${prefix}${caption}`;
    return `${prefix}Voice message`;
  }
  if (message.imageUrl) {
    const caption = message.content?.trim();
    if (caption) return `${prefix}${caption}`;
    return `${prefix}Photo`;
  }

  return `${prefix}${message.content?.trim() || ""}`;
}
