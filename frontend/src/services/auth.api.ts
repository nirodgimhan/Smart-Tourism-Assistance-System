
import { api } from "./api";

export async function loginUser(
  email: string,
  password: string
) {
  const { data } = await api.post("/auth/login", {
    email,
    password
  });

  return data.user;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const { data } = await api.post("/auth/register", {
    name,
    email,
    password
  });

  return data.user;
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export async function logoutUser() {
  await api.post("/auth/logout");
}
