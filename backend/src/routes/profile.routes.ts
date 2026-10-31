
import { Router } from "express";
import {
  getProfile,
  updateProfile
} from "../controllers/profile.controller.js";
import { protect } from
  "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getProfile);
router.patch("/", updateProfile);

export default router;
