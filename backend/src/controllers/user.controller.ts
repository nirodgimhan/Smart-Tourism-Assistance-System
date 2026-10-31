import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { User } from "../models/User.model.js";
import { fail, unauthorized } from "../utils/http.js";

export async function getMyAccount(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  try {
    const user = await User.findById(req.userId)
      .select(
        "name email role language isActive createdAt"
      )
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Account not found"
      });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    fail(res, error);
  }
}