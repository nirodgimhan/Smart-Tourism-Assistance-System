
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  CalendarDays,
  Map,
  Plus,
  Trash2,
  Wallet,
  ArrowRight,
  RefreshCw,
  Route
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface Trip {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  budgetLkr: number;
  status: string;
  transportMode?: string;
  interests?: string[];
  destinationIds?: string[];
}

export default function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load all trips belonging to the logged-in user
  async function loadTrips() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/trips");

      setTrips(
        Array.isArray(data.items) ? data.items : []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTrips();
  }, []);

  // Delete selected trip
  async function deleteTrip(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this trip?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      await api.delete(`/trips/${id}`);

      setTrips(previous =>
        previous.filter(trip => trip._id !== id)
      );

      setMessage("Trip deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  return (
    <div className="container inner-page">
      {/* PAGE HEADER */}
      <div className="page-title">
        <span className="section-eyebrow">
          GOCELONE SMART TRAVEL PLANNER
        </span>

        <h1>My Trips</h1>

        <p>
          View, manage and explore your saved
          Sri Lankan travel plans.
        </p>

        <div className="button-row">
          <Link to="/planner" className="btn btn-primary">
            <Plus size={18} />
            Create New Trip
          </Link>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void loadTrips()}
            disabled={loading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div
          className="panel"
          role="status"
          style={{ marginBottom: 20 }}
        >
          {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="panel">
          <p>Loading your trips...</p>
        </div>
      )}

      {/* TRIP COUNT */}
      {!loading && !error && (
        <div className="panel" style={{ marginBottom: 25 }}>
          <div className="button-row">
            <Map size={23} color="#167D85" />
            <strong>
              Total Saved Trips: {trips.length}
            </strong>
          </div>
        </div>
      )}

      {/* TRIP CARDS */}
      {!loading && (
        <div className="dashboard-cards">
          {trips.map(trip => (
            <article
              key={trip._id}
              className="dashboard-module-card"
            >
              <div className="trip-card-icon">
                <Route size={30} />
              </div>

              <span className="section-eyebrow">
                {trip.status || "Saved Trip"}
              </span>

              <h3>{trip.title}</h3>

              <div className="trip-meta">
                {/* TRAVEL DATES */}
                <p>
                  <CalendarDays size={18} />
                  <span>
                    {formatDate(trip.startDate)}
                    {" - "}
                    {formatDate(trip.endDate)}
                  </span>
                </p>

                {/* BUDGET */}
                <p>
                  <Wallet size={18} />
                  <span>
                    Budget: LKR{" "}
                    {trip.budgetLkr.toLocaleString()}
                  </span>
                </p>

                {/* DESTINATION COUNT */}
                <p>
                  <Map size={18} />
                  <span>
                    {trip.destinationIds?.length ?? 0}
                    {" destinations"}
                  </span>
                </p>

                {/* TRANSPORT */}
                {trip.transportMode && (
                  <p>
                    <Route size={18} />
                    <span>
                      Transport: {trip.transportMode}
                    </span>
                  </p>
                )}
              </div>

              {/* INTERESTS */}
              {!!trip.interests?.length && (
                <p>
                  <strong>Interests:</strong>{" "}
                  {trip.interests.join(", ")}
                </p>
              )}

              {/* ACTION BUTTONS */}
              <div className="button-row">
                <Link
                  to={`/trips/${trip._id}`}
                  className="btn btn-primary"
                >
                  View Trip
                  <ArrowRight size={17} />
                </Link>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={deletingId === trip._id}
                  onClick={() => void deleteTrip(trip._id)}
                >
                  <Trash2 size={17} />
                  {deletingId === trip._id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* NO TRIPS */}
      {!loading && !error && trips.length === 0 && (
        <div className="panel" style={{ textAlign: "center" }}>
          <Map
            size={45}
            color="#167D85"
          />

          <h2>No Trips Created Yet</h2>

          <p>
            You haven't created any trips yet.
            Start planning your first adventure
            around Sri Lanka!
          </p>

          <Link
            to="/planner"
            className="btn btn-primary"
          >
            <Plus size={18} />
            Plan My First Trip
          </Link>
        </div>
      )}
    </div>
  );
}
