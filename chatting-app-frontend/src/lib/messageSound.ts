const MUTE_STORAGE_KEY = "chat_message_sounds_muted";

let audioContext: AudioContext | null = null;
let unlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

/** Call once after user gesture so autoplay policies allow notification sounds. */
export function unlockMessageSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  unlocked = true;
}

export function isMessageSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
}

export function setMessageSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Short two-tone notification (no external audio file). */
export function playIncomingMessageSound(): void {
  if (isMessageSoundMuted()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (!unlocked && ctx.state === "suspended") {
    return;
  }

  try {
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const t = ctx.currentTime;
    playTone(ctx, 784, t, 0.1, 0.09);
    playTone(ctx, 1046.5, t + 0.09, 0.14, 0.07);
  } catch {
    // Ignore playback errors (e.g. autoplay blocked).
  }
}

export function shouldPlayIncomingSound(
  message: { senderId: string; receiverId: string; messageType?: string },
  currentUserId: string,
  pathname: string,
): boolean {
  if (message.senderId === currentUserId) return false;
  if (message.messageType === "call") return false;
  if (isMessageSoundMuted()) return false;

  const chatMatch = pathname.match(/^\/chat\/([^/]+)/);
  if (chatMatch?.[1] === message.senderId) return false;

  return true;
}
