// Weather Service – thin wrapper around the Open‑Meteo provider
import { fetchWeather } from "../integrations/weather.provider.js";
import type { NormalizedWeather } from "../integrations/weather.provider.js";

/**
 * Retrieve a live weather forecast for the given latitude/longitude.
 * Performs basic coordinate validation (mirroring the provider) and then
 * delegates to {@link fetchWeather}. No additional business logic or DB
 * interactions are performed.
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number
): Promise<NormalizedWeather> {
  // ---- Validation ----
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

  // Delegate to provider – no duplicate Open‑Meteo logic.
  return await fetchWeather(latitude, longitude);
}
