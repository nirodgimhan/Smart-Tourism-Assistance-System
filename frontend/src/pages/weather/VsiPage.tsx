
import { useState, type FormEvent } from "react";
import { CloudSun, MapPin } from "lucide-react";
import { api, getErrorMessage } from "../../services/api";

interface VsiResult {
  score: number;
  category: string;
  recommendation?: string;
  factors?: Record<string, number>;
  source?: string;
}

export default function VsiPage() {
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [result, setResult] = useState<VsiResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function calculate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data } = await api.post("/vsi/calculate", {
        destination,
        date
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
        <span className="section-eyebrow">
          WEATHER INTELLIGENCE
        </span>
        <h1>Visit Suitability Index</h1>
        <p>
          Evaluate destination suitability using weather
          conditions and the research scoring model.
        </p>
      </div>

      <form className="panel form-grid" onSubmit={calculate}>
        <label>
          <span><MapPin size={16} /> Destination</span>
          <input
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder="e.g. Sigiriya"
            required
          />
        </label>

        <label>
          Travel Date
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </label>

        <button
          className="btn btn-primary"
          disabled={loading}
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
            {result.score.toFixed(1)}
          </div>

          <h3>{result.category}</h3>

          <p>
            {result.recommendation ||
              "No detailed recommendation available."}
          </p>

          {result.factors && (
            <div className="vsi-factors">
              {Object.entries(result.factors).map(
                ([name, value]) => (
                  <div key={name}>
                    <span>{name}</span>
                    <strong>{value}</strong>
                  </div>
                )
              )}
            </div>
          )}

          <p className="content-note">
            Source: {result.source || "Not specified"}
          </p>
        </div>
      )}

      <p className="content-note">
        The VSI model requires weather forecasts,
        calibrated scoring factors and a completed backend.
        No suitability value is invented by this page.
      </p>
    </div>
  );
}
