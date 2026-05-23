"use client";

import { useCall } from "@/context/CallContext";

export function ActiveCallBar() {
  const { phase, activeCall, muted, cancelCall, endCall, toggleMute } = useCall();

  const showBar =
    activeCall &&
    (phase === "outgoing" ||
      phase === "connecting" ||
      phase === "active" ||
      phase === "ending");

  if (!showBar || !activeCall) return null;

  const statusLabel =
    phase === "outgoing"
      ? "Calling…"
      : phase === "connecting"
        ? "Connecting…"
        : phase === "active"
          ? "On call"
          : "Ending…";

  const onHangUp = phase === "outgoing" ? cancelCall : endCall;

  return (
    <div className="fixed bottom-[5.25rem] left-1/2 z-[90] w-[min(100vw-1.5rem,24rem)] -translate-x-1/2 rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-lg sm:bottom-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {activeCall.peerName}
          </p>
          <p className="text-xs text-brand-600">{statusLabel}</p>
        </div>
        {phase === "active" && (
          <button
            type="button"
            onClick={toggleMute}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              muted
                ? "bg-rose-100 text-rose-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A23.902 23.902 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75 2.034 0 3.923.627 5.482 1.698m0 0L21.75 4.5M17.25 9.75L21.75 4.5" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onHangUp}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-700"
          aria-label="End call"
        >
          <svg
            className="h-5 w-5 rotate-[135deg]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
