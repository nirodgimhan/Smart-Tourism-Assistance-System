import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { User } from "../models/User.model.js";

export function unauthorized(res: Response): void {
  res.status(401).json({
    success: false,
    message: "Authentication required"
  });
}

export function unavailable(res: Response, feature: string): void {
  res.status(501).json({
    success: false,
    message: `${feature} is not implemented or connected yet. No operation was performed.`
  });
}

export function fail(res: Response, error: unknown): void {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}

export async function requireAdmin(
  req: AuthRequest,
  res: Response
): Promise<boolean> {
  if (!req.userId) {
    unauthorized(res);
    return false;
  }

  const user = await User.findById(req.userId)
    .select("role isActive")
    .lean();

  if (user?.role !== "admin" || !user.isActive) {
    res.status(403).json({
      success: false,
      message: "Admin permission required"
    });
    return false;
  }

  return true;
}