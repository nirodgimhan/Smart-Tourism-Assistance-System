
import { useState, type FormEvent } from "react";
import { Hotel, Search } from "lucide-react";
import { api, getErrorMessage } from "../../services/api";
import { Link } from "react-router-dom";

interface Recommendation {
  hotelId: string;
  name: string;
  district?: string;
  score: number;
  reasons?: string[];
  indicativePriceLkr?: number;
}

export default function RecommendationsPage() {
  const [district, setDistrict] = useState("Kandy");
  const [budgetLkr, setBudgetLkr] = useState(15000);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function recommend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const { data } = await api.post("/hotels/recommend", {
        district,
        budgetLkr
      });
      setResults(data.items || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">SMART HOTEL FINDER</span>
        <h1>Personalized Hotel Recommendations</h1>
        <p>Find accommodation matching your travel budget.</p>
      </div>

      <form className="panel form-grid" onSubmit={recommend}>
        <label>
          District
          <input
            value={district}
            onChange={e => setDistrict(e.target.value)}
            required
          />
        </label>

        <label>
          Budget (LKR)
          <input
            type="number"
            min="0"
            value={budgetLkr}
            onChange={e => setBudgetLkr(Number(e.target.value))}
            required
          />
        </label>

        <button className="btn btn-primary" disabled={loading}>
          <Search size={18} />
          {loading ? "Finding..." : "Find Hotels"}
        </button>
      </form>

      {error && <div className="form-error">{error}</div>}

      <div className="dashboard-cards">
        {results.map(item => (
          <article className="dashboard-module-card" key={item.hotelId}>
            <Hotel size={28} />
            <h3>{item.name}</h3>
            <p>{item.district}</p>
            <strong>Match Score: {item.score.toFixed(2)}</strong>
            <p>{item.reasons?.join(" · ")}</p>
            <p>
              {item.indicativePriceLkr == null
                ? "Price unavailable"
                : `LKR ${item.indicativePriceLkr}`}
            </p>
            <Link
              className="btn btn-outline"
              to={`/hotels/${item.hotelId}`}
            >
              View Hotel
            </Link>
          </article>
        ))}
      </div>

      <p className="content-note">
        Recommendations require the backend hotel-ranking
        model and a verified hotel dataset.
      </p>
    </div>
  );
}
