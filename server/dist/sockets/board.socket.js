"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBoardHandlers = void 0;
const boardRoom = (boardId) => `board:${boardId}`;
/** Handles joining/leaving board rooms and notifies other members. */
const registerBoardHandlers = (io, socket) => {
    socket.on("board:join", (boardId) => {
        if (!socket.userId || !boardId)
            return;
        socket.join(boardRoom(boardId));
        const joined = socket.data.joinedBoards ?? new Set();
        joined.add(boardId);
        socket.data.joinedBoards = joined;
        socket
            .to(boardRoom(boardId))
            .emit("board:user-joined", { userId: socket.userId, userName: socket.userName });
    });
    socket.on("board:leave", (boardId) => {
        if (!socket.userId || !boardId)
            return;
        socket.leave(boardRoom(boardId));
        socket.data.joinedBoards?.delete(boardId);
        socket
            .to(boardRoom(boardId))
            .emit("board:user-left", { userId: socket.userId, userName: socket.userName });
    });
};
exports.registerBoardHandlers = registerBoardHandlers;
//# sourceMappingURL=board.socket.js.map