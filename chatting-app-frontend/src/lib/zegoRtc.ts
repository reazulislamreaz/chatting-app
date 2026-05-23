import type { ZegoTokenResponse } from "@/types/call";

type ZegoEngine = InstanceType<
  typeof import("zego-express-engine-webrtc").ZegoExpressEngine
>;

let engine: ZegoEngine | null = null;
let localStream: MediaStream | null = null;
let publishStreamId: string | null = null;
const playingStreamIds = new Set<string>();
const remoteAudioElements = new Map<string, HTMLAudioElement>();

export async function joinAudioRoom(params: {
  appId: number;
  serverUrl: string;
  roomId: string;
  token: string;
  userId: string;
  userName: string;
  onRemoteStream: (streamId: string) => void;
}): Promise<ZegoEngine> {
  const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");

  if (engine) {
    await leaveAudioRoom();
  }

  const zg = new ZegoExpressEngine(params.appId, params.serverUrl, {
    scenario: 4,
  });
  engine = zg;

  zg.on(
    "roomStreamUpdate",
    async (roomID, updateType, streamList: { streamID: string }[]) => {
      if (roomID !== params.roomId) return;

      if (updateType === "ADD") {
        for (const stream of streamList) {
          if (stream.streamID === publishStreamId) continue;
          await playRemoteAudio(zg, stream.streamID);
          params.onRemoteStream(stream.streamID);
        }
      } else if (updateType === "DELETE") {
        for (const stream of streamList) {
          stopRemoteAudio(stream.streamID);
        }
      }
    },
  );

  zg.on("tokenWillExpire", async () => {
    try {
      const renewed = await fetchFreshToken(params.roomId);
      zg.renewToken(renewed.token);
    } catch {
      // Token renewal failed; call may drop when token expires.
    }
  });

  const loggedIn = await zg.loginRoom(
    params.roomId,
    params.token,
    { userID: params.userId, userName: params.userName },
    { userUpdate: true },
  );

  if (!loggedIn) {
    engine = null;
    throw new Error("Failed to join Zego room");
  }

  localStream = await zg.createStream({
    camera: { audio: true, video: false },
  });

  publishStreamId = `audio_${params.userId}`;
  zg.startPublishingStream(publishStreamId, localStream);

  return zg;
}

async function fetchFreshToken(roomId: string): Promise<ZegoTokenResponse> {
  const { api } = await import("@/lib/api");
  const res = await api<{ success: boolean; data: ZegoTokenResponse }>(
    "/calls/token",
    {
      method: "POST",
      body: JSON.stringify({ roomId }),
    },
  );
  return res.data;
}

async function playRemoteAudio(zg: ZegoEngine, streamId: string): Promise<void> {
  if (playingStreamIds.has(streamId)) return;

  const mediaStream = await zg.startPlayingStream(streamId);

  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.srcObject = mediaStream;
  audio.setAttribute("playsinline", "true");
  document.body.appendChild(audio);

  playingStreamIds.add(streamId);
  remoteAudioElements.set(streamId, audio);
}

function stopRemoteAudio(streamId: string): void {
  if (engine) {
    engine.stopPlayingStream(streamId);
  }
  const el = remoteAudioElements.get(streamId);
  if (el) {
    el.srcObject = null;
    el.remove();
    remoteAudioElements.delete(streamId);
  }
  playingStreamIds.delete(streamId);
}

export function setLocalAudioMuted(muted: boolean): void {
  if (!localStream) return;
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !muted;
  });
}

export async function leaveAudioRoom(): Promise<void> {
  if (!engine) return;

  const zg = engine;

  if (publishStreamId) {
    zg.stopPublishingStream(publishStreamId);
    publishStreamId = null;
  }

  if (localStream) {
    zg.destroyStream(localStream);
    localStream = null;
  }

  for (const streamId of [...playingStreamIds]) {
    stopRemoteAudio(streamId);
  }

  zg.logoutRoom();
  engine = null;
}
