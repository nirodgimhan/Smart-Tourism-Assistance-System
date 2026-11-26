import type { NormalizedWeather } from "../integrations/weather.provider.js";
import {
  InvalidNumericError,
  InvalidTemperatureError,
  InvalidTemperatureRangeError,
  InvalidPrecipitationProbabilityError,
  InvalidHumidityError,
  InvalidWindError,
  InvalidUVError,
  InvalidPrecipitationSumError,
  UnsupportedTimezoneTransitionError,
  NoDataError,
  InvalidRequestError,
  InvalidTimestampError,
} from "../errors/vsi.errors.js";

/**
 * Types for VSI requests and responses.
 */
export interface HourlyVsiRequest {
  /** ISOâ€‘8601 timestamp with explicit offset */
  requestedStart: string;
  /** ISOâ€‘8601 timestamp with explicit offset */
  requestedEnd: string;
}

export interface DailyVsiRequest {
  /** Inclusive start date "YYYYâ€‘MMâ€‘DD" */
  startDate: string;
  /** Inclusive end date "YYYYâ€‘MMâ€‘DD" */
  endDate: string;
}

export interface VsiResult {
  vsiScore: number | null;
  rating: 'Excellent' | 'Good' | 'Moderate' | 'Poor' | null;
  dataCoverageStatus: 'complete' | 'partial' | 'insufficient';
  hourlyCoverage: number | null; // null in daily mode
  dailyCoverage: number | null; // null in hourly mode
  factorCoverage: {
    temperature: number;
    rainfall: number;
    humidity: number; // 0 in daily mode
    wind: number;
    uv: number;
  };
  missingFactors: string[]; // list of factor keys that are completely missing
  effectiveFactors: {
    temperature: number | null;
    rainfall: number | null;
    humidity: number | null; // null in daily mode
    wind: number | null;
    uv: number | null;
  };
}

/** Provisional weights â€“ kept as constants */
const WEIGHTS = {
  temperature: 0.3,
  rainfall: 0.25,
  humidity: 0.15,
  wind: 0.2,
  uv: 0.1,
};

/** Rating thresholds (provisional) */
const RATING_THRESHOLDS = {
  excellent: 85,
  good: 70,
  moderate: 45,
};

/** Validate ISO-8601 timestamp and return its UTC offset in seconds. */
function parseOffsetSeconds(timestamp: string): number {
  const match = timestamp.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|([+-])(\d{2}):(\d{2}))$/
  );

  if (!match) {
    throw new InvalidTimestampError("Timestamp must be ISO-8601 with an explicit UTC offset");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] === undefined ? 0 : Number(match[6]);

  if (month < 1 || month > 12) {
    throw new InvalidTimestampError("Timestamp contains an invalid date or time");
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (
    day < 1 || day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    throw new InvalidTimestampError("Timestamp contains an invalid date or time");
  }

  if (match[7] === "Z") return 0;

  const sign = match[8] === "+" ? 1 : -1;
  const offsetHours = Number(match[9]);
  const offsetMinutes = Number(match[10]);

  if (offsetHours > 23 || offsetMinutes > 59) {
    throw new InvalidTimestampError("Timestamp contains an invalid UTC offset");
  }

  const offsetSeconds = sign * (offsetHours * 3600 + offsetMinutes * 60);
  return offsetSeconds === 0 ? 0 : offsetSeconds;
}

/** Validate strict YYYY-MM-DD calendar date (no rollover) and return UTC midnight Date. */
function parseCalendarDate(dateStr: string, errorCtor: new (msg: string) => Error, label: string): Date {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new errorCtor(`${label} must be a valid YYYY-MM-DD date`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) {
    throw new errorCtor(`${label} contains an invalid calendar month`);
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) {
    throw new errorCtor(`${label} contains an invalid calendar day`);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

/** Convert a validated ISO-8601 timestamp to epoch milliseconds. */
function isoToUtcMs(ts: string): number {
  parseOffsetSeconds(ts);

  const milliseconds = new Date(ts).getTime();

  if (!Number.isFinite(milliseconds)) {
    throw new InvalidTimestampError("Timestamp cannot be converted to a valid date");
  }

  return milliseconds;
}

/** Scoring formulas – each returns a score 0–100 */
function scoreTemperature(t: number): number {
  if (t <= 10) return 0;
  if (t < 22) return (100 * (t - 10)) / (22 - 10);
  if (t <= 30) return 100;
  if (t < 38) return (100 * (38 - t)) / (38 - 30);
  return 0;
}

function scoreRainfallProbability(p: number): number {
  if (p <= 20) return 100;
  if (p <= 50) return 100 - ((p - 20) / 30) * 70;
  // p > 50 up to 100
  return 30 - ((p - 50) / 50) * 30;
}

function scoreHumidity(h: number): number {
  if (h <= 20) return 0;
  if (h < 40) return (100 * (h - 20)) / (40 - 20);
  if (h <= 70) return 100;
  if (h < 90) return (100 * (90 - h)) / (90 - 70);
  return 0;
}

function scoreWind(w: number): number {
  if (w <= 5) return 100;
  if (w <= 15) return 100 - ((w - 5) / 10) * 70;
  if (w <= 30) return 30 - ((w - 15) / 15) * 30;
  return 0;
}

function scoreUV(u: number): number {
  if (u <= 2) return 100;
  if (u <= 5) return 100 - ((u - 2) / 3) * 70;
  if (u <= 11) return 30 - ((u - 5) / 6) * 30;
  return 0;
}

/** Main VSI service class */
export class VsiService {
  /** Hourly VSI calculation */
  static calculateHourlyVsi(weather: NormalizedWeather, req: HourlyVsiRequest): VsiResult {
    // Validate request timestamps separately from provider timestamps.
    let startMs: number;
    let endMs: number;

    try {
      parseOffsetSeconds(req.requestedStart);
      parseOffsetSeconds(req.requestedEnd);
      startMs = isoToUtcMs(req.requestedStart);
      endMs = isoToUtcMs(req.requestedEnd);
    } catch {
      throw new InvalidRequestError("Request timestamps must be valid ISO-8601 timestamps with explicit UTC offsets");
    }

    if (startMs >= endMs) {
      throw new InvalidRequestError("Request start must be earlier than request end");
    }

    // Deduplicate timestamps while preserving first index
    const uniqIndices: number[] = [];
    const seen = new Set<string>();
    const timestamps = weather.hourly.time;
    timestamps.forEach((t, idx) => {
      if (!seen.has(t)) {
        seen.add(t);
        uniqIndices.push(idx);
      }
    });

    // Extract deduped arrays
    const dedup = <T>(arr: T[]): T[] => uniqIndices.map(i => arr[i]);
    const timeArr = dedup(weather.hourly.time);
    const tempArr = dedup(weather.hourly.temperature);
    const precipProbArr = dedup(weather.hourly.precipitationProbability);
    const humidityArr = dedup(weather.hourly.relativeHumidity);
    const windArr = dedup(weather.hourly.windSpeed);
    const uvArr = dedup(weather.hourly.uvIndex);

    // Select only hourly slots overlapping the requested time window.
    const slotOverlaps = (slotStart: number, slotEnd: number) =>
      slotStart < endMs && slotEnd > startMs;

    const selectedIndices: number[] = [];

    for (let i = 0; i < timeArr.length; i++) {
      const slotStart = isoToUtcMs(timeArr[i]);
      if (slotOverlaps(slotStart, slotStart + 3600_000)) {
        selectedIndices.push(i);
      }
    }

    // No selected provider timestamps: return an insufficient result.
    if (selectedIndices.length === 0) {
      return {
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
    }

    // Check UTC offset consistency only among selected timestamps.
    const firstOffset = parseOffsetSeconds(timeArr[selectedIndices[0]]);

    for (const index of selectedIndices) {
      const offset = parseOffsetSeconds(timeArr[index]);

      if (offset !== firstOffset) {
        throw new UnsupportedTimezoneTransitionError(
          "Selected hourly timestamps contain differing UTC offsets"
        );
      }
    }

    // Build expected slot grid (phaseâ€‘aligned)
    const phase = ((firstOffset % 3600) + 3600) % 3600; // positive modulo
    const floorToPhase = (ms: number) => {
      const date = new Date(ms);
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();
      const msSinceHour = (minutes * 60 + seconds) * 1000 + date.getUTCMilliseconds();
      const remainder = (msSinceHour - phase * 1000 + 3600_000) % 3600_000;
      return ms - remainder;
    };
    const ceilToPhase = (ms: number) => {
      const floored = floorToPhase(ms);
      return floored === ms ? ms : floored + 3600_000;
    };
    const expectedStartMs = floorToPhase(startMs);
    const expectedEndMs = ceilToPhase(endMs);

    const expectedSlotCount = Math.max(
      0,
      Math.round((expectedEndMs - expectedStartMs) / 3600_000)
    );

    // Iterate over deduped timestamps, collect valid factor values per slot
    const validSlotIndices = new Set<number>();
    const factorSlots = {
      temperature: new Set<number>(),
      rainfall: new Set<number>(),
      humidity: new Set<number>(),
      wind: new Set<number>(),
      uv: new Set<number>(),
    };
    const factorScores: {
      temperature: number[];
      rainfall: number[]; // we will store probability values for later max
      humidity: number[];
      wind: number[];
      uv: number[];
    } = {
      temperature: [],
      rainfall: [],
      humidity: [],
      wind: [],
      uv: [],
    };


    for (const i of selectedIndices) {
      const slotStart = isoToUtcMs(timeArr[i]);
      const slotIndex = Math.floor((slotStart - expectedStartMs) / 3600_000);

      if (slotIndex < 0 || slotIndex >= expectedSlotCount) continue;

      validSlotIndices.add(slotIndex);

      // Temperature validation
      const tempVal = tempArr[i];
      if (tempVal !== null && tempVal !== undefined) {
        if (!Number.isFinite(tempVal)) throw new InvalidNumericError('hourly.temperature');
        if (tempVal < -30 || tempVal > 60) throw new InvalidTemperatureError('hourly.temperature');
        factorSlots.temperature.add(slotIndex);
        factorScores.temperature.push(scoreTemperature(tempVal));
      }

      // Rainfall probability validation
      const prob = precipProbArr[i];
      if (prob !== null && prob !== undefined) {
        if (!Number.isFinite(prob)) throw new InvalidNumericError('hourly.precipitationProbability');
        if (prob < 0 || prob > 100) throw new InvalidPrecipitationProbabilityError('hourly.precipitationProbability');
        factorSlots.rainfall.add(slotIndex);
        factorScores.rainfall.push(prob); // store raw probability for later max
      }

      // Humidity
      const hum = humidityArr[i];
      if (hum !== null && hum !== undefined) {
        if (!Number.isFinite(hum)) throw new InvalidNumericError('hourly.relativeHumidity');
        if (hum < 0 || hum > 100) throw new InvalidHumidityError('hourly.relativeHumidity');
        factorSlots.humidity.add(slotIndex);
        factorScores.humidity.push(scoreHumidity(hum));
      }

      // Wind
      const wind = windArr[i];
      if (wind !== null && wind !== undefined) {
        if (!Number.isFinite(wind)) throw new InvalidNumericError('hourly.windSpeed');
        if (wind < 0) throw new InvalidWindError('hourly.windSpeed');
        factorSlots.wind.add(slotIndex);
        factorScores.wind.push(scoreWind(wind));
      }

      // UV
      const uv = uvArr[i];
      if (uv !== null && uv !== undefined) {
        if (!Number.isFinite(uv)) throw new InvalidNumericError('hourly.uvIndex');
        if (uv < 0) throw new InvalidUVError('hourly.uvIndex');
        factorSlots.uv.add(slotIndex);
        factorScores.uv.push(scoreUV(uv));
      }
    }

    // Coverage calculations
    const hourlyCoverage = expectedSlotCount === 0 ? 0 : (validSlotIndices.size / expectedSlotCount) * 100;
    const factorCoverage = {
      temperature: expectedSlotCount === 0 ? 0 : (factorSlots.temperature.size / expectedSlotCount) * 100,
      rainfall: expectedSlotCount === 0 ? 0 : (factorSlots.rainfall.size / expectedSlotCount) * 100,
      humidity: expectedSlotCount === 0 ? 0 : (factorSlots.humidity.size / expectedSlotCount) * 100,
      wind: expectedSlotCount === 0 ? 0 : (factorSlots.wind.size / expectedSlotCount) * 100,
      uv: expectedSlotCount === 0 ? 0 : (factorSlots.uv.size / expectedSlotCount) * 100,
    };

    // Aggregate factor scores according to spec
    const effectiveFactors: VsiResult['effectiveFactors'] = {
      temperature: null,
      rainfall: null,
      humidity: null,
      wind: null,
      uv: null,
    };
    const availableWeights: Record<string, number> = {};
    const missingFactors: string[] = [];

    // Temperature
    if (factorScores.temperature.length > 0) {
      const avg = factorScores.temperature.reduce((a, b) => a + b, 0) / factorScores.temperature.length;
      effectiveFactors.temperature = avg;
      availableWeights.temperature = WEIGHTS.temperature;
    } else {
      missingFactors.push('temperature');
    }
    // Rainfall â€“ use max probability then score
    if (factorScores.rainfall.length > 0) {
      const maxProb = Math.max(...factorScores.rainfall);
      effectiveFactors.rainfall = scoreRainfallProbability(maxProb);
      availableWeights.rainfall = WEIGHTS.rainfall;
    } else {
      missingFactors.push('rainfall');
    }
    // Humidity
    if (factorScores.humidity.length > 0) {
      const avg = factorScores.humidity.reduce((a, b) => a + b, 0) / factorScores.humidity.length;
      effectiveFactors.humidity = avg;
      availableWeights.humidity = WEIGHTS.humidity;
    } else {
      missingFactors.push('humidity');
    }
    // Wind
    if (factorScores.wind.length > 0) {
      const avg = factorScores.wind.reduce((a, b) => a + b, 0) / factorScores.wind.length;
      effectiveFactors.wind = avg;
      availableWeights.wind = WEIGHTS.wind;
    } else {
      missingFactors.push('wind');
    }
    // UV
    if (factorScores.uv.length > 0) {
      const avg = factorScores.uv.reduce((a, b) => a + b, 0) / factorScores.uv.length;
      effectiveFactors.uv = avg;
      availableWeights.uv = WEIGHTS.uv;
    } else {
      missingFactors.push('uv');
    }

    // Determine if any scoring factor is available
    const anyFactorAvailable = Object.keys(availableWeights).length > 0;
    let vsiScore: number | null = null;
    let rating: VsiResult['rating'] = null;
    let dataCoverageStatus: VsiResult['dataCoverageStatus'] = 'insufficient';

    if (anyFactorAvailable) {
      // Renormalise weights
      const weightSum = Object.values(availableWeights).reduce<number>((a, b) => a + b, 0);
      const normalized = Object.fromEntries(
        Object.entries(availableWeights).map(([k, w]) => [k, w / weightSum])
      );
      // Compute weighted sum and round consistently with daily mode
      const rawScore =
        (effectiveFactors.temperature ?? 0) * (normalized.temperature ?? 0) +
        (effectiveFactors.rainfall ?? 0) * (normalized.rainfall ?? 0) +
        (effectiveFactors.humidity ?? 0) * (normalized.humidity ?? 0) +
        (effectiveFactors.wind ?? 0) * (normalized.wind ?? 0) +
        (effectiveFactors.uv ?? 0) * (normalized.uv ?? 0);
      vsiScore = Number(rawScore.toFixed(2));
      // Rating evaluated against returned score
      if (vsiScore >= RATING_THRESHOLDS.excellent) rating = 'Excellent';
      else if (vsiScore >= RATING_THRESHOLDS.good) rating = 'Good';
      else if (vsiScore >= RATING_THRESHOLDS.moderate) rating = 'Moderate';
      else rating = 'Poor';

      // Determine coverage status
      if (
        hourlyCoverage === 100 &&
        factorCoverage.temperature === 100 &&
        factorCoverage.rainfall === 100 &&
        factorCoverage.humidity === 100 &&
        factorCoverage.wind === 100 &&
        factorCoverage.uv === 100
      ) {
        dataCoverageStatus = 'complete';
      } else {
        dataCoverageStatus = 'partial';
      }
    } else {
      // No factors -> per spec
      vsiScore = null;
      rating = null;
      dataCoverageStatus = 'insufficient';
    }

    return {
      vsiScore,
      rating,
      dataCoverageStatus,
      hourlyCoverage: Number(hourlyCoverage.toFixed(2)),
      dailyCoverage: null,
      factorCoverage: {
        temperature: Number(factorCoverage.temperature.toFixed(2)),
        rainfall: Number(factorCoverage.rainfall.toFixed(2)),
        humidity: Number(factorCoverage.humidity.toFixed(2)),
        wind: Number(factorCoverage.wind.toFixed(2)),
        uv: Number(factorCoverage.uv.toFixed(2)),
      },
      missingFactors,
      effectiveFactors: {
        temperature: effectiveFactors.temperature !== null ? Number(effectiveFactors.temperature.toFixed(2)) : null,
        rainfall: effectiveFactors.rainfall !== null ? Number(effectiveFactors.rainfall.toFixed(2)) : null,
        humidity: effectiveFactors.humidity !== null ? Number(effectiveFactors.humidity.toFixed(2)) : null,
        wind: effectiveFactors.wind !== null ? Number(effectiveFactors.wind.toFixed(2)) : null,
        uv: effectiveFactors.uv !== null ? Number(effectiveFactors.uv.toFixed(2)) : null,
      },
    };
  }

  /** Daily VSI calculation */
  static calculateDailyVsi(weather: NormalizedWeather, req: DailyVsiRequest): VsiResult {
    // Strictly validate YYYY-MM-DD calendar dates (no JS rollover)
    const start = parseCalendarDate(req.startDate, InvalidRequestError, 'startDate');
    const end = parseCalendarDate(req.endDate, InvalidRequestError, 'endDate');
    if (start > end) {
      throw new InvalidRequestError('startDate must be earlier than or equal to endDate');
    }

    // Validate provider daily dates strictly
    for (const d of weather.daily.time) {
      parseCalendarDate(d, InvalidTimestampError, 'daily.time');
    }

    // Deduplicate daily dates (keep first index)
    const uniqIndices: number[] = [];
    const seen = new Set<string>();
    weather.daily.time.forEach((d, idx) => {
      if (!seen.has(d)) {
        seen.add(d);
        uniqIndices.push(idx);
      }
    });
    const dedup = <T>(arr: T[]): T[] => uniqIndices.map(i => arr[i]);
    const dateArr = dedup(weather.daily.time);
    const tMinArr = dedup(weather.daily.temperatureMin);
    const tMaxArr = dedup(weather.daily.temperatureMax);
    const precipArr = dedup(weather.daily.precipitationSum);
    const windArr = dedup(weather.daily.windSpeedMax);
    const uvArr = dedup(weather.daily.uvIndexMax);

    // Build list of requested dates (inclusive)
    const requestedDates: string[] = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      requestedDates.push(iso);
    }

    // Map dates to indices in provider data (if present)
    const dateToIdx: Record<string, number> = {};
    dateArr.forEach((d, i) => {
      dateToIdx[d] = i;
    });

    // No data case
    const anyRequestedPresent = requestedDates.some(d => d in dateToIdx);
    if (!anyRequestedPresent) {
      throw new NoDataError('No requested dates present in provider data');
    }

    const totalDays = requestedDates.length;

    // Helper to count presence per factor
    const factorPresence = {
      temperature: 0,
      rainfall: 0,
      wind: 0,
      uv: 0,
    };
    const dailyTempScores: number[] = [];
    const precipitationProbs: number[] = [];
    const windScores: number[] = [];
    const uvScores: number[] = [];

    for (const date of requestedDates) {
      const idx = dateToIdx[date];
      if (idx === undefined) {
        // missing date â€“ counts in denominator only
        continue;
      }
      // Temperature validation: validate each present value independently
      const tMin = tMinArr[idx];
      const tMax = tMaxArr[idx];
      const hasMin = tMin !== null && tMin !== undefined;
      const hasMax = tMax !== null && tMax !== undefined;
      if (hasMin) {
        if (!Number.isFinite(tMin)) {
          throw new InvalidNumericError('daily.temperatureMin');
        }
        if (tMin < -30 || tMin > 60) {
          throw new InvalidTemperatureError('daily.temperatureMin');
        }
      }
      if (hasMax) {
        if (!Number.isFinite(tMax)) {
          throw new InvalidNumericError('daily.temperatureMax');
        }
        if (tMax < -30 || tMax > 60) {
          throw new InvalidTemperatureError('daily.temperatureMax');
        }
      }
      if (hasMin && hasMax) {
        if (tMin > tMax) {
          throw new InvalidTemperatureRangeError('daily.temperatureMin > temperatureMax');
        }
        const midpoint = (tMin + tMax) / 2;
        dailyTempScores.push(scoreTemperature(midpoint));
        factorPresence.temperature++;
      }
      // Rainfall
      const precip = precipArr[idx];
      if (precip !== null && precip !== undefined) {
        if (!Number.isFinite(precip)) throw new InvalidNumericError('daily.precipitationSum');
        if (precip < 0) throw new InvalidPrecipitationSumError('daily.precipitationSum');
        const prob = precip === 0 ? 0 : 60; // provisional mapping
        precipitationProbs.push(prob);
        factorPresence.rainfall++;
      }
      // Wind
      const wind = windArr[idx];
      if (wind !== null && wind !== undefined) {
        if (!Number.isFinite(wind)) throw new InvalidNumericError('daily.windSpeedMax');
        if (wind < 0) throw new InvalidWindError('daily.windSpeedMax');
        windScores.push(scoreWind(wind));
        factorPresence.wind++;
      }
      // UV
      const uv = uvArr[idx];
      if (uv !== null && uv !== undefined) {
        if (!Number.isFinite(uv)) throw new InvalidNumericError('daily.uvIndexMax');
        if (uv < 0) throw new InvalidUVError('daily.uvIndexMax');
        uvScores.push(scoreUV(uv));
        factorPresence.uv++;
      }
    }

    // Coverage calculations
    let daysWithAssessable = 0;
    for (const date of requestedDates) {
      const idx = dateToIdx[date];
      if (idx === undefined) continue;
      const hasTemp = tMinArr[idx] != null && tMaxArr[idx] != null;
      const hasRain = precipArr[idx] != null;
      const hasWind = windArr[idx] != null;
      const hasUV = uvArr[idx] != null;
      if (hasTemp || hasRain || hasWind || hasUV) daysWithAssessable++;
    }
    const dailyCoverage = (daysWithAssessable / totalDays) * 100;

    const factorCoverage = {
      temperature: totalDays === 0 ? 0 : (factorPresence.temperature / totalDays) * 100,
      rainfall: totalDays === 0 ? 0 : (factorPresence.rainfall / totalDays) * 100,
      humidity: 0,
      wind: totalDays === 0 ? 0 : (factorPresence.wind / totalDays) * 100,
      uv: totalDays === 0 ? 0 : (factorPresence.uv / totalDays) * 100,
    };

    // Aggregate factor scores
    const effectiveFactors: VsiResult['effectiveFactors'] = {
      temperature: null,
      rainfall: null,
      humidity: null,
      wind: null,
      uv: null,
    };
    const availableWeights: Record<string, number> = {};
    const missingFactors: string[] = [];

    if (dailyTempScores.length > 0) {
      const avg = dailyTempScores.reduce((a, b) => a + b, 0) / dailyTempScores.length;
      effectiveFactors.temperature = avg;
      availableWeights.temperature = WEIGHTS.temperature;
    } else missingFactors.push('temperature');

    if (precipitationProbs.length > 0) {
      const maxProb = Math.max(...precipitationProbs);
      effectiveFactors.rainfall = scoreRainfallProbability(maxProb);
      availableWeights.rainfall = WEIGHTS.rainfall;
    } else missingFactors.push('rainfall');

    // Humidity unavailable in daily mode â€“ keep null and do not list as missing
    effectiveFactors.humidity = null;
    // Wind
    if (windScores.length > 0) {
      const avg = windScores.reduce((a, b) => a + b, 0) / windScores.length;
      effectiveFactors.wind = avg;
      availableWeights.wind = WEIGHTS.wind;
    } else missingFactors.push('wind');
    // UV
    if (uvScores.length > 0) {
      const avg = uvScores.reduce((a, b) => a + b, 0) / uvScores.length;
      effectiveFactors.uv = avg;
      availableWeights.uv = WEIGHTS.uv;
    } else missingFactors.push('uv');

    const anyFactorAvailable = Object.keys(availableWeights).length > 0;
    let vsiScore: number | null = null;
    let rating: VsiResult['rating'] = null;
    let dataCoverageStatus: VsiResult['dataCoverageStatus'] = 'insufficient';

    if (anyFactorAvailable) {
      const weightSum = Object.values(availableWeights).reduce<number>((a, b) => a + b, 0);
      const norm = Object.fromEntries(
        Object.entries(availableWeights).map(([k, w]) => [k, w / weightSum])
      );
      const rawScore =
        (effectiveFactors.temperature ?? 0) * (norm.temperature ?? 0) +
        (effectiveFactors.rainfall ?? 0) * (norm.rainfall ?? 0) +
        (effectiveFactors.wind ?? 0) * (norm.wind ?? 0) +
        (effectiveFactors.uv ?? 0) * (norm.uv ?? 0);
      vsiScore = Number(rawScore.toFixed(2));

      if (vsiScore >= RATING_THRESHOLDS.excellent) rating = 'Excellent';
      else if (vsiScore >= RATING_THRESHOLDS.good) rating = 'Good';
      else if (vsiScore >= RATING_THRESHOLDS.moderate) rating = 'Moderate';
      else rating = 'Poor';

      dataCoverageStatus = dailyCoverage === 100 ? 'partial' : 'insufficient';
    } else {
      vsiScore = null;
      rating = null;
      dataCoverageStatus = 'insufficient';
    }

    return {
      vsiScore: vsiScore !== null ? Number(vsiScore.toFixed(2)) : null,
      rating,
      dataCoverageStatus,
      hourlyCoverage: null,
      dailyCoverage: Number(dailyCoverage.toFixed(2)),
      factorCoverage: {
        temperature: Number(factorCoverage.temperature.toFixed(2)),
        rainfall: Number(factorCoverage.rainfall.toFixed(2)),
        humidity: 0,
        wind: Number(factorCoverage.wind.toFixed(2)),
        uv: Number(factorCoverage.uv.toFixed(2)),
      },
      missingFactors,
      effectiveFactors: {
        temperature: effectiveFactors.temperature !== null ? Number(effectiveFactors.temperature.toFixed(2)) : null,
        rainfall: effectiveFactors.rainfall !== null ? Number(effectiveFactors.rainfall.toFixed(2)) : null,
        humidity: null,
        wind: effectiveFactors.wind !== null ? Number(effectiveFactors.wind.toFixed(2)) : null,
        uv: effectiveFactors.uv !== null ? Number(effectiveFactors.uv.toFixed(2)) : null,
      },
    };
  }
}

export default VsiService;









