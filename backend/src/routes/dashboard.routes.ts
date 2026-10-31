import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(protect);
router.get("/", getDashboard);

export default router;