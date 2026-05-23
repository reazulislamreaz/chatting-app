export type CallPhase =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connecting"
  | "active"
  | "ending";

export interface IncomingCallPayload {
  callId: string;
  roomId: string;
  callerId: string;
  callerName: string;
}

export interface ZegoCallConfig {
  appId: number;
  serverUrl: string;
}

export interface ZegoTokenResponse {
  token: string;
  roomId: string;
  appId: number;
  serverUrl: string;
  userId: string;
}
