import type { Request, Response } from "express";
import { unavailable } from "../utils/http.js";

export function getForecast(
  _req: Request,
  res: Response
): void {
  unavailable(
    res,
    "Live weather provider and forecast model"
  );
}

export function getWeatherAlerts(
  _req: Request,
  res: Response
): void {
  unavailable(
    res,
    "Verified official weather alert feed"
  );
}