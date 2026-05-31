# Final API/UI Test Evidence - Week 5

## Environment

- Date: 2026-05-31
- Backend: `http://localhost:4000/api`
- Database: local MySQL from `backend/.env`
- Frontend: Next.js app from `frontend`
- Demo accounts:

| Role | Username | Password |
| --- | --- | --- |
| QTV | `admin` | `123456` |
| CBDT | `cbdt1` | `123456` |
| GV | `gv_phthy` | `123456` |
| KTV | `ktv1` | `123456` |
| SV | `sv1` | `123456` |

## Importable Postman Files

Existing importable files remain in this folder:

- `LabSchedulePTIT.postman_collection.json`
- `LabSchedulePTIT.local.postman_environment.json`
- `lab-schedule-week4-final.postman_collection.json`
- `lab-schedule-week4.postman_environment.json`

The Week 4 collection covers TC01-TC19 style core scheduling tests. Week 5 backend/API evidence is recorded in Markdown smoke reports because those APIs were implemented after the original Week 4 collection was assembled.

## Final TC01-TC25 Status

| TC | Area | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- |
| TC01 | Login QTV | `admin` login returns HTTP 200 and token | Pass | `docs/postman/test-cases-final.md` screenshots image1/image5 set; README demo account table |
| TC02 | Login CBDT | `cbdt1` login returns HTTP 200 and token | Pass | `docs/postman/test-cases-final.md` previous Week 4 evidence |
| TC03 | Login GV | `gv_phthy` login returns HTTP 200 and token | Pass | `docs/postman/test-cases-final.md` previous Week 4 evidence |
| TC04 | Login KTV | `ktv1` login returns HTTP 200 and token | Pass | `docs/postman/test-cases-final.md` previous Week 4 evidence |
| TC05 | Login SV | `sv1` login returns HTTP 200 and token | Pass | `docs/postman/test-cases-final.md` previous Week 4 evidence |
| TC06 | Login wrong password | Invalid password returns HTTP 401 | Pass | `docs/postman/test-cases-final.md` previous Week 4 evidence |
| TC07 | Create schedule request | CBDT creates real schedule request with HTTP 201 | Pass | `docs/postman/test_results_w3-01.md`, Week 4 collection |
| TC08 | List schedule requests | CBDT lists schedule requests with HTTP 200 | Pass | `docs/postman/test_results_w3-01.md`, Week 4 collection |
| TC09 | Constraint pass | Valid slot returns `passed = true` | Pass | `docs/postman/test_result_w3-03.md`, Week 4 collection |
| TC10 | Room conflict | Conflicting room returns `ROOM_CONFLICT` | Pass | `docs/postman/test_result_w3-03.md`, Week 4 collection |
| TC11 | Lecturer conflict | Conflicting lecturer returns `LECTURER_CONFLICT` | Pass | `docs/postman/test_result_w3-03.md`, Week 4 collection |
| TC12 | Room status/availability | Unavailable room returns failed business rule | Pass | Week 4 collection screenshot set |
| TC13 | Capacity | Large team fails capacity check | Pass | `docs/postman/test_results_w4-08.md`, Week 4 collection |
| TC14 | Holiday blocked | Blocked holiday returns `HOLIDAY_BLOCKED` | Pass | `docs/postman/test_result_w3-03.md`, Week 4 collection |
| TC15 | Auto-arrange success | Valid input returns ranked options | Pass | `docs/postman/test_results_w4-08.md` |
| TC16 | Auto-arrange no valid option | Blocked input returns `no_valid_option` | Pass | `docs/postman/test_results_w4-08.md` |
| TC17 | Auto-arrange preferred day | Preferred day affects ranking | Pass | `docs/postman/test_results_w4-08.md` |
| TC18 | Create draft schedule | Valid schedule draft is created with HTTP 201 | Pass | `docs/postman/test_result_w3-03.md`, Week 4 collection |
| TC19 | Approve/publish/lookup lifecycle | Draft approve/publish and role lookup pass | Pass | `docs/postman/test_results_w3-04.md`, Week 4 collection |
| TC20 | Schedule change request APIs | GV create, CBDT list/review/implement, RBAC and cleanup pass | Pass | `docs/postman/test_results_w5-45.md` |
| TC21 | Room issue APIs | GV/KTV create/list/update room issues and RBAC pass | Pass | `docs/postman/test_results_w5-46.md` |
| TC22 | Room block APIs | KTV/CBDT create/list/review block request and constraints see approved block | Pass | `docs/postman/test_results_w5-46.md` |
| TC23 | Student feedback APIs | SV submit feedback; CBDT/QTV list/respond; KTV forbidden | Pass | `docs/postman/test_results_w5-47.md` |
| TC24 | Notification APIs | Current user list/read/ack/read-all notification flow pass | Pass | `docs/postman/test_results_w5-47.md` |
| TC25 | Basic report path | CBDT/QTV read real report metrics; SV forbidden | Pass | `docs/postman/test_results_w5-50.md` |

## Frontend Evidence

- #49 connects the relevant role screens to real APIs.
- Evidence: `docs/postman/test_results_w5-49.md`.
- Automated screenshots were not captured in this CLI run because browser automation is not installed. Manual screenshots are tracked for the final demo package in #52.

## Known Limitations

- The Week 4 Postman collection does not contain every Week 5 endpoint. Week 5 endpoint evidence is captured through local smoke runs and Markdown records.
- Some TC01-TC19 screenshots are historical Week 4 screenshots and should be refreshed manually in #52 if the final report requires a single screenshot set.
- The final demo screenshot package remains part of #52.
