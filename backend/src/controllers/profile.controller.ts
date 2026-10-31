
import type { Response } from "express";
import { z } from "zod";

import { Profile } from
  "../models/Profile.model.js";
import { User } from
  "../models/User.model.js";
import type { AuthRequest } from
  "../middlewares/auth.middleware.js";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  language: z.enum(["en", "si"]).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  interests: z.array(z.string()).optional(),
  budgetLkr: z.number().min(0).optional(),
  travelPace: z.enum([
    "relaxed",
    "normal",
    "fast"
  ]).optional(),
  consent: z.object({
    location: z.boolean().optional(),
    receipt: z.boolean().optional(),
    notifications: z.boolean().optional()
  }).optional()
});

export async function getProfile(
  req: AuthRequest,
  res: Response
) {
  const [user, profile] = await Promise.all([
    User.findById(req.userId),
    Profile.findOne({ userId: req.userId })
  ]);

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found"
    });
    return;
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      language: user.language
    },
    profile
  });
}

export async function updateProfile(
  req: AuthRequest,
  res: Response
) {
  const parsed = updateSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      errors: z.flattenError(parsed.error)
    });
    return;
  }

  const {
    name,
    language,
    ...profileData
  } = parsed.data;

  if (name !== undefined || language !== undefined) {
    await User.findByIdAndUpdate(req.userId, {
      ...(name !== undefined && { name }),
      ...(language !== undefined && { language })
    });
  }

  const updates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(profileData)) {
    if (key === "consent" && value) {
      for (
        const [consentKey, consentValue]
        of Object.entries(value)
      ) {
        updates[`consent.${consentKey}`] = consentValue;
      }
    } else if (value !== undefined) {
      updates[key] = value;
    }
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: req.userId },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({
    success: true,
    profile
  });
}
