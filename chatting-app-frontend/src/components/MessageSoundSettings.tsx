"use client";

import { useEffect, useState } from "react";
import {
  isMessageSoundMuted,
  playIncomingMessageSound,
  setMessageSoundMuted,
  unlockMessageSound,
} from "@/lib/messageSound";

export function MessageSoundSettings() {
  const [muted, setMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMuted(isMessageSoundMuted());
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const next = !muted;
    setMuted(next);
    setMessageSoundMuted(next);

    if (!next) {
      unlockMessageSound();
      playIncomingMessageSound();
    }
  };

  if (!mounted) return null;

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0-12a9 9 0 00-6.364 2.636M12 6a9 9 0 016.364 2.636M6.5 17.5h11"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900">
            Message sounds
          </h2>
          <p className="text-sm text-slate-500">
            Play a sound when you receive a new message
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={muted ? "false" : "true"}
          onClick={handleToggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            muted ? "bg-slate-300" : "bg-brand-600"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              muted ? "translate-x-0" : "translate-x-5"
            }`}
          />
          <span className="sr-only">
            {muted ? "Message sounds off" : "Message sounds on"}
          </span>
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Sounds play for incoming messages from other chats. No sound while you
        are viewing that conversation.
      </p>
    </div>
  );
}
