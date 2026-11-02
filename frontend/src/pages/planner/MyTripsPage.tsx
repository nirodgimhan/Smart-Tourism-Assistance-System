import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  CalendarDays,
  Plus,
  Trash2,
  Users,
  ArrowRight,
  MapPin
} from "lucide-react";

import {
  getErrorMessage
} from "../../services/api";

import {
  tripApi,
  money,
  toLocalDate,
  type Trip
} from "../../services/tripPlanner.api";

import "../../styles/tripPlanner.css";

export default function MyTripsPage() {
  const [trips, setTrips] =
    useState<Trip[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [deleting, setDeleting] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    let alive = true;

    tripApi.list()
      .then(items => {
        if (alive) setTrips(items);
      })
      .catch(e => {
        if (alive) {
          setError(getErrorMessage(e));
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  async function remove(id: string) {
    if (
      !window.confirm(
        "Delete this trip and its saved plan?"
      )
    ) {
      return;
    }

    setDeleting(id);
    setError("");

    try {
      await tripApi.remove(id);

      setTrips(prev =>
        prev.filter(t => t._id !== id)
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDeleting("");
    }
  }

  return (
    <main className="container tp-page">
      <header className="tp-hero">
        <div className="tp-eyebrow">
          <MapPin size={16} />
          GOCELONE
        </div>

        <h1>My saved trips</h1>

        <p>
          View itineraries, update plans,
          manage hotels and check
          estimated budgets.
        </p>

        <Link
          className="tp-primary tp-inline"
          to="/planner"
        >
          <Plus size={18} />
          Plan a new trip
        </Link>
      </header>

      {error && (
        <div
          className="tp-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="tp-panel">
          Loading trips...
        </div>
      ) : trips.length === 0 ? (
        <div className="tp-panel tp-empty">
          <CalendarDays size={42} />

          <h2>No trips yet</h2>

          <p>
            Build your first personalized
            itinerary to see it here.
          </p>

          <Link
            to="/planner"
            className="tp-primary tp-inline"
          >
            Create trip
          </Link>
        </div>
      ) : (
        <div className="tp-trip-grid">
          {trips.map(trip => (
            <article
              key={trip._id}
              className="tp-trip-card"
            >
              <span className="tp-pill">
                {trip.status}
              </span>

              <h2>{trip.title}</h2>

              <p>
                <CalendarDays size={16} />
                {toLocalDate(trip.startDate)}
                {" — "}
                {toLocalDate(trip.endDate)}
              </p>

              <p>
                <Users size={16} />
                {trip.adults || 2} adults ·{" "}
                {trip.children || 0} children ·{" "}
                {trip.tripType || "custom"}
              </p>

              <p>
                <strong>
                  {money(trip.budgetLkr)}
                </strong>
                {" "}planned budget
              </p>

              <div className="tp-actions">
                <Link
                  className="tp-primary tp-inline"
                  to={`/trips/${trip._id}`}
                >
                  Open plan
                  <ArrowRight size={16} />
                </Link>

                <button
                  type="button"
                  className="tp-subtle"
                  disabled={
                    deleting === trip._id
                  }
                  onClick={() =>
                    void remove(trip._id)
                  }
                >
                  <Trash2 size={16} />

                  {deleting === trip._id
                    ? "Deleting"
                    : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}