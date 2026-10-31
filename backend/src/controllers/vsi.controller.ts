import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { unavailable } from "../utils/http.js";

export function calculateVSI(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "Calibrated weather Visit Suitability Index"
  );
}