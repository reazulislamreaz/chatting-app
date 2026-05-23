"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { joinAudioRoom, leaveAudioRoom, setLocalAudioMuted } from "@/lib/zegoRtc";
import { useAuth } from "@/context/AuthContext";
import type {
  CallPhase,
  IncomingCallPayload,
  ZegoCallConfig,
  ZegoTokenResponse,
} from "@/types/call";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  startIncomingRingtone,
  startOutgoingRingtone,
  stopCallRingtone,
} from "@/lib/callRingtone";

interface ActiveCallState {
  callId: string;
  roomId: string;
  peerId: string;
  peerName: string;
  isCaller: boolean;
}

interface CallContextType {
  phase: CallPhase;
  incomingCall: IncomingCallPayload | null;
  activeCall: ActiveCallState | null;
  muted: boolean;
  startCall: (calleeId: string, calleeName: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  cancelCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(
    null,
  );
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [muted, setMuted] = useState(false);
  const zegoConfigRef = useRef<ZegoCallConfig | null>(null);
  const activeCallRef = useRef<ActiveCallState | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const resetCallState = useCallback(() => {
    stopCallRingtone();
    setPhase("idle");
    setIncomingCall(null);
    setActiveCall(null);
    setMuted(false);
  }, []);

  useEffect(() => {
    if (phase === "incoming") {
      void startIncomingRingtone();
    } else if (phase === "outgoing") {
      void startOutgoingRingtone();
    } else {
      stopCallRingtone();
    }
    return () => stopCallRingtone();
  }, [phase]);

  const getZegoConfig = useCallback(async (): Promise<ZegoCallConfig> => {
    if (zegoConfigRef.current?.appId) return zegoConfigRef.current;

    const res = await api<{ success: boolean; data: ZegoCallConfig }>(
      "/calls/config",
    );
    zegoConfigRef.current = res.data;
    return res.data;
  }, []);

  const fetchToken = useCallback(async (roomId: string) => {
    const res = await api<{ success: boolean; data: ZegoTokenResponse }>(
      "/calls/token",
      {
        method: "POST",
        body: JSON.stringify({ roomId }),
      },
    );
    return res.data;
  }, []);

  const connectZego = useCallback(
    async (call: ActiveCallState) => {
      if (!user) return;

      setPhase("connecting");
      try {
        const tokenData = await fetchToken(call.roomId);
        const config = await getZegoConfig();
        const appId = tokenData.appId || config.appId;
        const serverUrl = tokenData.serverUrl || config.serverUrl;

        if (!appId) {
          throw new Error(
            "Set a numeric ZEGOCLOUD_APP_ID in the backend .env (from the ZEGOCLOUD console)",
          );
        }

        await joinAudioRoom({
          appId,
          serverUrl,
          roomId: call.roomId,
          token: tokenData.token,
          userId: user.id,
          userName: user.name,
          onRemoteStream: () => {
            setPhase("active");
          },
        });

        setPhase("active");
      } catch (err) {
        await leaveAudioRoom();
        resetCallState();
        const socket = getSocket();
        if (call.callId) {
          socket.emit("call:end", { callId: call.callId });
        }
        toastError(
          err instanceof Error ? err.message : "Could not connect audio call",
        );
      }
    },
    [user, fetchToken, getZegoConfig, resetCallState],
  );

  const endCall = useCallback(() => {
    const call = activeCallRef.current;
    if (call) {
      getSocket().emit("call:end", { callId: call.callId });
    }
    void leaveAudioRoom();
    resetCallState();
  }, [resetCallState]);

  const handleCallEnded = useCallback(
    (reason?: string) => {
      void leaveAudioRoom();
      resetCallState();
      if (reason === "rejected") {
        toastError("Call declined");
      } else if (reason === "timeout") {
        toastError("No answer");
      } else if (reason === "busy") {
        toastError("User is busy");
      }
    },
    [resetCallState],
  );

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const onIncoming = (payload: IncomingCallPayload) => {
      if (phase !== "idle" && phase !== "incoming") return;
      setIncomingCall(payload);
      setPhase("incoming");
    };

    const onAccepted = async (payload: { callId: string; roomId: string }) => {
      const current = activeCallRef.current;
      if (!current || current.callId !== payload.callId) return;

      const updated = { ...current, roomId: payload.roomId };
      setActiveCall(updated);
      activeCallRef.current = updated;
      await connectZego(updated);
    };

    const onEnded = (payload: { callId: string; reason?: string }) => {
      const current = activeCallRef.current;
      const incoming = incomingCall;
      if (
        current?.callId !== payload.callId &&
        incoming?.callId !== payload.callId
      ) {
        return;
      }
      handleCallEnded(payload.reason);
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:ended", onEnded);
    };
  }, [user, phase, incomingCall, connectZego, handleCallEnded]);

  const startCall = useCallback(
    (calleeId: string, calleeName: string) => {
      if (!user || phase !== "idle") return;

      setPhase("outgoing");
      getSocket().emit(
        "call:invite",
        { calleeId },
        (response: {
          success: boolean;
          data?: { callId: string; roomId: string };
          message?: string;
        }) => {
          if (!response.success || !response.data) {
            setPhase("idle");
            toastError(response.message || "Could not start call");
            return;
          }

          const call: ActiveCallState = {
            callId: response.data.callId,
            roomId: response.data.roomId,
            peerId: calleeId,
            peerName: calleeName,
            isCaller: true,
          };
          setActiveCall(call);
          activeCallRef.current = call;
        },
      );
    },
    [user, phase],
  );

  const acceptCall = useCallback(() => {
    if (!incomingCall || !user) return;

    stopCallRingtone();

    const call: ActiveCallState = {
      callId: incomingCall.callId,
      roomId: incomingCall.roomId,
      peerId: incomingCall.callerId,
      peerName: incomingCall.callerName,
      isCaller: false,
    };
    setActiveCall(call);
    activeCallRef.current = call;
    setIncomingCall(null);

    getSocket().emit(
      "call:accept",
      { callId: call.callId },
      async (response: {
        success: boolean;
        data?: { callId: string; roomId: string };
        message?: string;
      }) => {
        if (!response.success) {
          resetCallState();
          toastError(response.message || "Could not accept call");
          return;
        }
        await connectZego(call);
        toastSuccess("Call connected");
      },
    );
  }, [incomingCall, user, connectZego, resetCallState]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    stopCallRingtone();
    getSocket().emit("call:reject", { callId: incomingCall.callId });
    resetCallState();
  }, [incomingCall, resetCallState]);

  const cancelCall = useCallback(() => {
    const call = activeCallRef.current;
    if (call?.isCaller && phase === "outgoing") {
      getSocket().emit("call:cancel", { callId: call.callId });
    }
    void leaveAudioRoom();
    resetCallState();
  }, [phase, resetCallState]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      setLocalAudioMuted(next);
      return next;
    });
  }, []);

  return (
    <CallContext.Provider
      value={{
        phase,
        incomingCall,
        activeCall,
        muted,
        startCall,
        acceptCall,
        rejectCall,
        cancelCall,
        endCall,
        toggleMute,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCall must be used within CallProvider");
  }
  return ctx;
}
