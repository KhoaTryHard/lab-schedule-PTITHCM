# Priority 3 - Tạo repo và cấu trúc project ban đầu

**Owner:** Khoa  
**Ngày thực hiện:** 28/04/2026  
**Mục tiêu:** Có repo skeleton để cả nhóm clone, chạy, chia branch và bắt đầu code.

## 1. Checklist phải xong

- [x] Tạo cấu trúc monorepo `frontend/backend/database/docs`.
- [x] Đưa scope vào `docs/scope-mvp-v1.md`.
- [x] Đưa SQL dump vào `database/Dump20260428.sql`.
- [x] Tạo `README.md` hướng dẫn chạy project.
- [x] Tạo `.gitignore`, `.editorconfig`, `CONTRIBUTING.md`.
- [x] Tạo skeleton backend Express.
- [x] Tạo skeleton frontend Next.js.
- [x] Tạo docs Git workflow.
- [x] Tạo template issue/PR.
- [x] Tạo script khởi tạo Git local và branch.
- [ ] Khoa tạo GitHub repo thật bằng tài khoản cá nhân/nhóm.
- [ ] Khoa push `main` và `develop`.
- [ ] Khoa tạo feature branches trên GitHub.
- [ ] Mời Thành và Duy vào repo.
- [ ] Thành clone repo và chạy frontend skeleton.
- [ ] Duy clone repo và chạy backend skeleton.

## 2. Issue nên tạo trên GitHub

| Mã | Title | Owner | Branch gợi ý |
|---|---|---|---|
| W1-06 | Setup monorepo skeleton | Khoa | `chore/init-repo` |
| W1-06A | Push repo lên GitHub và tạo branch workflow | Khoa | `main`, `develop` |
| W1-06B | Verify frontend skeleton runs locally | Thành | `feature/frontend-layout` |
| W1-06C | Verify backend skeleton runs locally | Duy | `feature/schedule-auto-arrange` |
| W1-06D | Import SQL dump from repo path | Khoa + Duy | `feature/room-management` |
| W1-06E | Add first Postman environment placeholder | Duy | `feature/testing-report` |

## 3. Tiêu chí nghiệm thu

Priority 3 được xem là xong khi:

1. Repo GitHub tồn tại.
2. `main` và `develop` đã push.
3. Thành và Duy clone được repo.
4. `frontend` chạy được trang `/login`.
5. `backend` chạy được `GET /api/health`.
6. File `docs/scope-mvp-v1.md` có trong repo.
7. File `database/Dump20260428.sql` có trong repo.
8. Mỗi thành viên biết branch mình sẽ làm.
