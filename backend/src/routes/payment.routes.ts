import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getMyPayments,
  createCheckout
} from "../controllers/payment.controller.js";

const router = Router();

router.use(protect);
router.get("/", getMyPayments);
router.post("/checkout", createCheckout);

export default router;