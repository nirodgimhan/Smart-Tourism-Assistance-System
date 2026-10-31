
import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { api, getErrorMessage } from "../../services/api";

interface FraudAlert {
  _id: string;
  title: string;
  description?: string;
  severity?: string;
  reason?: string;
  createdAt?: string;
  status?: string;
}

export default function FraudAlertsPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/fraud/alerts")
      .then(({ data }) => {
        setAlerts(data.items || []);
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          TOURIST SAFETY
        </span>
        <h1>Fraud & Price Alerts</h1>
        <p>
          Review potential price anomalies flagged by
          Gocelone's safety analysis.
        </p>
      </div>

      {loading && <p>Loading your alerts...</p>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && alerts.length === 0 && (
        <div className="panel">
          <ShieldCheck size={30} />
          <h3>No recorded alerts</h3>
          <p>
            No alerts are present in the connected data.
            This does not verify that a transaction is safe.
          </p>
        </div>
      )}

      {alerts.map(alert => (
        <article className="panel" key={alert._id}>
          <div className="button-row">
            <AlertTriangle size={22} />
            <strong>{alert.severity || "Review needed"}</strong>
          </div>

          <h3>{alert.title}</h3>
          <p>{alert.description || alert.reason}</p>
          <small>
            {alert.status || "Unreviewed"}
            {alert.createdAt &&
              ` · ${new Date(alert.createdAt).toLocaleString()}`}
          </small>
        </article>
      ))}

      <p className="content-note">
        An anomaly flag does not prove fraud.
        Results require human review and reliable
        contextual price baselines.
      </p>
    </div>
  );
}
