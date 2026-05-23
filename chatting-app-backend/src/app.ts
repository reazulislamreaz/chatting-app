import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env";
import { corsOriginValidator } from "./config/cors";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import authRoutes from "./modules/auth/auth.route";
import userRoutes from "./modules/user/user.route";
import friendRequestRoutes from "./modules/friendRequest/friendRequest.route";
import messageRoutes from "./modules/message/message.route";
import chatRoutes from "./modules/chat/chat.route";
import postRoutes from "./modules/post/post.route";

const app = express();

app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friend-requests", friendRequestRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/posts", postRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
