import type { Response } from "express";
import mongoose from "mongoose";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { SavedPlace } from "../models/SavedPlace.model.js";
import { Destination } from "../models/Destination.model.js";
import { fail, unauthorized } from "../utils/http.js";

export async function getSavedPlaces(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  try {
    const items = await SavedPlace.find({
      userId: req.userId
    })
      .populate(
        "destinationId",
        "name district category location"
      )
      .limit(100)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}

export async function savePlace(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  const destinationId = String(
    req.body?.destinationId ?? ""
  );

  if (!mongoose.isValidObjectId(destinationId)) {
    res.status(400).json({
      success: false,
      message: "Invalid destinationId"
    });
    return;
  }

  try {
    const destinationExists = await Destination.exists({
      _id: destinationId
    });

    if (!destinationExists) {
      res.status(404).json({
        success: false,
        message: "Destination not found"
      });
      return;
    }

    const item = await SavedPlace.findOneAndUpdate(
      {
        userId: req.userId,
        destinationId
      },
      {
        $setOnInsert: {
          userId: req.userId,
          destinationId
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    res.status(201).json({
      success: true,
      item
    });
  } catch (error) {
    fail(res, error);
  }
}

export async function removeSavedPlace(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  const id = String(req.params.id ?? "");

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      success: false,
      message: "Invalid ID"
    });
    return;
  }

  try {
    const item = await SavedPlace.findOneAndDelete({
      _id: id,
      userId: req.userId
    });

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Saved place not found"
      });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    fail(res, error);
  }
}