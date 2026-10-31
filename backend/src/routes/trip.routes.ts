
import { Router } from "express";

import {
  createTrip,
  getTrips,
  getTrip,
  deleteTrip
} from "../controllers/trip.controller.js";

import { protect } from
  "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.post("/", createTrip);
router.get("/", getTrips);
router.get("/:id", getTrip);
router.delete("/:id", deleteTrip);

export default router;
