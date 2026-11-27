import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { fail } from "../utils/http.js";
import { vsiHourlySchema, vsiDailySchema } from "../validators/vsi.schema.js";
import { getWeatherForecast } from "../services/weather.service.js";
import { VsiService } from "../services/vsi.service.js";
import type { VsiResult } from "../services/vsi.service.js";
import {
  InvalidRequestError,
  InvalidTimestampError,
  NoDataError,
  UnsupportedTimezoneTransitionError,
  InvalidNumericError,
  InvalidTemperatureError,
  InvalidTemperatureRangeError,
  InvalidPrecipitationProbabilityError,
  InvalidHumidityError,
  InvalidWindError,
  InvalidUVError,
  InvalidPrecipitationSumError,
} from "../errors/vsi.errors.js";

/**
 * Controller to calculate Visit Suitability Index (VSI).
 * Supports hourly and daily calculation modes using coordinates (latitude, longitude).
 *
 * POST /api/v1/vsi/calculate
 */
export async function calculateVSI(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const body = req.body ?? {};

  // Detect mode & reject mixed modes
  const hasHourlyFields =
    body.requestedStart !== undefined || body.requestedEnd !== undefined;
  const hasDailyFields =
    body.date !== undefined ||
    body.startDate !== undefined ||
    body.endDate !== undefined;

  if (hasHourlyFields && hasDailyFields) {
    res.status(400).json({
      success: false,
      message: "Cannot mix hourly and daily parameters in VSI calculation request",
    });
    return;
  }

  if (!hasHourlyFields && !hasDailyFields) {
    res.status(400).json({
      success: false,
      message:
        "Must provide latitude, longitude, and either hourly window (requestedStart, requestedEnd) or daily parameters (date, or startDate and endDate)",
    });
    return;
  }

  try {
    let vsiResult: VsiResult;

    if (hasHourlyFields) {
      const parseResult = vsiHourlySchema.safeParse(body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: "Invalid hourly VSI request parameters",
          errors: parseResult.error.format(),
        });
        return;
      }

      const { latitude, longitude, requestedStart, requestedEnd } =
        parseResult.data;
      const weather = await getWeatherForecast(latitude, longitude);
      vsiResult = VsiService.calculateHourlyVsi(weather, {
        requestedStart,
        requestedEnd,
      });
    } else {
      const parseResult = vsiDailySchema.safeParse(body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: "Invalid daily VSI request parameters",
          errors: parseResult.error.format(),
        });
        return;
      }

      const { latitude, longitude, startDate, endDate } = parseResult.data;
      const weather = await getWeatherForecast(latitude, longitude);
      vsiResult = VsiService.calculateDailyVsi(weather, {
        startDate,
        endDate,
      });
    }

    const category = vsiResult.rating ?? "Insufficient Data";

    res.status(200).json({
      success: true,
      data: vsiResult,
      result: {
        score: vsiResult.vsiScore,
        category,
        factors: vsiResult.effectiveFactors,
        source: "Open-Meteo Weather Model & VSI Algorithm",
        dataCoverageStatus: vsiResult.dataCoverageStatus,
        hourlyCoverage: vsiResult.hourlyCoverage,
        dailyCoverage: vsiResult.dailyCoverage,
        factorCoverage: vsiResult.factorCoverage,
        missingFactors: vsiResult.missingFactors,
        effectiveFactors: vsiResult.effectiveFactors,
      },
    });
  } catch (error) {
    // Map deliberate domain errors to proper HTTP status codes
    if (
      error instanceof InvalidRequestError ||
      error instanceof InvalidTimestampError
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof NoDataError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof UnsupportedTimezoneTransitionError) {
      res.status(422).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error instanceof InvalidNumericError ||
      error instanceof InvalidTemperatureError ||
      error instanceof InvalidTemperatureRangeError ||
      error instanceof InvalidPrecipitationProbabilityError ||
      error instanceof InvalidHumidityError ||
      error instanceof InvalidWindError ||
      error instanceof InvalidUVError ||
      error instanceof InvalidPrecipitationSumError
    ) {
      res.status(502).json({
        success: false,
        message: error.message || "Weather provider returned invalid metrics",
      });
      return;
    }

    // Default to unexpected server error
    fail(res, error);
  }
}
