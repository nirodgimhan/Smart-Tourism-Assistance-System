import { Router } from "express";

import {
  createTrip,
  getTrips,
  getTrip,
  deleteTrip,
  getPlannerCatalog,
  updateTrip,
  updateTripDay,
  regenerateTrip
} from "../controllers/trip.controller.js";

import {
  protect
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

// Catalog must be before /:id.
router.get("/catalog", getPlannerCatalog);

router.post("/", createTrip);
router.get("/", getTrips);
router.get("/:id", getTrip);
router.patch("/:id", updateTrip);

router.patch(
  "/:id/days/:date",
  updateTripDay
);

router.post(
  "/:id/regenerate",
  regenerateTrip
);

router.delete("/:id", deleteTrip);

export default router;