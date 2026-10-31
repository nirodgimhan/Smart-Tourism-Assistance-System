
import { useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap
} from "react-leaflet";

import L, { LatLngBounds } from "leaflet";

import "leaflet/dist/leaflet.css";

// ========================================
// TYPES
// ========================================

// IMPORTANT:
// Leaflet coordinates = [latitude, longitude]
// OSRM coordinates = [longitude, latitude]

export type MapPoint = [number, number];

interface LiveNavigationMapProps {
  current: MapPoint | null;
  destination: MapPoint | null;
  route: MapPoint[];
}

// ========================================
// DEFAULT MAP LOCATION - SRI LANKA
// ========================================

const SRI_LANKA_CENTER: MapPoint = [
  7.8731,
  80.7718
];

// ========================================
// GPS MARKER ICON
// ========================================

const gpsIcon = L.divIcon({
  className: "gocelone-gps-marker",
  html: `
    <div style="
      width:20px;
      height:20px;
      background:#16a34a;
      border:4px solid #ffffff;
      border-radius:50%;
      box-shadow:0 0 0 5px rgba(22,163,74,0.2),
                 0 3px 10px rgba(0,0,0,0.25);
    "></div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// ========================================
// DESTINATION MARKER ICON
// ========================================

const destinationIcon = L.divIcon({
  className: "gocelone-destination-marker",
  html: `
    <div style="
      width:22px;
      height:22px;
      background:#dc2626;
      border:4px solid #ffffff;
      border-radius:50%;
      box-shadow:0 0 0 5px rgba(220,38,38,0.18),
                 0 3px 10px rgba(0,0,0,0.25);
    "></div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// ========================================
// AUTOMATIC MAP FITTING
// ========================================

function MapAutoFit({
  current,
  destination,
  route
}: LiveNavigationMapProps) {
  const map = useMap();

  useEffect(() => {
    const points: MapPoint[] =
      route.length > 1
        ? route
        : [current, destination].filter(
            (point): point is MapPoint =>
              point !== null
          );

    if (points.length === 0) {
      map.setView(SRI_LANKA_CENTER, 8);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    const bounds = new LatLngBounds(points);

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 15,
      animate: true
    });
  }, [map, current, destination, route]);

  return null;
}

// ========================================
// MAP SIZE / TILE RENDER FIX
// ========================================

function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);

    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

// ========================================
// MAIN LIVE NAVIGATION MAP
// ========================================

export default function LiveNavigationMap({
  current,
  destination,
  route
}: LiveNavigationMapProps) {
  return (
    <div
      className="live-navigation-map"
      style={{
        width: "100%",
        height: "450px",
        minHeight: "450px",
        overflow: "hidden",
        borderRadius: "16px",
        position: "relative"
      }}
    >
      <MapContainer
        center={SRI_LANKA_CENTER}
        zoom={8}
        minZoom={5}
        maxZoom={19}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={true}
        style={{
          height: "100%",
          width: "100%",
          background: "#e5f0ef"
        }}
      >
        {/* OPENSTREETMAP TILES */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          tileSize={256}
        />

        {/* AUTOMATIC MAP POSITIONING */}
        <MapAutoFit
          current={current}
          destination={destination}
          route={route}
        />

        {/* RESIZE FIX */}
        <MapResizeFix />

        {/* CURRENT GPS MARKER */}
        {current && (
          <Marker
            position={current}
            icon={gpsIcon}
          >
            <Popup>
              <strong>Your Current Location</strong>
              <div>
                Latitude: {current[0].toFixed(6)}
              </div>
              <div>
                Longitude: {current[1].toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* DESTINATION MARKER */}
        {destination && (
          <Marker
            position={destination}
            icon={destinationIcon}
          >
            <Popup>
              <strong>Selected Destination</strong>
              <div>
                Latitude: {destination[0].toFixed(6)}
              </div>
              <div>
                Longitude: {destination[1].toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* ROAD ROUTE */}
        {route.length > 1 && (
          <>
            {/* White outline */}
            <Polyline
              positions={route}
              pathOptions={{
                color: "#ffffff",
                weight: 9,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round"
              }}
            />

            {/* Main route */}
            <Polyline
              positions={route}
              pathOptions={{
                color: "#087f8c",
                weight: 5,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
