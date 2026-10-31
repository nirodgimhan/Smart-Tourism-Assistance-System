
import type { Response } from "express";
import { z } from "zod";

import { Profile } from "../models/Profile.model.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const consentSchema = z.object({
  location: z.boolean().optional(),
  receipt: z.boolean().optional(),
  notifications: z.boolean().optional()
}).strict();

// GET /api/v1/consent
export async function getMyConsent(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required."
      });
      return;
    }

    const profile = await Profile.findOne({
      userId: req.userId
    }).lean();

    res.json({
      success: true,
      consent: {
        location: profile?.consent?.location ?? false,
        receipt: profile?.consent?.receipt ?? false,
        notifications:
          profile?.consent?.notifications ?? false
      }
    });
  } catch (error) {
    console.error("Get consent error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load privacy preferences."
    });
  }
}

// PATCH /api/v1/consent
export async function updateMyConsent(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required."
      });
      return;
    }

    const parsed = consentSchema.safeParse(req.body);

    if (
      !parsed.success ||
      Object.keys(parsed.data ?? {}).length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "Provide at least one valid consent setting."
      });
      return;
    }

    const updates: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        updates[`consent.${key}`] = value;
      }
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Privacy preferences updated.",
      consent: {
        location: profile.consent?.location ?? false,
        receipt: profile.consent?.receipt ?? false,
        notifications:
          profile.consent?.notifications ?? false
      }
    });
  } catch (error) {
    console.error("Update consent error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save privacy preferences."
    });
  }
}
