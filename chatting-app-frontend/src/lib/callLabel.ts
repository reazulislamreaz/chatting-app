import type { CallLogStatus } from "@/types";

export function formatCallDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
}

export function getCallLogLabel(
  callStatus: CallLogStatus,
  isCaller: boolean,
  durationSeconds = 0,
): string {
  switch (callStatus) {
    case "completed":
      return isCaller
        ? `Outgoing voice call · ${formatCallDuration(durationSeconds)}`
        : `Incoming voice call · ${formatCallDuration(durationSeconds)}`;
    case "disconnected":
      return isCaller
        ? `Voice call ended · ${formatCallDuration(durationSeconds)}`
        : `Voice call ended · ${formatCallDuration(durationSeconds)}`;
    case "rejected":
      return isCaller ? "Voice call · Declined" : "Voice call · Declined";
    case "cancelled":
      return isCaller ? "Voice call · Cancelled" : "Missed voice call";
    case "missed":
      return isCaller ? "Voice call · No answer" : "Missed voice call";
    case "busy":
      return isCaller ? "Voice call · Busy" : "Voice call · Busy";
    default:
      return "Voice call";
  }
}
