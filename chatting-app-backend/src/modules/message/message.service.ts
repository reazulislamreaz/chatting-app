import { Message, IMessage } from "./message.model";
import { friendRequestService } from "../friendRequest/friendRequest.service";
import { AppError } from "../../utils/AppError";
import { MESSAGE_LIST_SELECT } from "../../constants/queryFields";
import {
  uploadImageToS3,
  resolveImageUrl,
  deleteFromS3ByUrl,
} from "../../config/s3";
import type { MessagePayload } from "../../socket/message.events";

function formatMessage(message: {
  _id: { toString(): string };
  senderId: { toString(): string };
  receiverId: { toString(): string };
  content?: string;
  imageUrl?: string;
  read: boolean;
  isDeleted?: boolean;
  editedAt?: Date;
  createdAt: Date;
}): MessagePayload {
  const isDeleted = Boolean(message.isDeleted);

  return {
    id: message._id.toString(),
    senderId: message.senderId.toString(),
    receiverId: message.receiverId.toString(),
    content: isDeleted ? "" : message.content || "",
    imageUrl: isDeleted
      ? undefined
      : message.imageUrl
        ? resolveImageUrl(message.imageUrl)
        : undefined,
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
    imageFile?: Express.Multer.File
  ): Promise<MessagePayload> {
    const areFriends = await friendRequestService.areFriends(senderId, receiverId);
    if (!areFriends) {
      throw new AppError(403, "You can only message friends");
    }

    const trimmedContent = content?.trim() ?? "";
    if (!trimmedContent && !imageFile) {
      throw new AppError(400, "Message must have text or an image");
    }

    let imageUrl = "";
    if (imageFile) {
      imageUrl = await uploadImageToS3(imageFile, "messages");
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content: trimmedContent,
      imageUrl,
    });

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

    return formatMessage(message as IMessage);
  }

  async deleteMessage(messageId: string, userId: string): Promise<MessagePayload> {
    const message = await getOwnedMessage(messageId, userId);

    if (message.imageUrl) {
      await deleteFromS3ByUrl(resolveImageUrl(message.imageUrl));
    }

    message.content = "";
    message.imageUrl = "";
    message.isDeleted = true;
    message.editedAt = undefined;
    await message.save();

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

    return { modifiedCount: result.modifiedCount };
  }

  async getUnreadCount(userId: string, fromUserId: string) {
    return Message.countDocuments({
      senderId: fromUserId,
      receiverId: userId,
      read: false,
      isDeleted: false,
    });
  }
}

export const messageService = new MessageService();
