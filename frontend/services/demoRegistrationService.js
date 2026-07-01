import { apiClient } from "../lib/apiClient";

export function simulateStudentRegistration() {
  return apiClient("/demo-registration/simulate-student-registration", {
    method: "POST",
  });
}
