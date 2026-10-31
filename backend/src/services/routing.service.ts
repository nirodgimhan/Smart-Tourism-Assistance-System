
import axios from "axios";

export type Coordinates = [number, number];
// GeoJSON order: [longitude, latitude]

export interface RoadRoute {
  geometry: {
    type: "LineString";
    coordinates: Coordinates[];
  };
  distanceMeters: number;
  durationSeconds: number;
  instructions: {
    text: string;
    distanceMeters: number;
    durationSeconds: number;
    location: Coordinates;
  }[];
  provider: string;
}

function validCoordinate(p: Coordinates) {
  return (
    Array.isArray(p) &&
    p.length === 2 &&
    p.every(Number.isFinite) &&
    p[0] >= -180 &&
    p[0] <= 180 &&
    p[1] >= -90 &&
    p[1] <= 90
  );
}

export async function calculateRoadRoute(
  start: Coordinates,
  destination: Coordinates
): Promise<RoadRoute> {
  if (
    !validCoordinate(start) ||
    !validCoordinate(destination)
  ) {
    throw new Error("Invalid map coordinates");
  }

  const baseUrl = (
    process.env.OSRM_BASE_URL ||
    "https://router.project-osrm.org"
  ).replace(/\/$/, "");

  const coordinates =
    `${start[0]},${start[1]};` +
    `${destination[0]},${destination[1]}`;

  const url =
    `${baseUrl}/route/v1/driving/${coordinates}`;

  const { data } = await axios.get(url, {
    params: {
      overview: "full",
      geometries: "geojson",
      steps: "true"
    },
    timeout: 15000
  });

  if (
    data.code !== "Ok" ||
    !Array.isArray(data.routes) ||
    !data.routes.length
  ) {
    throw new Error(
      "No road route was found between these points"
    );
  }

  const route = data.routes[0];

  if (
    route.geometry?.type !== "LineString" ||
    !Array.isArray(route.geometry.coordinates)
  ) {
    throw new Error("Routing provider returned invalid geometry");
  }

  const instructions = route.legs.flatMap(
    (leg: any) =>
      (leg.steps || []).map((step: any) => {
        const maneuver = step.maneuver || {};

        return {
          text:
            [
              maneuver.type,
              maneuver.modifier,
              step.name
                ? `onto ${step.name}`
                : ""
            ]
              .filter(Boolean)
              .join(" ") || "Continue",

          distanceMeters: step.distance || 0,
          durationSeconds: step.duration || 0,
          location: maneuver.location as Coordinates
        };
      })
  );

  return {
    geometry: route.geometry,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    instructions,
    provider: "OSRM"
  };
}
