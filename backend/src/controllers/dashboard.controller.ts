import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { Trip } from "../models/Trip.model.js";
import { SavedPlace } from "../models/SavedPlace.model.js";
import { Notification } from "../models/Notification.model.js";
import { fail, unauthorized } from "../utils/http.js";

export async function getDashboard(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  try {
    const [trips, savedPlaces, unreadNotifications] =
      await Promise.all([
        Trip.countDocuments({ userId: req.userId }),
        SavedPlace.countDocuments({ userId: req.userId }),
        Notification.countDocuments({
          userId: req.userId,
          read: false
        })
      ]);

    res.json({
      success: true,
      stats: { trips, savedPlaces, unreadNotifications }
    });
  } catch (error) {
    fail(res, error);
  }
}