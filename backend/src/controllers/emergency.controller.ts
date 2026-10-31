import type { Request, Response } from "express";
import { EmergencyContact } from "../models/EmergencyContact.model.js";
import { fail } from "../utils/http.js";

export async function getEmergencyContacts(
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

    const query: Record<string, unknown> = {
      verified: true
    };

    if (search) {
      query.name = {
        $regex: search.replace(/[^\p{L}\p{N}\s-]/gu, ""),
        $options: "i"
      };
    }

    const items = await EmergencyContact.find(query)
      .select("name district phone category sourceUrl")
      .limit(limit)
      .lean();

    res.json({ success: true, items });
  } catch (error) {
    fail(res, error);
  }
}