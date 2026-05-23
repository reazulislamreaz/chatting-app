"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  MAX_VOICE_DURATION_SECONDS,
  formatVoiceLimitLabel,
} from "@/lib/voiceLimits";
import { toastError, toastSuccess } from "@/lib/toast";

interface ChatComposerProps {
  onSendText: (content: string) => void;
  onSendImage: (file: File, caption: string) => Promise<void>;
  onSendVoice: (file: File, durationSeconds: number, caption: string) => Promise<void>;
  onInputChange?: (value: string) => void;
  sending?: boolean;
}

function pickRecorderMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ChatComposer({
  onSendText,
  onSendImage,
  onSendVoice,
  onInputChange,
  sending,
}: ChatComposerProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number>(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStoppedAtLimitRef = useRef(false);

  const clearImage = () => {
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const stopMediaStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopRecordingTimer();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stopMediaStream();
    };
  }, []);

  const handleImagePick = (file: File | null) => {
    clearImage();
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const finishRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    autoStoppedAtLimitRef.current = false;
    stopRecordingTimer();
    chunksRef.current = [];
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    stopMediaStream();
    setRecording(false);
    setRecordingSeconds(0);
  };

  const startRecording = async () => {
    if (recording || sending || image) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      autoStoppedAtLimitRef.current = false;
      setRecordingSeconds(0);
      setRecording(true);

      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - recordingStartedAtRef.current) / 1000,
        );
        const capped = Math.min(elapsed, MAX_VOICE_DURATION_SECONDS);
        setRecordingSeconds(capped);

        if (elapsed >= MAX_VOICE_DURATION_SECONDS) {
          stopRecordingTimer();
          if (!autoStoppedAtLimitRef.current) {
            autoStoppedAtLimitRef.current = true;
            toastSuccess("1 minute limit reached — sending voice message");
          }
          finishRecording();
        }
      }, 200);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stopRecordingTimer();
        stopMediaStream();

        const rawDuration = Math.round(
          (Date.now() - recordingStartedAtRef.current) / 1000,
        );
        const duration = Math.min(
          MAX_VOICE_DURATION_SECONDS,
          Math.max(1, rawDuration),
        );
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];

        if (blob.size < 100) {
          setRecording(false);
          setRecordingSeconds(0);
          return;
        }

        const ext = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `voice-${Date.now()}.${ext}`, {
          type: recorder.mimeType || "audio/webm",
        });
        const caption = content.trim();

        setContent("");
        setRecording(false);
        setRecordingSeconds(0);
        await onSendVoice(file, duration, caption);
      };

      recorder.start();
    } catch {
      stopMediaStream();
      setRecording(false);
      setRecordingSeconds(0);
      toastError(
        "Microphone access is required to record voice messages. Allow mic permission in your browser.",
      );
    }
  };

  const canSendText =
    !sending && !recording && !image && content.trim().length > 0;
  const canSend = canSendText || (!!image && !sending && !recording);
  const showMicButton = !canSend && !sending && !recording;

  const recordingProgress =
    (recordingSeconds / MAX_VOICE_DURATION_SECONDS) * 100;
  const nearLimit = recordingSeconds >= MAX_VOICE_DURATION_SECONDS - 10;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;

    if (image) {
      const caption = content.trim();
      setContent("");
      clearImage();
      await onSendImage(image, caption);
      return;
    }

    const text = content.trim();
    setContent("");
    onSendText(text);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="composer-bottom z-20 shrink-0 border-t border-surface-border bg-wa-panel px-2 pt-2.5 sm:px-4"
    >
      {preview && (
        <div className="mx-auto mb-2 flex w-full max-w-2xl items-start gap-2 rounded-xl bg-white p-2 shadow-sm sm:max-w-3xl lg:max-w-4xl">
          <img
            src={preview}
            alt="Preview"
            className="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-600">Image ready to send</p>
            <p className="truncate text-xs text-slate-400">{image?.name}</p>
          </div>
          <button
            type="button"
            onClick={clearImage}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Remove image"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {recording && (
        <div className="mx-auto mb-2 flex w-full max-w-2xl items-center justify-between rounded-xl bg-rose-50 px-4 py-3 shadow-sm sm:max-w-3xl lg:max-w-4xl">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-rose-700">Recording voice…</p>
              <p
                className={`text-xs font-medium tabular-nums ${
                  nearLimit ? "text-rose-600" : "text-rose-500"
                }`}
              >
                {formatRecordingTime(recordingSeconds)} / {formatVoiceLimitLabel()}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-rose-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    nearLimit ? "bg-rose-600" : "bg-rose-400"
                  }`}
                  style={{ width: `${Math.min(recordingProgress, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-rose-400">
                Max {MAX_VOICE_DURATION_SECONDS} seconds per message
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="rounded-full px-3 py-1.5 text-sm text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={finishRecording}
              className="rounded-full bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-2xl items-end gap-1.5 sm:max-w-3xl sm:gap-2 lg:max-w-4xl">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={sending || recording}
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/80 disabled:opacity-50 sm:mb-0 sm:h-10 sm:w-10"
          aria-label="Attach image"
        >
          <svg
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImagePick(e.target.files?.[0] || null)}
        />

        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onInputChange?.(e.target.value);
            }}
            placeholder={
              recording
                ? "Optional caption for voice note"
                : image
                  ? "Add a caption (optional)"
                  : "Message"
            }
            disabled={sending}
            className="min-h-[42px] w-full rounded-3xl border-0 bg-white py-2.5 pl-4 pr-12 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60 sm:min-h-[44px] sm:pr-14 sm:text-sm"
          />

          {canSend && (
            <button
              type="submit"
              disabled={!canSend}
              className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:bottom-1.5 sm:right-1.5 sm:h-10 sm:w-10"
              aria-label="Send message"
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-5 sm:w-5" />
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M3.4 20.4 20.85 12.28c.8-.4.8-1.5 0-1.9L3.4 2.6c-.77-.38-1.66.22-1.5 1.08l1.25 6.3c.1.5.5.88 1 .94l7.9.95-7.9.95c-.5.06-.9.44-1 .94l-1.25 6.3c-.16.86.73 1.46 1.5 1.08z" />
                </svg>
              )}
            </button>
          )}

          {showMicButton && (
            <button
              type="button"
              onClick={startRecording}
              className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 sm:bottom-1.5 sm:right-1.5 sm:h-10 sm:w-10"
              aria-label="Record voice message (max 1 minute)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
