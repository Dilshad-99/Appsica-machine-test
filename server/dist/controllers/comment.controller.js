"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.createComment = exports.getCommentsByTask = void 0;
const Board_1 = require("../models/Board");
const Comment_1 = require("../models/Comment");
const Task_1 = require("../models/Task");
const activity_service_1 = require("../services/activity.service");
const sockets_1 = require("../sockets");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const idOf_1 = require("../utils/idOf");
const uid = (req) => String(req.user._id);
const assertBoardAccess = (board, userId) => {
    const isOwner = (0, idOf_1.idOf)(board.owner) === userId;
    const isMember = board.members.some((member) => (0, idOf_1.idOf)(member) === userId);
    if (!isOwner && !isMember) {
        throw new ApiError_1.ApiError(403, "You do not have access to this board");
    }
};
const formatComment = (commentDoc) => {
    const obj = commentDoc.toObject ? commentDoc.toObject() : commentDoc;
    return {
        ...obj,
        user: obj.user || obj.author,
    };
};
exports.getCommentsByTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { taskId } = req.params;
    const task = await Task_1.Task.findById(taskId);
    if (!task)
        throw new ApiError_1.ApiError(404, "Task not found");
    const board = await Board_1.Board.findById(task.board);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const comments = await Comment_1.Comment.find({ task: taskId })
        .sort({ createdAt: 1 })
        .populate("author", "name email avatar");
    const formatted = comments.map(formatComment);
    res.json(new ApiResponse_1.ApiResponse(200, "Comments fetched", formatted));
});
exports.createComment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { taskId } = req.params;
    const task = await Task_1.Task.findById(taskId);
    if (!task)
        throw new ApiError_1.ApiError(404, "Task not found");
    const board = await Board_1.Board.findById(task.board);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const comment = await Comment_1.Comment.create({
        task: task._id,
        author: req.user._id,
        content: req.body.content,
    });
    await comment.populate("author", "name email avatar");
    await activity_service_1.ActivityService.log(req.user._id, task.board, "COMMENT_ADDED", `commented on task "${task.title}"`, { taskId, commentId: String(comment._id) }, taskId);
    sockets_1.io.to(`board:${String(task.board)}`).emit("comment:created", {
        boardId: String(task.board),
        taskId,
        comment: formatComment(comment),
    });
    res.status(201).json(new ApiResponse_1.ApiResponse(201, "Comment created", formatComment(comment)));
});
exports.updateComment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment_1.Comment.findById(commentId);
    if (!comment)
        throw new ApiError_1.ApiError(404, "Comment not found");
    if ((0, idOf_1.idOf)(comment.author) !== uid(req)) {
        throw new ApiError_1.ApiError(403, "You can only edit your own comments");
    }
    if (typeof req.body.content === "string") {
        comment.content = req.body.content;
    }
    await comment.save();
    await comment.populate("author", "name email avatar");
    res.json(new ApiResponse_1.ApiResponse(200, "Comment updated", formatComment(comment)));
});
exports.deleteComment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment_1.Comment.findById(commentId);
    if (!comment)
        throw new ApiError_1.ApiError(404, "Comment not found");
    if ((0, idOf_1.idOf)(comment.author) !== uid(req)) {
        throw new ApiError_1.ApiError(403, "You can only delete your own comments");
    }
    await comment.deleteOne();
    res.json(new ApiResponse_1.ApiResponse(200, "Comment deleted", null));
});
//# sourceMappingURL=comment.controller.js.map