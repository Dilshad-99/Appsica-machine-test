import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import * as commentController from "../controllers/comment.controller";

const router = Router();

router.use(authenticate);

const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});
const updateCommentSchema = createCommentSchema.partial();

router.get("/task/:taskId", commentController.getCommentsByTask);
router.post("/task/:taskId", validate(createCommentSchema), commentController.createComment);
router.patch("/:commentId", validate(updateCommentSchema), commentController.updateComment);
router.delete("/:commentId", commentController.deleteComment);

export default router;