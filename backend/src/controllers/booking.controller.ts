
import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { Booking } from "../models/Booking.model.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const createBookingSchema = z.object({
  hotelId: z.string().trim().min(1).max(120),

  checkIn: z.coerce.date(),

  checkOut: z.coerce.date(),

  guests: z.coerce.number().int().min(1).max(20)
});

// POST /api/v1/bookings
export async function createBooking(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Please log in first."
      });
      return;
    }

    const parsed = createBookingSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid booking details.",
        errors: z.flattenError(parsed.error)
      });
      return;
    }

    const { hotelId, checkIn, checkOut, guests } = parsed.data;

    if (checkOut <= checkIn) {
      res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date."
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past."
      });
      return;
    }

    const booking = await Booking.create({
      userId: req.userId,
      hotelId,
      checkIn,
      checkOut,
      guests,
      status: "pending",
      totalLkr: null
    });

    res.status(201).json({
      success: true,
      message:
        "Booking request saved. Hotel availability is not confirmed.",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create booking request."
    });
  }
}

// GET /api/v1/bookings
export async function getMyBookings(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Please log in first."
      });
      return;
    }

    const items = await Booking.find({
      userId: req.userId
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error("Get bookings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings."
    });
  }
}

// GET /api/v1/bookings/:id
export async function getBookingById(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id ?? "");

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Please log in first."
      });
      return;
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid booking ID."
      });
      return;
    }

    const booking = await Booking.findOne({
      _id: id,
      userId: req.userId
    }).lean();

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found."
      });
      return;
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error("Get booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve booking."
    });
  }
}

// PATCH /api/v1/bookings/:id/cancel
export async function cancelBooking(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id ?? "");

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Please log in first."
      });
      return;
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid booking ID."
      });
      return;
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: id,
        userId: req.userId,
        status: "pending"
      },
      {
        $set: { status: "cancelled" }
      },
      { new: true }
    );

    if (!booking) {
      res.status(404).json({
        success: false,
        message:
          "Pending booking request not found or cannot be cancelled."
      });
      return;
    }

    res.json({
      success: true,
      message: "Booking request cancelled.",
      booking
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel booking request."
    });
  }
}
