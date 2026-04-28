# Git workflow

## 1. Branch chính

| Branch | Mục đích |
|---|---|
| `main` | Bản ổn định để nộp/demo |
| `develop` | Nhánh tích hợp chính |

## 2. Branch chức năng cần tạo

```text
feature/auth
feature/user-management
feature/room-management
feature/academic-data
feature/schedule-request
feature/schedule-auto-arrange
feature/schedule-constraint
feature/frontend-layout
feature/frontend-schedule
feature/testing-report
```

## 3. Quy tắc đặt tên branch

```text
feature/<module-name>
fix/<bug-name>
docs/<document-name>
test/<test-scope>
```

Ví dụ:

```text
feature/schedule-auto-arrange
fix/login-invalid-token
docs/report-chapter-5
test/postman-schedule-flow
```

## 4. Quy tắc commit

```text
<type>: <nội dung ngắn>
```

| Type | Ví dụ |
|---|---|
| `feat` | `feat: add auto arrange schedule endpoint` |
| `fix` | `fix: block out-of-scope room in schedule service` |
| `docs` | `docs: add scope mvp document` |
| `test` | `test: add postman tests for room conflict` |
| `refactor` | `refactor: split schedule controller and service` |
| `chore` | `chore: initialize monorepo skeleton` |

## 5. Quy trình PR

```text
Issue → Branch từ develop → Commit nhỏ → Push → PR vào develop → Review → Merge
```

Không merge nếu chưa có minh chứng test.

## 6. Lệnh khởi tạo GitHub repo

Sau khi tải skeleton này về:

```bash
cd lab-schedule-ptit
git init
git add .
git commit -m "chore: initialize lab schedule monorepo skeleton"
git branch -M main
git checkout -b develop
```

Tạo repo rỗng trên GitHub, ví dụ `lab-schedule-ptit`, sau đó:

```bash
git remote add origin https://github.com/<your-username>/lab-schedule-ptit.git
git push -u origin main
git push -u origin develop
```

Tạo branch chức năng:

```bash
bash scripts/create-feature-branches.sh
```

Push toàn bộ branch nếu cần:

```bash
git push --all origin
```
