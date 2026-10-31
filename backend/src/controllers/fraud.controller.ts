import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { FraudAlert } from "../models/FraudAlert.model.js";
import { fail, unauthorized, unavailable } from "../utils/http.js";

export async function getFraudAlerts(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  try {
    const items = await FraudAlert.find({
      userId: req.userId
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}

export function analyzeFraud(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(res, "Fraud anomaly detection model");
}