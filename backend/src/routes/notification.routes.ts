import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markNotificationRead
} from "../controllers/notification.controller.js";

const router = Router();

router.use(protect);
router.get("/", getNotifications);
router.patch("/:id/read", markNotificationRead);

export default router;