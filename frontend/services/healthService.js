import { apiClient } from "../lib/apiClient";

export function getHealth() {
  return apiClient("/health", {
    method: "GET",
    requireAuth: false,
  });
}

export async function checkBackendHealth() {
  const response = await getHealth();
  const data = response?.data || {};

  return {
    ok: response?.success !== false && data.status === "running",
    service: data.service || "",
    status: data.status || "",
    room_scope: Array.isArray(data.room_scope) ? data.room_scope : [],
    raw: response,
  };
}
