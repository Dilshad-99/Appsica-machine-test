"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const sockets_1 = require("./sockets");
const server = http_1.default.createServer(app_1.app);
(0, sockets_1.initSocket)(server);
const start = async () => {
    try {
        await (0, db_1.connectDB)();
        server.listen(env_1.env.port, () => {
            console.log(`[server] REST API running on http://localhost:${env_1.env.port} (${env_1.env.nodeEnv})`);
            console.log("[server] Socket.IO attached to the HTTP server");
        });
    }
    catch (error) {
        console.error("[server] Failed to start:", error);
        process.exit(1);
    }
};
void start();
//# sourceMappingURL=server.js.map