# ADR 0001 - Monorepo structure

## Date

28/04/2026

## Decision

Dùng monorepo:

```text
frontend/
backend/
database/
docs/
```

## Reason

- Nhóm 3 người, dễ clone và nộp bài.
- Báo cáo, source, SQL, Postman nằm cùng một nơi.
- Khoa dễ kiểm soát integration.

## Consequence

- Cần quy tắc branch/PR rõ.
- Frontend và backend có `package.json` riêng.
