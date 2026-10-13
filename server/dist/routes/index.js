"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const board_routes_1 = __importDefault(require("./board.routes"));
const task_routes_1 = __importDefault(require("./task.routes"));
const comment_routes_1 = __importDefault(require("./comment.routes"));
const upload_routes_1 = __importDefault(require("./upload.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/boards", board_routes_1.default);
router.use("/tasks", task_routes_1.default);
router.use("/comments", comment_routes_1.default);
router.use("/upload", upload_routes_1.default);
router.use("/notifications", notification_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map