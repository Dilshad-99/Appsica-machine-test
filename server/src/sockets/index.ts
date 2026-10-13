import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { registerBoardHandlers } from "./board.socket";
import { registerTaskHandlers } from "./task.socket";
import { registerPresenceHandlers } from "./presence.socket";
import { registerTypingHandlers } from "./typing.socket";

declare module "socket.io" {
  interface Socket {
    userId?: string;
    userName?: string;
  }
  interface SocketData {
    joinedBoards?: Set<string>;
  }
}

export let io: Server;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.clientUrl === "*") return callback(null, true);

        const allowedList = env.clientUrl.split(",").map((url) => url.trim());
        if (allowedList.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("localhost")) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("User not found"));

      socket.userId = String(user._id);
      socket.userName = user.name;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
    registerBoardHandlers(io, socket);
    registerTaskHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerTypingHandlers(io, socket);
  });

  return io;
};