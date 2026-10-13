import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middlewares/error.middleware";
import rootRoutes from "./routes";

export const app = express();

const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  if (env.clientUrl === "*") return true;

  const allowedList = env.clientUrl.split(",").map((url) => url.trim());
  if (allowedList.includes(origin)) return true;
  if (origin.includes("localhost")) return true;

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback for deployment
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api", rootRoutes);

app.use(notFound);
app.use(errorHandler);
