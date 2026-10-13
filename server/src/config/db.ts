import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error("[db] Primary MongoDB connection failed:", error.message || error);
    const localUri = "mongodb://127.0.0.1:27017/kanban";
    if (env.mongoUri !== localUri) {
      console.log("[db] Attempting fallback to local MongoDB (127.0.0.1:27017)...");
      try {
        const localConn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
        console.log(`[db] Connected to local MongoDB fallback: ${localConn.connection.host}`);
        return;
      } catch (localError: any) {
        console.error("[db] Local fallback failed:", localError.message || localError);
      }
    }
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};