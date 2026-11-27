import { z } from "zod";

/**
 * Validate that a string represents a real calendar date in YYYY-MM-DD format (no JS date rollover).
 */
function isValidCalendarDate(val: string): boolean {
  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return false;
  return true;
}

/**
 * Validate that a string is a valid ISO-8601 timestamp with an explicit UTC offset (e.g. Z, +05:30, -04:00).
 */
function isValidIsoWithOffset(val: string): boolean {
  const match = val.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|([+-])(\d{2}):(\d{2}))$/
  );
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] === undefined ? 0 : Number(match[6]);

  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;

  if (match[7] === "Z") return true;

  const offsetHours = Number(match[9]);
  const offsetMinutes = Number(match[10]);
  if (offsetHours > 23 || offsetMinutes > 59) return false;

  return true;
}

/**
 * Separate schema for Hourly VSI calculation requests.
 */
export const vsiHourlySchema = z
  .object({
    latitude: z
      .number()
      .min(-90, { message: "Latitude must be between -90 and 90" })
      .max(90, { message: "Latitude must be between -90 and 90" }),
    longitude: z
      .number()
      .min(-180, { message: "Longitude must be between -180 and 180" })
      .max(180, { message: "Longitude must be between -180 and 180" }),
    requestedStart: z
      .string()
      .refine(
        isValidIsoWithOffset,
        "requestedStart must be a valid ISO-8601 timestamp with explicit UTC offset"
      ),
    requestedEnd: z
      .string()
      .refine(
        isValidIsoWithOffset,
        "requestedEnd must be a valid ISO-8601 timestamp with explicit UTC offset"
      ),
    // Reject daily fields in hourly mode
    date: z.never().optional(),
    startDate: z.never().optional(),
    endDate: z.never().optional(),
    // Reject arbitrary weather payload
    weather: z.never().optional(),
  })
  .strict();

export type VsiHourlyInput = z.infer<typeof vsiHourlySchema>;

/**
 * Separate schema for Daily VSI calculation requests.
 * Accepts either single date (normalized to startDate = endDate = date) or a startDate and endDate pair.
 */
export const vsiDailySchema = z
  .object({
    latitude: z
      .number()
      .min(-90, { message: "Latitude must be between -90 and 90" })
      .max(90, { message: "Latitude must be between -90 and 90" }),
    longitude: z
      .number()
      .min(-180, { message: "Longitude must be between -180 and 180" })
      .max(180, { message: "Longitude must be between -180 and 180" }),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be in YYYY-MM-DD format" })
      .refine(isValidCalendarDate, "date must be a valid calendar date")
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "startDate must be in YYYY-MM-DD format" })
      .refine(isValidCalendarDate, "startDate must be a valid calendar date")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "endDate must be in YYYY-MM-DD format" })
      .refine(isValidCalendarDate, "endDate must be a valid calendar date")
      .optional(),
    // Reject hourly fields in daily mode
    requestedStart: z.never().optional(),
    requestedEnd: z.never().optional(),
    // Reject arbitrary weather payload
    weather: z.never().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasDate = data.date !== undefined;
    const hasStartDate = data.startDate !== undefined;
    const hasEndDate = data.endDate !== undefined;

    if (hasDate && (hasStartDate || hasEndDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot provide both single 'date' and 'startDate'/'endDate' range",
        path: ["date"],
      });
      return;
    }

    if (!hasDate && !hasStartDate && !hasEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must provide either single 'date' or both 'startDate' and 'endDate'",
        path: ["date"],
      });
      return;
    }

    if (hasStartDate !== hasEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both 'startDate' and 'endDate' must be provided together",
        path: [hasStartDate ? "endDate" : "startDate"],
      });
      return;
    }

    if (hasStartDate && hasEndDate && data.startDate! > data.endDate!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startDate must be earlier than or equal to endDate",
        path: ["startDate"],
      });
    }
  })
  .transform((data) => ({
    latitude: data.latitude,
    longitude: data.longitude,
    startDate: data.date ?? data.startDate!,
    endDate: data.date ?? data.endDate!,
  }));

export type VsiDailyInput = z.infer<typeof vsiDailySchema>;
