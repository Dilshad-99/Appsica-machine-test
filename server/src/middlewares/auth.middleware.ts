import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";
import { IUser, User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export type AuthUser = IUser & { _id: Types.ObjectId };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Not authorized: missing or malformed token");
    }

    const token = header.split(" ")[1];
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, env.jwtSecret) as { id: string };
    } catch {
      throw new ApiError(401, "Not authorized: invalid or expired token");
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, "Not authorized: user no longer exists");
    }

    req.user = user as AuthUser;
    next();
  }
);