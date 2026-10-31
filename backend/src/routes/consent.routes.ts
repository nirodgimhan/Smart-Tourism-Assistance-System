
import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";

import {
  getMyConsent,
  updateMyConsent
} from "../controllers/consent.controller.js";

const router = Router();

router.use(protect);

router.get("/", getMyConsent);
router.patch("/", updateMyConsent);

export default router;
