
import { useEffect, useState } from "react";
import {
  Link,
  useParams
} from "react-router-dom";

import {
  MapPin,
  CalendarDays,
  Navigation
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface Trip {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  budgetLkr: number;
  interests: string[];
  transportMode: string;
  status: string;
  destinationIds?: {
    _id: string;
    name: string;
  }[];
}

export default function TripDetailsPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function load() {
      try {
        const { data } = await api.get(`/trips/${id}`);

        if (active) setTrip(data.trip);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container inner-page">
        Loading trip...
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="container inner-page">
        <p className="form-error">
          {error || "Trip not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          TRIP DETAILS
        </span>

        <h1>{trip.title}</h1>
        <p>Status: {trip.status}</p>
      </div>

      <div className="panel">
        <CalendarDays size={27} />

        <h2>Your Journey</h2>

        <p>
          <strong>Start Date:</strong>{" "}
          {new Date(trip.startDate).toLocaleDateString()}
        </p>

        <p>
          <strong>End Date:</strong>{" "}
          {new Date(trip.endDate).toLocaleDateString()}
        </p>

        <p>
          <strong>Budget:</strong>{" "}
          LKR {trip.budgetLkr.toLocaleString()}
        </p>

        <p>
          <strong>Transport:</strong>{" "}
          {trip.transportMode}
        </p>

        <p>
          <strong>Interests:</strong>{" "}
          {trip.interests.join(", ") || "Not selected"}
        </p>

        <h3>Selected Destinations</h3>

        {trip.destinationIds?.length ? (
          trip.destinationIds.map(destination => (
            <p key={destination._id}>
              <MapPin size={16} />
              {" "}{destination.name}
            </p>
          ))
        ) : (
          <p>No destinations selected yet.</p>
        )}

        <Link
          to="/maps/navigation"
          className="btn btn-primary"
        >
          <Navigation size={18} />
          Open GPS Navigation
        </Link>
      </div>

      <p className="content-note">
        Optimized day-by-day itinerary generation
        requires a connected planner AI service.
      </p>
    </div>
  );
}
