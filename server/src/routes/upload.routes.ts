import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { uploadImage } from "../controllers/upload.controller";

const router = Router();

router.use(authenticate);

router.post("/", upload.single("image"), uploadImage);

export default router;
