import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Link,
  useParams
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Hotel as HotelIcon,
  MapPin,
  Pencil,
  Printer,
  RefreshCw,
  Save,
  Sparkles,
  Users,
  Wallet,
  Navigation,
  CheckCircle2
} from "lucide-react";

import {
  getErrorMessage
} from "../../services/api";

import {
  tripApi,
  asId,
  money,
  toLocalDate,
  fromLocalDate,
  type Trip,
  type TripPlan,
  type TripCatalog,
  type TripInput,
  type PlannedDay,
  type TripType,
  type TravelPace,
  type Accommodation
} from "../../services/tripPlanner.api";

import "../../styles/tripPlanner.css";

const tripTypes: TripType[] = [
  "solo",
  "couple",
  "family",
  "friends",
  "group",
  "business"
];

const paceOptions: TravelPace[] = [
  "relaxed",
  "balanced",
  "active"
];

const accommodationOptions: Accommodation[] = [
  "budget",
  "standard",
  "premium"
];

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

function editForm(trip: Trip) {
  return {
    title: trip.title,
    startDate: toLocalDate(trip.startDate),
    endDate: toLocalDate(trip.endDate),
    budgetLkr: trip.budgetLkr,
    tripType: trip.tripType,
    adults: trip.adults,
    children: trip.children,
    interests: [...trip.interests],
    preferredDistricts: [
      ...trip.preferredDistricts
    ],
    pace: trip.pace,
    accommodation: trip.accommodation,
    packageId: asId(trip.packageId) || null,
    transportMode: trip.transportMode,
    specialNotes: trip.specialNotes || ""
  };
}

function toggle(xs: string[], x: string) {
  return xs.includes(x)
    ? xs.filter(v => v !== x)
    : [...xs, x];
}

export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [trip, setTrip] =
    useState<Trip | null>(null);

  const [plan, setPlan] =
    useState<TripPlan | null>(null);

  const [catalog, setCatalog] =
    useState<TripCatalog>({
      destinations: [],
      hotels: [],
      packages: []
    });

  const [form, setForm] =
    useState<ReturnType<typeof editForm> | null>(null);

  const [editing, setEditing] =
    useState(false);

  const [dayEditing, setDayEditing] =
    useState<string | null>(null);

  const [chosenStops, setChosenStops] =
    useState<string[]>([]);

  const [chosenHotel, setChosenHotel] =
    useState<string>("auto");

  const [filter, setFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const load = useCallback(async () => {
    if (!id) return;

    try {
      const data = await tripApi.detail(id);

      setTrip(data.trip);
      setPlan(data.plan);
      setCatalog(data.catalog);
      setForm(editForm(data.trip));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const suggestedPlaces = useMemo(() => {
    if (!trip || !plan) return [];

    const used = new Set(
      plan.days.flatMap(
        d => d.stops.map(s => s.destinationId)
      )
    );

    return catalog.destinations
      .filter(p => !used.has(p._id))
      .map(p => ({
        ...p,
        score:
          (
            trip.preferredDistricts.includes(
              p.district
            )
              ? 10
              : 0
          ) +
          (
            trip.interests.some(x =>
              `${p.name} ${p.category} ${p.description || ""}`
                .toLowerCase()
                .includes(x.toLowerCase())
            )
              ? 7
              : 0
          )
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [
    trip,
    plan,
    catalog.destinations
  ]);

  const suggestedHotels = useMemo(() => {
    if (!plan) return [];

    const ds = new Set(
      plan.days.map(d => d.district)
    );

    return catalog.hotels
      .filter(h => ds.has(h.district))
      .slice(0, 8);
  }, [
    plan,
    catalog.hotels
  ]);

  function editDay(day: PlannedDay) {
    setDayEditing(day.date);

    setChosenStops(
      day.stops.map(x => x.destinationId)
    );

    setChosenHotel("auto");
    setFilter("");
    setError("");
    setSuccess("");
  }

  async function saveDay(date: string) {
    if (!id) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const next = await tripApi.updateDay(
        id,
        date,
        {
          destinationIds: chosenStops,
          hotelId:
            chosenHotel === "auto"
              ? undefined
              : chosenHotel === "none"
                ? null
                : chosenHotel
        }
      );

      setPlan(next);
      setDayEditing(null);

      setSuccess(
        "Day updated. Hotels, activity fees and overall budget have been recalculated."
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    if (!id || !form) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const patch: Partial<TripInput> = {
        ...form,
        startDate: fromLocalDate(
          form.startDate
        ),
        endDate: fromLocalDate(
          form.endDate
        )
      };

      const next = await tripApi.update(
        id,
        patch
      );

      setTrip(next.trip);
      setPlan(next.plan);
      setForm(editForm(next.trip));
      setEditing(false);

      setSuccess(
        "Trip settings saved and costs recalculated. Manual day choices were kept only for dates still in the trip."
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function regenerate(
    resetManual: boolean
  ) {
    if (!id) return;

    if (
      resetManual &&
      !window.confirm(
        "Replace all manually edited days with a fresh suggested plan?"
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const next = await tripApi.regenerate(
        id,
        resetManual
      );

      setPlan(next);
      setDayEditing(null);

      setSuccess(
        "Your day-by-day plan and budget have been recalculated."
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function setField<
    K extends keyof NonNullable<typeof form>
  >(
    key: K,
    value: NonNullable<typeof form>[K]
  ) {
    setForm(prev =>
      prev
        ? { ...prev, [key]: value }
        : prev
    );
  }

  if (loading) {
    return (
      <main className="container tp-page">
        <div className="tp-panel">
          Loading your trip plan...
        </div>
      </main>
    );
  }

  if (!trip || !plan || !form) {
    return (
      <main className="container tp-page">
        <div className="tp-error">
          {error || "Trip not found"}
        </div>

        <Link to="/trips">
          My trips
        </Link>
      </main>
    );
  }

  const total = plan.totals;

  const pkg = catalog.packages.find(
    p => p._id === asId(trip.packageId)
  );

  const allDistricts = [
    ...new Set(
      catalog.destinations.map(
        x => x.district
      )
    )
  ].sort();

  return (
    <main className="container tp-page tp-print-area">
      <div className="tp-toolbar tp-no-print">
        <Link to="/trips">
          <ArrowLeft size={17} />
          My trips
        </Link>

        <div>
          <button
            type="button"
            className="tp-subtle"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Print / Save as PDF
          </button>

          <button
            type="button"
            className="tp-subtle"
            onClick={() => {
              setEditing(v => !v);
              setDayEditing(null);
            }}
          >
            <Pencil size={16} />
            {editing
              ? "Close editor"
              : "Edit trip"}
          </button>
        </div>
      </div>

      <header className="tp-hero">
        <div className="tp-eyebrow">
          <Sparkles size={16} />
          YOUR PERSONALIZED ITINERARY
        </div>

        <h1>{trip.title}</h1>

        <p>
          {toLocalDate(trip.startDate)}
          {" — "}
          {toLocalDate(trip.endDate)}
          {" · "}
          {trip.tripType}
          {" · "}
          {trip.adults} adult(s) +{" "}
          {trip.children} child(ren)
        </p>

        <div className="tp-hero-stats">
          <span>
            <CalendarDays size={17} />
            {total.days} days /{" "}
            {total.nights} nights
          </span>

          <span>
            <Users size={17} />
            {total.travelers} travelers
          </span>

          <span>
            <Wallet size={17} />
            {money(trip.budgetLkr)} budget
          </span>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="tp-error tp-no-print"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="tp-success tp-no-print"
        >
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <div className="tp-summary-grid">
        <div className="tp-summary-card">
          <span>Estimated trip cost</span>

          <strong>
            {money(total.grandTotalLkr)}
          </strong>

          <small>
            Attractions + hotels + meals + transport
          </small>
        </div>

        <div className="tp-summary-card">
          <span>Remaining budget</span>

          <strong className={
            total.remainingLkr < 0
              ? "tp-over"
              : "tp-good"
          }>
            {money(
              Math.abs(total.remainingLkr)
            )}
          </strong>

          <small>
            {total.remainingLkr < 0
              ? "Over budget (consider edits)"
              : "Under planned budget"}
          </small>
        </div>

        <div className="tp-summary-card">
          <span>People / rooms</span>

          <strong>
            {total.travelers} / {total.rooms}
          </strong>

          <small>
            Illustrative 2 guests per room
          </small>
        </div>

        <div className="tp-summary-card">
          <span>Trip style</span>

          <strong>{trip.pace}</strong>

          <small>
            {trip.accommodation} stays ·{" "}
            {pkg?.name || "Custom plan"}
          </small>
        </div>
      </div>

      <section
        className="tp-panel"
        style={{ marginBottom: 24 }}
      >
        <h2>
          <MapPin size={20} />
          Trip preferences & important details
        </h2>

        <div className="tp-form-grid">
          <p>
            <strong>Travel type:</strong>{" "}
            {trip.tripType}
          </p>

          <p>
            <strong>Transport:</strong>{" "}
            {trip.transportMode}
          </p>

          <p>
            <strong>Travel pace:</strong>{" "}
            {trip.pace}
          </p>

          <p>
            <strong>Accommodation:</strong>{" "}
            {trip.accommodation}
          </p>

          <p className="tp-wide">
            <strong>Interests:</strong>{" "}
            {trip.interests.join(", ") || "Flexible"}
          </p>

          <p className="tp-wide">
            <strong>Preferred districts:</strong>{" "}
            {trip.preferredDistricts.join(", ") ||
              "Open to all districts"}
          </p>

          <p className="tp-wide">
            <strong>Additional requirements:</strong>{" "}
            {trip.specialNotes || "None entered"}
          </p>

          <p className="tp-wide">
            <strong>Starting location:</strong>{" "}
            {trip.startLocation.coordinates[1].toFixed(4)}
            ° N,{" "}
            {trip.startLocation.coordinates[0].toFixed(4)}
            ° E
          </p>
        </div>
      </section>

      <div className="tp-layout">
        <div className="tp-main">
          {editing && (
            <section className="tp-panel tp-no-print">
              <h2>
                <Pencil size={20} />
                Change trip preferences
              </h2>

              <p className="tp-muted">
                Saving automatically recalculates your
                itinerary, hotel rooms and budget.
                Manually edited days remain selected
                until you choose Fresh plan.
              </p>

              <div className="tp-form-grid">
                <label className="tp-wide">
                  Trip name

                  <input
                    value={form.title}
                    onChange={e =>
                      setField(
                        "title",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  From

                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e =>
                      setField(
                        "startDate",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  To

                  <input
                    type="date"
                    min={form.startDate}
                    value={form.endDate}
                    onChange={e =>
                      setField(
                        "endDate",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Budget (LKR)

                  <input
                    type="number"
                    min={0}
                    value={form.budgetLkr}
                    onChange={e =>
                      setField(
                        "budgetLkr",
                        Number(e.target.value)
                      )
                    }
                  />
                </label>

                <label>
                  Trip type

                  <select
                    value={form.tripType}
                    onChange={e =>
                      setField(
                        "tripType",
                        e.target.value as TripType
                      )
                    }
                  >
                    {tripTypes.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
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
                      setField(
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
                      setField(
                        "children",
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
                      setField(
                        "pace",
                        e.target.value as TravelPace
                      )
                    }
                  >
                    {paceOptions.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Hotel standard

                  <select
                    value={form.accommodation}
                    onChange={e =>
                      setField(
                        "accommodation",
                        e.target.value as Accommodation
                      )
                    }
                  >
                    {accommodationOptions.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Transport

                  <select
                    value={form.transportMode}
                    onChange={e =>
                      setField(
                        "transportMode",
                        e.target.value as TripInput["transportMode"]
                      )
                    }
                  >
                    <option value="driving">
                      Driving
                    </option>

                    <option value="walking">
                      Walking (estimates only)
                    </option>
                  </select>
                </label>

                <label>
                  Travel package

                  <select
                    value={form.packageId || ""}
                    onChange={e => {
                      const p = catalog.packages.find(
                        x => x._id === e.target.value
                      );

                      setForm(prev =>
                        prev
                          ? {
                              ...prev,
                              packageId:
                                e.target.value || null,
                              preferredDistricts:
                                p?.districts ||
                                prev.preferredDistricts,
                              interests:
                                p?.interests?.length
                                  ? p.interests
                                  : prev.interests
                            }
                          : prev
                      );
                    }}
                  >
                    <option value="">
                      Custom plan
                    </option>

                    {catalog.packages.map(p => (
                      <option
                        key={p._id}
                        value={p._id}
                      >
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="tp-wide">
                  <strong>Interests</strong>

                  <div className="tp-chips">
                    {interestOptions.map(x => (
                      <button
                        key={x}
                        type="button"
                        className={`tp-chip ${
                          form.interests.includes(x)
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setField(
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
                  <strong>Districts</strong>

                  <div className="tp-chips">
                    {allDistricts.map(x => (
                      <button
                        key={x}
                        type="button"
                        className={`tp-chip ${
                          form.preferredDistricts.includes(x)
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setField(
                            "preferredDistricts",
                            toggle(
                              form.preferredDistricts,
                              x
                            )
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
                    rows={2}
                    maxLength={500}
                    value={form.specialNotes}
                    onChange={e =>
                      setField(
                        "specialNotes",
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>

              <div className="tp-actions">
                <button
                  className="tp-primary"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void saveSettings()
                  }
                >
                  <Save size={17} />
                  Save & recalculate
                </button>

                <button
                  className="tp-subtle"
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setForm(editForm(trip));
                  }}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          <section className="tp-panel">
            <div className="tp-section-head">
              <div>
                <h2>
                  <CalendarDays size={20} />
                  Day-by-day trip plan
                </h2>

                <p className="tp-muted">
                  Edit activities or stays;
                  other costs update automatically.
                </p>
              </div>

              <button
                className="tp-subtle tp-no-print"
                type="button"
                disabled={busy}
                onClick={() =>
                  void regenerate(true)
                }
              >
                <RefreshCw size={16} />
                Fresh plan
              </button>
            </div>

            {plan.days.map(day => (
              <article
                key={day.date}
                className="tp-day"
              >
                <div className="tp-day-head">
                  <div className="tp-day-number">
                    DAY {day.dayNumber}
                  </div>

                  <div>
                    <h3>{day.date}</h3>

                    <small>
                      <MapPin size={13} />
                      {day.district || "Multi-district"}
                    </small>
                  </div>

                  <button
                    className="tp-subtle tp-no-print"
                    type="button"
                    onClick={() =>
                      dayEditing === day.date
                        ? setDayEditing(null)
                        : editDay(day)
                    }
                  >
                    <Pencil size={15} />
                    {dayEditing === day.date
                      ? "Close"
                      : "Edit day"}
                  </button>
                </div>

                <div className="tp-timeline">
                  {day.stops.length === 0 && (
                    <p>
                      No activities selected.
                      Choose places in Edit day.
                    </p>
                  )}

                  {day.stops.map(
                    (stop, index) => (
                      <div
                        className="tp-stop"
                        key={`${stop.destinationId}-${index}`}
                      >
                        <div className="tp-time">
                          {stop.startTime}
                        </div>

                        <div className="tp-stop-main">
                          <h4>{stop.name}</h4>

                          <p>
                            {stop.description ||
                              stop.category}
                          </p>

                          <span className="tp-meta">
                            {stop.district}
                            {" · ~"}
                            {stop.durationMinutes} min
                            {" · Entry "}
                            {money(stop.estimatedFeeLkr)}
                          </span>

                          <div className="tp-no-print">
                            <Link
                              to={`/maps/navigation?destination=${stop.destinationId}`}
                              className="tp-link"
                            >
                              <Navigation size={14} />
                              Navigate
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="tp-day-hotel">
                  <HotelIcon size={19} />

                  <div>
                    <strong>
                      {day.hotel
                        ? day.hotel.name
                        : "No overnight stay"}
                    </strong>

                    <p>
                      {day.hotel
                        ? `${day.hotel.district} · ${day.hotel.rooms} room(s) · ${money(day.hotel.costLkr)}`
                        : "Last day or no hotel selected"}
                    </p>
                  </div>
                </div>

                <div className="tp-cost-strip">
                  <span>
                    Activities{" "}
                    {money(day.costs.entryLkr)}
                  </span>

                  <span>
                    Hotel{" "}
                    {money(day.costs.hotelLkr)}
                  </span>

                  <span>
                    Transport{" "}
                    {money(day.costs.transportLkr)}
                  </span>

                  <span>
                    Meals{" "}
                    {money(day.costs.mealsLkr)}
                  </span>

                  <strong>
                    Day total{" "}
                    {money(day.costs.totalLkr)}
                  </strong>
                </div>

                <p className="tp-hint">
                  <Clock3 size={14} />
                  Approx. {day.estimatedDistanceKm}
                  {" km travel estimate; not a mapped driving route."}
                </p>

                {dayEditing === day.date && (
                  <div className="tp-day-editor tp-no-print">
                    <h4>
                      Customize activities for {day.date}
                    </h4>

                    <label>
                      Search places

                      <input
                        placeholder="Search a destination or district"
                        value={filter}
                        onChange={e =>
                          setFilter(e.target.value)
                        }
                      />
                    </label>

                    <div className="tp-options-scroll">
                      {catalog.destinations
                        .filter(p =>
                          `${p.name} ${p.district} ${p.category}`
                            .toLowerCase()
                            .includes(
                              filter.toLowerCase()
                            )
                        )
                        .map(p => (
                          <label
                            key={p._id}
                            className="tp-option"
                          >
                            <input
                              type="checkbox"
                              checked={
                                chosenStops.includes(p._id)
                              }
                              disabled={
                                !chosenStops.includes(p._id) &&
                                chosenStops.length >= 6
                              }
                              onChange={() =>
                                setChosenStops(
                                  prev => toggle(prev, p._id)
                                )
                              }
                            />

                            <span>
                              <strong>{p.name}</strong>

                              <small>
                                {p.district} · {p.category}
                                {" · Base fee "}
                                {money(p.estimatedFeeLkr)}
                              </small>
                            </span>
                          </label>
                        ))}
                    </div>

                    {day.dayNumber < total.days && (
                      <label>
                        Overnight hotel

                        <select
                          value={chosenHotel}
                          onChange={e =>
                            setChosenHotel(e.target.value)
                          }
                        >
                          <option value="auto">
                            Auto-match hotel to updated places
                          </option>

                          <option value="none">
                            No overnight hotel
                          </option>

                          {catalog.hotels.map(h => (
                            <option
                              value={h._id}
                              key={h._id}
                            >
                              {h.name} · {h.district} ·{" "}
                              {money(h.indicativePriceLkr)}
                              {" / room"}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <div className="tp-actions">
                      <button
                        type="button"
                        className="tp-primary"
                        onClick={() =>
                          void saveDay(day.date)
                        }
                        disabled={busy}
                      >
                        <Save size={16} />
                        Save day & recalculate
                      </button>

                      <button
                        type="button"
                        className="tp-subtle"
                        onClick={() =>
                          setDayEditing(null)
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </section>
        </div>

        <aside className="tp-aside">
          <div className="tp-panel tp-sticky">
            <h2>
              <Wallet size={20} />
              Cost breakdown
            </h2>

            {[
              ["Entrance fees", total.entryLkr],
              ["Accommodation", total.hotelsLkr],
              ["Transport (estimated)", total.transportLkr],
              ["Meals (estimated)", total.mealsLkr]
            ].map(([label, value]) => (
              <div
                className="tp-metric"
                key={String(label)}
              >
                <span>{label}</span>
                <strong>
                  {money(Number(value))}
                </strong>
              </div>
            ))}

            <hr />

            <div className="tp-metric">
              <strong>Projected total</strong>
              <strong>
                {money(total.grandTotalLkr)}
              </strong>
            </div>

            <p className="tp-hint">
              Demo prices are estimates, not quotes.
              Room size assumed 2, entry fees assume
              children pay half; meals and travel
              are estimates.
            </p>

            {pkg && (
              <div className="tp-package-note">
                <span className="tp-pill">
                  Selected package
                </span>

                <h3>{pkg.name}</h3>
                <p>{pkg.description}</p>

                <small>
                  Highlights:{" "}
                  {(pkg.highlights || []).join(", ") ||
                    "See sample route"}
                </small>

                <p>
                  <small>
                    Template includes:{" "}
                    {(pkg.inclusions || []).join(", ") ||
                      "Suggested itinerary"}
                  </small>
                </p>

                <p>
                  <small>
                    Not included:{" "}
                    {(pkg.exclusions || []).join(", ") ||
                      "Actual reservations and purchases"}
                  </small>
                </p>

                <small>
                  Template reference from{" "}
                  {money(pkg.indicativeFromLkr)}.
                  Not added separately to total.
                </small>
              </div>
            )}

            <hr />

            <h3>
              <MapPin size={17} />
              More places to explore
            </h3>

            {suggestedPlaces.map(p => (
              <div
                className="tp-mini-item"
                key={p._id}
              >
                <strong>{p.name}</strong>

                <small>
                  {p.district} · {p.category}
                </small>
              </div>
            ))}

            {!suggestedPlaces.length && (
              <p className="tp-hint">
                All available places are included,
                or your dataset is empty.
              </p>
            )}

            <hr />

            <h3>
              <HotelIcon size={17} />
              Suggested hotels
            </h3>

            {suggestedHotels.map(h => (
              <div
                className="tp-mini-item"
                key={h._id}
              >
                <strong>{h.name}</strong>

                <small>
                  {h.district}
                  {" · "}
                  {money(h.indicativePriceLkr)}
                  {" per room/night"}
                </small>
              </div>
            ))}

            {!suggestedHotels.length && (
              <p className="tp-hint">
                Import hotels for recommended stays.
              </p>
            )}

            <button
              className="tp-subtle tp-no-print"
              type="button"
              onClick={() =>
                void regenerate(false)
              }
              disabled={busy}
            >
              <RefreshCw size={16} />
              Recalculate (keep edits)
            </button>
          </div>
        </aside>
      </div>

      <p className="tp-hint tp-disclaimer">
        This is a rule-based demonstration itinerary,
        not NSGA-II/DQN optimization.
        Check opening hours, road conditions,
        fees and hotel availability before travel.
        No reservation is created.
      </p>
    </main>
  );
}