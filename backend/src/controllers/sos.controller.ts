import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { unavailable } from "../utils/http.js";

export function submitSOS(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "Emergency dispatch is not connected. Contact local emergency services directly"
  );
}