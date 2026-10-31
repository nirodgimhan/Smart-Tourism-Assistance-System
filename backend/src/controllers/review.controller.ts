import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";
import { z } from "zod";
import { Review } from "../models/Review.model.js";
import { fail, unauthorized } from "../utils/http.js";

const reviewSchema = z.object({
  hotelId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).default("")
});

export async function createReview(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  const parsed = reviewSchema.safeParse(req.body);

  if (
    !parsed.success ||
    !mongoose.isValidObjectId(parsed.data.hotelId)
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid review"
    });
    return;
  }

  try {
    const review = await Review.create({
      ...parsed.data,
      userId: req.userId,
      status: "pending"
    });

    res.status(201).json({
      success: true,
      review,
      message: "Review submitted for moderation"
    });
  } catch (error) {
    fail(res, error);
  }
}

export async function getApprovedReviews(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const hotelId = String(req.query.hotelId ?? "");

  if (!mongoose.isValidObjectId(hotelId)) {
    res.status(400).json({
      success: false,
      message: "Valid hotelId is required"
    });
    return;
  }

  try {
    const items = await Review.find({
      hotelId,
      status: "approved"
    })
      .select("rating comment createdAt")
      .limit(100)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}