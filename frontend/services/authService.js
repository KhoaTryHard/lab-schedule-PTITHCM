import { apiClient } from "../lib/apiClient";

export function login(username, password) {
  return apiClient("/auth/login", {
    method: "POST",
    requireAuth: false,
    body: JSON.stringify({ username, password }),
  });
}

export function getMe() {
  return apiClient("/auth/me");
}

export function changePassword(payload) {
  return apiClient("/auth/change-password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiClient("/auth/logout", {
    method: "POST",
  });
}
