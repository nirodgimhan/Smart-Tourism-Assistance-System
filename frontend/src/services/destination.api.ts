
import { api } from "./api";

export interface DestinationRecord {
  _id: string;
  name: string;
  description?: string;
  category: string;
  district?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  images?: string[];
}

export async function fetchDestinations(
  limit = 100
): Promise<DestinationRecord[]> {
  const { data } = await api.get("/destinations", {
    params: { limit }
  });

  return data.items || [];
}

export async function fetchDestination(
  id: string
): Promise<DestinationRecord> {
  const { data } = await api.get(`/destinations/${id}`);
  return data.destination;
}

export async function fetchNearbyDestinations(
  lat: number,
  lon: number,
  maxDistance = 20000
): Promise<DestinationRecord[]> {
  const { data } = await api.get("/destinations/nearby", {
    params: { lat, lon, maxDistance }
  });

  return data.items || [];
}
