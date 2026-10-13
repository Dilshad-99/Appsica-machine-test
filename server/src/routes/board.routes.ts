import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createBoardSchema,
  updateBoardSchema,
  addColumnSchema,
  renameColumnSchema,
  addMemberSchema,
  respondInvitationSchema,
} from "../validators/board.validator";
import { createTaskSchema } from "../validators/task.validator";
import * as boardController from "../controllers/board.controller";
import * as taskController from "../controllers/task.controller";
import { getBoardActivities } from "../controllers/activity.controller";

const router = Router();

// Public Board Preview Endpoint
router.get("/join-preview/:inviteCode", boardController.getBoardPreviewByInviteCode);

router.use(authenticate);

// Authenticated Join Link Endpoints
router.post("/join-code/:inviteCode", boardController.joinBoardByInviteCode);
router.post("/join-workspace", boardController.joinWorkspaceByNameOrId);

// User Invitations Endpoints
router.get("/invitations/pending", boardController.getUserPendingInvitations);
router.post(
  "/invitations/:invitationId/respond",
  validate(respondInvitationSchema),
  boardController.respondToInvitation
);

// Board Endpoints
router.post("/", validate(createBoardSchema), boardController.createBoard);
router.get("/", boardController.getMyBoards);
router.get("/workspace/members", boardController.getWorkspaceMembers);
router.get("/dashboard/stats", boardController.getDashboardStats);
router.get("/:boardId", boardController.getBoardById);
router.patch("/:boardId", validate(updateBoardSchema), boardController.updateBoard);
router.delete("/:boardId", boardController.deleteBoard);

// Columns
router.post("/:boardId/columns", validate(addColumnSchema), boardController.addColumn);
router.patch("/:boardId/columns/reorder", boardController.reorderColumns);
router.patch("/:boardId/columns/:columnId", validate(renameColumnSchema), boardController.renameColumn);
router.delete("/:boardId/columns/:columnId", boardController.removeColumn);

// Members & Share Link per Board
router.post("/:boardId/members", validate(addMemberSchema), boardController.addMember);
router.delete("/:boardId/members/:userId", boardController.removeMember);
router.get("/:boardId/invitations", boardController.getBoardInvitations);
router.get("/:boardId/invite-code", boardController.getBoardInviteCode);
router.post("/:boardId/regenerate-invite-code", boardController.regenerateBoardInviteCode);

// Tasks under board context
router.get("/:boardId/tasks", taskController.getBoardTasks);
router.post(
  "/:boardId/columns/:columnId/tasks",
  validate(createTaskSchema),
  taskController.createTask
);

// Activity feed under board context
router.get("/:boardId/activity", getBoardActivities);

export default router;