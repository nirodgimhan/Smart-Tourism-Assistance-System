
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  LocateFixed,
  Route,
  Navigation,
  Square,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  Bell,
  Compass
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

import LiveNavigationMap, {
  type MapPoint,
  type NearbyPlace,
  type TravelMode,
  type NavigationLanguage
} from "../../components/maps/LiveNavigationMap";

// =====================================
// TYPES
// =====================================

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
  instructions?: {
    text: string;
    distanceMeters: number;
  }[];
}

interface NavigationAlert {
  id: string;
  message: string;
  time: string;
}

const messages: Record<
  NavigationLanguage,
  {
    started: string;
    near2km: string;
    near500m: string;
    near100m: string;
    nearby: string;
    location: string;
  }
> = {
  "en-US": {
    started: "Navigation started.",
    near2km: "Your destination is approximately two kilometers away.",
    near500m: "Your destination is about five hundred meters away.",
    near100m: "You are very close to your destination.",
    nearby: "Interesting tourist place nearby:",
    location: "Your current coordinates are"
  },
  "si-LK": {
    started: "ගමන් මග පෙන්වීම ආරම්භ කළා.",
    near2km: "ගමනාන්තයට කිලෝමීටර් දෙකක් පමණ තිබෙනවා.",
    near500m: "ගමනාන්තයට මීටර් පන්සියයක් පමණ තිබෙනවා.",
    near100m: "ඔබ ගමනාන්තයට ඉතා ආසන්නයි.",
    nearby: "ඔබ අසල නැරඹිය හැකි ස්ථානයක්:",
    location: "ඔබගේ වත්මන් ඛණ්ඩාංක"
  },
  "ta-IN": {
    started: "வழிகாட்டல் தொடங்கப்பட்டது.",
    near2km: "இலக்கு சுமார் இரண்டு கிலோமீட்டர் தொலைவில் உள்ளது.",
    near500m: "இலக்கு சுமார் ஐந்நூறு மீட்டர் தொலைவில் உள்ளது.",
    near100m: "நீங்கள் இலக்கிற்கு மிக அருகில் உள்ளீர்கள்.",
    nearby: "அருகில் பார்க்கக்கூடிய இடம்:",
    location: "உங்கள் தற்போதைய ஆயத்தொலைவுகள்"
  },
  "hi-IN": {
    started: "नेविगेशन शुरू हो गया है।",
    near2km: "आपका गंतव्य लगभग दो किलोमीटर दूर है।",
    near500m: "आपका गंतव्य लगभग पाँच सौ मीटर दूर है।",
    near100m: "आप अपने गंतव्य के बहुत करीब हैं।",
    nearby: "पास में देखने लायक जगह:",
    location: "आपके वर्तमान निर्देशांक हैं"
  }
};

// =====================================
// HELPERS
// =====================================

function validPoint(point: MapPoint): boolean {
  return (
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1]) &&
    Math.abs(point[0]) <= 90 &&
    Math.abs(point[1]) <= 180
  );
}

function distanceMeters(a: MapPoint, b: MapPoint) {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * rad) *
      Math.cos(b[0] * rad) *
      Math.sin(dLng / 2) ** 2;

  return 6371000 * 2 * Math.atan2(
    Math.sqrt(x),
    Math.sqrt(Math.max(0, 1 - x))
  );
}

function formatPoint(point: MapPoint): string {
  return `${point[0].toFixed(5)}, ${point[1].toFixed(5)}`;
}

// =====================================
// MAIN PAGE
// =====================================

export default function RouteMapPage() {
  const [searchParams] = useSearchParams();
  const queryDestination =
    searchParams.get("destination") ?? "";

  const [destinations, setDestinations] =
    useState<Destination[]>([]);
  const [selectedId, setSelectedId] =
    useState(queryDestination);

  const [current, setCurrent] =
    useState<MapPoint | null>(null);
  const [accuracy, setAccuracy] =
    useState<number | null>(null);
  const [roadRoute, setRoadRoute] =
    useState<RoadRoute | null>(null);
  const [trail, setTrail] =
    useState<MapPoint[]>([]);

  const [mode, setMode] =
    useState<TravelMode>("car");
  const [language, setLanguage] =
    useState<NavigationLanguage>("en-US");

  const [voiceEnabled, setVoiceEnabled] =
    useState(true);
  const [voiceName, setVoiceName] =
    useState("");
  const [voices, setVoices] =
    useState<SpeechSynthesisVoice[]>([]);

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(false);
  const [navigating, setNavigating] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [alerts, setAlerts] =
    useState<NavigationAlert[]>([]);

  const gpsWatch = useRef<number | null>(null);
  const navigationActive = useRef(false);
  const requestId = useRef(0);
  const lastRerouteAt = useRef(0);
  const lastVoiceAt = useRef(0);
  const announced = useRef(new Set<string>());

  const destinationRef = useRef<MapPoint | null>(null);
  const nearbyRef = useRef<NearbyPlace[]>([]);
  const selectedIdRef = useRef(selectedId);
  const languageRef = useRef(language);
  const voiceRef = useRef(voiceEnabled);
  const voiceNameRef = useRef(voiceName);
  const notificationRef = useRef(notificationsEnabled);

  // =====================================
  // DESTINATION
  // =====================================

  const selected = destinations.find(
    (item) => item._id === selectedId
  );

  const destination: MapPoint | null =
    selected &&
    Array.isArray(selected.location?.coordinates) &&
    selected.location.coordinates.length >= 2
      ? [
          selected.location.coordinates[1],
          selected.location.coordinates[0]
        ]
      : null;

  destinationRef.current = destination;
  selectedIdRef.current = selectedId;
  languageRef.current = language;
  voiceRef.current = voiceEnabled;
  voiceNameRef.current = voiceName;
  notificationRef.current = notificationsEnabled;

  // The current backend supplies driving road routes.
  const supportedMode =
    mode === "car" || mode === "motorcycle";

  // =====================================
  // ROUTE COORDINATES
  // =====================================

  const routePoints = useMemo<MapPoint[]>(() => {
    return (roadRoute?.geometry?.coordinates ?? [])
      .map(
        ([lng, lat]): MapPoint => [lat, lng]
      )
      .filter(validPoint);
  }, [roadRoute]);

  // =====================================
  // NEARBY PLACES
  // =====================================

  const nearby = useMemo<NearbyPlace[]>(() => {
    if (!current || accuracy === null || accuracy > 250) {
      return [];
    }

    return destinations
      .filter(
        (item) =>
          item._id !== selectedId &&
          Array.isArray(item.location?.coordinates)
      )
      .map((item): NearbyPlace => {
        const point: MapPoint = [
          item.location.coordinates[1],
          item.location.coordinates[0]
        ];

        return {
          _id: item._id,
          name: item.name,
          point,
          distanceMeters: validPoint(point)
            ? distanceMeters(current, point)
            : Infinity
        };
      })
      .filter(
        (item) =>
          item.distanceMeters > 0 &&
          item.distanceMeters <= 2000
      )
      .sort((a, b) =>
        a.distanceMeters - b.distanceMeters
      )
      .slice(0, 5);
  }, [current, accuracy, destinations, selectedId]);

  nearbyRef.current = nearby;

  // =====================================
  // LOAD DESTINATIONS
  // =====================================

  useEffect(() => {
    let active = true;

    api.get("/destinations?limit=100")
      .then(({ data }) => {
        if (active) {
          setDestinations(data.items ?? []);
        }
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSelectedId(queryDestination);
  }, [queryDestination]);

  // =====================================
  // LOAD INSTALLED VOICES
  // =====================================

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const speech = window.speechSynthesis;

    const updateVoices = () => {
      setVoices(speech.getVoices());
    };

    updateVoices();
    speech.addEventListener("voiceschanged", updateVoices);

    return () => {
      speech.removeEventListener("voiceschanged", updateVoices);
      speech.cancel();
    };
  }, []);

  useEffect(() => {
    setVoiceName("");
  }, [language]);

  const matchingVoices = voices.filter(
    (voice) =>
      voice.lang.split("-")[0].toLowerCase() ===
      language.split("-")[0].toLowerCase()
  );

  // =====================================
  // SPEECH
  // =====================================

  const speak = useCallback((message: string) => {
    if (
      !voiceRef.current ||
      !("speechSynthesis" in window)
    ) return;

    const speech = window.speechSynthesis;
    const available = speech.getVoices();
    const lang = languageRef.current;

    const selectedVoice =
      available.find(
        (voice) =>
          voice.name === voiceNameRef.current &&
          voice.lang.split("-")[0].toLowerCase() ===
            lang.split("-")[0].toLowerCase()
      ) ||
      available.find(
        (voice) =>
          voice.lang.toLowerCase() === lang.toLowerCase()
      ) ||
      available.find(
        (voice) =>
          voice.lang.split("-")[0].toLowerCase() ===
          lang.split("-")[0].toLowerCase()
      );

    if (!selectedVoice) return;

    const utterance =
      new SpeechSynthesisUtterance(message);

    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
    utterance.rate = 0.95;
    utterance.volume = 1;

    speech.cancel();
    speech.speak(utterance);
  }, []);

  // =====================================
  // ALERTS
  // =====================================

  const addAlert = useCallback((
    key: string,
    message: string,
    useVoice = true
  ) => {
    if (announced.current.has(key)) return;

    announced.current.add(key);

    setAlerts((previous) => [
      {
        id: `${key}-${Date.now()}`,
        message,
        time: new Date().toLocaleTimeString()
      },
      ...previous
    ].slice(0, 12));

    if (
      notificationRef.current &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Gocelone Navigation", {
          body: message
        });
      } catch {
        // In-page alert still works.
      }
    }

    if (useVoice) speak(message);
  }, [speak]);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setError("Browser notifications are not supported.");
      return;
    }

    try {
      const permission =
        await Notification.requestPermission();

      const enabled = permission === "granted";

      setNotificationsEnabled(enabled);
      notificationRef.current = enabled;

      if (!enabled) {
        setError("Notification permission was not granted.");
      } else {
        setError("");
      }
    } catch {
      setError("Could not enable notifications.");
    }
  }

  // =====================================
  // ENABLE GPS
  // =====================================

  function enableGPS() {
    if (!navigator.geolocation) {
      setError("GPS not supported in this browser.");
      return;
    }

    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point: MapPoint = [
          position.coords.latitude,
          position.coords.longitude
        ];

        if (!validPoint(point)) {
          setError("Invalid GPS coordinates.");
          return;
        }

        setCurrent(point);
        setAccuracy(position.coords.accuracy);
        setError("");
      },
      (err) => {
        setError(`GPS error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }

  // =====================================
  // BACKEND ROUTING
  // =====================================

  const calculateRoute = useCallback(async (
    start: MapPoint,
    end: MapPoint,
    showLoading = true
  ) => {
    const id = ++requestId.current;
    if (showLoading) setLoading(true);

    try {
      const { data } = await api.post("/maps/route", {
        start: [start[1], start[0]],
        destination: [end[1], end[0]]
      });

      if (id === requestId.current) {
        setRoadRoute(data.route as RoadRoute);
        setError("");
      }
    } catch (err) {
      if (id === requestId.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (showLoading && id === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  function showRoute() {
    if (!current || !destination) {
      setError("Enable GPS and select a destination first.");
      return;
    }

    if (!supportedMode) {
      setError(
        "Walking and cycling routing require backend support."
      );
      return;
    }

    if (accuracy === null || accuracy > 250) {
      setError(
        "GPS accuracy is too low. Try a mobile device outdoors."
      );
      return;
    }

    void calculateRoute(current, destination);
  }

  // =====================================
  // STOP NAVIGATION
  // =====================================

  const stopNavigation = useCallback(() => {
    navigationActive.current = false;

    if (gpsWatch.current !== null) {
      navigator.geolocation.clearWatch(gpsWatch.current);
      gpsWatch.current = null;
    }

    setNavigating(false);
  }, []);

  // =====================================
  // START LIVE NAVIGATION
  // =====================================

  function startNavigation() {
    if (
      !current ||
      !destination ||
      !roadRoute ||
      !supportedMode
    ) {
      setError("Calculate a supported route first.");
      return;
    }

    if (accuracy === null || accuracy > 250) {
      setError("A more accurate GPS reading is required.");
      return;
    }

    if (!navigator.geolocation) {
      setError("GPS is unavailable.");
      return;
    }

    if (navigationActive.current) return;

    setError("");
    setTrail([current]);
    setAlerts([]);
    announced.current.clear();

    lastRerouteAt.current = Date.now();
    lastVoiceAt.current = Date.now();

    navigationActive.current = true;
    setNavigating(true);

    speak(messages[languageRef.current].started);

    gpsWatch.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!navigationActive.current) return;

        const point: MapPoint = [
          position.coords.latitude,
          position.coords.longitude
        ];

        const gpsAccuracy = position.coords.accuracy;
        setAccuracy(gpsAccuracy);

        if (!validPoint(point)) return;

        if (gpsAccuracy > 100) {
          setError(
            `GPS accuracy ${Math.round(gpsAccuracy)}m. ` +
            "Waiting for an accurate position."
          );
          return;
        }

        setCurrent(point);
        setError("");

        // Draw the actual travelled path.
        setTrail((previous) => {
          const last = previous[previous.length - 1];

          if (
            last &&
            distanceMeters(last, point) < 10
          ) return previous;

          return [...previous, point].slice(-500);
        });

        const end = destinationRef.current;
        if (!end) return;

        const remaining = distanceMeters(point, end);
        const text = messages[languageRef.current];
        const target = selectedIdRef.current;

        // Straight-line proximity alerts.
        if (remaining <= 2000) {
          addAlert(`2km-${target}`, text.near2km);
        }

        if (remaining <= 500) {
          addAlert(`500m-${target}`, text.near500m);
        }

        if (remaining <= 100) {
          addAlert(`100m-${target}`, text.near100m);
        }

        // Nearby tourist attraction alerts.
        for (const place of nearbyRef.current) {
          if (place.distanceMeters <= 1000) {
            addAlert(
              `nearby-${place._id}`,
              `${text.nearby} ${place.name}`
            );
          }
        }

        const now = Date.now();

        // Announce current coordinates periodically.
        if (now - lastVoiceAt.current >= 120000) {
          lastVoiceAt.current = now;

          speak(
            `${text.location}: ${formatPoint(point)}`
          );
        }

        // Refresh driving route at most every 45 seconds.
        if (
          remaining > 100 &&
          now - lastRerouteAt.current >= 45000
        ) {
          lastRerouteAt.current = now;
          void calculateRoute(point, end, false);
        }
      },
      (err) => {
        setError(`GPS tracking error: ${err.message}`);
        stopNavigation();
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 2000
      }
    );
  }

  // =====================================
  // RESET / CLEANUP
  // =====================================

  useEffect(() => {
    return () => {
      navigationActive.current = false;

      if (gpsWatch.current !== null) {
        navigator.geolocation.clearWatch(gpsWatch.current);
      }
    };
  }, []);

  useEffect(() => {
    navigationActive.current = false;

    if (gpsWatch.current !== null) {
      navigator.geolocation.clearWatch(gpsWatch.current);
      gpsWatch.current = null;
    }

    setNavigating(false);
    setRoadRoute(null);
    setTrail([]);
    setLoading(false);
    announced.current.clear();
    requestId.current += 1;
  }, [selectedId, mode]);

  function approximateMinutes(meters: number) {
    const speed =
      mode === "walking"
        ? 5
        : mode === "cycling"
          ? 15
          : 30;

    return Math.max(
      1,
      Math.ceil(((meters / 1000) * 1.4 / speed) * 60)
    );
  }

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="container map-page">
      <div className="page-title">
        <span className="section-eyebrow">
          GOCELONE LIVE NAVIGATION
        </span>
        <h1>Smart Live Road Navigation</h1>
        <p>
          Real OpenStreetMap, live GPS, voice alerts
          and nearby attractions.
        </p>
      </div>

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
            Travel Mode
            <select
              value={mode}
              disabled={navigating}
              onChange={(event) =>
                setMode(event.target.value as TravelMode)
              }
            >
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="walking">Walking</option>
              <option value="cycling">Cycling</option>
            </select>
          </label>

          <label>
            Destination
            <select
              value={selectedId}
              disabled={navigating}
              onChange={(event) =>
                setSelectedId(event.target.value)
              }
            >
              <option value="">Select Destination</option>
              {destinations.map((place) => (
                <option key={place._id} value={place._id}>
                  {place.name}
                  {place.district
                    ? ` - ${place.district}`
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
              loading ||
              navigating ||
              !supportedMode
            }
          >
            <Route size={18} />
            {loading ? "Calculating..." : "Show Route"}
          </button>
        </div>

        <div className="navigation-options">
          <label>
            Voice Language
            <select
              value={language}
              onChange={(event) =>
                setLanguage(
                  event.target.value as NavigationLanguage
                )
              }
            >
              <option value="en-US">English</option>
              <option value="si-LK">සිංහල</option>
              <option value="ta-IN">தமிழ்</option>
              <option value="hi-IN">हिन्दी</option>
            </select>
          </label>

          <label>
            Installed Voice
            <select
              value={voiceName}
              onChange={(event) =>
                setVoiceName(event.target.value)
              }
            >
              <option value="">Automatic</option>
              {matchingVoices.map((voice) => (
                <option
                  key={`${voice.name}-${voice.lang}`}
                  value={voice.name}
                >
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setVoiceEnabled((value) => !value)
            }
          >
            {voiceEnabled ? (
              <Volume2 size={18} />
            ) : (
              <VolumeX size={18} />
            )}
            Voice {voiceEnabled ? "On" : "Off"}
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              speak(messages[language].started)
            }
          >
            Test Voice
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void enableNotifications()}
          >
            <Bell size={18} />
            {notificationsEnabled
              ? "Alerts Enabled"
              : "Enable Alerts"}
          </button>
        </div>

        {matchingVoices.length === 0 && (
          <p className="content-note">
            No installed voice found for this language.
            Text alerts still work.
          </p>
        )}

        {current && (
          <p className="gps-status">
            <MapPin size={17} />
            GPS: {formatPoint(current)}
            {accuracy !== null &&
              ` · Accuracy ${Math.round(accuracy)}m`}
          </p>
        )}

        {!supportedMode && (
          <p className="content-note">
            Walking and cycling need dedicated backend
            routing profiles. Currently only driving
            routes are available.
          </p>
        )}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>

      {roadRoute && (
        <div className="navigation-summary">
          <div>
            <Route size={24} />
            <strong>
              {(roadRoute.distanceMeters / 1000).toFixed(1)}
              {" km"}
            </strong>
            <span>Road Distance</span>
          </div>

          <div>
            <Clock size={24} />
            <strong>
              {Math.round(roadRoute.durationSeconds / 60)}
              {" min"}
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

      <LiveNavigationMap
        current={current}
        destination={destination}
        route={routePoints}
        trail={trail}
        mode={mode}
        language={language}
        nearby={nearby}
        accuracy={accuracy}
        following={navigating}
      />

      <div className="panel navigation-bottom">
        <h2>Live Navigation</h2>

        <div className="button-row">
          {navigating ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={stopNavigation}
            >
              <Square size={18} />
              Stop Navigation
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={startNavigation}
              disabled={
                !roadRoute ||
                !current ||
                !destination ||
                !supportedMode
              }
            >
              <Navigation size={18} />
              Start Navigation
            </button>
          )}
        </div>

        {roadRoute && (
          <>
            <h3>Driving Directions</h3>
            <ol className="directions-list">
              {(roadRoute.instructions ?? []).map(
                (step, index) => (
                  <li key={index}>
                    <span className="direction-number">
                      {index + 1}
                    </span>

                    <div>
                      <p>{step.text}</p>
                      <small>
                        {(step.distanceMeters / 1000).toFixed(2)}
                        {" km"}
                      </small>
                    </div>
                  </li>
                )
              )}
            </ol>
          </>
        )}
      </div>

      <div className="panel">
        <h2>
          <Compass
            size={22}
            style={{ verticalAlign: "middle" }}
          />{" "}
          Nearby Attractions
        </h2>

        <p className="content-note">
          Places within 2 km of your GPS location.
          Straight-line distances and rough travel-time
          estimates; not verified road ETAs.
        </p>

        {!current ? (
          <p>Enable GPS to find nearby attractions.</p>
        ) : nearby.length === 0 ? (
          <p>
            No nearby attractions found or GPS accuracy
            is too low.
          </p>
        ) : (
          <div className="nearby-place-grid">
            {nearby.map((place) => (
              <div
                className="nearby-place-card"
                key={place._id}
              >
                <h3>{place.name}</h3>
                <p>
                  {(place.distanceMeters / 1000).toFixed(2)}
                  {" km away"}
                </p>
                <p>
                  Rough extra time:{" "}
                  {approximateMinutes(place.distanceMeters)}
                  {" minutes"}
                </p>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={navigating}
                  onClick={() => setSelectedId(place._id)}
                >
                  Navigate Here
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel navigation-alerts">
        <h2>Navigation Alerts</h2>
        {alerts.length === 0 ? (
          <p>Navigation alerts will appear here.</p>
        ) : (
          <div aria-live="polite">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="navigation-alert"
              >
                <Bell size={18} />
                <div>
                  <strong>{alert.message}</strong>
                  <small>{alert.time}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="content-note">
        Prototype foreground GPS navigation. Location
        readings may be inaccurate. Proximity alerts
        use straight-line distances and browser voice
        availability depends on installed voices.
        Follow official directions and road signs.
      </p>
    </div>
  );
}
