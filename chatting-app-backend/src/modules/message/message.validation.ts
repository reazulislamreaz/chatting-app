import { z } from "zod";

export const sendMessageSchema = z.object({
  receiverId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
  content: z.string().max(5000).trim().optional().default(""),
  voiceDuration: z.coerce.number().min(0).max(600).optional().default(0),
});

export const updateMessageSchema = z.object({
  content: z.string().max(5000).trim().optional(),
  removeImage: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

export const getMessagesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const markReadSchema = z.object({
  senderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
});
