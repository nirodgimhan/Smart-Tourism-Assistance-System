import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Hotel } from "../models/Hotel.model.js";
import { fail, unavailable } from "../utils/http.js";

export async function getHotels(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const search = typeof req.query.search === "string"
      ? req.query.search.trim().slice(0, 100)
      : "";

    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 30)
    );

    const query: Record<string, unknown> = {};

    if (search) {
      query.name = {
        $regex: search.replace(/[^\p{L}\p{N}\s-]/gu, ""),
        $options: "i"
      };
    }

    if (typeof req.query.district === "string") {
      query.district = req.query.district.trim();
    }

    const maxPrice = Number(req.query.maxPrice);

    if (
      req.query.maxPrice !== undefined &&
      Number.isFinite(maxPrice) &&
      maxPrice >= 0
    ) {
      query.indicativePriceLkr = { $lte: maxPrice };
    }

    const items = await Hotel.find(query)
      .select(
        "name district address description amenities images indicativePriceLkr providerUrl verified"
      )
      .limit(limit)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}

export async function getHotelById(
  req: Request,
  res: Response
): Promise<void> {
  const id = String(req.params.id ?? "");

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      success: false,
      message: "Invalid hotel ID"
    });
    return;
  }

  try {
    const hotel = await Hotel.findById(id).lean();

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: "Hotel not found"
      });
      return;
    }

    res.json({ success: true, hotel });
  } catch (error) {
    fail(res, error);
  }
}

export function recommendHotels(
  _req: Request,
  res: Response
): void {
  unavailable(res, "Hotel recommendation model");
}