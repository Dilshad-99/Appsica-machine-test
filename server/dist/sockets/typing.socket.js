"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTypingHandlers = void 0;
const boardRoom = (boardId) => `board:${boardId}`;
// Track active typers per socket to auto-clear on disconnect or 3s TTL
const activeTypingTimers = new Map();
const socketActiveTypings = new Map();
/** Broadcasts typing indicators inside a board room (never to the sender). */
const registerTypingHandlers = (io, socket) => {
    socket.on("typing:start", (payload) => {
        if (!payload?.boardId || !socket.userId)
            return;
        const room = boardRoom(payload.boardId);
        // Track for this socket
        let typings = socketActiveTypings.get(socket.id);
        if (!typings) {
            typings = new Set();
            socketActiveTypings.set(socket.id, typings);
        }
        typings.add({ boardId: payload.boardId, taskId: payload.taskId });
        // Server-side 3s TTL auto-expiry
        const timerKey = `${socket.id}:${payload.boardId}:${payload.taskId || "global"}`;
        if (activeTypingTimers.has(timerKey)) {
            clearTimeout(activeTypingTimers.get(timerKey));
        }
        activeTypingTimers.set(timerKey, setTimeout(() => {
            socket.to(room).emit("typing:stop", {
                boardId: payload.boardId,
                taskId: payload.taskId,
                userId: socket.userId,
                userName: socket.userName,
            });
            activeTypingTimers.delete(timerKey);
        }, 3000));
        socket.to(room).emit("typing:start", {
            boardId: payload.boardId,
            taskId: payload.taskId,
            userId: socket.userId,
            userName: socket.userName,
        });
    });
    socket.on("typing:stop", (payload) => {
        if (!payload?.boardId || !socket.userId)
            return;
        const room = boardRoom(payload.boardId);
        const timerKey = `${socket.id}:${payload.boardId}:${payload.taskId || "global"}`;
        if (activeTypingTimers.has(timerKey)) {
            clearTimeout(activeTypingTimers.get(timerKey));
            activeTypingTimers.delete(timerKey);
        }
        const typings = socketActiveTypings.get(socket.id);
        if (typings) {
            for (const item of typings) {
                if (item.taskId === payload.taskId) {
                    typings.delete(item);
                }
            }
            if (typings.size === 0)
                socketActiveTypings.delete(socket.id);
        }
        socket.to(room).emit("typing:stop", {
            boardId: payload.boardId,
            taskId: payload.taskId,
            userId: socket.userId,
            userName: socket.userName,
        });
    });
    socket.on("disconnect", () => {
        const typings = socketActiveTypings.get(socket.id);
        if (typings && socket.userId) {
            for (const item of typings) {
                socket.to(boardRoom(item.boardId)).emit("typing:stop", {
                    boardId: item.boardId,
                    taskId: item.taskId,
                    userId: socket.userId,
                    userName: socket.userName,
                });
                const timerKey = `${socket.id}:${item.boardId}:${item.taskId || "global"}`;
                if (activeTypingTimers.has(timerKey)) {
                    clearTimeout(activeTypingTimers.get(timerKey));
                    activeTypingTimers.delete(timerKey);
                }
            }
            socketActiveTypings.delete(socket.id);
        }
    });
};
exports.registerTypingHandlers = registerTypingHandlers;
//# sourceMappingURL=typing.socket.js.map