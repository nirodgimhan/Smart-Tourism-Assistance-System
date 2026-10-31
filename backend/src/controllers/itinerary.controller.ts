import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { Itinerary } from "../models/Itinerary.model.js";
import { fail, unauthorized, unavailable } from "../utils/http.js";

export async function getMyItineraries(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  try {
    const items = await Itinerary.find({
      userId: req.userId
    })
      .limit(100)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}

export function optimizeItinerary(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "NSGA-II multiobjective itinerary optimization"
  );
}