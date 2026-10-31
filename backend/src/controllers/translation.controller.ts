import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { unavailable } from "../utils/http.js";

export function translateText(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(res, "Sinhala-English translation model");
}