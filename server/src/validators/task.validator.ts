import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id format");

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().trim().max(1000000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  labels: z.array(z.string().trim().max(30)).max(20).optional(),
  dueDate: z.coerce.date().nullish(),
  assignees: z.array(objectId).optional(),
  opId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  version: z.number().int().min(1).optional(),
  opId: z.string().optional(),
});

export const moveTaskSchema = z.object({
  columnId: objectId,
  position: z.number().finite().min(0).optional(),
  opId: z.string().optional(),
});