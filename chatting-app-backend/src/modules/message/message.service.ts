import { Message, IMessage } from "./message.model";
import { friendRequestService } from "../friendRequest/friendRequest.service";
import { AppError } from "../../utils/AppError";
import { MESSAGE_LIST_SELECT } from "../../constants/queryFields";
import {
  uploadImageToS3,
  uploadAudioToS3,
  resolveImageUrl,
  deleteFromS3ByUrl,
} from "../../config/s3";
import type { MessagePayload } from "../../socket/message.events";
import { cache } from "../../cache/cache.service";
import { cacheInvalidate } from "../../cache/invalidate";
import { keys, TTL } from "../../cache/keys";
import { MAX_VOICE_DURATION_SECONDS } from "../../constants/limits";
import type { CallLogStatus } from "../../constants/call";
import { emitReceiveMessage } from "../../socket/message.events";

function formatMessage(message: {
  _id: { toString(): string };
  senderId: { toString(): string };
  receiverId: { toString(): string };
  messageType?: string;
  content?: string;
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  callStatus?: CallLogStatus;
  callDuration?: number;
  read: boolean;
  isDeleted?: boolean;
  editedAt?: Date;
  createdAt: Date;
}): MessagePayload {
  const isDeleted = Boolean(message.isDeleted);
  const isCall = message.messageType === "call";

  return {
    id: message._id.toString(),
    senderId: message.senderId.toString(),
    receiverId: message.receiverId.toString(),
    messageType: isCall ? "call" : "text",
    content: isDeleted ? "" : message.content || "",
    imageUrl: isDeleted
      ? undefined
      : message.imageUrl
        ? resolveImageUrl(message.imageUrl)
        : undefined,
    voiceUrl: isDeleted
      ? undefined
      : message.voiceUrl
        ? resolveImageUrl(message.voiceUrl)
        : undefined,
    voiceDuration: isDeleted ? undefined : message.voiceDuration || undefined,
    callStatus: isCall && !isDeleted ? message.callStatus : undefined,
    callDuration: isCall && !isDeleted ? message.callDuration ?? 0 : undefined,
    read: message.read,
    isDeleted,
    editedAt: message.editedAt,
    createdAt: message.createdAt,
  };
}

async function getOwnedMessage(messageId: string, userId: string) {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError(404, "Message not found");
  }
  if (message.messageType === "call") {
    throw new AppError(400, "Call history cannot be edited");
  }
  if (message.senderId.toString() !== userId) {
    throw new AppError(403, "Not authorized to modify this message");
  }
  if (message.isDeleted) {
    throw new AppError(400, "Message already deleted");
  }
  return message;
}

export class MessageService {
  async sendMessage(
    senderId: string,
    receiverId: string,
    content = "",
    imageFile?: Express.Multer.File,
    voiceFile?: Express.Multer.File,
    voiceDuration = 0
  ): Promise<MessagePayload> {
    const areFriends = await friendRequestService.areFriends(senderId, receiverId);
    if (!areFriends) {
      throw new AppError(403, "You can only message friends");
    }

    if (imageFile && voiceFile) {
      throw new AppError(400, "Send either an image or a voice message, not both");
    }

    const trimmedContent = content?.trim() ?? "";
    if (!trimmedContent && !imageFile && !voiceFile) {
      throw new AppError(400, "Message must have text, an image, or a voice note");
    }

    let imageUrl = "";
    let voiceUrl = "";
    let duration = 0;

    if (imageFile) {
      imageUrl = await uploadImageToS3(imageFile, "messages");
    }

    if (voiceFile) {
      duration = Math.max(0, Math.round(voiceDuration));
      if (duration < 1) {
        throw new AppError(400, "Voice message is too short");
      }
      if (duration > MAX_VOICE_DURATION_SECONDS) {
        throw new AppError(
          400,
          `Voice messages cannot be longer than ${MAX_VOICE_DURATION_SECONDS} seconds`
        );
      }
      voiceUrl = await uploadAudioToS3(voiceFile, "messages");
    }

    const message = await Message.create({
      senderId,
      receiverId,
      messageType: "text",
      content: trimmedContent,
      imageUrl,
      voiceUrl,
      voiceDuration: duration,
    });

    await cacheInvalidate.onNewMessage(senderId, receiverId);

    return formatMessage(message as IMessage);
  }

  async updateMessage(
    messageId: string,
    userId: string,
    content?: string,
    imageFile?: Express.Multer.File,
    removeImage = false
  ): Promise<MessagePayload> {
    const message = await getOwnedMessage(messageId, userId);

    if (message.voiceUrl) {
      throw new AppError(400, "Voice messages cannot be edited");
    }

    const trimmedContent =
      content !== undefined ? content.trim() : message.content || "";

    let imageUrl = message.imageUrl || "";
    if (removeImage && imageUrl) {
      await deleteFromS3ByUrl(resolveImageUrl(imageUrl));
      imageUrl = "";
    }
    if (imageFile) {
      if (imageUrl) await deleteFromS3ByUrl(resolveImageUrl(imageUrl));
      imageUrl = await uploadImageToS3(imageFile, "messages");
    }

    if (!trimmedContent && !imageUrl) {
      throw new AppError(400, "Message must have text or an image");
    }

    message.content = trimmedContent;
    message.imageUrl = imageUrl;
    message.editedAt = new Date();
    await message.save();

    const senderId = message.senderId.toString();
    const receiverId = message.receiverId.toString();
    await cacheInvalidate.messages(senderId, receiverId);
    await cacheInvalidate.chatLists(senderId, receiverId);

    return formatMessage(message as IMessage);
  }

  async deleteMessage(messageId: string, userId: string): Promise<MessagePayload> {
    const message = await getOwnedMessage(messageId, userId);

    if (message.imageUrl) {
      await deleteFromS3ByUrl(resolveImageUrl(message.imageUrl));
    }
    if (message.voiceUrl) {
      await deleteFromS3ByUrl(resolveImageUrl(message.voiceUrl));
    }

    message.content = "";
    message.imageUrl = "";
    message.voiceUrl = "";
    message.voiceDuration = 0;
    message.isDeleted = true;
    message.editedAt = undefined;
    await message.save();

    const senderId = message.senderId.toString();
    const receiverId = message.receiverId.toString();
    await cacheInvalidate.messages(senderId, receiverId);
    await cacheInvalidate.chatLists(senderId, receiverId);

    return formatMessage(message as IMessage);
  }

  async getConversation(
    userId: string,
    otherUserId: string,
    page = 1,
    limit = 50
  ) {
    const areFriends = await friendRequestService.areFriends(userId, otherUserId);
    if (!areFriends) {
      throw new AppError(403, "You can only view messages with friends");
    }

    if (page <= 3) {
      return cache.getOrSet(
        keys.messages(userId, otherUserId, page),
        TTL.MESSAGES_PAGE,
        () => this.fetchConversation(userId, otherUserId, page, limit)
      );
    }

    return this.fetchConversation(userId, otherUserId, page, limit);
  }

  private async fetchConversation(
    userId: string,
    otherUserId: string,
    page: number,
    limit: number
  ) {
    const conversationFilter = {
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    };

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find(conversationFilter)
        .select(MESSAGE_LIST_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(conversationFilter),
    ]);

    return {
      messages: messages.reverse().map((m) => formatMessage(m)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(receiverId: string, senderId: string) {
    const result = await Message.updateMany(
      { senderId, receiverId, read: false },
      { read: true, readAt: new Date() }
    );

    if (result.modifiedCount > 0) {
      await cacheInvalidate.onMarkRead(receiverId, senderId);
      await cacheInvalidate.messages(receiverId, senderId);
    }

    return { modifiedCount: result.modifiedCount };
  }

  async getUnreadCount(userId: string, fromUserId: string) {
    return Message.countDocuments({
      senderId: fromUserId,
      receiverId: userId,
      read: false,
      isDeleted: false,
      messageType: { $ne: "call" },
    });
  }

  async createCallLogMessage(
    callerId: string,
    calleeId: string,
    callStatus: CallLogStatus,
    durationSeconds = 0,
  ): Promise<MessagePayload> {
    const areFriends = await friendRequestService.areFriends(callerId, calleeId);
    if (!areFriends) {
      throw new AppError(403, "You can only call friends");
    }

    const message = await Message.create({
      senderId: callerId,
      receiverId: calleeId,
      messageType: "call",
      content: "",
      callStatus,
      callDuration: Math.max(0, Math.round(durationSeconds)),
      read: true,
    });

    await cacheInvalidate.onNewMessage(callerId, calleeId);

    const payload = formatMessage(message as IMessage);
    emitReceiveMessage(payload);
    return payload;
  }
}

export const messageService = new MessageService();
