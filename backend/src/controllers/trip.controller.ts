import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { Trip } from "../models/Trip.model.js";
import { TripPlan } from "../models/TripPlan.model.js";
import { Destination } from "../models/Destination.model.js";
import { Hotel } from "../models/Hotel.model.js";
import { TourPackage } from "../models/TourPackage.model.js";

import {
  plannerCatalog,
  rebuildTripPlan,
  type DayOverride
} from "../services/tripPlanner.service.js";

import type { AuthRequest } from
  "../middlewares/auth.middleware.js";

const oid = z.string().refine(
  mongoose.isValidObjectId,
  "Invalid ID"
);

const point = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90)
  ])
});

const input = z.object({
  title: z.string().trim().min(2).max(150),

  startDate: z.iso.datetime({ offset: true }),
  endDate: z.iso.datetime({ offset: true }),

  budgetLkr: z.number().min(0).max(100000000),

  interests: z.array(
    z.string().trim().min(1)
  ).max(12).default([]),

  startLocation: point,

  transportMode: z.enum([
    "driving",
    "walking"
  ]).default("driving"),

  tripType: z.enum([
    "solo",
    "couple",
    "family",
    "friends",
    "group",
    "business"
  ]).default("family"),

  adults: z.number().int()
    .min(1).max(30).default(2),

  children: z.number().int()
    .min(0).max(20).default(0),

  pace: z.enum([
    "relaxed",
    "balanced",
    "active"
  ]).default("balanced"),

  accommodation: z.enum([
    "budget",
    "standard",
    "premium"
  ]).default("standard"),

  preferredDistricts: z.array(
    z.string().trim().min(1)
  ).max(10).default([]),

  specialNotes:
    z.string().max(500).default(""),

  packageId: oid.nullable().default(null)
});

function validDates(
  a: string | Date,
  b: string | Date
) {
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();

  const days = Math.round(
    (end - start) / 86400000
  ) + 1;

  return (
    Number.isFinite(days) &&
    days >= 1 &&
    days <= 14
  );
}

function invalid(
  res: Response,
  message: string,
  errors?: unknown
) {
  res.status(400).json({
    success: false,
    message,
    errors
  });
}

async function owned(
  id: string | undefined,
  userId: string | undefined,
  res: Response
) {
  if (!id || !mongoose.isValidObjectId(id)) {
    invalid(res, "Invalid trip ID");
    return null;
  }

  const trip = await Trip.findOne({
    _id: id,
    userId
  });

  if (!trip) {
    res.status(404).json({
      success: false,
      message: "Trip not found"
    });
  }

  return trip;
}

async function validatePackage(
  packageId: string | null | undefined
) {
  if (!packageId) return true;

  return Boolean(
    await TourPackage.exists({
      _id: packageId,
      active: true
    })
  );
}

// GET /api/v1/trips/catalog
export async function getPlannerCatalog(
  _req: AuthRequest,
  res: Response
) {
  res.json({
    success: true,
    ...await plannerCatalog()
  });
}

// POST /api/v1/trips
export async function createTrip(
  req: AuthRequest,
  res: Response
) {
  const parsed = input.safeParse(req.body);

  if (!parsed.success) {
    return invalid(
      res,
      "Invalid trip details",
      z.flattenError(parsed.error)
    );
  }

  if (!validDates(
    parsed.data.startDate,
    parsed.data.endDate
  )) {
    return invalid(
      res,
      "Trip duration must be between 1 and 14 days"
    );
  }

  if (!(await validatePackage(parsed.data.packageId))) {
    return invalid(res, "Invalid package");
  }

  const trip = await Trip.create({
    ...parsed.data,
    userId: req.userId,
    status: "planned"
  });

  const plan = await rebuildTripPlan(
    trip.toObject()
  );

  res.status(201).json({
    success: true,
    trip,
    plan
  });
}

// GET /api/v1/trips
export async function getTrips(
  req: AuthRequest,
  res: Response
) {
  const items = await Trip.find({
    userId: req.userId
  })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    items
  });
}

// GET /api/v1/trips/:id
export async function getTrip(
  req: AuthRequest,
  res: Response
) {
  const trip = await owned(
    String(req.params.id || ""),
    req.userId,
    res
  );

  if (!trip) return;

  let plan = await TripPlan.findOne({
    tripId: trip._id
  });

  if (!plan) {
    plan = await rebuildTripPlan(
      trip.toObject()
    );
  }

  const [populated, catalog] =
    await Promise.all([
      Trip.findById(trip._id)
        .populate("destinationIds")
        .populate("packageId")
        .lean(),

      plannerCatalog()
    ]);

  res.json({
    success: true,
    trip: populated,
    plan,
    catalog
  });
}

// PATCH /api/v1/trips/:id
export async function updateTrip(
  req: AuthRequest,
  res: Response
) {
  const trip = await owned(
    String(req.params.id || ""),
    req.userId,
    res
  );

  if (!trip) return;

  const parsed =
    input.partial().safeParse(req.body);

  if (!parsed.success) {
    return invalid(
      res,
      "Invalid changes",
      z.flattenError(parsed.error)
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return invalid(res, "No changes supplied");
  }

  const a =
    parsed.data.startDate ?? trip.startDate;

  const b =
    parsed.data.endDate ?? trip.endDate;

  if (!validDates(a, b)) {
    return invalid(
      res,
      "Trip duration must be between 1 and 14 days"
    );
  }

  if (!(await validatePackage(parsed.data.packageId))) {
    return invalid(res, "Invalid package");
  }

  trip.set(parsed.data);
  await trip.save();

  const plan = await rebuildTripPlan(
    trip.toObject()
  );

  res.json({
    success: true,
    trip,
    plan
  });
}

// PATCH /api/v1/trips/:id/days/:date
export async function updateTripDay(
  req: AuthRequest,
  res: Response
) {
  const trip = await owned(
    String(req.params.id || ""),
    req.userId,
    res
  );

  if (!trip) return;

  const date = String(
    req.params.date || ""
  );

  const plan = await TripPlan.findOne({
    tripId: trip._id
  });

  if (
    !plan ||
    !(plan.days as any[]).some(
      d => d.date === date
    )
  ) {
    return invalid(
      res,
      "Date is not in this trip"
    );
  }

  const schema = z.object({
    destinationIds: z.array(oid).max(6),
    hotelId: oid.nullable().optional()
  });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return invalid(
      res,
      "Invalid day selection",
      z.flattenError(parsed.error)
    );
  }

  const ids = [
    ...new Set(parsed.data.destinationIds)
  ];

  const count = await Destination.countDocuments({
    _id: { $in: ids }
  });

  if (count !== ids.length) {
    return invalid(
      res,
      "One or more destinations do not exist"
    );
  }

  if (
    parsed.data.hotelId &&
    !(await Hotel.exists({
      _id: parsed.data.hotelId
    }))
  ) {
    return invalid(
      res,
      "Hotel does not exist"
    );
  }

  const previous =
    (plan.overrides as DayOverride[]).filter(
      o => o.date !== date
    );

  const override: DayOverride = {
    date,
    destinationIds: ids,
    ...(
      parsed.data.hotelId !== undefined
        ? { hotelId: parsed.data.hotelId }
        : {}
    )
  };

  const updated = await rebuildTripPlan(
    trip.toObject(),
    [...previous, override]
  );

  res.json({
    success: true,
    plan: updated
  });
}

// POST /api/v1/trips/:id/regenerate
export async function regenerateTrip(
  req: AuthRequest,
  res: Response
) {
  const trip = await owned(
    String(req.params.id || ""),
    req.userId,
    res
  );

  if (!trip) return;

  const plan = await rebuildTripPlan(
    trip.toObject(),
    req.body?.resetManual === true
      ? []
      : undefined
  );

  res.json({
    success: true,
    plan
  });
}

// DELETE /api/v1/trips/:id
export async function deleteTrip(
  req: AuthRequest,
  res: Response
) {
  const trip = await owned(
    String(req.params.id || ""),
    req.userId,
    res
  );

  if (!trip) return;

  await TripPlan.deleteOne({
    tripId: trip._id
  });

  await Trip.deleteOne({
    _id: trip._id,
    userId: req.userId
  });

  res.json({
    success: true,
    message: "Trip deleted"
  });
}