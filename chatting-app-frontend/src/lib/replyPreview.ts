import type { MessageReply } from "@/types";

export function getReplyPreviewText(reply?: MessageReply): string {
  if (!reply) return "";
  if (reply.isDeleted) return "Message deleted";
  if (reply.voiceUrl) {
    return reply.content?.trim() || "Voice message";
  }
  if (reply.imageUrl) {
    return reply.content?.trim() || "Photo";
  }
  return reply.content?.trim() || "Message";
}
