"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const cloudinary_1 = require("../config/cloudinary");
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.uploadImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        throw new ApiError_1.ApiError(400, "No image file provided");
    }
    const isCloudinaryConfigured = Boolean(env_1.env.cloudinaryCloudName) &&
        Boolean(env_1.env.cloudinaryApiKey) &&
        Boolean(env_1.env.cloudinaryApiSecret);
    if (isCloudinaryConfigured) {
        // Upload buffer to Cloudinary
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.cloudinary.uploader.upload_stream({ folder: "kanban_uploads" }, (error, result) => {
                if (error || !result) {
                    reject(new ApiError_1.ApiError(500, error?.message || "Cloudinary upload failed"));
                    return;
                }
                res.json(new ApiResponse_1.ApiResponse(200, "Image uploaded to Cloudinary", {
                    url: result.secure_url,
                    public_id: result.public_id,
                }));
                resolve();
            });
            uploadStream.end(req.file.buffer);
        });
    }
    else {
        // Development fallback: Base64 data URI
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        res.json(new ApiResponse_1.ApiResponse(200, "Image uploaded (Local base64 fallback)", {
            url: base64Image,
            public_id: `local_${Date.now()}`,
        }));
    }
});
//# sourceMappingURL=upload.controller.js.map