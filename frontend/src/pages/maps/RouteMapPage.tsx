
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  LocateFixed,
  Route,
  Navigation,
  Square,
  Clock,
  MapPin
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

import LiveNavigationMap, {
  type MapPoint
} from "../../components/maps/LiveNavigationMap";

interface Destination {
  _id: string;
  name: string;
  district?: string;
  location: {
    coordinates: [number, number];
  };
}

interface RoadRoute {
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  distanceMeters: number;
  durationSeconds: number;
  instructions: {
    text: string;
    distanceMeters: number;
  }[];
}

export default function RouteMapPage() {
  const [searchParams] = useSearchParams();
  const destinationQuery = searchParams.get("destination") || "";

  const [current, setCurrent] =
    useState<MapPoint | null>(null);

  const [accuracy, setAccuracy] =
    useState<number | null>(null);

  const [destinations, setDestinations] =
    useState<Destination[]>([]);

  const [selectedId, setSelectedId] = useState(destinationQuery);

  const [roadRoute, setRoadRoute] =
    useState<RoadRoute | null>(null);

  const [navigating, setNavigating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const watchId = useRef<number | null>(null);
  const lastRouteAt = useRef(0);
  const requestId = useRef(0);
  const destinationRef = useRef<MapPoint | null>(null);

  const selected = destinations.find(
    (item) => item._id === selectedId
  );

  // Backend GeoJSON: [longitude, latitude]
  // Leaflet: [latitude, longitude]
  const destination: MapPoint | null = selected
    ? [
        selected.location.coordinates[1],
        selected.location.coordinates[0]
      ]
    : null;

  destinationRef.current = destination;

  // ======================================
  // LOAD DESTINATIONS
  // ======================================

  useEffect(() => {
    let active = true;

    api
      .get("/destinations?limit=100")
      .then(({ data }) => {
        if (active) {
          setDestinations(data.items || []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Sync destination from URL
  useEffect(() => {
    setSelectedId(destinationQuery);
    setRoadRoute(null);
    requestId.current += 1;
  }, [destinationQuery]);

  // ======================================
  // ENABLE GPS
  // ======================================

  function enableGPS() {
    if (!navigator.geolocation) {
      setError("GPS is not supported in this browser.");
      return;
    }

    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrent([
          position.coords.latitude,
          position.coords.longitude
        ]);

        setAccuracy(position.coords.accuracy);
      },
      (err) => {
        setError(`GPS error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  // ======================================
  // CALCULATE ROAD ROUTE
  // ======================================

  async function calculateRoute(
    start: MapPoint,
    end: MapPoint,
    showLoading = true
  ) {
    const id = ++requestId.current;

    if (showLoading) setLoading(true);

    try {
      const { data } = await api.post("/maps/route", {
        start: [start[1], start[0]],
        destination: [end[1], end[0]]
      });

      if (id === requestId.current) {
        setRoadRoute(data.route);
        setError("");
      }
    } catch (err) {
      if (id === requestId.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (id === requestId.current && showLoading) {
        setLoading(false);
      }
    }
  }

  // ======================================
  // SHOW ROUTE
  // ======================================

  function showRoute() {
    if (!current) {
      setError("Enable GPS first.");
      return;
    }

    if (!destination) {
      setError("Choose a destination first.");
      return;
    }

    void calculateRoute(current, destination);
  }

  // ======================================
  // STOP NAVIGATION
  // ======================================

  function stopNavigation() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setNavigating(false);
  }

  // ======================================
  // START LIVE NAVIGATION
  // ======================================

  function startNavigation() {
    if (!current || !destination || !roadRoute) {
      setError("Calculate the road route first.");
      return;
    }

    if (!navigator.geolocation) {
      setError("GPS is not supported.");
      return;
    }

    if (watchId.current !== null) return;

    setError("");
    lastRouteAt.current = Date.now();

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const point: MapPoint = [
          position.coords.latitude,
          position.coords.longitude
        ];

        setCurrent(point);
        setAccuracy(position.coords.accuracy);

        const now = Date.now();

        // Recalculate only when GPS is accurate
        // and at least 30 seconds have passed.
        if (
          destinationRef.current &&
          position.coords.accuracy <= 100 &&
          now - lastRouteAt.current >= 30000
        ) {
          lastRouteAt.current = now;

          void calculateRoute(
            point,
            destinationRef.current,
            false
          );
        }
      },
      (err) => {
        setError(`GPS tracking error: ${err.message}`);
        stopNavigation();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000
      }
    );

    setNavigating(true);
  }

  // ======================================
  // CLEANUP GPS TRACKING
  // ======================================

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, []);

  // ======================================
  // CONVERT BACKEND ROUTE TO LEAFLET
  // ======================================

  const routePoints: MapPoint[] =
    roadRoute?.geometry.coordinates.map(
      ([longitude, latitude]): MapPoint => [
        latitude,
        longitude
      ]
    ) || [];

  // ======================================
  // JSX
  // ======================================

  return (
    <div className="container map-page">
      <div className="page-title">
        <span className="section-eyebrow">
          GOCELONE GPS NAVIGATION
        </span>

        <h1>Smart Road Navigation</h1>

        <p>
          Find the road route from your GPS location
          to your selected destination.
        </p>
      </div>

      {/* NAVIGATION CONTROLS */}
      <div className="panel navigation-form">
        <div className="navigation-controls">
          <button
            type="button"
            className="btn btn-outline"
            onClick={enableGPS}
            disabled={navigating}
          >
            <LocateFixed size={18} />
            Enable GPS
          </button>

          <label>
            Choose Destination

            <select
              value={selectedId}
              disabled={navigating}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setRoadRoute(null);
                requestId.current += 1;
                setLoading(false);
              }}
            >
              <option value="">
                Select Destination
              </option>

              {destinations.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                  {item.district
                    ? ` - ${item.district}`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="btn btn-primary"
            onClick={showRoute}
            disabled={
              !current ||
              !destination ||
              loading
            }
          >
            <Route size={18} />
            {loading ? "Loading..." : "Show Route"}
          </button>
        </div>

        {/* GPS LOCATION */}
        {current && (
          <p className="gps-status">
            <MapPin size={17} />
            GPS: {current[0].toFixed(5)},{" "}
            {current[1].toFixed(5)}
            {accuracy !== null &&
              ` · Accuracy ${Math.round(accuracy)}m`}
          </p>
        )}

        {accuracy !== null && accuracy > 100 && (
          <p className="content-note">
            GPS accuracy is low. Navigation position
            may be approximate.
          </p>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>

      {/* ROUTE SUMMARY */}
      {roadRoute && (
        <div className="navigation-summary">
          <div>
            <Route size={24} />

            <strong>
              {(
                roadRoute.distanceMeters / 1000
              ).toFixed(1)}{" "}
              km
            </strong>

            <span>Road Distance</span>
          </div>

          <div>
            <Clock size={24} />

            <strong>
              {Math.round(
                roadRoute.durationSeconds / 60
              )}{" "}
              min
            </strong>

            <span>Estimated Driving Time</span>
          </div>

          <div>
            <Navigation size={24} />

            <strong>
              {navigating ? "Tracking" : "Ready"}
            </strong>

            <span>GPS Status</span>
          </div>
        </div>
      )}

      {/* ===================================
          REAL OPENSTREETMAP MAP
      ==================================== */}

      <LiveNavigationMap
        current={current}
        destination={destination}
        route={routePoints}
      />

      {/* LIVE NAVIGATION */}
      {roadRoute && (
        <div className="panel navigation-bottom">
          <h2>Navigation</h2>

          {navigating ? (
            <button
              className="btn btn-danger"
              onClick={stopNavigation}
            >
              <Square size={18} />
              Stop Navigation
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={startNavigation}
            >
              <Navigation size={18} />
              Start Navigation
            </button>
          )}

          <h3>Driving Directions</h3>

          <ol className="directions-list">
            {(roadRoute.instructions || []).map(
              (step, index) => (
                <li key={index}>
                  <span className="direction-number">
                    {index + 1}
                  </span>

                  <div>
                    <p>{step.text}</p>

                    <small>
                      {(
                        step.distanceMeters / 1000
                      ).toFixed(2)}{" "}
                      km
                    </small>
                  </div>
                </li>
              )
            )}
          </ol>
        </div>
      )}

      <p className="content-note">
        GPS accuracy and road routes may vary.
        This is a prototype foreground navigation
        feature. Always follow road signs and
        official directions.
      </p>
    </div>
  );
}
