"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardActivities = void 0;
const Board_1 = require("../models/Board");
const activity_service_1 = require("../services/activity.service");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const idOf_1 = require("../utils/idOf");
exports.getBoardActivities = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    const userId = String(req.user._id);
    const hasAccess = (0, idOf_1.idOf)(board.owner) === userId ||
        board.members.some((member) => (0, idOf_1.idOf)(member) === userId);
    if (!hasAccess) {
        throw new ApiError_1.ApiError(403, "You do not have access to this board");
    }
    const activities = await activity_service_1.ActivityService.getBoardActivity(boardId, limit);
    res.json(new ApiResponse_1.ApiResponse(200, "Activities fetched", activities));
});
//# sourceMappingURL=activity.controller.js.map