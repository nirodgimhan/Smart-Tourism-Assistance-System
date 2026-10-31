import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  requestRefund,
  getRefundStatus
} from "../controllers/refund.controller.js";

const router = Router();

router.use(protect);
router.post("/", requestRefund);
router.get("/:id", getRefundStatus);

export default router;