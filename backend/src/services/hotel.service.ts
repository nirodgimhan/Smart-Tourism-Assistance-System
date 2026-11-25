// Hotel Recommendation Service implementation
import { Hotel } from "../models/Hotel.model.js";
import { z } from "zod";
import { hotelRecommendationSchema } from "../validators/hotel.schema.js";

// Derive criteria type from shared schema
export type Criteria = z.infer<typeof hotelRecommendationSchema>;

// Lean hotel document type (plain object, not a Mongoose Document)
export interface HotelDoc {
  _id: any;
  name: string;
  district: string;
  address?: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  indicativePriceLkr?: number;
  providerUrl?: string;
  verified: boolean;
}

export interface HotelRecommendationResult {
  hotel: HotelDoc;
  score: number;
  explanation: string;
}

/** Helper to escape RegExp special characters */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compute a deterministic score for a hotel based on the supplied criteria.
 * Scoring rules (higher is better):
 *   • District match: +30
 *   • Within budget (price ≤ budget): +20
 *   • Each required amenity matched (case‑insensitive, deduped): +5 per match
 *   • Verified hotel (when onlyVerified is true): +10
 * Hotels missing `indicativePriceLkr` are treated as over‑budget.
 * Missing `amenities` are treated as having no matches.
 * Results are sorted by descending score with name tie‑break for determinism.
 */
export async function recommendHotels(
  criteria: Criteria
): Promise<HotelRecommendationResult[]> {
  // Build MongoDB query filters that can be applied at the DB level.
  const query: Record<string, unknown> = {};

  // District filtering – trim, escape, exact case‑insensitive match.
  if (criteria.districts?.length) {
    const regexes = criteria.districts.map((d) => {
      const trimmed = d.trim();
      const escaped = escapeRegExp(trimmed);
      return new RegExp(`^${escaped}$`, "i");
    });
    query.district = { $in: regexes };
  }

  // Verified filter
  if (criteria.onlyVerified) {
    query.verified = true;
  }

  // Fetch candidate hotels (lean plain objects).
  const hotels: HotelDoc[] = await Hotel.find(query).lean();

  // Normalise criteria amenities: trim, lower‑case, deduplicate.
  const normAmenities = criteria.requiredAmenities
    ? Array.from(
        new Set(
          criteria.requiredAmenities.map((a) => a.trim().toLowerCase()).filter(Boolean)
        )
      )
    : [];

  const results: HotelRecommendationResult[] = hotels.map((hotel) => {
    let score = 0;
    const reasons: string[] = [];

    // District match
    if (
      criteria.districts?.some(
        (d) => d.trim().toLowerCase() === (hotel.district ?? "").trim().toLowerCase()
      )
    ) {
      score += 30;
      reasons.push("district match");
    }

    // Verified bonus
    if (criteria.onlyVerified && hotel.verified) {
      score += 10;
      reasons.push("verified hotel");
    }

    // Budget handling
    if (criteria.budgetLkr !== undefined) {
      const price = hotel.indicativePriceLkr;
      if (typeof price === "number" && price <= criteria.budgetLkr) {
        score += 20;
        reasons.push(`within budget (${price} ≤ ${criteria.budgetLkr})`);
      } else {
        if (typeof price === "number") {
          reasons.push(`over budget (${price} > ${criteria.budgetLkr})`);
        } else {
          reasons.push("price unknown");
        }
      }
    }

    // Amenities matching – case‑insensitive, deduped.
    if (normAmenities.length) {
      const hotelAmens = (hotel.amenities ?? []).map((a) => a.trim().toLowerCase());
      const matched = normAmenities.filter((req) => hotelAmens.includes(req)).length;
      if (matched > 0) {
        const amenityScore = matched * 5;
        score += amenityScore;
        reasons.push(`${matched} required amenity${matched > 1 ? "s" : ""} match`);
      }
    }

    const explanation = reasons.join(", ");
    return { hotel, score, explanation };
  });

  // Sort by descending score, then name for deterministic tie‑break.
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.hotel.name ?? "").localeCompare(b.hotel.name ?? "");
  });

  return results;
}
