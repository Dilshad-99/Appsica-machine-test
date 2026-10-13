"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = exports.io = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const board_socket_1 = require("./board.socket");
const task_socket_1 = require("./task.socket");
const presence_socket_1 = require("./presence.socket");
const typing_socket_1 = require("./typing.socket");
const initSocket = (server) => {
    exports.io = new socket_io_1.Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (env_1.env.clientUrl === "*")
                    return callback(null, true);
                const allowedList = env_1.env.clientUrl.split(",").map((url) => url.trim());
                if (allowedList.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("localhost")) {
                    return callback(null, true);
                }
                return callback(null, true);
            },
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });
    exports.io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token)
                return next(new Error("Authentication required"));
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
            const user = await User_1.User.findById(decoded.id);
            if (!user)
                return next(new Error("User not found"));
            socket.userId = String(user._id);
            socket.userName = user.name;
            next();
        }
        catch {
            next(new Error("Invalid or expired token"));
        }
    });
    exports.io.on("connection", (socket) => {
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }
        (0, board_socket_1.registerBoardHandlers)(exports.io, socket);
        (0, task_socket_1.registerTaskHandlers)(exports.io, socket);
        (0, presence_socket_1.registerPresenceHandlers)(exports.io, socket);
        (0, typing_socket_1.registerTypingHandlers)(exports.io, socket);
    });
    return exports.io;
};
exports.initSocket = initSocket;
//# sourceMappingURL=index.js.map