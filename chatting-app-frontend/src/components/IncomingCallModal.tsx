"use client";

import { useCall } from "@/context/CallContext";

export function IncomingCallModal() {
  const { phase, incomingCall, acceptCall, rejectCall } = useCall();

  if (phase !== "incoming" || !incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in"
        role="dialog"
        aria-labelledby="incoming-call-title"
      >
        <p
          id="incoming-call-title"
          className="text-center text-sm font-medium text-slate-500"
        >
          Incoming voice call
        </p>
        <p className="mt-2 text-center text-xl font-semibold text-slate-900">
          {incomingCall.callerName}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={rejectCall}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={acceptCall}
            className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
