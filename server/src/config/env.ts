import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const required = ["PORT", "MONGODB_URI", "JWT_SECRET"] as const;

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`[env] Missing required environment variable(s): ${missing.join(", ")}`);
}

export const env = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGODB_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "*",
  cloudinaryCloudName: (process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME)?.trim(),
  cloudinaryApiKey: (process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY)?.trim(),
  cloudinaryApiSecret: (process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET)?.trim(),
} as const;
