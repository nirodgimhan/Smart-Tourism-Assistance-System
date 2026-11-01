
import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet uses [latitude, longitude]
export type MapPoint = [number, number];

interface LiveNavigationMapProps {
  current: MapPoint | null;
  destination: MapPoint | null;
  route: MapPoint[];
}

const SRI_LANKA: MapPoint = [7.8731, 80.7718];

// Current position icon
const currentIcon = L.divIcon({
  className: "gocelone-custom-icon",
  html: `
    <div style="
      width:22px;
      height:22px;
      background:#16a34a;
      border:4px solid white;
      border-radius:50%;
      box-shadow:0 2px 10px #0004;
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// Destination icon
const destinationIcon = L.divIcon({
  className: "gocelone-custom-icon",
  html: `
    <div style="
      width:24px;
      height:24px;
      background:#dc2626;
      border:4px solid white;
      border-radius:50%;
      box-shadow:0 2px 10px #0004;
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Automatically zoom to route
function FitMap({
  current,
  destination,
  route
}: LiveNavigationMapProps) {
  const map = useMap();

  useEffect(() => {
    const points: MapPoint[] = [];

    if (current) points.push(current);
    if (destination) points.push(destination);
    if (route.length > 1) points.push(...route);

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [45, 45],
        maxZoom: 15,
        animate: false
      });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.setView(SRI_LANKA, 8);
    }
  }, [map, current, destination, route]);

  return null;
}

// Fix map container resize
function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(map.getContainer());

    return () => observer.disconnect();
  }, [map]);

  return null;
}

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
        height: "480px",
        overflow: "hidden",
        borderRadius: "16px",
        position: "relative"
      }}
    >
      <MapContainer
        center={SRI_LANKA}
        zoom={8}
        minZoom={5}
        maxZoom={19}
        zoomControl={true}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%"
        }}
      >
        {/* Real OpenStreetMap background */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          maxZoom={19}
        />

        <FitMap
          current={current}
          destination={destination}
          route={route}
        />

        <ResizeMap />

        {current && (
          <Marker position={current} icon={currentIcon}>
            <Popup>
              <strong>Your Current Location</strong>
              <p>
                {current[0].toFixed(5)},{" "}
                {current[1].toFixed(5)}
              </p>
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker
            position={destination}
            icon={destinationIcon}
          >
            <Popup>
              <strong>Selected Destination</strong>
              <p>
                {destination[0].toFixed(5)},{" "}
                {destination[1].toFixed(5)}
              </p>
            </Popup>
          </Marker>
        )}

        {route.length > 1 && (
          <>
            <Polyline
              positions={route}
              pathOptions={{
                color: "#ffffff",
                weight: 9,
                opacity: 0.9
              }}
            />

            <Polyline
              positions={route}
              pathOptions={{
                color: "#087f8c",
                weight: 5,
                opacity: 1
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
