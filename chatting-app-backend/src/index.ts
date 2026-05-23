import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { allowedOrigins } from "./config/cors";
import { setupSocket } from "./socket/socket.handler";

async function bootstrap() {
  await connectDatabase();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  setupSocket(io);

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
