import { Destination } from "../models/Destination.model.js";
import { Hotel } from "../models/Hotel.model.js";
import { TourPackage } from "../models/TourPackage.model.js";
import { TripPlan } from "../models/TripPlan.model.js";
import { Trip } from "../models/Trip.model.js";

export type DayOverride = {
  date: string;
  destinationIds: string[];
  hotelId?: string | null;
};

type Item = Record<string, any>;

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function distanceKm(a: number[], b: number[]) {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLon = (b[0] - a[0]) * r;

  const v =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * r) *
    Math.cos(b[1] * r) *
    Math.sin(dLon / 2) ** 2;

  return 6371 * 2 *
    Math.asin(Math.min(1, Math.sqrt(v)));
}

const id = (x: unknown) => String(x ?? "");

const money = (n: number) =>
  Math.round(Math.max(0, n));

export async function plannerCatalog() {
  const [destinations, hotels, packages] =
    await Promise.all([
      Destination.find({}).sort({ name: 1 }).lean(),
      Hotel.find({}).sort({ name: 1 }).lean(),
      TourPackage.find({ active: true })
        .sort({ name: 1 })
        .lean()
    ]);

  return {
    destinations,
    hotels,
    packages
  };
}

export async function rebuildTripPlan(
  trip: Item,
  customOverrides?: DayOverride[]
) {
  const previous = await TripPlan.findOne({
    tripId: trip._id
  }).lean();

  const overrides: DayOverride[] =
    customOverrides ??
    (previous?.overrides as DayOverride[] | undefined) ??
    [];

  const {
    destinations,
    hotels,
    packages
  } = await plannerCatalog();

  const pkg = packages.find(
    p => id(p._id) === id(trip.packageId)
  );

  const interests: string[] = trip.interests || [];

  const districts: string[] =
    trip.preferredDistricts?.length
      ? trip.preferredDistricts
      : (pkg?.districts || []);

  const adults = Math.max(
    1,
    Number(trip.adults ?? 2)
  );

  const children = Math.max(
    0,
    Number(trip.children ?? 0)
  );

  const travelers = adults + children;

  // Demo assumption: 2 people per room.
  const rooms = Math.ceil(travelers / 2);

  const nights = Math.max(
    0,
    Math.round(
      (
        new Date(trip.endDate).getTime() -
        new Date(trip.startDate).getTime()
      ) / 86400000
    )
  );

  const dayCount = nights + 1;

  const stopsPerDay =
    trip.pace === "relaxed"
      ? 2
      : trip.pace === "active"
        ? 4
        : 3;

  const featured = new Set(
    (pkg?.featuredDestinations || [])
      .map((s: string) => s.toLowerCase())
  );

  const interestWords = interests.map(
    x => x.toLowerCase()
  );

  const styleHotelTarget =
    trip.accommodation === "budget"
      ? 10000
      : trip.accommodation === "premium"
        ? 45000
        : 22000;

  const mealEstimate =
    (adults * 2200 + children * 1300) * dayCount;

  const affordableHotelRate = nights > 0
    ? Math.max(
        3500,
        (Number(trip.budgetLkr) - mealEstimate) *
          0.5 / (Math.max(1, nights) * rooms)
      )
    : styleHotelTarget;

  // Adjust hotel recommendations when budget changes.
  const budgetPerNight = Math.min(
    styleHotelTarget,
    affordableHotelRate
  );

  const start: number[] =
    trip.startLocation?.coordinates ||
    [80.6337, 7.2906];

  function scorePlace(p: Item): number {
    const pDistrict = String(
      p.district || ""
    ).toLowerCase();

    const districtMatch = districts.some(
      x => x.toLowerCase() === pDistrict
    );

    const words =
      `${p.category || ""} ${p.description || ""} ${p.name}`
        .toLowerCase();

    const interestsScore =
      interestWords.filter(
        x => words.includes(x)
      ).length;

    return (
      interestsScore * 10 +
      (districtMatch ? 12 : 0) +
      (
        featured.has(String(p.name).toLowerCase())
          ? 16
          : 0
      ) +
      (p.verified ? 1 : 0) -
      Number(p.estimatedFeeLkr || 0) / 4000
    );
  }

  const candidates = [...destinations].sort(
    (a, b) => scorePlace(b) - scorePlace(a)
  );

  const focusDistricts = districts.length
    ? districts
    : [
        ...new Set(
          candidates
            .slice(
              0,
              Math.max(1, dayCount * stopsPerDay)
            )
            .map(p => String(p.district || ""))
        )
      ].filter(Boolean);

  const used = new Set<string>();
  const days: Item[] = [];

  let totalEntry = 0;
  let totalHotel = 0;
  let totalTransport = 0;
  let totalMeals = 0;

  let lastLocation: number[] = start;

  for (let i = 0; i < dayCount; i++) {
    const date = dateKey(
      new Date(
        new Date(trip.startDate).getTime() +
        i * 86400000
      )
    );

    const override = overrides.find(
      x => x.date === date
    );

    let selected: Item[];

    if (override) {
      selected = override.destinationIds
        .map(x => destinations.find(
          p => id(p._id) === x
        ))
        .filter(Boolean) as Item[];
    } else {
      const targetDistrict = focusDistricts.length
        ? focusDistricts[
            Math.min(
              focusDistricts.length - 1,
              Math.floor(
                i * focusDistricts.length / dayCount
              )
            )
          ]
        : "";

      const available = candidates.filter(
        p => !used.has(id(p._id))
      );

      const inArea = available.filter(
        p =>
          String(p.district || "").toLowerCase() ===
          targetDistrict.toLowerCase()
      );

      const others = available
        .filter(p => !inArea.includes(p))
        .sort(
          (a, b) =>
            distanceKm(
              a.location?.coordinates || start,
              lastLocation
            ) -
            distanceKm(
              b.location?.coordinates || start,
              lastLocation
            )
        );

      const shortlist = [
        ...inArea,
        ...others
      ].slice(0, stopsPerDay);

      const ordered: Item[] = [];

      let position = lastLocation;

      while (shortlist.length) {
        shortlist.sort(
          (a, b) =>
            distanceKm(
              a.location?.coordinates || position,
              position
            ) -
            distanceKm(
              b.location?.coordinates || position,
              position
            )
        );

        const next = shortlist.shift()!;
        ordered.push(next);

        position =
          next.location?.coordinates || position;
      }

      selected = ordered;
    }

    selected.forEach(
      p => used.add(id(p._id))
    );

    let journeyKm = 0;

    const stops = selected.map((p, index) => {
      const point =
        p.location?.coordinates || lastLocation;

      if (
        point.length === 2 &&
        lastLocation.length === 2
      ) {
        // Estimate only — not a real road route.
        journeyKm +=
          distanceKm(lastLocation, point) * 1.35;

        lastLocation = point;
      }

      const fee = money(
        Number(p.estimatedFeeLkr || 0) *
        (adults + children * 0.5)
      );

      totalEntry += fee;

      return {
        destinationId: id(p._id),
        name: p.name,
        category: p.category,
        district: p.district || "",
        description: p.description || "",
        coordinates: point,
        estimatedFeeLkr: fee,
        startTime:
          `${String(9 + index * 2).padStart(2, "0")}:00`,
        durationMinutes: 90
      };
    });

    const dayDistrict =
      selected[0]?.district ||
      districts[i % Math.max(1, districts.length)] ||
      "";

    const hotelsHere = hotels.filter(
      h =>
        String(h.district).toLowerCase() ===
        String(dayDistrict).toLowerCase()
    );

    const hotelPool =
      hotelsHere.length ? hotelsHere : hotels;

    const chosenHotel =
      override && "hotelId" in override
        ? hotels.find(
            h => id(h._id) === id(override.hotelId)
          )
        : [...hotelPool].sort(
            (a, b) =>
              Math.abs(
                Number(a.indicativePriceLkr || 0) -
                budgetPerNight
              ) -
              Math.abs(
                Number(b.indicativePriceLkr || 0) -
                budgetPerNight
              )
          )[0];

    const hasNight = i < nights;

    const hotelCost =
      hasNight && chosenHotel
        ? money(
            Number(chosenHotel.indicativePriceLkr || 0) *
            rooms
          )
        : 0;

    const transportCost = money(
      journeyKm *
      (trip.transportMode === "walking" ? 0 : 65)
    );

    const mealCost = money(
      adults * 2200 + children * 1300
    );

    const entryCost = stops.reduce(
      (sum, x) => sum + x.estimatedFeeLkr,
      0
    );

    totalHotel += hotelCost;
    totalTransport += transportCost;
    totalMeals += mealCost;

    days.push({
      date,
      dayNumber: i + 1,
      district: dayDistrict,
      stops,
      hotel: hasNight && chosenHotel
        ? {
            hotelId: id(chosenHotel._id),
            name: chosenHotel.name,
            district: chosenHotel.district,
            address: chosenHotel.address || "",
            rooms,
            nightlyRateLkr:
              Number(chosenHotel.indicativePriceLkr || 0),
            costLkr: hotelCost
          }
        : null,
      costs: {
        entryLkr: entryCost,
        hotelLkr: hotelCost,
        transportLkr: transportCost,
        mealsLkr: mealCost,
        totalLkr:
          entryCost +
          hotelCost +
          transportCost +
          mealCost
      },
      estimatedDistanceKm:
        Math.round(journeyKm * 10) / 10
    });
  }

  const grandTotal =
    totalEntry +
    totalHotel +
    totalTransport +
    totalMeals;

  const totals = {
    entryLkr: totalEntry,
    hotelsLkr: totalHotel,
    transportLkr: totalTransport,
    mealsLkr: totalMeals,
    grandTotalLkr: grandTotal,
    budgetLkr: trip.budgetLkr,
    remainingLkr:
      trip.budgetLkr - grandTotal,
    days: dayCount,
    nights,
    travelers,
    rooms,
    currency: "LKR",
    estimateOnly: true
  };

  const validOverrides = overrides.filter(
    o => days.some(d => d.date === o.date)
  );

  const plan = await TripPlan.findOneAndUpdate(
    { tripId: trip._id },
    {
      $set: {
        userId: trip.userId,
        days,
        overrides: validOverrides,
        totals,
        generatedAt: new Date(),
        algorithm: "rule-based-demo-v1"
      }
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );

  await Trip.updateOne(
    { _id: trip._id },
    {
      $set: {
        destinationIds: [
          ...new Set(
            days.flatMap(
              d => d.stops.map(
                (s: Item) => s.destinationId
              )
            )
          )
        ]
      }
    }
  );

  return plan;
}