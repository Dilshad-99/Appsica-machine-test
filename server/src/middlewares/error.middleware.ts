import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: unknown[] | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation error";
    errors = Object.values(err.errors).map((e) => e.message);
  } else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    stack: env.nodeEnv === "development" && err instanceof Error ? err.stack : undefined,
  });
};