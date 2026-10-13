import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.mongoUri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("[db] MongoDB connection failed:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};