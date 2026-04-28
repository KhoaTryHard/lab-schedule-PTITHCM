const { ROOM_SCOPE, isInScopeRoom } = require('../../config/roomScope');

function getScheduleListStub(query) {
  return {
    filters: query,
    schedules: []
  };
}

function checkScheduleConstraintsStub(input) {
  const roomCode = input.room_code || '2B11';
  const startDate = input.start_date;

  const results = [
    {
      code: 'ROOM_SCOPE',
      passed: isInScopeRoom(roomCode),
      message: isInScopeRoom(roomCode)
        ? `Room ${roomCode} is in MVP scope`
        : `Room ${roomCode} is outside MVP scope`
    },
    {
      code: 'HOLIDAY_BLOCKED',
      passed: startDate !== '2026-05-01',
      message: startDate === '2026-05-01'
        ? 'Selected date is configured as a holiday in demo rule'
        : 'Date is not blocked by demo holiday rule'
    },
    {
      code: 'ROOM_CONFLICT',
      passed: true,
      message: 'Stub: no room conflict detected'
    },
    {
      code: 'LECTURER_CONFLICT',
      passed: true,
      message: 'Stub: no lecturer conflict detected'
    },
    {
      code: 'CAPACITY_OK',
      passed: true,
      message: 'Stub: room has enough usable computers'
    },
    {
      code: 'SOFTWARE_OK',
      passed: true,
      message: 'Stub: required software is installed'
    }
  ];

  return {
    passed: results.every((item) => item.passed),
    results
  };
}

function autoArrangeScheduleStub(input) {
  const preferredDay = input.preferred_day_of_week || 3;
  const preferredTimeSlot = input.preferred_time_slot || '7-10';
  const startDate = input.start_date || '2026-04-28';
  const endDate = input.end_date || startDate;

  const rankedOptions = ROOM_SCOPE.map((roomCode, index) => ({
    room_code: roomCode,
    day_of_week: preferredDay,
    time_slot: preferredTimeSlot,
    start_date: startDate,
    end_date: endDate,
    score: 90 - index * 5,
    reasons: [
      'In MVP room scope',
      'Passes demo hard constraints',
      'Ranked by simple rule-based scoring stub'
    ]
  }));

  return {
    request_id: input.request_id || null,
    auto_arrange_status: 'success',
    selected_option: rankedOptions[0],
    ranked_options: rankedOptions,
    failed_reasons: []
  };
}

module.exports = {
  getScheduleListStub,
  checkScheduleConstraintsStub,
  autoArrangeScheduleStub
};
