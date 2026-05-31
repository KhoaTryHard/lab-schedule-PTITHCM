# Basic Report Scope

## MVP Report Path

The final-demo report path for #50 is:

- UI: `/academic/reports`
- API: `GET /api/reports/basic`
- Roles: CBDT, QTV

## Metrics And Data Sources

| Metric | Source |
| --- | --- |
| Scheduled session count | `lab_schedule_entries` |
| Published session count | `lab_schedule_entries.entry_status = 'published'` |
| Cancelled session count | `lab_schedule_entries.entry_status = 'cancelled'` |
| Room usage by room | `rooms` joined with `lab_schedule_entries` |
| Issue count | `room_issue_reports` |
| Room block count | `room_block_requests` |
| Change request count | `lab_schedule_change_requests` |
| Cancel request count | `lab_schedule_change_requests.change_type = 'cancel'` |
| Student feedback count | `student_feedback` |

## Out Of Scope For #50

- Admin advanced report dashboard export behavior.
- PDF/Excel generation beyond existing CSV/mock UI affordances.
- Historical trend charts by week or semester.
- Screenshot capture from automation. Manual screenshots are part of the final demo package in #52.
