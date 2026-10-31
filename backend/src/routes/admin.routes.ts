
import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";

import {
  getAdminStats,
  getAdminUsers,
  getAdminDestinations,
  getAdminBookings,
  getAdminHotels
} from "../controllers/admin.controller.js";

const router = Router();

router.use(protect);

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.get("/destinations", getAdminDestinations);
router.get("/bookings", getAdminBookings);
router.get("/hotels", getAdminHotels);

export default router;
