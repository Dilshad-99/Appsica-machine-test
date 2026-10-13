"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveTaskSchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id format");
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, "Task title is required").max(200),
    description: zod_1.z.string().trim().max(1000000).optional(),
    priority: zod_1.z.enum(["low", "medium", "high", "critical"]).optional(),
    labels: zod_1.z.array(zod_1.z.string().trim().max(30)).max(20).optional(),
    dueDate: zod_1.z.coerce.date().nullish(),
    assignees: zod_1.z.array(objectId).optional(),
    opId: zod_1.z.string().optional(),
});
exports.updateTaskSchema = exports.createTaskSchema.partial().extend({
    version: zod_1.z.number().int().min(1).optional(),
    opId: zod_1.z.string().optional(),
});
exports.moveTaskSchema = zod_1.z.object({
    columnId: objectId,
    position: zod_1.z.number().finite().min(0).optional(),
    opId: zod_1.z.string().optional(),
});
//# sourceMappingURL=task.validator.js.map