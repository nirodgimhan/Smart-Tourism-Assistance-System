import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

// Mock weather service & VSI core service
vi.mock("../services/weather.service.js", () => ({
  getWeatherForecast: vi.fn(),
}));

vi.mock("../services/vsi.service.js", () => ({
  VsiService: {
    calculateHourlyVsi: vi.fn(),
    calculateDailyVsi: vi.fn(),
  },
}));

import { calculateVSI } from "../controllers/vsi.controller.js";
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
} from "../errors/vsi.errors.js";

function createMockResponse(): Response {
  const res: any = {};
  res.statusCode = 0;
  res.body = undefined;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.body = payload;
    return res;
  };
  return res as Response;
}

const mockWeather = {
  location: { latitude: 6.9271, longitude: 79.8612 },
  timezone: "Asia/Colombo",
  current: {} as any,
  hourly: { time: [] } as any,
  daily: { time: [] } as any,
};

const mockVsiResult: VsiResult = {
  vsiScore: 88.5,
  rating: "Excellent",
  dataCoverageStatus: "complete",
  hourlyCoverage: 100,
  dailyCoverage: null,
  factorCoverage: {
    temperature: 100,
    rainfall: 100,
    humidity: 100,
    wind: 100,
    uv: 100,
  },
  missingFactors: [],
  effectiveFactors: {
    temperature: 90,
    rainfall: 95,
    humidity: 80,
    wind: 85,
    uv: 90,
  },
};

describe("VSI Controller - calculateVSI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates hourly VSI on valid hourly request and calls services with correct args", async () => {
    (getWeatherForecast as any).mockResolvedValue(mockWeather);
    (VsiService.calculateHourlyVsi as any).mockReturnValue(mockVsiResult);

    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        requestedStart: "2026-03-01T09:00:00+05:30",
        requestedEnd: "2026-03-01T12:00:00+05:30",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(getWeatherForecast).toHaveBeenCalledWith(6.9271, 79.8612);
    expect(VsiService.calculateHourlyVsi).toHaveBeenCalledWith(mockWeather, {
      requestedStart: "2026-03-01T09:00:00+05:30",
      requestedEnd: "2026-03-01T12:00:00+05:30",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockVsiResult);
    expect(res.body.result).toEqual({
      score: 88.5,
      category: "Excellent",
      factors: mockVsiResult.effectiveFactors,
      source: "Open-Meteo Weather Model & VSI Algorithm",
      dataCoverageStatus: "complete",
      hourlyCoverage: 100,
      dailyCoverage: null,
      factorCoverage: mockVsiResult.factorCoverage,
      missingFactors: [],
      effectiveFactors: mockVsiResult.effectiveFactors,
    });
  });

  it("calculates daily VSI on valid daily range request (startDate and endDate)", async () => {
    (getWeatherForecast as any).mockResolvedValue(mockWeather);
    const dailyResult: VsiResult = {
      ...mockVsiResult,
      hourlyCoverage: null,
      dailyCoverage: 100,
      dataCoverageStatus: "partial",
    };
    (VsiService.calculateDailyVsi as any).mockReturnValue(dailyResult);

    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        startDate: "2026-03-01",
        endDate: "2026-03-03",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(getWeatherForecast).toHaveBeenCalledWith(6.9271, 79.8612);
    expect(VsiService.calculateDailyVsi).toHaveBeenCalledWith(mockWeather, {
      startDate: "2026-03-01",
      endDate: "2026-03-03",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(dailyResult);
  });

  it("calculates daily VSI on single-date daily request (date normalized to startDate=date and endDate=date)", async () => {
    (getWeatherForecast as any).mockResolvedValue(mockWeather);
    (VsiService.calculateDailyVsi as any).mockReturnValue(mockVsiResult);

    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        date: "2026-03-01",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(getWeatherForecast).toHaveBeenCalledWith(6.9271, 79.8612);
    expect(VsiService.calculateDailyVsi).toHaveBeenCalledWith(mockWeather, {
      startDate: "2026-03-01",
      endDate: "2026-03-01",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("preserves null when vsiScore is null, setting category to 'Insufficient Data'", async () => {
    (getWeatherForecast as any).mockResolvedValue(mockWeather);
    const nullScoreResult: VsiResult = {
      vsiScore: null,
      rating: null,
      dataCoverageStatus: "insufficient",
      hourlyCoverage: 0,
      dailyCoverage: null,
      factorCoverage: {
        temperature: 0,
        rainfall: 0,
        humidity: 0,
        wind: 0,
        uv: 0,
      },
      missingFactors: ["temperature", "rainfall", "humidity", "wind", "uv"],
      effectiveFactors: {
        temperature: null,
        rainfall: null,
        humidity: null,
        wind: null,
        uv: null,
      },
    };
    (VsiService.calculateHourlyVsi as any).mockReturnValue(nullScoreResult);

    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        requestedStart: "2026-03-01T09:00:00Z",
        requestedEnd: "2026-03-01T10:00:00Z",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.vsiScore).toBeNull();
    expect(res.body.result.score).toBeNull();
    expect(res.body.result.score).not.toBe(0);
    expect(res.body.result.category).toBe("Insufficient Data");
  });

  it("rejects request missing coordinates", async () => {
    const req = {
      body: {
        requestedStart: "2026-03-01T09:00:00Z",
        requestedEnd: "2026-03-01T10:00:00Z",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid hourly VSI request parameters");
  });

  it("rejects request with invalid coordinates out of bounds", async () => {
    const req = {
      body: {
        latitude: 100, // max 90
        longitude: 79.8612,
        date: "2026-03-01",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid daily VSI request parameters");
  });

  it("rejects invalid calendar dates (e.g. 2026-02-31, 2026-13-01)", async () => {
    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        date: "2026-02-31",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects hourly timestamps without explicit UTC offsets", async () => {
    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        requestedStart: "2026-03-01T09:00:00", // missing offset
        requestedEnd: "2026-03-01T10:00:00Z",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects requests mixing hourly and daily fields", async () => {
    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        requestedStart: "2026-03-01T09:00:00Z",
        date: "2026-03-01",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Cannot mix hourly and daily parameters");
  });

  it("rejects arbitrary weather payloads", async () => {
    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        date: "2026-03-01",
        weather: { fake: "data" },
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("maps NoDataError to 404", async () => {
    (getWeatherForecast as any).mockResolvedValue(mockWeather);
    (VsiService.calculateDailyVsi as any).mockImplementation(() => {
      throw new NoDataError("No requested dates present in provider data");
    });

    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        date: "2026-03-01",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("No requested dates present in provider data");
  });

  it("maps InvalidRequestError and InvalidTimestampError to 400", async () => {
    (getWeatherForecast as any).mockResolvedValue(mockWeather);
    (VsiService.calculateHourlyVsi as any).mockImplementation(() => {
      throw new InvalidRequestError("Request start must be earlier than request end");
    });

    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        requestedStart: "2026-03-01T12:00:00Z",
        requestedEnd: "2026-03-01T09:00:00Z",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Request start must be earlier than request end");
  });

  it("maps UnsupportedTimezoneTransitionError to 422", async () => {
    (getWeatherForecast as any).mockResolvedValue(mockWeather);
    (VsiService.calculateHourlyVsi as any).mockImplementation(() => {
      throw new UnsupportedTimezoneTransitionError(
        "Selected hourly timestamps contain differing UTC offsets"
      );
    });

    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        requestedStart: "2026-03-01T09:00:00Z",
        requestedEnd: "2026-03-01T15:00:00Z",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("differing UTC offsets");
  });

  it("maps invalid provider weather metrics (e.g. InvalidTemperatureError, InvalidNumericError) to 502", async () => {
    (getWeatherForecast as any).mockResolvedValue(mockWeather);
    (VsiService.calculateDailyVsi as any).mockImplementation(() => {
      throw new InvalidTemperatureError("daily.temperatureMax out of range");
    });

    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        date: "2026-03-01",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("daily.temperatureMax out of range");
  });

  it("maps unexpected service/provider crash to 500", async () => {
    (getWeatherForecast as any).mockRejectedValue(
      new Error("Network connection failed")
    );

    const req = {
      body: {
        latitude: 6.9271,
        longitude: 79.8612,
        date: "2026-03-01",
      },
    } as unknown as AuthRequest;
    const res = createMockResponse();

    await calculateVSI(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unexpected server error");
  });
});
