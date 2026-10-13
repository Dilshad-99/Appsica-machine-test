import { z } from "zod";

export const createBoardSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    title: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.name || data.title, {
    message: "Board name or title is required",
    path: ["name"],
  });

export const updateBoardSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
});

export const addColumnSchema = z.object({
  name: z.string().trim().min(1, "Column name is required").max(50),
});

export const renameColumnSchema = addColumnSchema;

export const addMemberSchema = z
  .object({
    userId: z.string().optional(),
    email: z.string().email("Invalid email format").optional(),
  })
  .refine((data) => data.userId || data.email, {
    message: "Either userId or email is required",
    path: ["email"],
  });

export const respondInvitationSchema = z.object({
  action: z.enum(["accept", "decline"], {
    required_error: "Action must be accept or decline",
  }),
});