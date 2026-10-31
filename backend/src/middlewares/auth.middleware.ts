
import type {
  Request,
  Response,
  NextFunction
} from "express";

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

export function protect(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;

  const bearerToken =
    authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : undefined;

  const token = req.cookies?.accessToken || bearerToken;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required"
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string"
    ) {
      throw new Error("Invalid token");
    }

    req.userId = decoded.sub;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Session expired or invalid"
    });
  }
}
