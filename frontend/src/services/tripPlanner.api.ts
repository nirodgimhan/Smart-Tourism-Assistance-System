import { api } from "./api";

export type TripType =
  | "solo"
  | "couple"
  | "family"
  | "friends"
  | "group"
  | "business";

export type TravelPace =
  | "relaxed"
  | "balanced"
  | "active";

export type Accommodation =
  | "budget"
  | "standard"
  | "premium";

export type TripInput = {
  title: string;
  startDate: string;
  endDate: string;
  budgetLkr: number;
  interests: string[];
  preferredDistricts: string[];
  tripType: TripType;
  adults: number;
  children: number;
  pace: TravelPace;
  accommodation: Accommodation;
  specialNotes: string;
  packageId: string | null;
  transportMode: "driving" | "walking";
  startLocation: {
    type: "Point";
    coordinates: [number, number];
  };
};

export type Destination = {
  _id: string;
  name: string;
  category: string;
  district: string;
  description?: string;
  estimatedFeeLkr?: number;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
};

export type Hotel = {
  _id: string;
  name: string;
  district: string;
  address?: string;
  description?: string;
  indicativePriceLkr?: number;
  amenities?: string[];
};

export type TourPackage = {
  _id: string;
  name: string;
  description?: string;
  tripTypes: string[];
  districts: string[];
  interests: string[];
  days: number;
  indicativeFromLkr: number;
  featuredDestinations: string[];
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  minTravelers?: number;
  maxTravelers?: number;
};

export type TripCatalog = {
  destinations: Destination[];
  hotels: Hotel[];
  packages: TourPackage[];
};

export type Trip = Omit<
  TripInput,
  "packageId"
> & {
  _id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  packageId: string | TourPackage | null;
};

export type PlannedStop = {
  destinationId: string;
  name: string;
  district: string;
  category: string;
  description: string;
  startTime: string;
  durationMinutes: number;
  estimatedFeeLkr: number;
  coordinates: number[];
};

export type PlannedHotel = {
  hotelId: string;
  name: string;
  district: string;
  address: string;
  rooms: number;
  nightlyRateLkr: number;
  costLkr: number;
};

export type CostLines = {
  entryLkr: number;
  hotelLkr: number;
  transportLkr: number;
  mealsLkr: number;
  totalLkr: number;
};

export type PlannedDay = {
  date: string;
  dayNumber: number;
  district: string;
  stops: PlannedStop[];
  hotel: PlannedHotel | null;
  costs: CostLines;
  estimatedDistanceKm: number;
};

export type PlanTotals = {
  entryLkr: number;
  hotelsLkr: number;
  transportLkr: number;
  mealsLkr: number;
  grandTotalLkr: number;
  budgetLkr: number;
  remainingLkr: number;
  days: number;
  nights: number;
  travelers: number;
  rooms: number;
  estimateOnly: boolean;
};

export type TripPlan = {
  _id: string;
  tripId: string;
  days: PlannedDay[];
  totals: PlanTotals;
  algorithm: string;
  generatedAt: string;
};

export const tripApi = {
  async catalog(): Promise<TripCatalog> {
    const { data } = await api.get(
      "/trips/catalog"
    );

    return {
      destinations: data.destinations,
      hotels: data.hotels,
      packages: data.packages
    };
  },

  async create(
    body: TripInput
  ): Promise<{
    trip: Trip;
    plan: TripPlan;
  }> {
    const { data } = await api.post(
      "/trips",
      body
    );

    return data;
  },

  async list(): Promise<Trip[]> {
    const { data } = await api.get(
      "/trips"
    );

    return data.items;
  },

  async detail(
    id: string
  ): Promise<{
    trip: Trip;
    plan: TripPlan;
    catalog: TripCatalog;
  }> {
    const { data } = await api.get(
      `/trips/${id}`
    );

    return data;
  },

  async update(
    id: string,
    body: Partial<TripInput>
  ): Promise<{
    trip: Trip;
    plan: TripPlan;
  }> {
    const { data } = await api.patch(
      `/trips/${id}`,
      body
    );

    return data;
  },

  async updateDay(
    id: string,
    date: string,
    body: {
      destinationIds: string[];
      hotelId?: string | null;
    }
  ): Promise<TripPlan> {
    const { data } = await api.patch(
      `/trips/${id}/days/${date}`,
      body
    );

    return data.plan;
  },

  async regenerate(
    id: string,
    resetManual = false
  ): Promise<TripPlan> {
    const { data } = await api.post(
      `/trips/${id}/regenerate`,
      { resetManual }
    );

    return data.plan;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/trips/${id}`);
  }
};

export const money = (
  value: number | undefined
) =>
  `LKR ${Math.round(
    Number(value || 0)
  ).toLocaleString("en-LK")}`;

export const toLocalDate = (iso: string) =>
  iso.slice(0, 10);

export const fromLocalDate = (day: string) =>
  new Date(
    `${day}T12:00:00+05:30`
  ).toISOString();

export const asId = (
  value:
    | string
    | { _id: string }
    | null
    | undefined
): string =>
  typeof value === "string"
    ? value
    : value?._id || "";