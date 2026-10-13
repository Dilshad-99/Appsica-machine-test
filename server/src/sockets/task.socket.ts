import { Server, Socket } from "socket.io";

const boardRoom = (boardId: string): string => `board:${boardId}`;

interface TaskEventPayload {
  boardId: string;
  taskId?: string;
  [key: string]: unknown;
}

interface DragPayload {
  boardId: string;
  taskId: string;
}

// Track active dragged tasks per socket to clean up on abrupt disconnect
const socketActiveDrags = new Map<string, Set<{ boardId: string; taskId: string }>>();

/**
 * Relays task mutations and live movement to every socket in the board room.
 * The REST API is the source of truth; these events keep clients in sync.
 */
export const registerTaskHandlers = (io: Server, socket: Socket): void => {
  socket.on("task:create", (payload: TaskEventPayload) => {
    const room = boardRoom(payload.boardId);
    socket.to(room).emit("task:created", payload);
  });

  socket.on("task:move", (payload: TaskEventPayload) => {
    const room = boardRoom(payload.boardId);
    socket.to(room).emit("task:moved", payload);
  });

  socket.on("task:update", (payload: TaskEventPayload) => {
    const room = boardRoom(payload.boardId);
    socket.to(room).emit("task:updated", payload);
  });

  socket.on("task:delete", (payload: TaskEventPayload) => {
    const room = boardRoom(payload.boardId);
    socket.to(room).emit("task:deleted", payload);
  });

  // Live Task Movement (FR-13 & Realtime Requirements)
  socket.on("task:drag:start", (payload: DragPayload) => {
    if (!payload?.boardId || !payload?.taskId || !socket.userId) return;
    const room = boardRoom(payload.boardId);

    let drags = socketActiveDrags.get(socket.id);
    if (!drags) {
      drags = new Set();
      socketActiveDrags.set(socket.id, drags);
    }
    drags.add({ boardId: payload.boardId, taskId: payload.taskId });

    socket.to(room).emit("task:drag:started", {
      boardId: payload.boardId,
      taskId: payload.taskId,
      userId: socket.userId,
      userName: socket.userName || "A team member",
    });
  });

  socket.on("task:drag:end", (payload: DragPayload) => {
    if (!payload?.boardId || !payload?.taskId || !socket.userId) return;
    const room = boardRoom(payload.boardId);

    const drags = socketActiveDrags.get(socket.id);
    if (drags) {
      for (const item of drags) {
        if (item.taskId === payload.taskId) {
          drags.delete(item);
        }
      }
      if (drags.size === 0) socketActiveDrags.delete(socket.id);
    }

    socket.to(room).emit("task:drag:ended", {
      boardId: payload.boardId,
      taskId: payload.taskId,
      userId: socket.userId,
    });
  });

  socket.on("disconnect", () => {
    const drags = socketActiveDrags.get(socket.id);
    if (drags && socket.userId) {
      for (const item of drags) {
        socket.to(boardRoom(item.boardId)).emit("task:drag:ended", {
          boardId: item.boardId,
          taskId: item.taskId,
          userId: socket.userId,
        });
      }
      socketActiveDrags.delete(socket.id);
    }
  });
};