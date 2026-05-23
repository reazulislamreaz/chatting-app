import { io, Socket } from "socket.io-client";
import { getToken } from "./api";

let socket: Socket | null = null;

function socketTransports(): ("websocket" | "polling")[] {
  return process.env.NODE_ENV === "production"
    ? ["websocket"]
    : ["websocket", "polling"];
}

export function getSocket(): Socket {
  if (!socket) {
    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:5001" : "");
    if (!url) {
      throw new Error("NEXT_PUBLIC_SOCKET_URL is not set");
    }
    socket = io(url, {
      autoConnect: false,
      auth: { token: getToken() },
      transports: socketTransports(),
      reconnectionAttempts: 10,
      reconnectionDelayMax: 10_000,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  s.auth = { token: getToken() };
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
