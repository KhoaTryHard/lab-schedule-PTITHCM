# Cấu trúc repo ban đầu

```text
lab-schedule-ptit/
  .github/
    ISSUE_TEMPLATE/
    pull_request_template.md
  backend/
    src/
      config/
      middlewares/
      modules/
      routes/
      utils/
    .env.example
    package.json
  frontend/
    app/
    components/
    lib/
    services/
    .env.example
    package.json
  database/
    Dump20260428.sql
    migrations/
    seeds/
  docs/
    api-contract/
    decisions/
    diagrams/
    postman/
    report/
    screenshots/
    tasks/
  scripts/
  README.md
  CONTRIBUTING.md
```

## Ý nghĩa

| Khu vực | Người chính | Mục đích |
|---|---|---|
| `backend/` | Khoa + Duy | Express API, auth, RBAC, auto arrange, constraint checking |
| `frontend/` | Thành | Next.js UI, layout, role routes, forms, schedule views |
| `database/` | Khoa | SQL dump, migration, seed demo |
| `docs/` | Khoa tổng hợp | Scope, báo cáo, sơ đồ, API, Postman |
| `.github/` | Khoa | PR template, issue template |
| `scripts/` | Khoa | Script hỗ trợ khởi tạo repo/branch |

## Nguyên tắc

1. Monorepo để nộp bài dễ.
2. Không đặt code backend lẫn frontend chung một thư mục.
3. File SQL gốc để trong `database/`.
4. Báo cáo, ảnh, sơ đồ phải đi trong `docs/`.
5. Mỗi thay đổi DB sau này đi qua migration.
