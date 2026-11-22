// Weather Provider – Open-Meteo integration
// This module provides a reusable function to fetch weather data for a given
// latitude and longitude using the Open-Meteo public API. No API key is required.
// The function returns a normalized TypeScript-friendly structure.

import { AbortError } from "node:stream/web"; // for type checking only (no runtime effect)

/**
 * Raw Open‑Meteo response (partial – only fields we need).
 * See https://open-meteo.com/en/docs for the full schema.
 */
export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    relativehumidity_2m?: number[];
    apparent_temperature?: number[];
    precipitation?: number[];
    precipitation_probability?: number[];
    rain?: number[];
    windspeed_10m?: number[];
    winddirection_10m?: number[];
    weathercode?: number[];
    uv_index?: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    windspeed_10m_max?: number[];
    uv_index_max?: number[];
  };
}

/**
 * Normalized weather data used by the rest of the backend.
 */
export interface NormalizedWeather {
  location: { latitude: number; longitude: number };
  timezone: string;
  current: {
    temperature: number; // °C
    relativeHumidity: number; // %
    apparentTemperature: number; // °C
    precipitation: number; // mm
    rain: number; // mm
    windSpeed: number; // km/h
    windDirection: number; // degrees
    weatherCode: number; // Open‑Meteo weather code
    uvIndex: number; // unitless
    time: string; // ISO timestamp
  };
  hourly: {
    time: string[];
    temperature: number[]; // °C
    relativeHumidity: number[]; // %
    apparentTemperature: number[]; // °C
    precipitation: number[]; // mm
    precipitationProbability: number[]; // %
    rain: number[]; // mm
    windSpeed: number[]; // km/h
    windDirection: number[]; // degrees
    weatherCode: number[]; // codes
    uvIndex: number[]; // unitless
  };
  daily: {
    time: string[];
    temperatureMax: number[]; // °C
    temperatureMin: number[]; // °C
    precipitationSum: number[]; // mm
    windSpeedMax: number[]; // km/h
    uvIndexMax: number[]; // unitless
  };
}

/**
 * Fetch weather data from Open‑Meteo.
 *
 * @param latitude  Latitude in decimal degrees (‑90 … 90)
 * @param longitude Longitude in decimal degrees (‑180 … 180)
 * @returns NormalizedWeather object
 * @throws Error on validation, network, timeout or malformed response.
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  options?: { timeoutMs?: number }
): Promise<NormalizedWeather> {
  // ----- Input validation ---------------------------------------------------
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("Latitude and longitude must be numbers");
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }

  const timeoutMs = options?.timeoutMs ?? 10000; // default 10 s

  // ----- Build request URL -------------------------------------------------
  const baseUrl = "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    timezone: "Asia/Colombo",
    current_weather: "true",
    // Units
    temperature_unit: "celsius",
    windspeed_unit: "kmh",
    precipitation_unit: "mm",
    // Daily aggregates (7‑day forecast)
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "windspeed_10m_max",
      "uv_index_max",
    ].join(","),
    // Hourly series we need
    hourly: [
      "temperature_2m",
      "relativehumidity_2m",
      "apparent_temperature",
      "precipitation",
      "precipitation_probability",
      "rain",
      "windspeed_10m",
      "winddirection_10m",
      "weathercode",
      "uv_index",
    ].join(","),
    forecast_days: "7",
  });

  const url = `${baseUrl}?${params.toString()}`;

  // ----- Perform fetch with timeout ----------------------------------------
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if ((err as any).name === "AbortError") {
      throw new Error(`Weather request timed out after ${timeoutMs} ms`);
    }
    throw new Error(`Network error while fetching weather data: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Weather API responded with ${response.status} ${response.statusText}: ${text}`);
  }

  // ----- Parse JSON --------------------------------------------------------
  let data: OpenMeteoResponse;
  try {
    data = (await response.json()) as OpenMeteoResponse;
  } catch (err) {
    throw new Error(`Failed to parse weather JSON response: ${(err as Error).message}`);
  }

  // ----- Verify required fields -------------------------------------------
  if (!data.current_weather) {
    throw new Error("Missing current_weather data in Open-Meteo response");
  }
  if (!data.hourly || !data.daily) {
    throw new Error("Missing hourly or daily data in Open-Meteo response");
  }

  // Helper to safely extract arrays (fallback to empty array)
  const safeArray = <T>(arr?: T[]): T[] => (arr ?? []);

  // ----- Normalization ------------------------------------------------------
  const normalized: NormalizedWeather = {
    location: { latitude: data.latitude, longitude: data.longitude },
    timezone: data.timezone,
    current: {
      temperature: data.current_weather.temperature,
      // The API does not provide relative humidity in current_weather, so we take the latest hourly value.
      relativeHumidity: safeArray(data.hourly.relativehumidity_2m).slice(-1)[0] ?? 0,
      apparentTemperature: safeArray(data.hourly.apparent_temperature).slice(-1)[0] ?? data.current_weather.temperature,
      precipitation: safeArray(data.hourly.precipitation).slice(-1)[0] ?? 0,
      rain: safeArray(data.hourly.rain).slice(-1)[0] ?? 0,
      windSpeed: data.current_weather.windspeed,
      windDirection: data.current_weather.winddirection,
      weatherCode: data.current_weather.weathercode,
      uvIndex: safeArray(data.hourly.uv_index).slice(-1)[0] ?? 0,
      time: data.current_weather.time,
    },
    hourly: {
      time: data.hourly.time,
      temperature: safeArray(data.hourly.temperature_2m),
      relativeHumidity: safeArray(data.hourly.relativehumidity_2m),
      apparentTemperature: safeArray(data.hourly.apparent_temperature),
      precipitation: safeArray(data.hourly.precipitation),
      precipitationProbability: safeArray(data.hourly.precipitation_probability),
      rain: safeArray(data.hourly.rain),
      windSpeed: safeArray(data.hourly.windspeed_10m),
      windDirection: safeArray(data.hourly.winddirection_10m),
      weatherCode: safeArray(data.hourly.weathercode),
      uvIndex: safeArray(data.hourly.uv_index),
    },
    daily: {
      time: data.daily.time,
      temperatureMax: safeArray(data.daily.temperature_2m_max),
      temperatureMin: safeArray(data.daily.temperature_2m_min),
      precipitationSum: safeArray(data.daily.precipitation_sum),
      windSpeedMax: safeArray(data.daily.windspeed_10m_max),
      uvIndexMax: safeArray(data.daily.uv_index_max),
    },
  };

  return normalized;
}

// Export a default object for easy import if desired
export default { fetchWeather };
