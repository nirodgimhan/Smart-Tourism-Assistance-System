// Weather Provider – Open-Meteo integration
// Provides functions to fetch weather data and official Sri Lanka weather alerts.

// ---------------------------------------------------------------------------
// Types – only the fields we request
// ---------------------------------------------------------------------------

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  // Current weather values (requested via the `current` parameter)
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    rain: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    time: string;
  };
  // Hourly series (aligned with `hourly.time`)
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    apparent_temperature?: number[];
    precipitation?: number[];
    precipitation_probability?: number[];
    rain?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    weather_code?: number[];
    uv_index?: number[];
  };
  // Daily aggregates (7‑day forecast)
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
    uv_index_max?: number[];
  };
}

/** Normalized shape used throughout the backend. */
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
    windDirection: number; // °
    weatherCode: number; // Open‑Meteo code
    uvIndex: number; // unit‑less (derived from hourly)
    time: string; // ISO timestamp
  };
  hourly: {
    time: string[];
    temperature: number[];
    relativeHumidity: number[];
    apparentTemperature: number[];
    precipitation: number[];
    precipitationProbability: number[];
    rain: number[];
    windSpeed: number[];
    windDirection: number[];
    weatherCode: number[];
    uvIndex: number[];
  };
  daily: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    precipitationSum: number[];
    windSpeedMax: number[];
    uvIndexMax: number[];
  };
}

/** Normalized alert shape returned by `fetchWeatherAlerts`. */
export interface NormalizedWeatherAlert {
  identifier: string | undefined;
  title: string | undefined; // headline
  description: string | undefined;
  severity: string | undefined;
  urgency: string | undefined;
  certainty: string | undefined;
  event: string | undefined;
  area: string | undefined;
  effective: string | undefined;
  expires: string | undefined;
  sender: string | undefined;
  sent: string | undefined;
  sourceUrl: string; // the URL of the CAP XML document
}

/**
 * Fetch weather data from Open‑Meteo.
 * @param latitude  Latitude in decimal degrees (‑90 … 90)
 * @param longitude Longitude in decimal degrees (‑180 … 180)
 * @param options   Optional settings (e.g., request timeout)
 * @returns NormalizedWeather object
 * @throws Error for invalid coordinates, network failures, timeout, or malformed response.
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  options?: { timeoutMs?: number }
): Promise<NormalizedWeather> {
  // ----------- Coordinate validation -----------
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

  const timeoutMs = options?.timeoutMs ?? 10_000;

  // Build request URL
  const baseUrl = "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    timezone: "Asia/Colombo",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "rain",
      "wind_speed_10m",
      "wind_direction_10m",
      "weather_code"
    ].join(","),
    temperature_unit: "celsius",
    windspeed_unit: "kmh",
    precipitation_unit: "mm",
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "wind_speed_10m_max",
      "uv_index_max"
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "precipitation_probability",
      "rain",
      "wind_speed_10m",
      "wind_direction_10m",
      "weather_code",
      "uv_index"
    ].join(","),
    forecast_days: "7",
  });
  const url = `${baseUrl}?${params.toString()}`;

  // Fetch with timeout
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

  // Parse JSON
  let data: OpenMeteoResponse;
  try {
    data = (await response.json()) as OpenMeteoResponse;
  } catch (err) {
    throw new Error(`Failed to parse weather JSON response: ${(err as Error).message}`);
  }

  // Verify required sections
  if (!data.current) {
    throw new Error("Missing `current` section in Open-Meteo response");
  }
  if (!data.hourly) {
    throw new Error("Missing `hourly` section in Open-Meteo response");
  }
  if (!data.daily) {
    throw new Error("Missing `daily` section in Open-Meteo response");
  }

  // Validate arrays
  if (!Array.isArray(data.hourly.time) || data.hourly.time.length === 0) {
    throw new Error("Invalid or empty `hourly.time` array");
  }
  if (!Array.isArray(data.daily.time) || data.daily.time.length === 0) {
    throw new Error("Invalid or empty `daily.time` array");
  }

  const verifyHourlyArray = (name: string, arr?: any[]) => {
    if (!Array.isArray(arr)) {
      throw new Error(`Missing required hourly array '${name}'`);
    }
    if (arr.length !== data.hourly!.time.length) {
      throw new Error(`Length mismatch for hourly array '${name}': expected ${data.hourly!.time.length}, got ${arr.length}`);
    }
  };

  // Verify all hourly arrays we use
  verifyHourlyArray("temperature_2m", data.hourly.temperature_2m);
  verifyHourlyArray("relative_humidity_2m", data.hourly.relative_humidity_2m);
  verifyHourlyArray("apparent_temperature", data.hourly.apparent_temperature);
  verifyHourlyArray("precipitation", data.hourly.precipitation);
  verifyHourlyArray("precipitation_probability", data.hourly.precipitation_probability);
  verifyHourlyArray("rain", data.hourly.rain);
  verifyHourlyArray("wind_speed_10m", data.hourly.wind_speed_10m);
  verifyHourlyArray("wind_direction_10m", data.hourly.wind_direction_10m);
  verifyHourlyArray("weather_code", data.hourly.weather_code);
  verifyHourlyArray("uv_index", data.hourly.uv_index);

  // Validate current fields
  const c = data.current;
  const requiredCurrent = [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation",
    "rain",
    "wind_speed_10m",
    "wind_direction_10m",
    "weather_code",
    "time",
  ] as const;
  for (const field of requiredCurrent) {
    const value = (c as any)[field];
    if (field !== "time" && (typeof value !== "number" || !Number.isFinite(value))) {
      throw new Error(`Invalid current field '${field}': not a finite number`);
    }
    if (field === "time" && typeof value !== "string") {
      throw new Error("Invalid current field 'time': not a string");
    }
  }

  // UV index for current hour
  const hourPrefix = c.time.slice(0, 13); // e.g. "2026-11-22T14"
  const timeIdx = data.hourly.time.findIndex((t) => t.startsWith(hourPrefix));
  if (timeIdx === -1) {
    throw new Error("Current timestamp not found in hourly.time series – cannot determine UV index");
  }
  const uvIndexCurrent = data.hourly.uv_index![timeIdx];
  if (typeof uvIndexCurrent !== "number" || !Number.isFinite(uvIndexCurrent)) {
    throw new Error("UV index for current hour is missing or not a finite number");
  }

  // Verify daily arrays
  const dailyLen = data.daily.time.length;
  const verifyDailyArray = (name: string, arr?: any[]) => {
    if (!Array.isArray(arr)) {
      throw new Error(`Missing required daily array '${name}'`);
    }
    if (arr.length !== dailyLen) {
      throw new Error(`Length mismatch for daily array '${name}': expected ${dailyLen}, got ${arr.length}`);
    }
  };
  verifyDailyArray("temperature_2m_max", data.daily.temperature_2m_max);
  verifyDailyArray("temperature_2m_min", data.daily.temperature_2m_min);
  verifyDailyArray("precipitation_sum", data.daily.precipitation_sum);
  verifyDailyArray("wind_speed_10m_max", data.daily.wind_speed_10m_max);
  verifyDailyArray("uv_index_max", data.daily.uv_index_max);

  // Normalization
  const normalized: NormalizedWeather = {
    location: { latitude: data.latitude, longitude: data.longitude },
    timezone: data.timezone,
    current: {
      temperature: c.temperature_2m,
      relativeHumidity: c.relative_humidity_2m,
      apparentTemperature: c.apparent_temperature,
      precipitation: c.precipitation,
      rain: c.rain,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      weatherCode: c.weather_code,
      uvIndex: uvIndexCurrent,
      time: c.time,
    },
    hourly: {
      time: data.hourly.time,
      temperature: data.hourly.temperature_2m!,
      relativeHumidity: data.hourly.relative_humidity_2m!,
      apparentTemperature: data.hourly.apparent_temperature!,
      precipitation: data.hourly.precipitation!,
      precipitationProbability: data.hourly.precipitation_probability!,
      rain: data.hourly.rain!,
      windSpeed: data.hourly.wind_speed_10m!,
      windDirection: data.hourly.wind_direction_10m!,
      weatherCode: data.hourly.weather_code!,
      uvIndex: data.hourly.uv_index!,
    },
    daily: {
      time: data.daily.time,
      temperatureMax: data.daily.temperature_2m_max!,
      temperatureMin: data.daily.temperature_2m_min!,
      precipitationSum: data.daily.precipitation_sum!,
      windSpeedMax: data.daily.wind_speed_10m_max!,
      uvIndexMax: data.daily.uv_index_max!,
    },
  };

  return normalized;
}

// ---------------------------------------------------------------------
/**
 * Fetch official Sri Lanka weather alerts from the Department of Meteorology CAP/RSS feed.
 * Returns an array of NormalizedWeatherAlert objects. An empty RSS feed yields []
 */
export async function fetchWeatherAlerts(
  opts?: { timeoutMs?: number }
): Promise<NormalizedWeatherAlert[]> {
  const rssUrl = "https://was.meteo.gov.lk/cap/en/rss.xml";
  const timeoutMs = opts?.timeoutMs ?? 10_000;

  // Fetch RSS with timeout and redirect protection. Keep the timeout active until the full response body is read.
  const rssCtrl = new AbortController();
  const rssTimeout = setTimeout(() => rssCtrl.abort(), timeoutMs);
  let rssResp: Response;
  let rssText: string = "";
  try {
    rssResp = await fetch(rssUrl, { signal: rssCtrl.signal, redirect: "error" });
    rssText = await rssResp.text();
  } catch (e) {
    if ((e as any).name === "AbortError") {
      throw new Error(`Weather alerts request timed out after ${timeoutMs}\u00A0ms`);
    }
    throw new Error(`Network error while fetching alerts RSS: ${(e as Error).message}`);
  } finally {
    // Ensure timeout cleared after reading the response body (or on error)
    clearTimeout(rssTimeout);
  }

  if (!rssResp.ok) {
    // rssText already contains the response body (or empty string on failure to read)
    throw new Error(`Weather alerts RSS responded with ${rssResp.status} ${rssResp.statusText}: ${rssText}`);
  }

  // rssText now holds the successful response body
  const { XMLParser } = await import("fast-xml-parser");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true,
  });
  let rssObj: any;
  try {
    rssObj = parser.parse(rssText);
  } catch (e) {
    throw new Error(`Failed to parse alerts RSS XML: ${(e as Error).message}`);
  }

  const items = rssObj?.rss?.channel?.item;
  if (!items) {
    return [];
  }
  const itemArray = Array.isArray(items) ? items : [items];

  const alerts: NormalizedWeatherAlert[] = [];

  for (const item of itemArray) {
    const link = item?.link;
    if (typeof link !== "string" || !link) {
      throw new Error("RSS item missing valid <link> element");
    }

    // URL validation
    let urlObj: URL;
    try {
      urlObj = new URL(link);
    } catch {
      throw new Error(`Invalid URL in RSS item: ${link}`);
    }
    if (urlObj.protocol !== "https:") {
      throw new Error(`Alert URL must use HTTPS: ${link}`);
    }
    if (urlObj.hostname !== "was.meteo.gov.lk") {
      throw new Error(`Alert URL hostname must be was.meteo.gov.lk: ${link}`);
    }
    if (urlObj.port && urlObj.port !== "443") {
      throw new Error(`Alert URL must use default HTTPS port (443): ${link}`);
    }
    if (urlObj.username || urlObj.password) {
      throw new Error(`Alert URL must not contain user credentials: ${link}`);
    }

    // Fetch CAP XML with timeout and redirect protection
    const capCtrl = new AbortController();
    const capTimeout = setTimeout(() => capCtrl.abort(), timeoutMs);
    let capResp: Response;
    let capText: string = "";
    try {
      capResp = await fetch(urlObj.toString(), { signal: capCtrl.signal, redirect: "error" });
      // Read response body (both success and error cases) before clearing timeout
      capText = await capResp.text();
    } catch (e) {
      if ((e as any).name === "AbortError") {
        throw new Error(`CAP request to ${urlObj} timed out after ${timeoutMs}\u00A0ms`);
      }
      throw new Error(`Network error while fetching CAP ${urlObj}: ${(e as Error).message}`);
    } finally {
      // Ensure timeout cleared after body has been fully read
      clearTimeout(capTimeout);
    }

    if (!capResp.ok) {
      // capText already contains the response body (or empty string if reading failed)
      throw new Error(`CAP fetch error ${capResp.status} ${capResp.statusText} for ${urlObj}: ${capText}`);
    }

    const capXml = capText;
    let capObj: any;
    try {
      capObj = parser.parse(capXml);
    } catch (e) {
      throw new Error(`Failed to parse CAP XML from ${urlObj}: ${(e as Error).message}`);
    }

    const alert = capObj?.alert;
    if (!alert) {
      throw new Error(`CAP document missing <alert> root element: ${urlObj}`);
    }

    const identifier = alert?.identifier;
    const sender = alert?.sender;
    const sent = alert?.sent;

    const infos = alert?.info
      ? Array.isArray(alert.info)
        ? alert.info
        : [alert.info]
      : [];
    const infoEn = infos.find((i: any) => {
      const lang = i?.language?.toLowerCase?.();
      return lang === "en" || lang === "en-us" || lang === "english";
    }) || infos[0];

    if (!infoEn) {
      throw new Error(`CAP alert missing <info> block: ${urlObj}`);
    }

    const title = infoEn?.headline;
    const description = infoEn?.description;
    const severity = infoEn?.severity;
    const urgency = infoEn?.urgency;
    const certainty = infoEn?.certainty;
    const event = infoEn?.event;
    const effective = infoEn?.effective;
    const expires = infoEn?.expires;

    const areas = infoEn?.area
      ? Array.isArray(infoEn.area)
        ? infoEn.area
        : [infoEn.area]
      : [];
    const areaDesc = areas
      .map((a: any) => a?.areaDesc || a?.polygon || a?.circle)
      .filter(Boolean)
      .join(", ");

    alerts.push({
      identifier,
      title,
      description,
      severity,
      urgency,
      certainty,
      event,
      area: areaDesc || undefined,
      effective,
      expires,
      sender,
      sent,
      sourceUrl: urlObj.toString(),
    });
  }

  return alerts;
}

// Export a default object for convenient import elsewhere
export default { fetchWeather, fetchWeatherAlerts };