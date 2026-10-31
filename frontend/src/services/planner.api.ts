
import { api } from "./api";

export interface TripInput {
  title: string;
  startDate: string;
  endDate: string;
  budgetLkr: number;
  interests: string[];
  destinationIds: string[];
  startLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  transportMode: "driving" | "walking";
}

export async function createTrip(input: TripInput) {
  const { data } = await api.post("/trips", input);
  return data.trip;
}

export async function getMyTrips() {
  const { data } = await api.get("/trips");
  return data.items;
}

export async function getTripDetails(id: string) {
  const { data } = await api.get(`/trips/${id}`);
  return data.trip;
}

export async function removeTrip(id: string) {
  const { data } = await api.delete(`/trips/${id}`);
  return data;
}
