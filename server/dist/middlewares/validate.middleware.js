"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const ApiError_1 = require("../utils/ApiError");
/** Validates `req.body` against a Zod schema and replaces it with the parsed output. */
const validate = (schema) => (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        next(new ApiError_1.ApiError(400, "Request validation failed", result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
        }))));
        return;
    }
    req.body = result.data;
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.middleware.js.map