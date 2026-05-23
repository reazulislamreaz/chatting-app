import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { messageService } from "../modules/message/message.service";
import { userService } from "../modules/user/user.service";
import { setSocketServer, emitReceiveMessage } from "./message.events";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocket(io: Server): void {
  setSocketServer(io);

  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.toString().replace("Bearer ", "");

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);
    await userService.setOnlineStatus(userId, true);
    io.emit("user_online", { userId });

    socket.on(
      "send_message",
      async (data: { receiverId: string; content: string }, callback) => {
      try {
        const message = await messageService.sendMessage(
          userId,
          data.receiverId,
          data.content
        );

        emitReceiveMessage(message);

        if (typeof callback === "function") {
          callback({ success: true, data: message });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send message";
        if (typeof callback === "function") {
          callback({ success: false, message });
        }
      }
    }
    );

    socket.on("message_read", async (data: { senderId: string }) => {
      try {
        const result = await messageService.markAsRead(userId, data.senderId);
        io.to(`user:${data.senderId}`).emit("messages_read", {
          readerId: userId,
          modifiedCount: result.modifiedCount,
        });
      } catch (err) {
        console.error("message_read error:", err);
      }
    });

    socket.on("typing", (data: { receiverId: string; isTyping: boolean }) => {
      io.to(`user:${data.receiverId}`).emit("typing", {
        userId,
        isTyping: data.isTyping,
      });
    });

    socket.on("disconnect", async () => {
      await userService.setOnlineStatus(userId, false);
      io.emit("user_offline", { userId, lastSeen: new Date() });
    });
  });
}
