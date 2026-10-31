import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getMyReceipts,
  scanReceipt
} from "../controllers/receipt.controller.js";

const router = Router();

router.use(protect);
router.get("/", getMyReceipts);
router.post("/scan", scanReceipt);

export default router;