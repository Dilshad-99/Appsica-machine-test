"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
const notFound = (req, _res, next) => {
    next(new ApiError_1.ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
exports.notFound = notFound;
const errorHandler = (err, _req, res, _next) => {
    let statusCode = 500;
    let message = "Internal server error";
    let errors;
    if (err instanceof ApiError_1.ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }
    else if (err instanceof mongoose_1.default.Error.ValidationError) {
        statusCode = 400;
        message = "Validation error";
        errors = Object.values(err.errors).map((e) => e.message);
    }
    else if (err instanceof Error) {
        message = err.message;
    }
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        stack: env_1.env.nodeEnv === "development" && err instanceof Error ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map