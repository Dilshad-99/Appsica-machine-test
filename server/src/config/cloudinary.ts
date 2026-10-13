import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
  console.log(`[cloudinary] Configured with cloud_name: ${env.cloudinaryCloudName}`);
}

export { cloudinary };

