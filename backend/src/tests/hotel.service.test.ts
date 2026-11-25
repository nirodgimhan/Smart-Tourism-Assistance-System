// Vitest tests for Hotel recommendation service
import { describe, it, expect, vi, beforeEach } from "vitest";


// Mock the Hotel model used inside the service.
vi.mock("../models/Hotel.model.js", () => ({
  Hotel: {
    find: vi.fn().mockImplementation((query) => {
      // Store the query for the lean mock to use
      (Hotel as any)._lastQuery = query;
      return { lean: (Hotel as any).lean };
    }),
    // The lean mock will be overridden per test; default filters based on stored query
    lean: vi.fn().mockImplementation(async () => {
      const query = (Hotel as any)._lastQuery || {};
      // Choose dataset based on flag – default is core hotels only
      const dataset = includeSpecial ? [...hotels, ...specialHotels] : hotels;
      // Apply simple filter logic matching service implementation
      const filtered = dataset.filter((h) => {
        if (query.verified && h.verified !== true) return false;
        if (query.district && query.district.$in) {
          const regexes = query.district.$in as RegExp[];
          const match = regexes.some((re) => re.test(h.district));
          if (!match) return false;
        }
        return true;
      });
      return filtered;
    }),
  }
}));

import { Hotel } from "../models/Hotel.model.js";
import { recommendHotels } from "../services/hotel.service.js";

// Sample hotel data (lean documents)
// Sample hotel data (lean documents)
const hotels = [
  {
    _id: "1",
    name: "Alpha",
    district: "Colombo",
    indicativePriceLkr: 5000,
    amenities: ["wifi", "pool"],
    verified: true,
  },
  {
    _id: "2",
    name: "Beta",
    district: "Kandy",
    indicativePriceLkr: 8000,
    amenities: ["gym"],
    verified: false,
  },
  {
    _id: "3",
    name: "Gamma",
    district: "Colombo",
    // No price field
    amenities: [],
    verified: false,
  },
];

// Additional hotels for regex‑special‑character test
const specialHotels = [
  {
    _id: "4",
    name: "Delta",
    district: "N. Colombo",
    indicativePriceLkr: 6000,
    amenities: ["wifi"],
    verified: false,
  },
  {
    _id: "5",
    name: "Epsilon",
    district: "N. Colombo",
    indicativePriceLkr: 5500,
    amenities: ["spa"],
    verified: false,
  },
];

// Flag to toggle inclusion of specialHotels in the mock response
let includeSpecial = false;

beforeEach(() => {
  // Reset mock call history and stored query without overriding implementation.
  (Hotel.find as any).mockClear();
  (Hotel as any)._lastQuery = undefined;
  includeSpecial = false;
});

describe("Hotel Recommendation Service", () => {
  it("matches districts case‑insensitively", async () => {
    const results = await recommendHotels({ districts: ["colombo"] });
    expect(results).toHaveLength(2);
    expect(results[0].hotel.district.toLowerCase()).toBe("colombo");
    expect(results[1].hotel.district.toLowerCase()).toBe("colombo");
    const names = results.map(r => r.hotel.name);
    expect(names).not.toContain("Beta");
  });

  it("ranks within‑budget hotels above over‑budget", async () => {
    const results = await recommendHotels({ budgetLkr: 6000 });
    expect(results[0].hotel.name).toBe("Alpha");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("keeps over‑budget hotels when none are within budget", async () => {
    const results = await recommendHotels({ budgetLkr: 1000 }); // no hotel <= 1000
    expect(results).toHaveLength(3);
    const names = results.map((r) => r.hotel.name);
    expect(names).toContain("Alpha");
    expect(names).toContain("Beta");
    expect(names).toContain("Gamma");
  });

  it("matches required amenities case‑insensitively", async () => {
    const results = await recommendHotels({ requiredAmenities: ["WIFI"] });
    const alpha = results.find((r) => r.hotel.name === "Alpha")!;
    const beta = results.find((r) => r.hotel.name === "Beta")!;
    expect(alpha.score).toBeGreaterThan(beta.score);
    expect(alpha.explanation).toContain("required amenity match");
  });

  it("filters to verified hotels only when requested", async () => {
    const results = await recommendHotels({ onlyVerified: true });
    expect(results).toHaveLength(1);
    expect(results[0].hotel.name).toBe("Alpha");
    expect(results[0].explanation).toContain("verified hotel");
  });

  it("handles missing price and missing amenities safely", async () => {
    const results = await recommendHotels({ budgetLkr: 7000, requiredAmenities: ["gym"] });
    const gamma = results.find((r) => r.hotel.name === "Gamma")!;
    expect(gamma).toBeDefined();
    expect(gamma.explanation).toContain("price unknown");
  });

  it("returns results sorted descending by score (deterministic tie‑break)", async () => {
    const results = await recommendHotels({ districts: ["colombo"] });
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    if (results[0].score === results[1].score) {
      expect(results[0].hotel.name < results[1].hotel.name).toBe(true);
    }
  });

  it("returns empty array when no hotels are found", async () => {
    (Hotel.lean as any).mockResolvedValueOnce([]);
    const results = await recommendHotels({});
    expect(results).toEqual([]);
  });

  // New tests for trimming and regex safety
  it("trims whitespace in district criteria", async () => {
    const results = await recommendHotels({ districts: ["  Colombo  "] });
    expect(results).toHaveLength(2);
    const names = results.map(r => r.hotel.name);
    expect(names).toContain("Alpha");
    expect(names).toContain("Gamma");
  });

  it("safely matches districts containing regex special characters", async () => {
    includeSpecial = true;
    const special = "N. Colombo";
    const results = await recommendHotels({ districts: [special] });
    expect(results).toHaveLength(2);
    const names = results.map(r => r.hotel.name);
    expect(names).toContain("Delta");
    expect(names).toContain("Epsilon");
    expect(names).not.toContain("Alpha");
    expect(names).not.toContain("Beta");
    expect(names).not.toContain("Gamma");
  });

  it("trims whitespace in required amenities", async () => {
    const results = await recommendHotels({ requiredAmenities: ["  WIFI  "] });
    const alpha = results.find(r => r.hotel.name === "Alpha")!;
    expect(alpha.score).toBeGreaterThan(0);
    expect(alpha.explanation).toContain("required amenity match");
  });

  it("does not double‑count duplicate required amenities", async () => {
    const single = await recommendHotels({ requiredAmenities: ["wifi"] });
    const duplicate = await recommendHotels({ requiredAmenities: ["wifi", "WIFI"] });
    const alphaSingle = single.find(r => r.hotel.name === "Alpha")!;
    const alphaDup = duplicate.find(r => r.hotel.name === "Alpha")!;
    expect(alphaSingle.score).toBe(alphaDup.score);
  });
});
