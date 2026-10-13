"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const signToken = (userId) => jsonwebtoken_1.default.sign({ id: userId }, env_1.env.jwtSecret, {
    expiresIn: env_1.env.jwtExpiresIn,
});
const sanitizeUser = (user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
});
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User_1.User.findOne({ email });
    if (existing) {
        throw new ApiError_1.ApiError(409, "A user with this email already exists");
    }
    const user = await User_1.User.create({ name, email, password });
    const token = signToken(String(user._id));
    res.status(201).json(new ApiResponse_1.ApiResponse(201, "Registration successful", {
        token,
        user: sanitizeUser(user),
    }));
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError_1.ApiError(401, "Invalid email or password");
    }
    const token = signToken(String(user._id));
    res.json(new ApiResponse_1.ApiResponse(200, "Login successful", {
        token,
        user: sanitizeUser(user),
    }));
});
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(new ApiResponse_1.ApiResponse(200, "Profile fetched", sanitizeUser(req.user)));
});
//# sourceMappingURL=auth.controller.js.map