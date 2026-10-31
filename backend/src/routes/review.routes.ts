import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getApprovedReviews,
  createReview
} from "../controllers/review.controller.js";

const router = Router();

router.get("/", getApprovedReviews);
router.post("/", protect, createReview);

export default router;