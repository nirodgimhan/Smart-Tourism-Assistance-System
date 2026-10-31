
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  Navigation,
  ArrowLeft,
  Clock3,
  Wallet,
  Compass
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface Destination {
  _id: string;
  name: string;
  description?: string;
  category: string;
  district?: string;
  province?: string;
  images?: string[];
  openingHours?: string;
  estimatedFeeLkr?: number;
  verified?: boolean;
  source?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

export default function DestinationDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [destination, setDestination] =
    useState<Destination | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Destination ID is missing.");
      setLoading(false);
      return;
    }

    let active = true;

    async function loadDestination() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(
          `/destinations/${id}`
        );

        if (active) {
          setDestination(data.destination ?? null);
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDestination();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container inner-page">
        <div className="panel">
          Loading destination information...
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="container inner-page">
        <div className="form-error">
          {error || "Destination not found."}
        </div>

        <Link to="/explore" className="btn btn-outline">
          <ArrowLeft size={18} />
          Back to Explore
        </Link>
      </div>
    );
  }

  const locationName = [
    destination.district,
    destination.province
  ].filter(Boolean).join(", ");

  return (
    <div className="container inner-page">
      <Link to="/explore" className="text-link">
        <ArrowLeft size={18} />
        Back to Explore
      </Link>

      <div
        className="page-title"
        style={{ marginTop: 24 }}
      >
        <span className="section-eyebrow">
          {destination.category}
        </span>

        <h1>{destination.name}</h1>

        <p>
          <MapPin size={17} />
          {" "}
          {locationName || "Sri Lanka"}
        </p>
      </div>

      {destination.images?.[0] ? (
        <img
          className="destination-detail-hero"
          src={destination.images[0]}
          alt={destination.name}
        />
      ) : (
        <div className="destination-detail-placeholder">
          <Compass size={65} />
          <span>{destination.name}</span>
        </div>
      )}

      <div className="destination-detail-grid">
        <section className="panel">
          <h2>About This Destination</h2>

          <p>
            {destination.description ||
              "Detailed information is not available yet."}
          </p>

          <h3>Travel Information</h3>

          <div className="destination-info-row">
            <Clock3 size={20} />
            <div>
              <strong>Opening Hours</strong>
              <p>
                {destination.openingHours ||
                  "Not verified"}
              </p>
            </div>
          </div>

          <div className="destination-info-row">
            <Wallet size={20} />
            <div>
              <strong>Estimated Entry Fee</strong>
              <p>
                {destination.estimatedFeeLkr == null
                  ? "Not available"
                  : `LKR ${destination.estimatedFeeLkr.toLocaleString()}`}
              </p>
            </div>
          </div>

          <div className="destination-info-row">
            <MapPin size={20} />
            <div>
              <strong>Location</strong>
              <p>{locationName || "Sri Lanka"}</p>
            </div>
          </div>

          <p className="content-note">
            Information status:{" "}
            {destination.verified
              ? "Verified"
              : "Not independently verified"}
          </p>

          {destination.source && (
            <p className="content-note">
              Source: {destination.source}
            </p>
          )}
        </section>

        <aside className="panel">
          <h3>Plan Your Visit</h3>

          <p>
            View the road route from your current
            GPS location to this destination.
          </p>

          <Link
            to={`/maps/navigation?destination=${destination._id}`}
            className="btn btn-primary"
          >
            <Navigation size={18} />
            Start GPS Navigation
          </Link>

          <Link
            to="/planner"
            className="btn btn-outline"
            style={{ marginTop: 12 }}
          >
            <Compass size={18} />
            Plan a Trip
          </Link>
        </aside>
      </div>
    </div>
  );
}
