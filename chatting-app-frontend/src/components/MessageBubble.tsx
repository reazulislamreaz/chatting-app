"use client";

import { useState } from "react";
import { getUploadUrl } from "@/lib/api";
import { getReplyPreviewText } from "@/lib/replyPreview";
import { VoiceMessagePlayer } from "@/components/VoiceMessagePlayer";
import { CallLogBubble } from "@/components/CallLogBubble";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: Message) => void;
}

function ReplyQuote({
  reply,
  isOwn,
}: {
  reply: NonNullable<Message["replyTo"]>;
  isOwn: boolean;
}) {
  const preview = getReplyPreviewText(reply);

  return (
    <div
      className={`mb-1 rounded-lg border-l-4 px-2.5 py-1.5 ${
        isOwn
          ? "border-brand-700/40 bg-brand-700/10"
          : "border-brand-500 bg-brand-50/80"
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          isOwn ? "text-brand-900/80" : "text-brand-700"
        }`}
      >
        Replied message
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{preview}</p>
    </div>
  );
}

export function MessageBubble({
  message,
  isOwn,
  onEdit,
  onDelete,
  onReply,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const imageSrc = message.imageUrl ? getUploadUrl(message.imageUrl) : "";
  const hasVoice = Boolean(message.voiceUrl);
  const hasText = Boolean(message.content?.trim());
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const canReply = onReply && !message.isDeleted && message.messageType !== "call";
  const showMenu = isOwn ? onEdit || onDelete || canReply : canReply;

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="rounded-2xl bg-white/70 px-4 py-2 text-sm italic text-slate-500 shadow-sm">
          This message was deleted
        </div>
      </div>
    );
  }

  if (message.messageType === "call" && message.callStatus) {
    return (
      <CallLogBubble
        callStatus={message.callStatus}
        callDuration={message.callDuration ?? 0}
        isCaller={isOwn}
        createdAt={message.createdAt}
      />
    );
  }

  return (
    <div className={`group flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-[88%] xs:max-w-[85%] sm:max-w-[72%]">
        {showMenu && (
          <div
            className={`absolute top-1 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100 ${
              isOwn ? "-left-8" : "-right-8"
            }`}
          >
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-1 text-slate-500 hover:bg-white/80"
              aria-label="Message options"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className={`absolute bottom-full z-20 mb-1 min-w-[120px] overflow-hidden rounded-xl border border-surface-border bg-white py-1 shadow-lg ${
                    isOwn ? "left-0" : "right-0"
                  }`}
                >
                  {canReply && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onReply(message);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Reply
                    </button>
                  )}
                  {isOwn && onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(message);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  )}
                  {isOwn && onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(message.id);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div
          className={`overflow-hidden ${
            isOwn
              ? "rounded-2xl rounded-br-sm bg-wa-bubbleOut text-slate-900 shadow-sm"
              : "rounded-2xl rounded-bl-sm bg-wa-bubbleIn text-slate-900 shadow-card"
          }`}
        >
          {message.replyTo && (
            <div className="px-3 pt-2">
              <ReplyQuote reply={message.replyTo} isOwn={isOwn} />
            </div>
          )}
          {imageSrc && (
            <a href={imageSrc} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={imageSrc}
                alt="Shared"
                className="max-h-56 w-full object-cover sm:max-h-72"
              />
            </a>
          )}
          {hasVoice && message.voiceUrl && (
            <VoiceMessagePlayer
              src={message.voiceUrl}
              duration={message.voiceDuration}
              isOwn={isOwn}
            />
          )}
          <div
            className={`px-3 ${
              (imageSrc || hasVoice) && hasText
                ? "py-2 pt-1"
                : imageSrc || hasVoice
                  ? "pb-1"
                  : "py-2"
            }`}
          >
            {hasText && (
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                {message.content}
              </p>
            )}
            <p
              className={`flex items-center justify-end gap-1 text-[11px] ${
                hasText ? "mt-0.5" : ""
              } ${isOwn ? "text-brand-800/60" : "text-slate-400"}`}
            >
              {message.editedAt && <span className="mr-1">edited</span>}
              <span>{time}</span>
              {isOwn && <span>{message.read ? "✓✓" : "✓"}</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
