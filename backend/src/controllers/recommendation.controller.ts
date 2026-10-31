import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { unavailable } from "../utils/http.js";

export function recommendHotels(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "Personalized hotel recommendation and ranking model"
  );
}

export function recommendPois(
  _req: AuthRequest,
  res: Response
): void {
  unavailable(
    res,
    "Point-of-interest recommendation model"
  );
}