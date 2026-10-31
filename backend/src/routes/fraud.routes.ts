import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getFraudAlerts,
  analyzeFraud
} from "../controllers/fraud.controller.js";

const router = Router();

router.use(protect);
router.get("/alerts", getFraudAlerts);
router.post("/analyze", analyzeFraud);

export default router;