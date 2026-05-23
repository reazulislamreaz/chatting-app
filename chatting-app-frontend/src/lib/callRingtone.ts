let audioContext: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;
let activeMode: "incoming" | "outgoing" | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTonePair(
  ctx: AudioContext,
  frequencies: [number, number],
  durationMs: number,
  volume: number,
): void {
  const now = ctx.currentTime;
  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const start = now + index * 0.08;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
    osc.start(start);
    osc.stop(start + durationMs / 1000 + 0.05);
  });
}

async function ensureResumed(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return ctx;
}

export async function startIncomingRingtone(): Promise<void> {
  if (activeMode === "incoming") return;
  stopCallRingtone();
  activeMode = "incoming";

  const ctx = await ensureResumed();
  const ring = () => playTonePair(ctx, [440, 480], 400, 0.2);

  ring();
  ringTimer = setInterval(ring, 2000);
}

export async function startOutgoingRingtone(): Promise<void> {
  if (activeMode === "outgoing") return;
  stopCallRingtone();
  activeMode = "outgoing";

  const ctx = await ensureResumed();
  const ring = () => playTonePair(ctx, [350, 350], 250, 0.12);

  ring();
  ringTimer = setInterval(ring, 1500);
}

export function stopCallRingtone(): void {
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
  activeMode = null;
}
