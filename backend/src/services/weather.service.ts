// Weather Service - thin wrapper around the Open-Meteo provider

import {
  fetchWeather,
  fetchWeatherAlerts,
} from "../integrations/weather.provider.js";

import type {
  NormalizedWeather,
  NormalizedWeatherAlert,
} from "../integrations/weather.provider.js";

/**
 * Retrieve official Sri Lanka weather alerts.
 * Delegates directly to the provider.
 */
export async function getWeatherAlerts(): Promise<NormalizedWeatherAlert[]> {
  return await fetchWeatherAlerts();
}

/**
 * Retrieve a live weather forecast for the given latitude/longitude.
 * Validates coordinates before delegating to the provider.
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number
): Promise<NormalizedWeather> {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error("Latitude and longitude must be finite numbers");
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }

  return await fetchWeather(latitude, longitude);
}
