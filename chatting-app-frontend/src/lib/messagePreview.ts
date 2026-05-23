interface PreviewMessage {
  content?: string;
  imageUrl?: string;
  voiceUrl?: string;
}

export function getMessagePreview(
  message: (PreviewMessage & { isDeleted?: boolean }) | null | undefined,
  isOwn = false
): string {
  if (!message) return "No messages yet";

  if (message.isDeleted) {
    return isOwn ? "You: deleted a message" : "Message deleted";
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
