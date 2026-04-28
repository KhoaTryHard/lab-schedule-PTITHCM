# GitHub Issues - Tuần 1

## W1-06 Setup repo skeleton

**Owner:** Khoa  
**Priority:** Very High  
**Branch:** `chore/init-repo`

### Tasks

- [ ] Tạo GitHub repo `lab-schedule-ptit`
- [ ] Push skeleton lên `main`
- [ ] Tạo `develop`
- [ ] Tạo branch chức năng
- [ ] Mời Thành và Duy vào repo
- [ ] Gửi hướng dẫn clone/chạy local

### Acceptance Criteria

- Repo clone được.
- `README.md` đọc là chạy được skeleton.
- Backend health check trả response.
- Frontend mở được `/login`.

---

## W1-06B Verify frontend skeleton

**Owner:** Thành  
**Branch:** `feature/frontend-layout`

### Tasks

- [ ] Clone repo
- [ ] Chạy `cd frontend && npm install && npm run dev`
- [ ] Mở `/login`
- [ ] Mở `/academic/auto-arrange`
- [ ] Chụp ảnh màn hình gửi nhóm

---

## W1-06C Verify backend skeleton

**Owner:** Duy  
**Branch:** `feature/schedule-auto-arrange`

### Tasks

- [ ] Clone repo
- [ ] Chạy `cd backend && npm install && npm run dev`
- [ ] Test `GET /api/health`
- [ ] Test `POST /api/schedules/auto-arrange`
- [ ] Gửi response mẫu vào nhóm
