import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { unavailable } from "../utils/http.js";

export function requestRefund(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "Verified payment gateway refunds and booking policy"
  );
}

export function getRefundStatus(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "Payment provider refund status"
  );
}