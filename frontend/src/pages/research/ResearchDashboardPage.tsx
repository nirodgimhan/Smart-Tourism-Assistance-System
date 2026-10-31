
import { useEffect, useState } from "react";
import {
  Brain,
  Database,
  BarChart3,
  Microscope
} from "lucide-react";
import { api, getErrorMessage } from "../../services/api";

interface ModelStatus {
  id: string;
  name: string;
  version?: string;
  status: string;
  metricName?: string;
  metricValue?: number;
}

export default function ResearchDashboardPage() {
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/research/models")
      .then(({ data }) => {
        setModels(data.items || []);
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          J26-IT-464 · RESEARCH
        </span>
        <h1>Research Dashboard</h1>
        <p>
          Monitor algorithm versions, experiments
          and evaluation results.
        </p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-module-card">
          <Brain size={30} />
          <h3>Smart Travel Planner</h3>
          <p>NSGA-II optimization and DQN replanning.</p>
        </div>

        <div className="dashboard-module-card">
          <Database size={30} />
          <h3>Cultural AI Guide</h3>
          <p>Multilingual source-grounded RAG.</p>
        </div>

        <div className="dashboard-module-card">
          <BarChart3 size={30} />
          <h3>Weather Intelligence</h3>
          <p>Forecasting, VSI and hotel ranking.</p>
        </div>

        <div className="dashboard-module-card">
          <Microscope size={30} />
          <h3>Safety Research</h3>
          <p>OCR, anomaly detection and navigation safety.</p>
        </div>
      </div>

      <h2>Registered Models</h2>

      {loading && <p>Loading research models...</p>}
      {error && <div className="form-error">{error}</div>}

      <div className="dashboard-cards">
        {models.map(model => (
          <article className="dashboard-module-card" key={model.id}>
            <h3>{model.name}</h3>
            <p>Version: {model.version || "Unspecified"}</p>
            <p>Status: {model.status}</p>

            {model.metricValue !== undefined && (
              <p>
                {model.metricName || "Metric"}:{" "}
                {model.metricValue}
              </p>
            )}
          </article>
        ))}
      </div>

      {!loading && !error && models.length === 0 && (
        <p>No research model records are registered.</p>
      )}

      <p className="content-note">
        Model performance must come from real,
        reproducible experiments. This dashboard
        does not generate evaluation results.
      </p>
    </div>
  );
}
