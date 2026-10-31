import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { chatWithGuide } from "../controllers/guide.controller.js";

const router = Router();

router.use(protect);
router.post("/chat", chatWithGuide);

export default router;