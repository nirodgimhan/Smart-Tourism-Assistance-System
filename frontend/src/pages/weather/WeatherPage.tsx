
import {
  useState,
  type FormEvent
} from "react";

import { Link } from "react-router-dom";
import {
  CloudSun,
  Search,
  AlertTriangle
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface WeatherResponse {
  source?: string;
  data?: {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      wind_speed_10m?: number;
    };
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
    };
  };
}

export default function WeatherPage() {
  const [latitude, setLatitude] = useState(6.9271);
  const [longitude, setLongitude] = useState(79.8612);

  const [weather, setWeather] =
    useState<WeatherResponse | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const { data } = await api.get(
        "/weather/forecast",
        {
          params: {
            lat: latitude,
            lon: longitude
          }
        }
      );

      setWeather(data);
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
          GOCELONE WEATHER INTELLIGENCE
        </span>

        <h1>Weather Forecast</h1>

        <p>
          Explore weather information for
          your selected location.
        </p>
      </div>

      <form className="panel form-grid" onSubmit={search}>
        <label>
          Latitude
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
          Longitude
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
          className="btn btn-primary"
          disabled={loading}
        >
          <Search size={18} />
          {loading ? "Loading..." : "Get Weather"}
        </button>
      </form>

      <div className="button-row">
        <Link
          to="/weather/vsi"
          className="btn btn-outline"
        >
          <CloudSun size={18} />
          Visit Suitability Index
        </Link>

        <Link
          to="/weather/alerts"
          className="btn btn-outline"
        >
          <AlertTriangle size={18} />
          Weather Alerts
        </Link>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {weather?.data?.current && (
        <div className="panel">
          <CloudSun size={35} />

          <h2>Current Weather</h2>

          <p>
            <strong>Temperature:</strong>{" "}
            {weather.data.current.temperature_2m ?? "N/A"} °C
          </p>

          <p>
            <strong>Humidity:</strong>{" "}
            {weather.data.current.relative_humidity_2m ??
              "N/A"}%
          </p>

          <p>
            <strong>Wind Speed:</strong>{" "}
            {weather.data.current.wind_speed_10m ??
              "N/A"}
          </p>
        </div>
      )}

      {weather?.data?.daily && (
        <>
          <h2>Daily Forecast</h2>

          <div className="dashboard-cards">
            {(weather.data.daily.time || []).map(
              (date, index) => (
                <article
                  className="dashboard-module-card"
                  key={date}
                >
                  <CloudSun size={27} />

                  <h3>{date}</h3>

                  <p>
                    Max:{" "}
                    {weather.data?.daily
                      ?.temperature_2m_max?.[index] ?? "N/A"}
                    {" °C"}
                  </p>

                  <p>
                    Min:{" "}
                    {weather.data?.daily
                      ?.temperature_2m_min?.[index] ?? "N/A"}
                    {" °C"}
                  </p>

                  <p>
                    Rain:{" "}
                    {weather.data?.daily
                      ?.precipitation_sum?.[index] ?? "N/A"}
                    {" mm"}
                  </p>
                </article>
              )
            )}
          </div>
        </>
      )}

      {weather && (
        <p className="content-note">
          Weather Source:{" "}
          {weather.source || "Not specified"}
        </p>
      )}

      <p className="content-note">
        The backend weather provider must be connected
        for forecasts. ML-based weather prediction
        and Visit Suitability Index are separate
        research components.
      </p>
    </div>
  );
}
