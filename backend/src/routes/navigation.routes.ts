import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { analyzeDeviation } from "../controllers/navigation.controller.js";

const router = Router();

router.use(protect);
router.post("/deviation", analyzeDeviation);

export default router;