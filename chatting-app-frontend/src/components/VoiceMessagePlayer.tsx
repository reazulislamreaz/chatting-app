"use client";

import { useEffect, useRef, useState } from "react";
import { getUploadUrl } from "@/lib/api";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface VoiceMessagePlayerProps {
  src: string;
  duration?: number;
  isOwn?: boolean;
}

export function VoiceMessagePlayer({
  src,
  duration = 0,
  isOwn = false,
}: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadedDuration, setLoadedDuration] = useState(duration);

  const audioSrc = getUploadUrl(src);
  const total = loadedDuration || duration || 0;
  const progress = total > 0 ? Math.min((currentTime / total) * 100, 100) : 0;

  useEffect(() => {
    setLoadedDuration(duration);
    setCurrentTime(0);
    setPlaying(false);
  }, [src, duration]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div
      className={`flex min-w-[200px] max-w-[260px] items-center gap-3 px-3 py-2.5 ${
        isOwn ? "text-slate-900" : "text-slate-900"
      }`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
          isOwn
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "bg-brand-500 text-white hover:bg-brand-600"
        }`}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
          </svg>
        ) : (
          <svg className="h-5 w-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
          <div
            className={`h-full rounded-full transition-all ${isOwn ? "bg-brand-700" : "bg-brand-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {formatDuration(playing || currentTime > 0 ? currentTime : total)}
        </p>
      </div>

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (audio?.duration && Number.isFinite(audio.duration)) {
            setLoadedDuration(Math.round(audio.duration));
          }
        }}
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (audio) setCurrentTime(audio.currentTime);
        }}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
        onPause={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
