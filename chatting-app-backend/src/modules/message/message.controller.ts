import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { messageService } from "./message.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { getParamId } from "../../utils/params";
import {
  emitReceiveMessage,
  emitMessageUpdated,
  emitMessageDeleted,
} from "../../socket/message.events";

export class MessageController {
  sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { receiverId, content } = req.body;
    const message = await messageService.sendMessage(
      req.user!.userId,
      receiverId,
      content,
      req.file
    );
    emitReceiveMessage(message);
    res.status(201).json({ success: true, data: message });
  });

  updateMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content, removeImage } = req.body;
    const message = await messageService.updateMessage(
      getParamId(req.params.id),
      req.user!.userId,
      content,
      req.file,
      removeImage
    );
    emitMessageUpdated(message);
    res.json({ success: true, data: message });
  });

  deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const message = await messageService.deleteMessage(
      getParamId(req.params.id),
      req.user!.userId
    );
    emitMessageDeleted(message);
    res.json({ success: true, data: message });
  });

  getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query as Record<string, string | undefined>;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const result = await messageService.getConversation(
      req.user!.userId,
      getParamId(req.params.userId),
      page,
      limit
    );
    res.json({ success: true, data: result });
  });

  markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { senderId } = req.body;
    const result = await messageService.markAsRead(req.user!.userId, senderId);
    res.json({ success: true, data: result });
  });
}

export const messageController = new MessageController();
