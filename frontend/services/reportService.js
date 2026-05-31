import { apiClient } from "../lib/apiClient";

export function getBasicReport() {
  return apiClient("/reports/basic", {
    method: "GET",
  });
}
