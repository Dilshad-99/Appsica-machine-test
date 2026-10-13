"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const Activity_1 = require("../models/Activity");
class ActivityService {
    static async log(userId, boardId, type, message, metadata = {}, taskId) {
        const activity = await Activity_1.Activity.create({
            user: userId,
            board: boardId,
            task: taskId ? taskId : undefined,
            type,
            message,
            metadata,
        });
        return activity;
    }
    static async getBoardActivity(boardId, limit = 50) {
        return Activity_1.Activity.find({ board: boardId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("user", "name email avatar")
            .populate("task", "title");
    }
}
exports.ActivityService = ActivityService;
//# sourceMappingURL=activity.service.js.map