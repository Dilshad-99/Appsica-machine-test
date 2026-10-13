import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const signToken = (userId: string): string =>
  jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

const sanitizeUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string;
}) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  avatar: user.avatar,
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const user = await User.create({ name, email, password });
  const token = signToken(String(user._id));

  res.status(201).json(
    new ApiResponse(201, "Registration successful", {
      token,
      user: sanitizeUser(user),
    })
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(String(user._id));

  res.json(
    new ApiResponse(200, "Login successful", {
      token,
      user: sanitizeUser(user),
    })
  );
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.json(new ApiResponse(200, "Profile fetched", sanitizeUser(req.user!)));
});