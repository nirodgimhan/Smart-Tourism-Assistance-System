import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { unavailable } from "../utils/http.js";

export function analyzeDeviation(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "GPS route deviation detection using DTW"
  );
}