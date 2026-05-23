import { Server } from "socket.io";

export interface MessagePayload {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  read: boolean;
  isDeleted?: boolean;
  editedAt?: Date;
  createdAt: Date;
}

let io: Server | null = null;

export function setSocketServer(server: Server): void {
  io = server;
}

function emitToParticipants(
  message: Pick<MessagePayload, "senderId" | "receiverId">,
  event: string,
  payload: unknown
): void {
  if (!io) return;
  io.to(`user:${message.receiverId}`).emit(event, payload);
  io.to(`user:${message.senderId}`).emit(event, payload);
}

export function emitReceiveMessage(message: MessagePayload): void {
  emitToParticipants(message, "receive_message", message);
}

export function emitMessageUpdated(message: MessagePayload): void {
  emitToParticipants(message, "message_updated", message);
}

export function emitMessageDeleted(message: MessagePayload): void {
  emitToParticipants(message, "message_deleted", message);
}
