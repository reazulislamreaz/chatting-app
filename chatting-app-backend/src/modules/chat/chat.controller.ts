import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { chatService } from "./chat.service";
import { asyncHandler } from "../../utils/asyncHandler";

export class ChatController {
  getChatList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const chatList = await chatService.getChatList(req.user!.userId);
    res.json({ success: true, data: chatList });
  });
}

export const chatController = new ChatController();
