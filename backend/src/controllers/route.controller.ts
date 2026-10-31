import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { unavailable } from "../utils/http.js";

export function optimizedRoute(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(res, "Custom optimized multi-stop routing");
}