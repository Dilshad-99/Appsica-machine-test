"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.authenticate = (0, asyncHandler_1.asyncHandler)(async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        throw new ApiError_1.ApiError(401, "Not authorized: missing or malformed token");
    }
    const token = header.split(" ")[1];
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
    }
    catch {
        throw new ApiError_1.ApiError(401, "Not authorized: invalid or expired token");
    }
    const user = await User_1.User.findById(decoded.id);
    if (!user) {
        throw new ApiError_1.ApiError(401, "Not authorized: user no longer exists");
    }
    req.user = user;
    next();
});
//# sourceMappingURL=auth.middleware.js.map