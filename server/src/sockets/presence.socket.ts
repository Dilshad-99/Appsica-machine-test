import { Server, Socket } from "socket.io";

const boardRoom = (boardId: string): string => `board:${boardId}`;

/** boardId -> userId -> Set<socketId> (handles multiple tabs per user correctly). */
const boardPresence = new Map<string, Map<string, Set<string>>>();

const broadcastPresence = (io: Server, boardId: string): void => {
  const usersMap = boardPresence.get(boardId);
  const onlineUsers = usersMap ? Array.from(usersMap.keys()) : [];
  io.to(boardRoom(boardId)).emit("presence:update", {
    boardId,
    onlineUsers,
  });
};

/** Tracks which members are online per board and broadcasts `presence:update`. */
export const registerPresenceHandlers = (io: Server, socket: Socket): void => {
  const trackJoin = (boardId: string): void => {
    if (!socket.userId || !boardId) return;

    let usersMap = boardPresence.get(boardId);
    if (!usersMap) {
      usersMap = new Map<string, Set<string>>();
      boardPresence.set(boardId, usersMap);
    }

    let sockets = usersMap.get(socket.userId);
    if (!sockets) {
      sockets = new Set<string>();
      usersMap.set(socket.userId, sockets);
    }
    sockets.add(socket.id);

    broadcastPresence(io, boardId);
  };

  const trackLeave = (boardId: string): void => {
    if (!socket.userId || !boardId) return;

    const usersMap = boardPresence.get(boardId);
    if (!usersMap) return;

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

  socket.on("board:join", (boardId: string) => trackJoin(boardId));
  socket.on("board:leave", (boardId: string) => trackLeave(boardId));

  socket.on("disconnect", () => {
    socket.data.joinedBoards?.forEach((boardId: string) => trackLeave(boardId));
  });
};