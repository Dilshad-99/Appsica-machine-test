import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

/** Validates `req.body` against a Zod schema and replaces it with the parsed output. */
export const validate =
  (schema: ZodSchema<any>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new ApiError(
          400,
          "Request validation failed",
          result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          }))
        )
      );
      return;
    }
    req.body = result.data;
    next();
  };