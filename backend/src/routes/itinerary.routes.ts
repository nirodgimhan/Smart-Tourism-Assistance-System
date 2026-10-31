import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getMyItineraries,
  optimizeItinerary
} from "../controllers/itinerary.controller.js";

const router = Router();

router.use(protect);
router.get("/", getMyItineraries);
router.post("/optimize", optimizeItinerary);

export default router;