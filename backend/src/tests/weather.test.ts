// Vitest tests for Weather Intelligence component
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// Mock the provider (fetchWeather) – it is used by the service.
vi.mock("../integrations/weather.provider.js", () => ({
  fetchWeather: vi.fn(),
}));

import { fetchWeather } from "../integrations/weather.provider.js";
import { getWeatherForecast } from "../services/weather.service.js";
import { getForecast } from "../controllers/weather.controller.js";

// Minimal NormalizedWeather shape used in tests.
const mockWeather = {
  location: { latitude: 6.9271, longitude: 79.8612 },
  timezone: "Asia/Colombo",
  current: {
    temperature: 30,
    relativeHumidity: 70,
    apparentTemperature: 32,
    precipitation: 0,
    rain: 0,
    windSpeed: 10,
    windDirection: 180,
    weatherCode: 1,
    uvIndex: 5,
    time: "2026-11-22T14:15:00Z",
  },
  hourly: {
    time: ["2026-11-22T14:00:00Z"],
    temperature: [30],
    relativeHumidity: [70],
    apparentTemperature: [32],
    precipitation: [0],
    precipitationProbability: [0],
    rain: [0],
    windSpeed: [10],
    windDirection: [180],
    weatherCode: [1],
    uvIndex: [5],
  },
  daily: {
    time: ["2026-11-22"],
    temperatureMax: [33],
    temperatureMin: [25],
    precipitationSum: [0],
    windSpeedMax: [12],
    uvIndexMax: [6],
  },
} as const;

// Helper to create mock Express response object.
function createMockResponse() {
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

describe("Weather Service", () => {
  beforeEach(() => {
    (fetchWeather as any).mockReset();
  });

  it("returns data for valid coordinates", async () => {
    (fetchWeather as any).mockResolvedValue(mockWeather);
    const result = await getWeatherForecast(6.9, 79.8);
    expect(result).toEqual(mockWeather);
    expect(fetchWeather).toHaveBeenCalledWith(6.9, 79.8);
  });

  it("throws for invalid latitude", async () => {
    await expect(getWeatherForecast(200, 0)).rejects.toThrow(
      "Latitude must be between -90 and 90"
    );
  });

  it("throws for invalid longitude", async () => {
    await expect(getWeatherForecast(0, -200)).rejects.toThrow(
      "Longitude must be between -180 and 180"
    );
  });

  it("throws for non‑finite numbers", async () => {
    await expect(getWeatherForecast(NaN, Infinity)).rejects.toThrow(
      "Latitude and longitude must be finite numbers"
    );
  });
});

describe("Weather Forecast controller", () => {
  beforeEach(() => {
    (fetchWeather as any).mockReset();
  });

  it("valid coordinates → 200 success", async () => {
    (fetchWeather as any).mockResolvedValue(mockWeather);
    const req = { query: { lat: "6.9", lon: "79.8" } } as unknown as Request;
    const res = createMockResponse();
    await getForecast(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: mockWeather });
  });

  it("missing latitude → 400", async () => {
    const req = { query: { lon: "79.8" } } as unknown as Request;
    const res = createMockResponse();
    await getForecast(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("missing longitude → 400", async () => {
    const req = { query: { lat: "6.9" } } as unknown as Request;
    const res = createMockResponse();
    await getForecast(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("non‑numeric coordinates → 400", async () => {
    const req = { query: { lat: "abc", lon: "def" } } as unknown as Request;
    const res = createMockResponse();
    await getForecast(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("out‑of‑range coordinates → 400", async () => {
    const req = { query: { lat: "200", lon: "300" } } as unknown as Request;
    const res = createMockResponse();
    await getForecast(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("service failure → 500", async () => {
    (fetchWeather as any).mockRejectedValue(new Error("Provider crash"));
    const req = { query: { lat: "6.9", lon: "79.8" } } as unknown as Request;
    const res = createMockResponse();
    await getForecast(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unexpected server error");
  });
});
