
import { useState } from "react";
import {
  Siren,
  MapPin,
  ShieldAlert,
  Phone
} from "lucide-react";

export default function SosPage() {
  const [location, setLocation] = useState<{
    lat: number;
    lon: number;
    accuracy: number;
  } | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function findLocation() {
    if (!navigator.geolocation) {
      setError("GPS is not supported on this device.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          EMERGENCY INFORMATION
        </span>
        <h1>SOS & Emergency Assistance</h1>
        <p>
          Find your coordinates and contact verified
          local emergency services directly.
        </p>
      </div>

      <div className="panel">
        <Siren size={40} color="#b84040" />

        <h2>Need urgent assistance?</h2>

        <p>
          This Gocelone research prototype does not
          dispatch emergency responders.
          In an emergency, contact the appropriate
          local emergency service directly.
        </p>

        <button
          className="btn btn-primary"
          onClick={findLocation}
          disabled={loading}
        >
          <MapPin size={18} />
          {loading
            ? "Finding GPS location..."
            : "Find My GPS Location"}
        </button>

        {error && (
          <div className="form-error">{error}</div>
        )}

        {location && (
          <div className="panel" style={{ marginTop: 20 }}>
            <h3>Your Current Coordinates</h3>

            <p>
              Latitude: {location.lat.toFixed(6)}
            </p>
            <p>
              Longitude: {location.lon.toFixed(6)}
            </p>
            <p>
              Estimated GPS accuracy:{" "}
              {Math.round(location.accuracy)} metres
            </p>

            <a
              className="btn btn-outline"
              href={
                `https://www.openstreetmap.org/` +
                `?mlat=${location.lat}&mlon=${location.lon}` +
                `#map=16/${location.lat}/${location.lon}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={17} />
              View Location on Map
            </a>
          </div>
        )}
      </div>

      <div className="panel">
        <ShieldAlert size={25} />
        <h3>Emergency Directory</h3>
        <p>
          Verified emergency contact information
          must be added by administrators.
        </p>

        <div className="button-row">
          <Phone size={18} />
          <span>
            Emergency dispatch integration: Not enabled
          </span>
        </div>
      </div>
    </div>
  );
}
