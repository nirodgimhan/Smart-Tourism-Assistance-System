import type { Response } from "express";
import mongoose from "mongoose";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { Notification } from "../models/Notification.model.js";
import { fail, unauthorized } from "../utils/http.js";

export async function getNotifications(
  req: AuthRequest,
  res: Response
): Promise<void> {
  if (!req.userId) {
    unauthorized(res);
    return;
  }

  try {
    const items = await Notification.find({
      userId: req.userId
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}

export async function markNotificationRead(
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
      message: "Invalid notification ID"
    });
    return;
  }

  try {
    const item = await Notification.findOneAndUpdate(
      {
        _id: id,
        userId: req.userId
      },
      { $set: { read: true } },
      { new: true }
    );

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Notification not found"
      });
      return;
    }

    res.json({ success: true, item });
  } catch (error) {
    fail(res, error);
  }
}