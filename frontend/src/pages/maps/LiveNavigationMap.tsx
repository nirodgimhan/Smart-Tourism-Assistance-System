
import { useEffect, useMemo } from "react";

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

// React Leaflet uses [latitude, longitude].
export type MapPoint = [number, number];

interface LiveNavigationMapProps {
  current: MapPoint | null;
  destination: MapPoint | null;
  route: MapPoint[];
}

// GPS current location marker
const currentLocationIcon = L.divIcon({
  className: "gocelone-current-location",
  html: `
    <div style="
      width: 22px;
      height: 22px;
      background: #167D85;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(22,125,133,0.25),
                  0 3px 10px rgba(0,0,0,0.25);
    "></div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Selected destination marker
const destinationIcon = L.divIcon({
  className: "gocelone-destination-location",
  html: `
    <div style="
      width: 38px;
      height: 38px;
      background: #D55236;
      color: white;
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      font-size: 15px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.3);
    ">D</div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

// Auto zoom and center map
function MapAutoFit({
  current,
  destination,
  route
}: LiveNavigationMapProps) {
  const map = useMap();

  useEffect(() => {
    if (route.length >= 2) {
      map.fitBounds(L.latLngBounds(route), {
        padding: [50, 50],
        maxZoom: 16
      });
    } else if (current && destination) {
      map.fitBounds(
        L.latLngBounds([current, destination]),
        {
          padding: [50, 50],
          maxZoom: 16
        }
      );
    } else if (current) {
      map.setView(current, 15);
    } else if (destination) {
      map.setView(destination, 14);
    }
  }, [map, current, destination, route]);

  return null;
}

export default function LiveNavigationMap({
  current,
  destination,
  route
}: LiveNavigationMapProps) {
  const routeCoordinates = useMemo(
    () => route.filter(
      point =>
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
    ),
    [route]
  );

  return (
    <div
      className="navigation-map"
      style={{
        width: "100%",
        height: "520px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #dce8e6"
      }}
    >
      <MapContainer
        center={[7.8731, 80.7718]}
        zoom={8}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{
          width: "100%",
          height: "100%"
        }}
      >
        {/* OpenStreetMap road tiles */}
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current GPS position */}
        {current && (
          <Marker
            position={current}
            icon={currentLocationIcon}
          >
            <Popup>
              <strong>Your Current Location</strong>
              <div>
                Latitude: {current[0].toFixed(5)}
              </div>
              <div>
                Longitude: {current[1].toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            position={destination}
            icon={destinationIcon}
          >
            <Popup>
              <strong>Selected Destination</strong>
            </Popup>
          </Marker>
        )}

        {/* Road route from backend OSRM geometry */}
        {routeCoordinates.length >= 2 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#167D85",
              weight: 6,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round"
            }}
          />
        )}

        <MapAutoFit
          current={current}
          destination={destination}
          route={routeCoordinates}
        />
      </MapContainer>
    </div>
  );
}
