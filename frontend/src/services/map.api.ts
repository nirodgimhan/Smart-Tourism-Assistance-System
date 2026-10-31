
import { api } from "./api";

export type GeoPoint = [number, number];
// [longitude, latitude]

export interface RouteResult {
  geometry: {
    type: "LineString";
    coordinates: GeoPoint[];
  };

  distanceMeters: number;
  durationSeconds: number;

  instructions: {
    text: string;
    distanceMeters: number;
    durationSeconds: number;
    location: GeoPoint;
  }[];
}

export async function getDrivingRoute(
  start: GeoPoint,
  destination: GeoPoint
): Promise<RouteResult> {
  const { data } = await api.post("/maps/route", {
    start,
    destination
  });

  return data.route;
}
