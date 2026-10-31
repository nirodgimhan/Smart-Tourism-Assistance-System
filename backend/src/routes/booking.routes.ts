
import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";

import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
} from "../controllers/booking.controller.js";

const router = Router();

router.use(protect);

router.post("/", createBooking);
router.get("/", getMyBookings);
router.get("/:id", getBookingById);
router.patch("/:id/cancel", cancelBooking);

export default router;
