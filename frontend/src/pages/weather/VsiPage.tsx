import { useState, useEffect, type FormEvent } from "react";
import { CloudSun, MapPin } from "lucide-react";
import { api, getErrorMessage } from "../../services/api";
import {
  fetchDestinations,
  type DestinationRecord,
} from "../../services/destination.api";

interface VsiResult {
  score: number | null;
  category: string;
  recommendation?: string;
  factors?: Record<string, number | null>;
  source?: string;
  dataCoverageStatus?: string;
}

export default function VsiPage() {
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState("");
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<VsiResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    fetchDestinations(100)
      .then((items) => {
        if (active) {
          setDestinations(items);
          if (items.length > 0) {
            setSelectedDestinationId(items[0]._id);
          }
        }
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setDestinationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function calculate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const selected = destinations.find((d) => d._id === selectedDestinationId);
    if (!selected) {
      setError("Please select a destination.");
      setLoading(false);
      return;
    }

    const coords = selected.location?.coordinates;
    const longitude = coords?.[0];
    const latitude = coords?.[1];

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError("Selected destination does not have valid coordinates.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/vsi/calculate", {
        latitude,
        longitude,
        date,
      });

      setResult(data.result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">WEATHER INTELLIGENCE</span>
        <h1>Visit Suitability Index</h1>
        <p>
          Evaluate destination suitability using weather conditions and the
          research scoring model.
        </p>
      </div>

      <form className="panel form-grid" onSubmit={calculate}>
        <label>
          <span>
            <MapPin size={16} /> Destination
          </span>
          <select
            value={selectedDestinationId}
            onChange={(e) => setSelectedDestinationId(e.target.value)}
            disabled={destinationsLoading || loading}
            required
          >
            <option value="">
              {destinationsLoading
                ? "Loading destinations..."
                : "Select destination"}
            </option>
            {destinations.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
                {item.district ? ` - ${item.district}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Travel Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <button
          className="btn btn-primary"
          disabled={loading || destinationsLoading}
        >
          <CloudSun size={18} />
          {loading ? "Calculating..." : "Check Suitability"}
        </button>
      </form>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="panel">
          <h2>Visit Suitability Result</h2>

          <div className="vsi-score">
            {result.score !== null && result.score !== undefined
              ? result.score.toFixed(1)
              : "N/A"}
          </div>

          <h3>{result.category}</h3>

          {result.score === null && (
            <p className="content-note">
              Insufficient data to compute a Visit Suitability Index score for
              this date.
            </p>
          )}

          {result.recommendation && <p>{result.recommendation}</p>}

          {result.factors && (
            <div className="vsi-factors">
              {Object.entries(result.factors).map(([name, value]) => (
                <div key={name}>
                  <span>{name}</span>
                  <strong>
                    {value !== null && value !== undefined ? value : "N/A"}
                  </strong>
                </div>
              ))}
            </div>
          )}

          <p className="content-note">
            Source: {result.source || "Not specified"}
          </p>
        </div>
      )}

      <p className="content-note">
        The VSI model requires weather forecasts, calibrated scoring factors and
        a completed backend. No suitability value is invented by this page.
      </p>
    </div>
  );
}
