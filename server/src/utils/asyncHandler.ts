import { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncHandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/** Wraps an async route handler and forwards rejections to the error middleware. */
export const asyncHandler = (fn: AsyncHandlerFn): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};