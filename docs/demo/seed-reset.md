# Seed Reset Instructions

## Database

Default database:

```text
lab_schedule_ptit_v2
```

Reset from schema/dump:

```powershell
mysql -u root -p -e "DROP DATABASE IF EXISTS lab_schedule_ptit_v2; CREATE DATABASE lab_schedule_ptit_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p lab_schedule_ptit_v2 < database/Dump20260428.sql
mysql -u root -p lab_schedule_ptit_v2 < database/seed_demo_final.sql
```

If the database already exists and only demo data needs refreshing, prefer a full reset. The Week 5 smoke scripts create and clean temporary rows, but a full reset is safer before a final demo.

## Backend Environment

Create `backend/.env` from `backend/.env.example` and verify:

```env
APP_PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=lab_schedule_ptit_v2
JWT_SECRET=change_me_in_local_env
JWT_EXPIRES_IN=1d
```

Start backend:

```powershell
cd backend
npm install
npm start
```

Health check:

```text
GET http://localhost:4000/api/health
```

## Frontend Environment

Create `frontend/.env.local` from `frontend/.env.example` and verify:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

Start frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Demo Accounts

| Role | Username | Password |
| --- | --- | --- |
| QTV | `admin` | `123456` |
| CBDT | `cbdt1` | `123456` |
| GV | `gv_phthy` | `123456` |
| KTV | `ktv1` | `123456` |
| SV | `sv1` | `123456` |

## Quick Smoke Checklist

- Login as CBDT.
- Open `/academic/reports`; report metrics should load from `GET /api/reports/basic`.
- Login as SV.
- Open `/student/my-schedule` and `/student/notifications`.
- Login as GV.
- Open `/lecturer/my-schedule`, `/lecturer/change-requests`, and `/lecturer/room-issues`.
- Login as KTV.
- Open `/technician/issues` and `/technician/notifications`.

## Data Cleanup Notes

The documented W5 smoke runs cleaned up temporary rows for:

- schedule change requests
- makeup schedule entries
- room issue reports
- room block requests
- student feedback
- notifications created by feedback smoke

Before a formal demo, use the full reset command above so the team starts from known data.
