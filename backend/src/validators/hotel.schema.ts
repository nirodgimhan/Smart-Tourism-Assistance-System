import { z } from "zod";

/**
 * Validation schema for the hotel recommendation request.
 * All fields are optional and follow the requirements outlined in the feature
 * specification.
 */
export const hotelRecommendationSchema = z.object({
  // Optional positive number representing maximum budget in LKR.
  budgetLkr: z.number().positive().optional(),
  // Optional list of districts the user prefers – each must be a non‑empty string.
  districts: z.array(z.string().min(1)).optional(),
  // Optional list of required amenities – each must be a non‑empty string.
  requiredAmenities: z.array(z.string().min(1)).optional(),
  // Optional flag to return only verified hotels.
  onlyVerified: z.boolean().optional(),
});
