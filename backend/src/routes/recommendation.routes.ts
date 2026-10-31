import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  recommendHotels,
  recommendPois
} from "../controllers/recommendation.controller.js";

const router = Router();

router.use(protect);
router.post("/hotels", recommendHotels);
router.post("/pois", recommendPois);

export default router;