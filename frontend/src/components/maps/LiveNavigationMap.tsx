
import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// SHARED TYPES
export type MapPoint = [number, number];

export type TravelMode =
  | "car"
  | "motorcycle"
  | "walking"
  | "cycling";

export type NavigationLanguage =
  | "en-US"
  | "si-LK"
  | "ta-IN"
  | "hi-IN";

export interface NearbyPlace {
  _id: string;
  name: string;
  point: MapPoint;
  distanceMeters: number;
}

export interface LiveNavigationMapProps {
  current: MapPoint | null;
  destination: MapPoint | null;
  route: MapPoint[];
  trail?: MapPoint[];
  mode?: TravelMode;
  language?: NavigationLanguage;
  nearby?: NearbyPlace[];
  accuracy?: number | null;
  following?: boolean;
}

const SRI_LANKA: MapPoint = [7.8731, 80.7718];

function validPoint(
  point: MapPoint | null | undefined
): point is MapPoint {
  return !!point &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1]) &&
    Math.abs(point[0]) <= 90 &&
    Math.abs(point[1]) <= 180;
}

function createIcon(color: string) {
  return L.divIcon({
    className: "gocelone-custom-icon",
    html: `
      <div style="
        width:22px;
        height:22px;
        background:${color};
        border:4px solid white;
        border-radius:50%;
        box-shadow:0 2px 12px #0005;
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12]
  });
}

const currentIcon = createIcon("#16a34a");
const destinationIcon = createIcon("#dc2626");
const nearbyIcon = createIcon("#f59e0b");

interface MapControllerProps {
  current: MapPoint | null;
  destination: MapPoint | null;
  route: MapPoint[];
  following: boolean;
}

function MapController({
  current,
  destination,
  route,
  following
}: MapControllerProps) {
  const map = useMap();
  const lastDestinationKey = useRef("");
  const firstGpsShown = useRef(false);
  const wasFollowing = useRef(false);

  useEffect(() => {
    map.invalidateSize();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(map.getContainer());

    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (following) return;

    const key = destination?.join(",") ?? "";
    const changed = key !== lastDestinationKey.current;
    const firstGps = validPoint(current) &&
      !firstGpsShown.current;

    if (!changed && !firstGps) return;

    lastDestinationKey.current = key;

    if (validPoint(current)) {
      firstGpsShown.current = true;
    }

    const points: MapPoint[] = [];

    if (validPoint(current)) points.push(current);
    if (validPoint(destination)) points.push(destination);

    if (route.length > 1) {
      points.push(...route.filter(validPoint));
    }

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [45, 45],
        maxZoom: 15,
        animate: false
      });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.setView(SRI_LANKA, 8);
    }
  }, [map, current, destination, route, following]);

  useEffect(() => {
    if (!following || !validPoint(current)) {
      wasFollowing.current = false;
      return;
    }

    if (!wasFollowing.current) {
      map.setView(current, 16);
    } else {
      map.panTo(current, {
        animate: true,
        duration: 0.5
      });
    }

    wasFollowing.current = true;
  }, [map, current, following]);

  return null;
}

export default function LiveNavigationMap({
  current,
  destination,
  route,
  trail = [],
  mode = "car",
  language = "en-US",
  nearby = [],
  accuracy = null,
  following = false
}: LiveNavigationMapProps) {
  const cleanRoute = route.filter(validPoint);
  const cleanTrail = trail.filter(validPoint);
  const cleanNearby = nearby.filter((place) =>
    validPoint(place.point)
  );

  const languageNames: Record<
    NavigationLanguage,
    string
  > = {
    "en-US": "English",
    "si-LK": "Sinhala",
    "ta-IN": "Tamil",
    "hi-IN": "Hindi"
  };

  return (
    <div
      className="live-navigation-map"
      style={{
        width: "100%",
        height: "500px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        border: "1px solid #d5e7e5",
        background: "#e5f0ef"
      }}
    >
      <MapContainer
        center={SRI_LANKA}
        zoom={8}
        minZoom={5}
        maxZoom={19}
        scrollWheelZoom
        zoomControl
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          maxZoom={19}
        />

        <MapController
          current={current}
          destination={destination}
          route={cleanRoute}
          following={following}
        />

        {cleanRoute.length > 1 && (
          <>
            <Polyline
              positions={cleanRoute}
              pathOptions={{
                color: "#ffffff",
                weight: 9,
                opacity: 0.9
              }}
            />
            <Polyline
              positions={cleanRoute}
              pathOptions={{
                color: "#087f8c",
                weight: 5
              }}
            />
          </>
        )}

        {cleanTrail.length > 1 && (
          <Polyline
            positions={cleanTrail}
            pathOptions={{
              color: "#9333ea",
              weight: 4,
              dashArray: "8 8"
            }}
          />
        )}

        {validPoint(current) && (
          <>
            <Marker position={current} icon={currentIcon}>
              <Popup>
                <strong>Current GPS Location</strong>
                <p>
                  {current[0].toFixed(6)},{" "}
                  {current[1].toFixed(6)}
                </p>
                {accuracy !== null && (
                  <p>
                    Accuracy: {Math.round(accuracy)} m
                  </p>
                )}
              </Popup>
            </Marker>

            {accuracy !== null &&
              Number.isFinite(accuracy) &&
              accuracy > 0 && (
                <Circle
                  center={current}
                  radius={accuracy}
                  pathOptions={{
                    color: "#16a34a",
                    fillColor: "#16a34a",
                    fillOpacity: 0.06,
                    weight: 1
                  }}
                />
              )}
          </>
        )}

        {validPoint(destination) && (
          <Marker
            position={destination}
            icon={destinationIcon}
          >
            <Popup>Selected Destination</Popup>
          </Marker>
        )}

        {cleanNearby.map((place) => (
          <Marker
            key={place._id}
            position={place.point}
            icon={nearbyIcon}
          >
            <Popup>
              <strong>{place.name}</strong>
              <p>
                {(place.distanceMeters / 1000).toFixed(2)}
                {" km away (straight line)"}
              </p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div
        style={{
          position: "absolute",
          top: 12,
          left: 55,
          zIndex: 800,
          background: "rgba(255,255,255,.95)",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          color: "#173b47",
          pointerEvents: "none"
        }}
      >
        {mode.toUpperCase()} · {languageNames[language]}
        {" · "}
        {following ? "LIVE GPS" : "MAP READY"}
      </div>
    </div>
  );
}
