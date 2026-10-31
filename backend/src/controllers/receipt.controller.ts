import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { Receipt } from "../models/Receipt.model.js";
import { fail, unauthorized, unavailable } from "../utils/http.js";

export async function getMyReceipts(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  try {
    const items = await Receipt.find({
      userId: req.userId
    })
      .select(
        "merchant total currency processingStatus createdAt"
      )
      .limit(50)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}

export function scanReceipt(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "Consent-gated OCR scanning and receipt anomaly analysis"
  );
}