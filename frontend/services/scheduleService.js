import { apiClient } from '../lib/apiClient';

export function autoArrangeSchedule(payload) {
  return apiClient('/schedules/auto-arrange', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function checkScheduleConstraints(payload) {
  return apiClient('/schedules/check-constraints', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
