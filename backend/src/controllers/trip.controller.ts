
import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { Trip } from "../models/Trip.model.js";
import type { AuthRequest } from
  "../middlewares/auth.middleware.js";

const createSchema = z.object({
  title: z.string().trim().min(2).max(150),
  startDate: z.iso.datetime({ offset: true }),
  endDate: z.iso.datetime({ offset: true }),
  budgetLkr: z.number().min(0),
  interests: z.array(z.string()).default([]),
  destinationIds: z.array(
    z.string().refine(
      mongoose.isValidObjectId,
      "Invalid destination ID"
    )
  ).default([]),
  startLocation: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90)
    ])
  }),
  transportMode: z.enum([
    "driving",
    "walking"
  ]).default("driving")
}).refine(
  data => new Date(data.endDate) >= new Date(data.startDate),
  { message: "End date must not precede start date" }
);

export async function createTrip(
  req: AuthRequest,
  res: Response
) {
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      errors: z.flattenError(parsed.error)
    });
    return;
  }

  const trip = await Trip.create({
    ...parsed.data,
    userId: req.userId
  });

  res.status(201).json({
    success: true,
    trip
  });
}

export async function getTrips(
  req: AuthRequest,
  res: Response
) {
  const items = await Trip.find({
    userId: req.userId
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    items
  });
}

export async function getTrip(
  req: AuthRequest,
  res: Response
) {
  const { id } = req.params;

  if (
    typeof id !== "string" ||
    !mongoose.isValidObjectId(id)
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid trip ID"
    });
    return;
  }

  const trip = await Trip.findOne({
    _id: id,
    userId: req.userId
  }).populate("destinationIds");

  if (!trip) {
    res.status(404).json({
      success: false,
      message: "Trip not found"
    });
    return;
  }

  res.json({
    success: true,
    trip
  });
}

export async function deleteTrip(
  req: AuthRequest,
  res: Response
) {
  const { id } = req.params;

  if (
    typeof id !== "string" ||
    !mongoose.isValidObjectId(id)
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid trip ID"
    });
    return;
  }

  const result = await Trip.deleteOne({
    _id: id,
    userId: req.userId
  });

  if (!result.deletedCount) {
    res.status(404).json({
      success: false,
      message: "Trip not found"
    });
    return;
  }

  res.json({
    success: true,
    message: "Trip deleted"
  });
}
