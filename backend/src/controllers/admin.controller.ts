
import type { Request, Response } from "express";
import { User } from "../models/User.model.js";
import { Destination } from "../models/Destination.model.js";
import { Booking } from "../models/Booking.model.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

async function verifyAdmin(req: AuthRequest): Promise<boolean> {
  if (!req.userId) return false;

  const user = await User.findById(req.userId)
    .select("role isActive")
    .lean();

  return user?.role === "admin" && user.isActive === true;
}

async function authorize(
  req: AuthRequest,
  res: Response
): Promise<boolean> {
  if (!(await verifyAdmin(req))) {
    res.status(403).json({
      success: false,
      message: "Administrator access required."
    });
    return false;
  }

  return true;
}

// GET /api/v1/admin/stats
export async function getAdminStats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!(await authorize(req, res))) return;

    const [users, destinations, bookings] = await Promise.all([
      User.countDocuments(),
      Destination.countDocuments(),
      Booking.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        users,
        destinations,
        hotels: null,
        bookings
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load administrator statistics."
    });
  }
}

// GET /api/v1/admin/users
export async function getAdminUsers(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!(await authorize(req, res))) return;

    const items = await User.find()
      .select("name email role isActive createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error("Admin users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load users."
    });
  }
}

// GET /api/v1/admin/destinations
export async function getAdminDestinations(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!(await authorize(req, res))) return;

    const items = await Destination.find()
      .select("name category district province verified")
      .sort({ name: 1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error("Admin destinations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load destinations."
    });
  }
}

// GET /api/v1/admin/bookings
export async function getAdminBookings(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!(await authorize(req, res))) return;

    const items = await Booking.find()
      .select(
        "userId hotelId checkIn checkOut guests status totalLkr createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error("Admin bookings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load booking records."
    });
  }
}

// GET /api/v1/admin/hotels
export async function getAdminHotels(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!(await authorize(req, res))) return;

  res.status(501).json({
    success: false,
    message: "Hotel model and admin hotel API are not implemented yet."
  });
}
