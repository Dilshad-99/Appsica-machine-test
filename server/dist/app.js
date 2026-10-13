"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const routes_1 = __importDefault(require("./routes"));
exports.app = (0, express_1.default)();
const isOriginAllowed = (origin) => {
    if (!origin)
        return true;
    if (env_1.env.clientUrl === "*")
        return true;
    const allowedList = env_1.env.clientUrl.split(",").map((url) => url.trim());
    if (allowedList.includes(origin))
        return true;
    if (origin.includes("localhost"))
        return true;
    return false;
};
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive fallback for deployment
    },
    credentials: true,
}));
exports.app.use(express_1.default.json({ limit: "10mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});
exports.app.use("/api", routes_1.default);
exports.app.use(error_middleware_1.notFound);
exports.app.use(error_middleware_1.errorHandler);
//# sourceMappingURL=app.js.map