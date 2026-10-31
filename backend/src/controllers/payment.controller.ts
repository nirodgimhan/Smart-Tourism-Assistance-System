import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { Payment } from "../models/Payment.model.js";
import { fail, unauthorized, unavailable } from "../utils/http.js";

export async function getMyPayments(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  try {
    const items = await Payment.find({
      userId: req.userId
    })
      .select("bookingId amountLkr status createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}

export function createCheckout(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "Verified payment gateway and hotel availability"
  );
}

export function paymentWebhook(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(res, "Signed payment provider webhooks");
}