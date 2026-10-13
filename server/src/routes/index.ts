import { Router } from "express";
import authRoutes from "./auth.routes";
import boardRoutes from "./board.routes";
import taskRoutes from "./task.routes";
import commentRoutes from "./comment.routes";
import uploadRoutes from "./upload.routes";
import notificationRoutes from "./notification.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/boards", boardRoutes);
router.use("/tasks", taskRoutes);
router.use("/comments", commentRoutes);
router.use("/upload", uploadRoutes);
router.use("/notifications", notificationRoutes);

export default router;