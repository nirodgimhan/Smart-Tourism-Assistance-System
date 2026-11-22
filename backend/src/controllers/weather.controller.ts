import type { Request, Response } from "express";
import { fail, unavailable } from "../utils/http.js";
import { getWeatherForecast } from "../services/weather.service.js";

/**
 * GET /forecast?lat=<number>&lon=<number>
 * Returns a normalized weather forecast.
 */
export async function getForecast(req: Request, res: Response): Promise<void> {
  try {
    const latRaw = req.query.lat;
    const lonRaw = req.query.lon;

    // ---- Presence & type validation ----
    // Must be defined, be a string, non‑empty after trimming, and not an array.
    const isInvalid = (val: any): boolean => {
      return (
        val === undefined ||
        val === null ||
        Array.isArray(val) ||
        (typeof val !== "string") ||
        val.trim() === ""
      );
    };
    if (isInvalid(latRaw) || isInvalid(lonRaw)) {
      res.status(400).json({
        success: false,
        message: "Missing or empty latitude/longitude query parameters",
      });
      return;
    }

    const lat = Number(latRaw);
    const lon = Number(lonRaw);

    // ---- Numeric validation ----
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.status(400).json({
        success: false,
        message: "Latitude/longitude must be finite numbers",
      });
      return;
    }

    // ---- Range validation ----
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({
        success: false,
        message: "Latitude must be –90..90 and longitude –180..180",
      });
      return;
    }

    const forecast = await getWeatherForecast(lat, lon);
    res.status(200).json({ success: true, data: forecast });
  } catch (error) {
    // Provider/network errors
    fail(res, error);
  }
}

export function getWeatherAlerts(_req: Request, res: Response): void {
  unavailable(res, "Verified official weather alert feed");
}
