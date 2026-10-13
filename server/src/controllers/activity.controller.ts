import { Request, Response } from "express";
import { Board } from "../models/Board";
import { ActivityService } from "../services/activity.service";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { idOf } from "../utils/idOf";

export const getBoardActivities = asyncHandler(
  async (req: Request, res: Response) => {
    const { boardId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const board = await Board.findById(boardId);
    if (!board) throw new ApiError(404, "Board not found");

    const userId = String(req.user!._id);
    const hasAccess =
      idOf(board.owner) === userId ||
      board.members.some((member) => idOf(member) === userId);
    if (!hasAccess) {
      throw new ApiError(403, "You do not have access to this board");
    }

    const activities = await ActivityService.getBoardActivity(boardId, limit);

    res.json(new ApiResponse(200, "Activities fetched", activities));
  }
);