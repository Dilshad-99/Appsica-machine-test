import { Server, Socket } from "socket.io";

const boardRoom = (boardId: string): string => `board:${boardId}`;

/** Handles joining/leaving board rooms and notifies other members. */
export const registerBoardHandlers = (io: Server, socket: Socket): void => {
  socket.on("board:join", (boardId: string) => {
    if (!socket.userId || !boardId) return;

    socket.join(boardRoom(boardId));
    const joined = socket.data.joinedBoards ?? new Set<string>();
    joined.add(boardId);
    socket.data.joinedBoards = joined;

    socket
      .to(boardRoom(boardId))
      .emit("board:user-joined", { userId: socket.userId, userName: socket.userName });
  });

  socket.on("board:leave", (boardId: string) => {
    if (!socket.userId || !boardId) return;

    socket.leave(boardRoom(boardId));
    socket.data.joinedBoards?.delete(boardId);

    socket
      .to(boardRoom(boardId))
      .emit("board:user-left", { userId: socket.userId, userName: socket.userName });
  });
};