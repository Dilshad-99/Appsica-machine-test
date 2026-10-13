"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPresenceHandlers = void 0;
const boardRoom = (boardId) => `board:${boardId}`;
/** boardId -> userId -> Set<socketId> (handles multiple tabs per user correctly). */
const boardPresence = new Map();
const broadcastPresence = (io, boardId) => {
    const usersMap = boardPresence.get(boardId);
    const onlineUsers = usersMap ? Array.from(usersMap.keys()) : [];
    io.to(boardRoom(boardId)).emit("presence:update", {
        boardId,
        onlineUsers,
    });
};
/** Tracks which members are online per board and broadcasts `presence:update`. */
const registerPresenceHandlers = (io, socket) => {
    const trackJoin = (boardId) => {
        if (!socket.userId || !boardId)
            return;
        let usersMap = boardPresence.get(boardId);
        if (!usersMap) {
            usersMap = new Map();
            boardPresence.set(boardId, usersMap);
        }
        let sockets = usersMap.get(socket.userId);
        if (!sockets) {
            sockets = new Set();
            usersMap.set(socket.userId, sockets);
        }
        sockets.add(socket.id);
        broadcastPresence(io, boardId);
    };
    const trackLeave = (boardId) => {
        if (!socket.userId || !boardId)
            return;
        const usersMap = boardPresence.get(boardId);
        if (!usersMap)
            return;
        const sockets = usersMap.get(socket.userId);
        if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                usersMap.delete(socket.userId);
            }
        }
        if (usersMap.size === 0) {
            boardPresence.delete(boardId);
        }
        broadcastPresence(io, boardId);
    };
    socket.on("board:join", (boardId) => trackJoin(boardId));
    socket.on("board:leave", (boardId) => trackLeave(boardId));
    socket.on("disconnect", () => {
        socket.data.joinedBoards?.forEach((boardId) => trackLeave(boardId));
    });
};
exports.registerPresenceHandlers = registerPresenceHandlers;
//# sourceMappingURL=presence.socket.js.map