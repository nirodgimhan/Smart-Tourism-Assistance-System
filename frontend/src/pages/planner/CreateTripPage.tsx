
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Route,
  LocateFixed
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

export default function CreateTripPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetLkr, setBudgetLkr] = useState(30000);
  const [interests, setInterests] = useState("");
  const [latitude, setLatitude] = useState(7.2906);
  const [longitude, setLongitude] = useState(80.6337);
  const [transportMode, setTransportMode] =
    useState<"driving" | "walking">("driving");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function useGPS() {
    if (!navigator.geolocation) {
      setError("GPS not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setError("");
      },
      err => setError(err.message),
      {
        enableHighAccuracy: true,
        timeout: 15000
      }
    );
  }

  async function createTrip(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (endDate < startDate) {
      setError("End date must be after start date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/trips", {
        title,
        startDate: new Date(
          `${startDate}T12:00:00+05:30`
        ).toISOString(),
        endDate: new Date(
          `${endDate}T12:00:00+05:30`
        ).toISOString(),
        budgetLkr,
        interests: interests
          .split(",")
          .map(x => x.trim())
          .filter(Boolean),
        destinationIds: [],
        startLocation: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        transportMode
      });

      navigate(`/trips/${data.trip._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          SMART TRAVEL PLANNER
        </span>

        <h1>Create Your Trip</h1>

        <p>
          Enter your travel details and save the trip
          to your Gocelone account.
        </p>
      </div>

      <form
        className="panel form-grid"
        onSubmit={createTrip}
      >
        <label className="full-field">
          Trip Name
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="My Sri Lanka Adventure"
            required
          />
        </label>

        <label>
          Start Date
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
        </label>

        <label>
          End Date
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
            required
          />
        </label>

        <label>
          Budget (LKR)
          <input
            type="number"
            min={0}
            value={budgetLkr}
            onChange={e =>
              setBudgetLkr(Number(e.target.value))
            }
            required
          />
        </label>

        <label>
          Transportation
          <select
            value={transportMode}
            onChange={e =>
              setTransportMode(
                e.target.value as "driving" | "walking"
              )
            }
          >
            <option value="driving">Driving</option>
            <option value="walking">Walking</option>
          </select>
        </label>

        <label className="full-field">
          Interests
          <input
            value={interests}
            onChange={e => setInterests(e.target.value)}
            placeholder="Nature, Culture, Beaches"
          />
        </label>

        <label>
          Starting Latitude
          <input
            type="number"
            step="any"
            min={-90}
            max={90}
            value={latitude}
            onChange={e =>
              setLatitude(Number(e.target.value))
            }
          />
        </label>

        <label>
          Starting Longitude
          <input
            type="number"
            step="any"
            min={-180}
            max={180}
            value={longitude}
            onChange={e =>
              setLongitude(Number(e.target.value))
            }
          />
        </label>

        <button
          type="button"
          className="btn btn-outline"
          onClick={useGPS}
        >
          <LocateFixed size={18} />
          Use My GPS
        </button>

        {error && (
          <div className="form-error full-field">
            {error}
          </div>
        )}

        <div className="full-field">
          <button
            className="btn btn-primary"
            disabled={loading}
          >
            <Route size={18} />
            {loading ? "Saving..." : "Create Trip"}
          </button>
        </div>
      </form>

      <p className="content-note">
        This page saves trip details. NSGA-II itinerary
        generation must be integrated separately.
      </p>
    </div>
  );
}
