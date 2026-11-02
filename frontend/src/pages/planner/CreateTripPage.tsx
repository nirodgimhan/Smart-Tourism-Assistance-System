import {
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";

import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  LocateFixed,
  Wallet,
  SlidersHorizontal
} from "lucide-react";

import {
  getErrorMessage
} from "../../services/api";

import {
  tripApi,
  money,
  fromLocalDate,
  type TripCatalog,
  type TripInput,
  type TripType,
  type TravelPace,
  type Accommodation
} from "../../services/tripPlanner.api";

import "../../styles/tripPlanner.css";

const interestOptions = [
  "Nature",
  "Culture",
  "Beaches",
  "Adventure",
  "Wildlife",
  "Food",
  "Wellness",
  "Shopping"
];

const districts = [
  "Kandy",
  "Matale",
  "Badulla",
  "Galle",
  "Matara",
  "Polonnaruwa",
  "Colombo",
  "Nuwara Eliya",
  "Anuradhapura",
  "Trincomalee"
];

const locations = [
  {
    name: "Kandy",
    coords: [80.6337, 7.2906] as [number, number]
  },
  {
    name: "Colombo",
    coords: [79.8612, 6.9271] as [number, number]
  },
  {
    name: "Galle",
    coords: [80.2168, 6.0329] as [number, number]
  },
  {
    name: "Ella",
    coords: [81.0466, 6.8667] as [number, number]
  },
  {
    name: "Sigiriya",
    coords: [80.7603, 7.9570] as [number, number]
  }
];

const initial: TripInput = {
  title: "",
  startDate: "",
  endDate: "",
  budgetLkr: 80000,
  interests: ["Nature", "Culture"],
  preferredDistricts: [],
  tripType: "family",
  adults: 2,
  children: 0,
  pace: "balanced",
  accommodation: "standard",
  specialNotes: "",
  packageId: null,
  transportMode: "driving",
  startLocation: {
    type: "Point",
    coordinates: [80.6337, 7.2906]
  }
};

function toggle(items: string[], item: string) {
  return items.includes(item)
    ? items.filter(x => x !== item)
    : [...items, item];
}

export default function CreateTripPage() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<TripInput>(initial);

  const [catalog, setCatalog] =
    useState<TripCatalog>({
      destinations: [],
      hotels: [],
      packages: []
    });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] =
    useState(true);

  useEffect(() => {
    let alive = true;

    tripApi.catalog()
      .then(data => {
        if (alive) setCatalog(data);
      })
      .catch(e => {
        if (alive) {
          setError(getErrorMessage(e));
        }
      })
      .finally(() => {
        if (alive) setCatalogLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const days =
    form.startDate && form.endDate
      ? Math.round(
          (
            new Date(form.endDate).getTime() -
            new Date(form.startDate).getTime()
          ) / 86400000
        ) + 1
      : 0;

  const recommendedPackages = useMemo(() => {
    return [...catalog.packages].sort((a, b) => {
      const score = (p: typeof a) =>
        (
          p.tripTypes.includes(form.tripType)
            ? 10
            : 0
        ) +
        p.interests.filter(
          x => form.interests.includes(x)
        ).length * 4 -
        (
          days > 0
            ? Math.abs(p.days - days) * 2
            : 0
        );

      return score(b) - score(a);
    });
  }, [
    catalog.packages,
    form.tripType,
    form.interests,
    days
  ]);

  const suggested = useMemo(() => {
    return catalog.destinations
      .filter(
        p =>
          form.preferredDistricts.length === 0 ||
          form.preferredDistricts.includes(p.district)
      )
      .slice(0, 6);
  }, [
    catalog.destinations,
    form.preferredDistricts
  ]);

  function update<K extends keyof TripInput>(
    key: K,
    value: TripInput[K]
  ) {
    setForm(prev => ({
      ...prev,
      [key]: value
    }));
  }

  function selectPackage(id: string) {
    const pkg = catalog.packages.find(
      p => p._id === id
    );

    setForm(prev => ({
      ...prev,
      packageId:
        prev.packageId === id ? null : id,
      preferredDistricts: pkg?.districts || [],
      interests: pkg?.interests?.length
        ? pkg.interests
        : prev.interests
    }));
  }

  function gps() {
    if (!navigator.geolocation) {
      setError("GPS is unavailable.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      p => {
        update("startLocation", {
          type: "Point",
          coordinates: [
            p.coords.longitude,
            p.coords.latitude
          ]
        });

        setError("");
      },
      e => setError(e.message),
      {
        enableHighAccuracy: true,
        timeout: 20000
      }
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (days < 1 || days > 14) {
      setError(
        "Select a trip between 1 and 14 days."
      );
      return;
    }

    if (
      form.adults < 1 ||
      form.adults + form.children > 50
    ) {
      setError(
        "Check participant numbers."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { trip } = await tripApi.create({
        ...form,
        startDate: fromLocalDate(form.startDate),
        endDate: fromLocalDate(form.endDate)
      });

      navigate(`/trips/${trip._id}`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container tp-page">
      <header className="tp-hero">
        <div className="tp-eyebrow">
          <Sparkles size={16} />
          GOCELONE SMART TRAVEL PLANNER
        </div>

        <h1>Design your perfect Sri Lanka trip</h1>

        <p>
          Choose your group, budget and interests.
          We'll build a customizable day-by-day
          itinerary with suggested stays and
          transparent cost estimates.
        </p>

        <div className="tp-hero-stats">
          <span>
            <CalendarDays size={17} />
            1–14 days
          </span>

          <span>
            <Users size={17} />
            Your group, your style
          </span>

          <span>
            <Wallet size={17} />
            LKR budget planner
          </span>
        </div>
      </header>

      <form onSubmit={submit} className="tp-layout">
        <div className="tp-main">
          <section className="tp-panel">
            <h2>
              <CalendarDays size={20} />
              1. Your journey
            </h2>

            <div className="tp-form-grid">
              <label className="tp-wide">
                Trip name

                <input
                  required
                  minLength={2}
                  maxLength={150}
                  placeholder="My Hill Country Escape"
                  value={form.title}
                  onChange={e =>
                    update("title", e.target.value)
                  }
                />
              </label>

              <label>
                Start date

                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={e =>
                    update("startDate", e.target.value)
                  }
                />
              </label>

              <label>
                End date

                <input
                  required
                  type="date"
                  min={form.startDate}
                  value={form.endDate}
                  onChange={e =>
                    update("endDate", e.target.value)
                  }
                />
              </label>

              <label>
                Trip type

                <select
                  value={form.tripType}
                  onChange={e =>
                    update(
                      "tripType",
                      e.target.value as TripType
                    )
                  }
                >
                  <option value="solo">Solo</option>
                  <option value="couple">Couple</option>
                  <option value="family">Family</option>
                  <option value="friends">Friends</option>
                  <option value="group">Group</option>
                  <option value="business">Business</option>
                </select>
              </label>

              <label>
                Transport

                <select
                  value={form.transportMode}
                  onChange={e =>
                    update(
                      "transportMode",
                      e.target.value as TripInput["transportMode"]
                    )
                  }
                >
                  <option value="driving">
                    Driving / hired vehicle
                  </option>

                  <option value="walking">
                    Walking (estimates only)
                  </option>
                </select>
              </label>

              <label>
                Adults

                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.adults}
                  onChange={e =>
                    update(
                      "adults",
                      Number(e.target.value)
                    )
                  }
                />
              </label>

              <label>
                Children

                <input
                  type="number"
                  min={0}
                  max={20}
                  value={form.children}
                  onChange={e =>
                    update(
                      "children",
                      Number(e.target.value)
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section className="tp-panel">
            <h2>
              <SlidersHorizontal size={20} />
              2. Preferences
            </h2>

            <div className="tp-form-grid">
              <label>
                Entire-trip budget (LKR)

                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.budgetLkr}
                  onChange={e =>
                    update(
                      "budgetLkr",
                      Number(e.target.value)
                    )
                  }
                />
              </label>

              <label>
                Daily pace

                <select
                  value={form.pace}
                  onChange={e =>
                    update(
                      "pace",
                      e.target.value as TravelPace
                    )
                  }
                >
                  <option value="relaxed">
                    Relaxed · 2 places/day
                  </option>
                  <option value="balanced">
                    Balanced · 3 places/day
                  </option>
                  <option value="active">
                    Active · 4 places/day
                  </option>
                </select>
              </label>

              <label>
                Hotel preference

                <select
                  value={form.accommodation}
                  onChange={e =>
                    update(
                      "accommodation",
                      e.target.value as Accommodation
                    )
                  }
                >
                  <option value="budget">
                    Budget stays
                  </option>
                  <option value="standard">
                    Comfortable stays
                  </option>
                  <option value="premium">
                    Premium stays
                  </option>
                </select>
              </label>

              <label>
                Starting city

                <select
                  value={
                    locations.find(
                      x =>
                        x.coords.join(",") ===
                        form.startLocation.coordinates.join(",")
                    )?.name || "custom"
                  }
                  onChange={e => {
                    const loc = locations.find(
                      x => x.name === e.target.value
                    );

                    if (loc) {
                      update("startLocation", {
                        type: "Point",
                        coordinates: loc.coords
                      });
                    }
                  }}
                >
                  <option value="custom">
                    Custom GPS coordinates
                  </option>

                  {locations.map(loc => (
                    <option
                      key={loc.name}
                      value={loc.name}
                    >
                      {loc.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="tp-wide">
                <button
                  className="tp-subtle"
                  type="button"
                  onClick={gps}
                >
                  <LocateFixed size={16} />
                  Use my location
                </button>

                <p className="tp-hint">
                  Start location:{" "}
                  {form.startLocation.coordinates[1].toFixed(4)}
                  ,{" "}
                  {form.startLocation.coordinates[0].toFixed(4)}
                </p>
              </div>

              <div className="tp-wide">
                <strong>Interests</strong>

                <div className="tp-chips">
                  {interestOptions.map(x => (
                    <button
                      type="button"
                      key={x}
                      className={`tp-chip ${
                        form.interests.includes(x)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        update(
                          "interests",
                          toggle(form.interests, x)
                        )
                      }
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tp-wide">
                <strong>Preferred districts (optional)</strong>

                <div className="tp-chips">
                  {districts.map(x => (
                    <button
                      type="button"
                      key={x}
                      className={`tp-chip ${
                        form.preferredDistricts.includes(x)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        update(
                          "preferredDistricts",
                          toggle(form.preferredDistricts, x)
                        )
                      }
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>

              <label className="tp-wide">
                Special requirements

                <textarea
                  maxLength={500}
                  rows={3}
                  placeholder="Accessibility needs, food preferences, other notes..."
                  value={form.specialNotes}
                  onChange={e =>
                    update(
                      "specialNotes",
                      e.target.value
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section className="tp-panel">
            <h2>
              <Sparkles size={20} />
              3. Choose a travel package (optional)
            </h2>

            <p className="tp-muted">
              Packages are itinerary templates.
              Displayed starting prices are sample
              references, not an extra charge
              or booking quote.
            </p>

            <div className="tp-package-grid">
              {recommendedPackages.map(pkg => (
                <button
                  key={pkg._id}
                  type="button"
                  onClick={() => selectPackage(pkg._id)}
                  className={`tp-package ${
                    form.packageId === pkg._id
                      ? "active"
                      : ""
                  }`}
                >
                  <span className="tp-pill">
                    {pkg.days} days
                  </span>

                  <h3>{pkg.name}</h3>
                  <p>{pkg.description}</p>

                  <small>
                    {(pkg.highlights || []).join(" • ")}
                  </small>

                  <strong>
                    From {money(pkg.indicativeFromLkr)}
                  </strong>

                  <small>
                    {pkg.districts.join(" • ")}
                  </small>

                  <span className="tp-choose">
                    {form.packageId === pkg._id
                      ? "✓ Selected"
                      : "Select package"}
                  </span>
                </button>
              ))}

              {!catalogLoading &&
                !recommendedPackages.length && (
                  <p>
                    No packages imported yet.
                    You can still create a customized trip.
                  </p>
                )}
            </div>
          </section>
        </div>

        <aside className="tp-aside">
          <div className="tp-panel tp-sticky">
            <h2>Trip preview</h2>

            <div className="tp-metric">
              <span>Duration</span>
              <strong>
                {days > 0
                  ? `${days} day${days > 1 ? "s" : ""}`
                  : "Pick dates"}
              </strong>
            </div>

            <div className="tp-metric">
              <span>Travelers</span>
              <strong>
                {form.adults + form.children}
              </strong>
            </div>

            <div className="tp-metric">
              <span>Budget</span>
              <strong>
                {money(form.budgetLkr)}
              </strong>
            </div>

            <div className="tp-metric">
              <span>Type</span>
              <strong>{form.tripType}</strong>
            </div>

            <div className="tp-metric">
              <span>Package</span>
              <strong>
                {
                  catalog.packages.find(
                    x => x._id === form.packageId
                  )?.name || "Custom"
                }
              </strong>
            </div>

            <hr />

            <h3>
              <MapPin size={17} />
              Suggested highlights
            </h3>

            {suggested.slice(0, 4).map(p => (
              <p className="tp-mini-item" key={p._id}>
                {p.name}
                <small>{p.district}</small>
              </p>
            ))}

            {!catalog.destinations.length && (
              <p className="tp-hint">
                Import the sample dataset
                to see recommendations.
              </p>
            )}

            {error && (
              <div className="tp-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="tp-primary"
              disabled={loading}
            >
              {loading
                ? "Building itinerary..."
                : "Create my trip plan"}

              <ArrowRight size={18} />
            </button>

            <p className="tp-hint">
              Includes day-by-day activities,
              suggested hotels and editable estimated
              costs. No payment or reservation is made.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}