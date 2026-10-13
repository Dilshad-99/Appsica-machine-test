import { Request, Response } from "express";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, "No image file provided");
  }

  const isCloudinaryConfigured =
    Boolean(env.cloudinaryCloudName) &&
    Boolean(env.cloudinaryApiKey) &&
    Boolean(env.cloudinaryApiSecret);

  if (isCloudinaryConfigured) {
    // Upload buffer to Cloudinary
    return new Promise<void>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "kanban_uploads" },
        (error, result) => {
          if (error || !result) {
            reject(new ApiError(500, error?.message || "Cloudinary upload failed"));
            return;
          }
          res.json(
            new ApiResponse(200, "Image uploaded to Cloudinary", {
              url: result.secure_url,
              public_id: result.public_id,
            })
          );
          resolve();
        }
      );
      uploadStream.end(req.file!.buffer);
    });
  } else {
    // Development fallback: Base64 data URI
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    res.json(
      new ApiResponse(200, "Image uploaded (Local base64 fallback)", {
        url: base64Image,
        public_id: `local_${Date.now()}`,
      })
    );
  }
});
