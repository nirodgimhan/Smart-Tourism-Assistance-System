
import { useEffect, useState } from "react";
import { AlertTriangle, CloudSun } from "lucide-react";
import { api, getErrorMessage } from "../../services/api";

interface WeatherAlert {
  _id: string;
  title: string;
  message: string;
  severity: string;
  district?: string;
  createdAt?: string;
}

export default function WeatherAlertsPage() {
  const [items, setItems] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/weather/alerts")
      .then(({ data }) => {
        setItems(data.items || []);
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          WEATHER INTELLIGENCE
        </span>
        <h1>Weather Alerts</h1>
        <p>Weather advisories from connected data sources.</p>
      </div>

      {loading && <p>Checking weather alerts...</p>}

      {error && (
        <div className="form-error">{error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="panel">
          <CloudSun size={30} />
          <h3>No alerts in the connected database</h3>
          <p>
            This does not guarantee that there are
            no official weather warnings.
          </p>
        </div>
      )}

      {items.map(item => (
        <article className="panel" key={item._id}>
          <div className="button-row">
            <AlertTriangle size={22} />
            <strong>{item.severity}</strong>
          </div>
          <h3>{item.title}</h3>
          <p>{item.message}</p>
          <small>
            {item.district || "Sri Lanka"}
            {item.createdAt &&
              ` · ${new Date(item.createdAt).toLocaleString()}`}
          </small>
        </article>
      ))}

      <p className="content-note">
        For safety-critical decisions, consult the official
        Department of Meteorology warnings.
      </p>
    </div>
  );
}
