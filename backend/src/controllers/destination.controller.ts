
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Destination } from
  "../models/Destination.model.js";

export async function getDestinations(
  req: Request,
  res: Response
) {
  const querySchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    district: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100)
      .default(30),
    page: z.coerce.number().int().min(1)
      .default(1)
  });

  const parsed = querySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid query"
    });
    return;
  }

  const {
    search,
    category,
    district,
    limit,
    page
  } = parsed.data;

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$text = { $search: search };
  }

  if (category) {
    filter.category = category;
  }

  if (district) {
    filter.district = district;
  }

  const [items, total] = await Promise.all([
    Destination.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Destination.countDocuments(filter)
  ]);

  res.json({
    success: true,
    items,
    total,
    page,
    limit
  });
}

export async function getDestination(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  if (
    typeof id !== "string" ||
    !mongoose.isValidObjectId(id)
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid destination ID"
    });
    return;
  }

  const item = await Destination.findById(id);

  if (!item) {
    res.status(404).json({
      success: false,
      message: "Destination not found"
    });
    return;
  }

  res.json({
    success: true,
    destination: item
  });
}

export async function nearbyDestinations(
  req: Request,
  res: Response
) {
  const schema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    maxDistance: z.coerce.number()
      .min(100).max(100000).default(20000)
  });

  const parsed = schema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid location"
    });
    return;
  }

  const { lat, lon, maxDistance } = parsed.data;

  const items = await Destination.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat]
        },
        $maxDistance: maxDistance
      }
    }
  }).limit(30);

  res.json({
    success: true,
    items
  });
}
