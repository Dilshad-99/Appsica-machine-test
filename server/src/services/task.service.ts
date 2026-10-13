import { HydratedDocument, Types } from "mongoose";
import { ITask, Task } from "../models/Task";
import { ApiError } from "../utils/ApiError";

export interface MoveTaskPayload {
  taskId: string;
  targetColumnId: string;
  targetPosition?: number;
}

/**
 * Position / reorder logic for tasks inside Kanban board columns.
 *
 * Each task's `position` is a non-negative integer. Positions are dense per
 * column (0, 1, 2, ...), so moving a task opens a gap and closes the old one.
 */
export class TaskService {
  /** Returns the position a new task should get when appended to a column. */
  static async getNextPosition(
    boardId: string | Types.ObjectId,
    columnId: string | Types.ObjectId
  ): Promise<number> {
    const last = await Task.findOne({ board: boardId, columnId })
      .sort({ position: -1, _id: -1 })
      .select("position");
    return last ? Math.max(last.position + 1000, 1000) : 1000;
  }

  /**
   * Moves a task to `targetColumnId` at `targetPosition` (or appends it when
   * no position is given), shifting surrounding tasks as needed.
   */
  static async moveTask(payload: MoveTaskPayload): Promise<HydratedDocument<ITask>> {
    const { taskId, targetColumnId, targetPosition } = payload;

    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found");

    const targetColumn = new Types.ObjectId(targetColumnId);
    let position =
      targetPosition ?? (await this.getNextPosition(task.board, targetColumn));

    // Clamp position if negative or NaN
    if (isNaN(position) || position < 0) {
      position = 0;
    }

    task.columnId = targetColumn;
    task.position = position;
    task.version = (task.version || 1) + 1;
    await task.save();

    // Check if rebalancing is needed to resolve reorder collisions / tiny gaps
    await this.rebalanceColumnIfNeeded(task.board, targetColumn);

    return task;
  }

  /** Checks for collisions or gaps smaller than 0.001 and re-spaces tasks evenly */
  static async rebalanceColumnIfNeeded(
    boardId: string | Types.ObjectId,
    columnId: string | Types.ObjectId
  ): Promise<boolean> {
    const tasks = await Task.find({ board: boardId, columnId }).sort({
      position: 1,
      _id: 1,
    });
    if (tasks.length <= 1) return false;

    let needsRebalance = false;
    for (let i = 0; i < tasks.length - 1; i++) {
      if (tasks[i + 1].position - tasks[i].position < 0.001) {
        needsRebalance = true;
        break;
      }
    }

    if (!needsRebalance) return false;

    const bulk = Task.collection.initializeOrderedBulkOp();
    tasks.forEach((task, index) => {
      const newPos = (index + 1) * 1000;
      bulk.find({ _id: task._id }).updateOne({ $set: { position: newPos } });
    });
    await bulk.execute();
    return true;
  }

  /** Compacts positions in a column so they are cleanly spaced by 1000. */
  static async normalizePositions(
    boardId: string | Types.ObjectId,
    columnId: string | Types.ObjectId
  ): Promise<void> {
    const tasks = await Task.find({ board: boardId, columnId }).sort({
      position: 1,
      _id: 1,
    });
    if (tasks.length === 0) return;

    const bulk = Task.collection.initializeOrderedBulkOp();
    tasks.forEach((task, index) => {
      const newPos = (index + 1) * 1000;
      if (task.position !== newPos) {
        bulk.find({ _id: task._id }).updateOne({ $set: { position: newPos } });
      }
    });
    await bulk.execute();
  }
}