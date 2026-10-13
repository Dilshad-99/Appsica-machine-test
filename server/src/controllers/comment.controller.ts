import { Request, Response } from "express";
import { Types } from "mongoose";
import { Board, IBoard } from "../models/Board";
import { Comment, IComment } from "../models/Comment";
import { Task } from "../models/Task";
import { ActivityService } from "../services/activity.service";
import { io } from "../sockets";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { idOf } from "../utils/idOf";

const uid = (req: Request): string => String(req.user!._id);

const assertBoardAccess = (board: IBoard, userId: string): void => {
  const isOwner = idOf(board.owner) === userId;
  const isMember = board.members.some((member) => idOf(member) === userId);
  if (!isOwner && !isMember) {
    throw new ApiError(403, "You do not have access to this board");
  }
};

const formatComment = (commentDoc: any) => {
  const obj = commentDoc.toObject ? commentDoc.toObject() : commentDoc;
  return {
    ...obj,
    user: obj.user || obj.author,
  };
};

export const getCommentsByTask = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found");

    const board = await Board.findById(task.board);
    if (!board) throw new ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));

    const comments = await Comment.find({ task: taskId })
      .sort({ createdAt: 1 })
      .populate("author", "name email avatar");

    const formatted = comments.map(formatComment);
    res.json(new ApiResponse(200, "Comments fetched", formatted));
  }
);

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const board = await Board.findById(task.board);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const comment = await Comment.create({
    task: task._id as Types.ObjectId,
    author: req.user!._id,
    content: req.body.content,
  } as Partial<IComment>);
  await comment.populate("author", "name email avatar");

  await ActivityService.log(
    req.user!._id,
    task.board,
    "COMMENT_ADDED",
    `commented on task "${task.title}"`,
    { taskId, commentId: String(comment._id) },
    taskId
  );
  io.to(`board:${String(task.board)}`).emit("comment:created", {
    boardId: String(task.board),
    taskId,
    comment: formatComment(comment),
  });

  res.status(201).json(new ApiResponse(201, "Comment created", formatComment(comment)));
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (idOf(comment.author) !== uid(req)) {
    throw new ApiError(403, "You can only edit your own comments");
  }

  if (typeof req.body.content === "string") {
    comment.content = req.body.content;
  }
  await comment.save();
  await comment.populate("author", "name email avatar");

  const task = await Task.findById(comment.task);
  if (task) {
    io.to(`board:${String(task.board)}`).emit("comment:updated", {
      boardId: String(task.board),
      taskId: String(comment.task),
      comment: formatComment(comment),
    });
  }

  res.json(new ApiResponse(200, "Comment updated", formatComment(comment)));
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const task = await Task.findById(comment.task);
  const board = task ? await Board.findById(task.board) : null;

  const currentUserId = uid(req);
  const isAuthor = idOf(comment.author) === currentUserId;
  const isBoardOwner = board ? idOf(board.owner) === currentUserId : false;

  if (!isAuthor && !isBoardOwner) {
    throw new ApiError(403, "You can only delete your own comments or comments on boards you own");
  }

  const taskId = String(comment.task);
  const boardId = task ? String(task.board) : undefined;

  await comment.deleteOne();

  if (boardId && task) {
    await ActivityService.log(
      req.user!._id,
      task.board,
      "COMMENT_DELETED",
      `deleted a comment on task "${task.title}"`,
      { taskId, commentId },
      taskId
    );

    io.to(`board:${boardId}`).emit("comment:deleted", {
      boardId,
      taskId,
      commentId,
    });
  }

  res.json(new ApiResponse(200, "Comment deleted", { commentId, taskId }));
});