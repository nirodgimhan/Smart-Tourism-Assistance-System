import { describe, it, expect } from "vitest";
import type { NormalizedWeather } from "../integrations/weather.provider.js";
import { VsiService } from "../services/vsi.service.js";
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

function createBaseWeather(overrides?: {
  hourly?: Partial<NormalizedWeather["hourly"]>;
  daily?: Partial<NormalizedWeather["daily"]>;
  timezone?: string;
}): NormalizedWeather {
  return {
    location: { latitude: 6.9271, longitude: 79.8612 },
    timezone: overrides?.timezone ?? "Asia/Colombo",
    current: {
      temperature: 26,
      relativeHumidity: 55,
      apparentTemperature: 27,
      precipitation: 0,
      rain: 0,
      windSpeed: 5,
      windDirection: 180,
      weatherCode: 0,
      uvIndex: 2,
      time: "2026-03-01T09:00:00+05:30",
    },
    hourly: {
      time: [
        "2026-03-01T09:00:00+05:30",
        "2026-03-01T10:00:00+05:30",
      ],
      temperature: [26, 26],
      relativeHumidity: [55, 55],
      apparentTemperature: [27, 27],
      precipitation: [0, 0],
      precipitationProbability: [10, 10],
      rain: [0, 0],
      windSpeed: [5, 5],
      windDirection: [180, 180],
      weatherCode: [0, 0],
      uvIndex: [2, 2],
      ...overrides?.hourly,
    },
    daily: {
      time: ["2026-03-01", "2026-03-02"],
      temperatureMin: [22, 22],
      temperatureMax: [30, 30],
      precipitationSum: [0, 0],
      windSpeedMax: [5, 5],
      uvIndexMax: [2, 2],
      ...overrides?.daily,
    },
  };
}

describe("VsiService - Hourly VSI", () => {
  it("calculates normal hourly VSI with 100% coverage and Excellent rating", () => {
    const weather = createBaseWeather();
    const result = VsiService.calculateHourlyVsi(weather, {
      requestedStart: "2026-03-01T09:00:00+05:30",
      requestedEnd: "2026-03-01T11:00:00+05:30",
    });

    expect(result.vsiScore).toBe(100);
    expect(result.rating).toBe("Excellent");
    expect(result.dataCoverageStatus).toBe("complete");
    expect(result.hourlyCoverage).toBe(100);
    expect(result.dailyCoverage).toBeNull();
    expect(result.missingFactors).toEqual([]);
    expect(result.factorCoverage).toEqual({
      temperature: 100,
      rainfall: 100,
      humidity: 100,
      wind: 100,
      uv: 100,
    });
    expect(result.effectiveFactors).toEqual({
      temperature: 100,
      rainfall: 100,
      humidity: 100,
      wind: 100,
      uv: 100,
    });
  });

  it("supports all four rating bands (Excellent, Good, Moderate, Poor)", () => {
    // Good (>= 70 and < 85): temp 19 (75), rain 35 (65), hum 35 (75), wind 10 (65), uv 3.5 (65)
    // Weighted: 75*0.3 + 65*0.25 + 75*0.15 + 65*0.2 + 65*0.1 = 22.5 + 16.25 + 11.25 + 13 + 6.5 = 69.5 -> bump temp to 22 (100)
    // Wait: 100*0.3 + 65*0.25 + 75*0.15 + 65*0.2 + 65*0.1 = 30 + 16.25 + 11.25 + 13 + 6.5 = 77 -> Good
    const goodWeather = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00Z"],
        temperature: [22],
        precipitationProbability: [35],
        relativeHumidity: [35],
        windSpeed: [10],
        uvIndex: [3.5],
      },
    });
    const goodRes = VsiService.calculateHourlyVsi(goodWeather, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T10:00:00Z",
    });
    expect(goodRes.vsiScore).toBe(77);
    expect(goodRes.rating).toBe("Good");

    // Moderate (>= 45 and < 70): temp 16 (50), rain 40 (53.33), hum 30 (50), wind 12 (51), uv 4 (53.33)
    const modWeather = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00Z"],
        temperature: [16],
        precipitationProbability: [40],
        relativeHumidity: [30],
        windSpeed: [12],
        uvIndex: [4],
      },
    });
    const modRes = VsiService.calculateHourlyVsi(modWeather, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T10:00:00Z",
    });
    expect(modRes.vsiScore).toBeGreaterThanOrEqual(45);
    expect(modRes.vsiScore).toBeLessThan(70);
    expect(modRes.rating).toBe("Moderate");

    // Poor (< 45)
    const poorWeather = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00Z"],
        temperature: [40],
        precipitationProbability: [90],
        relativeHumidity: [95],
        windSpeed: [35],
        uvIndex: [12],
      },
    });
    const poorRes = VsiService.calculateHourlyVsi(poorWeather, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T10:00:00Z",
    });
    expect(poorRes.vsiScore).toBeLessThan(45);
    expect(poorRes.rating).toBe("Poor");
  });

  it("evaluates formula boundary values accurately", () => {
    const boundaryWeather = createBaseWeather({
      hourly: {
        time: [
          "2026-03-01T09:00:00Z",
          "2026-03-01T10:00:00Z",
        ],
        // temp: 10 (0) and 38 (0) -> avg 0; rain: max(20, 50) = 50 -> 30;
        // hum: 20 (0) and 90 (0) -> avg 0; wind: 15 (30) and 30 (0) -> avg 15; uv: 5 (30) and 11 (0) -> avg 15
        temperature: [10, 38],
        precipitationProbability: [20, 50],
        relativeHumidity: [20, 90],
        windSpeed: [15, 30],
        uvIndex: [5, 11],
      },
    });
    const res = VsiService.calculateHourlyVsi(boundaryWeather, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T11:00:00Z",
    });

    expect(res.effectiveFactors.temperature).toBe(0);
    expect(res.effectiveFactors.rainfall).toBe(30);
    expect(res.effectiveFactors.humidity).toBe(0);
    expect(res.effectiveFactors.wind).toBe(15);
    expect(res.effectiveFactors.uv).toBe(15);
  });

  it("uses max precipitationProbability across selected hourly slots", () => {
    const weather = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00Z", "2026-03-01T10:00:00Z"],
        temperature: [25, 25],
        precipitationProbability: [10, 100],
        relativeHumidity: [50, 50],
        windSpeed: [5, 5],
        uvIndex: [1, 1],
      },
    });
    const res = VsiService.calculateHourlyVsi(weather, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T11:00:00Z",
    });
    expect(res.effectiveFactors.rainfall).toBe(0);
  });

  it("handles missing hourly values, reduces factorCoverage, and renormalises weights", () => {
    const weather = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00Z", "2026-03-01T10:00:00Z"],
        temperature: [25, 25],
        precipitationProbability: [undefined as unknown as number, undefined as unknown as number],
        relativeHumidity: [50, null as unknown as number],
        windSpeed: [5, 5],
        uvIndex: [1, 1],
      },
    });
    const res = VsiService.calculateHourlyVsi(weather, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T11:00:00Z",
    });

    expect(res.hourlyCoverage).toBe(100);
    expect(res.factorCoverage.rainfall).toBe(0);
    expect(res.factorCoverage.humidity).toBe(50);
    expect(res.dataCoverageStatus).toBe("partial");
    expect(res.missingFactors).toEqual(["rainfall"]);
    expect(res.effectiveFactors.rainfall).toBeNull();
    // Remaining weights sum to 0.75, all present scores are 100 -> vsiScore = 100
    expect(res.vsiScore).toBe(100);
  });

  it("deduplicates hourly timestamps preserving first original index", () => {
    const weather = createBaseWeather({
      hourly: {
        time: [
          "2026-03-01T09:00:00Z",
          "2026-03-01T09:00:00Z",
          "2026-03-01T10:00:00Z",
        ],
        temperature: [25, 0, 25],
        precipitationProbability: [0, 100, 0],
        relativeHumidity: [50, 0, 50],
        windSpeed: [5, 50, 5],
        uvIndex: [1, 20, 1],
      },
    });
    const res = VsiService.calculateHourlyVsi(weather, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T11:00:00Z",
    });

    expect(res.vsiScore).toBe(100);
    expect(res.hourlyCoverage).toBe(100);
  });

  it("selects overlapping slots and aligns expected grid to +05:30 phase without extra slot", () => {
    const weather = createBaseWeather({
      hourly: {
        time: ["2026-03-01T08:00:00+05:30"], // 02:30:00Z
        temperature: [25],
        precipitationProbability: [0],
        relativeHumidity: [50],
        windSpeed: [5],
        uvIndex: [1],
      },
    });
    // Request [02:30Z, 03:30Z) is already phase-aligned to +05:30
    const alignedRes = VsiService.calculateHourlyVsi(weather, {
      requestedStart: "2026-03-01T02:30:00Z",
      requestedEnd: "2026-03-01T03:30:00Z",
    });
    expect(alignedRes.hourlyCoverage).toBe(100);
    expect(alignedRes.dataCoverageStatus).toBe("complete");

    // Partial-hour request [03:15Z, 03:20Z) overlaps [02:30Z, 03:30Z)
    const partialRes = VsiService.calculateHourlyVsi(weather, {
      requestedStart: "2026-03-01T03:15:00Z",
      requestedEnd: "2026-03-01T03:20:00Z",
    });
    expect(partialRes.hourlyCoverage).toBe(100);
  });

  it("supports Z, +00:00, +05:30, and -04:00 offsets and treats Z and +00:00 as equivalent", () => {
    const utcMixed = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00Z", "2026-03-01T10:00:00+00:00"],
        temperature: [25, 25],
        precipitationProbability: [0, 0],
        relativeHumidity: [50, 50],
        windSpeed: [5, 5],
        uvIndex: [1, 1],
      },
    });
    const utcRes = VsiService.calculateHourlyVsi(utcMixed, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T11:00:00+00:00",
    });
    expect(utcRes.hourlyCoverage).toBe(100);
    expect(utcRes.vsiScore).toBe(100);

    const negOffset = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00-04:00"],
        temperature: [25],
        precipitationProbability: [0],
        relativeHumidity: [50],
        windSpeed: [5],
        uvIndex: [1],
      },
    });
    const negRes = VsiService.calculateHourlyVsi(negOffset, {
      requestedStart: "2026-03-01T09:00:00-04:00",
      requestedEnd: "2026-03-01T10:00:00-04:00",
    });
    expect(negRes.hourlyCoverage).toBe(100);
    expect(negRes.vsiScore).toBe(100);
  });

  it("throws UnsupportedTimezoneTransitionError when selected hourly timestamps have differing offsets", () => {
    const weather = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00+05:30", "2026-03-01T10:00:00+06:00"],
        temperature: [25, 25],
        precipitationProbability: [0, 0],
        relativeHumidity: [50, 50],
        windSpeed: [5, 5],
        uvIndex: [1, 1],
      },
    });

    expect(() =>
      VsiService.calculateHourlyVsi(weather, {
        requestedStart: "2026-03-01T09:00:00+05:30",
        requestedEnd: "2026-03-01T11:00:00+06:00",
      })
    ).toThrow(UnsupportedTimezoneTransitionError);
  });

  it("does not throw UnsupportedTimezoneTransitionError if differing offset is outside selected window", () => {
    const weather = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00+05:30", "2026-03-01T15:00:00+06:00"],
        temperature: [25, 25],
        precipitationProbability: [0, 0],
        relativeHumidity: [50, 50],
        windSpeed: [5, 5],
        uvIndex: [1, 1],
      },
    });

    const res = VsiService.calculateHourlyVsi(weather, {
      requestedStart: "2026-03-01T09:00:00+05:30",
      requestedEnd: "2026-03-01T10:00:00+05:30",
    });
    expect(res.vsiScore).toBe(100);
  });

  it("returns insufficient output with null vsiScore and rating when no timestamps or factors exist", () => {
    const emptyWeather = createBaseWeather({
      hourly: {
        time: [],
        temperature: [],
        precipitationProbability: [],
        relativeHumidity: [],
        windSpeed: [],
        uvIndex: [],
      },
    });
    const noTsRes = VsiService.calculateHourlyVsi(emptyWeather, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T10:00:00Z",
    });
    expect(noTsRes.vsiScore).toBeNull();
    expect(noTsRes.rating).toBeNull();
    expect(noTsRes.dataCoverageStatus).toBe("insufficient");

    const allNullWeather = createBaseWeather({
      hourly: {
        time: ["2026-03-01T09:00:00Z"],
        temperature: [null as unknown as number],
        precipitationProbability: [null as unknown as number],
        relativeHumidity: [null as unknown as number],
        windSpeed: [null as unknown as number],
        uvIndex: [null as unknown as number],
      },
    });
    const noFactorRes = VsiService.calculateHourlyVsi(allNullWeather, {
      requestedStart: "2026-03-01T09:00:00Z",
      requestedEnd: "2026-03-01T10:00:00Z",
    });
    expect(noFactorRes.vsiScore).toBeNull();
    expect(noFactorRes.rating).toBeNull();
    expect(noFactorRes.dataCoverageStatus).toBe("insufficient");
  });

  it("throws validation errors for invalid hourly request, NaN/Infinity, and out-of-range values", () => {
    const base = createBaseWeather();
    expect(() =>
      VsiService.calculateHourlyVsi(base, {
        requestedStart: "2026-03-01T09:00:00",
        requestedEnd: "2026-03-01T10:00:00Z",
      })
    ).toThrow(InvalidRequestError);

    expect(() =>
      VsiService.calculateHourlyVsi(base, {
        requestedStart: "2026-03-01T10:00:00Z",
        requestedEnd: "2026-03-01T10:00:00Z",
      })
    ).toThrow(InvalidRequestError);

    expect(() =>
      VsiService.calculateHourlyVsi(
        createBaseWeather({ hourly: { time: ["2026-03-01T09:00:00Z"], temperature: [NaN] } }),
        { requestedStart: "2026-03-01T09:00:00Z", requestedEnd: "2026-03-01T10:00:00Z" }
      )
    ).toThrow(InvalidNumericError);

    expect(() =>
      VsiService.calculateHourlyVsi(
        createBaseWeather({ hourly: { time: ["2026-03-01T09:00:00Z"], temperature: [61] } }),
        { requestedStart: "2026-03-01T09:00:00Z", requestedEnd: "2026-03-01T10:00:00Z" }
      )
    ).toThrow(InvalidTemperatureError);

    expect(() =>
      VsiService.calculateHourlyVsi(
        createBaseWeather({ hourly: { time: ["2026-03-01T09:00:00Z"], precipitationProbability: [101] } }),
        { requestedStart: "2026-03-01T09:00:00Z", requestedEnd: "2026-03-01T10:00:00Z" }
      )
    ).toThrow(InvalidPrecipitationProbabilityError);

    expect(() =>
      VsiService.calculateHourlyVsi(
        createBaseWeather({ hourly: { time: ["2026-03-01T09:00:00Z"], relativeHumidity: [-1] } }),
        { requestedStart: "2026-03-01T09:00:00Z", requestedEnd: "2026-03-01T10:00:00Z" }
      )
    ).toThrow(InvalidHumidityError);

    expect(() =>
      VsiService.calculateHourlyVsi(
        createBaseWeather({ hourly: { time: ["2026-03-01T09:00:00Z"], windSpeed: [-5] } }),
        { requestedStart: "2026-03-01T09:00:00Z", requestedEnd: "2026-03-01T10:00:00Z" }
      )
    ).toThrow(InvalidWindError);

    expect(() =>
      VsiService.calculateHourlyVsi(
        createBaseWeather({ hourly: { time: ["2026-03-01T09:00:00Z"], uvIndex: [-0.5] } }),
        { requestedStart: "2026-03-01T09:00:00Z", requestedEnd: "2026-03-01T10:00:00Z" }
      )
    ).toThrow(InvalidUVError);
  });
});

describe("VsiService - Daily VSI", () => {
  it("calculates normal daily VSI with partial status (humidity unavailable) and 0mm rainfall", () => {
    const weather = createBaseWeather();
    const res = VsiService.calculateDailyVsi(weather, {
      startDate: "2026-03-01",
      endDate: "2026-03-02",
    });

    expect(res.vsiScore).toBe(100);
    expect(res.rating).toBe("Excellent");
    expect(res.dataCoverageStatus).toBe("partial"); // never complete in daily mode
    expect(res.hourlyCoverage).toBeNull();
    expect(res.dailyCoverage).toBe(100);
    expect(res.factorCoverage.humidity).toBe(0);
    expect(res.effectiveFactors.humidity).toBeNull();
    expect(res.missingFactors).toEqual([]); // humidity is not reported as missing assessable factor
  });

  it("maps daily precipitationSum > 0 mm to provisional 60% effective probability", () => {
    const weather = createBaseWeather({
      daily: {
        time: ["2026-03-01", "2026-03-02"],
        temperatureMin: [22, 22],
        temperatureMax: [30, 30],
        precipitationSum: [0, 5.2], // max effective prob = 60% -> score 30 - ((60-50)/50)*30 = 24
        windSpeedMax: [5, 5],
        uvIndexMax: [2, 2],
      },
    });
    const res = VsiService.calculateDailyVsi(weather, {
      startDate: "2026-03-01",
      endDate: "2026-03-02",
    });

    expect(res.effectiveFactors.rainfall).toBe(24);
  });

  it("treats missing daily temperatureMin or temperatureMax as missing factor without error", () => {
    const weather = createBaseWeather({
      daily: {
        time: ["2026-03-01"],
        temperatureMin: [22],
        temperatureMax: [null as unknown as number],
        precipitationSum: [0],
        windSpeedMax: [5],
        uvIndexMax: [2],
      },
    });
    const res = VsiService.calculateDailyVsi(weather, {
      startDate: "2026-03-01",
      endDate: "2026-03-01",
    });

    expect(res.factorCoverage.temperature).toBe(0);
    expect(res.effectiveFactors.temperature).toBeNull();
    expect(res.missingFactors).toEqual(["temperature"]);
    expect(res.vsiScore).toBe(100);
  });

  it("still throws InvalidNumericError or InvalidTemperatureError when one temp is missing and the other is invalid", () => {
    const nanWeather = createBaseWeather({
      daily: {
        time: ["2026-03-01"],
        temperatureMin: [NaN],
        temperatureMax: [null as unknown as number],
      },
    });
    expect(() =>
      VsiService.calculateDailyVsi(nanWeather, {
        startDate: "2026-03-01",
        endDate: "2026-03-01",
      })
    ).toThrow(InvalidNumericError);

    const outOfRangeWeather = createBaseWeather({
      daily: {
        time: ["2026-03-01"],
        temperatureMin: [null as unknown as number],
        temperatureMax: [65],
      },
    });
    expect(() =>
      VsiService.calculateDailyVsi(outOfRangeWeather, {
        startDate: "2026-03-01",
        endDate: "2026-03-01",
      })
    ).toThrow(InvalidTemperatureError);
  });

  it("throws InvalidTemperatureRangeError when temperatureMin > temperatureMax", () => {
    const weather = createBaseWeather({
      daily: {
        time: ["2026-03-01"],
        temperatureMin: [30],
        temperatureMax: [25],
      },
    });
    expect(() =>
      VsiService.calculateDailyVsi(weather, {
        startDate: "2026-03-01",
        endDate: "2026-03-01",
      })
    ).toThrow(InvalidTemperatureRangeError);
  });

  it("deduplicates daily dates preserving first occurrence", () => {
    const weather = createBaseWeather({
      daily: {
        time: ["2026-03-01", "2026-03-01"],
        temperatureMin: [22, 10],
        temperatureMax: [30, 10],
        precipitationSum: [0, 50],
        windSpeedMax: [5, 50],
        uvIndexMax: [2, 20],
      },
    });
    const res = VsiService.calculateDailyVsi(weather, {
      startDate: "2026-03-01",
      endDate: "2026-03-01",
    });
    expect(res.vsiScore).toBe(100);
  });

  it("counts missing requested daily dates in coverage denominators and sets status to insufficient", () => {
    const weather = createBaseWeather({
      daily: {
        time: ["2026-03-01"],
        temperatureMin: [22],
        temperatureMax: [30],
        precipitationSum: [0],
        windSpeedMax: [5],
        uvIndexMax: [2],
      },
    });
    const res = VsiService.calculateDailyVsi(weather, {
      startDate: "2026-03-01",
      endDate: "2026-03-02",
    });

    expect(res.dailyCoverage).toBe(50);
    expect(res.factorCoverage.temperature).toBe(50);
    expect(res.dataCoverageStatus).toBe("insufficient");
    expect(res.vsiScore).toBe(100);
  });

  it("throws NoDataError when none of the requested dates exist in provider daily.time", () => {
    const weather = createBaseWeather();
    expect(() =>
      VsiService.calculateDailyVsi(weather, {
        startDate: "2026-03-10",
        endDate: "2026-03-12",
      })
    ).toThrow(NoDataError);
  });

  it("returns insufficient and null vsiScore/rating when requested date exists but all daily factors are missing", () => {
    const weather = createBaseWeather({
      daily: {
        time: ["2026-03-01"],
        temperatureMin: [null as unknown as number],
        temperatureMax: [null as unknown as number],
        precipitationSum: [null as unknown as number],
        windSpeedMax: [null as unknown as number],
        uvIndexMax: [null as unknown as number],
      },
    });
    const res = VsiService.calculateDailyVsi(weather, {
      startDate: "2026-03-01",
      endDate: "2026-03-01",
    });

    expect(res.vsiScore).toBeNull();
    expect(res.rating).toBeNull();
    expect(res.dataCoverageStatus).toBe("insufficient");
    expect(res.dailyCoverage).toBe(0);
  });

  it("rejects invalid calendar dates (no JS rollover), invalid date ranges, and negative daily precipitationSum", () => {
    const base = createBaseWeather();
    expect(() =>
      VsiService.calculateDailyVsi(base, {
        startDate: "2026-02-31",
        endDate: "2026-03-01",
      })
    ).toThrow(InvalidRequestError);

    expect(() =>
      VsiService.calculateDailyVsi(base, {
        startDate: "2026-03-05",
        endDate: "2026-03-01",
      })
    ).toThrow(InvalidRequestError);

    expect(() =>
      VsiService.calculateDailyVsi(
        createBaseWeather({ daily: { time: ["2026-02-30"] } }),
        { startDate: "2026-03-01", endDate: "2026-03-01" }
      )
    ).toThrow(InvalidTimestampError);

    expect(() =>
      VsiService.calculateDailyVsi(
        createBaseWeather({ daily: { time: ["2026-03-01"], precipitationSum: [-1] } }),
        { startDate: "2026-03-01", endDate: "2026-03-01" }
      )
    ).toThrow(InvalidPrecipitationSumError);
  });
});
