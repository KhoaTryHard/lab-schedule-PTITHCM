# Kết quả chạy Postman Collection 

**Báo cáo kết quả test API** cho chức năng **Duyệt (approve) / Công bố (publish) lịch thực hành** và **Tra cứu lịch đã công bố**, theo issue: rà soát `entry_status` trên `lab_schedule_entries`, RBAC QTV/CBDT, luồng trạng thái draft → approved → published, cập nhật API contract và Postman.

---

## 1. Tóm tắt kết quả

| Hạng mục | Nội dung |
|----------|----------|
| **Module** | Schedules — approve / publish / published lookup |
| **Endpoint chính** | `PATCH /api/schedules/:id/approve`, `PATCH /api/schedules/:id/publish`, `GET /api/schedules/published` |
| **Test Postman liên quan issue** | **12** Approve schedule, **13** Publish schedule, **14** Student/GV lookup published schedule (cộng phụ thuộc **5.1** để có `schedule_id`) |
| **Dữ liệu** | MySQL thật (`lab_schedule_entries`), không dùng mock/stub cho approve/publish |
| **Trạng thái kỳ vọng** | Sau khi backend đã triển khai W3-04 và DB seed khớp biến môi trường: các assertion của **12 / 13 / 14** **pass** khi chạy đúng thứ tự (xem mục 5). |

**So với `test_results.md` (bản cũ):** Trước đây test 12–14 bị fail vì backend chưa trả `data.status` và chưa có lookup published thật. Sau W3-04, collection đã đổi **POST → PATCH**, URL dùng `{{schedule_id}}` (set sau **5.1**), và backend cập nhật DB + trả `status` / `entry_status`.

---

## 2. Kết quả thực hiện theo yêu cầu issue (mapping)

| Yêu cầu issue | Kết quả đạt được |
|----------------|------------------|
| Rà soát field trạng thái `lab_schedule_entries` | Dùng `entry_status` (enum: `draft`, `approved`, `published`, …) và cột audit `approved_*`, `published_*` trong `schedule.service.js`. |
| Implement approve (PATCH hoặc tương đương) | `PATCH /api/schedules/:id/approve` — chỉ chuyển từ `draft` → `approved`, ghi `approved_by_user_id`, `approved_at`. |
| Implement publish (PATCH hoặc tương đương) | `PATCH /api/schedules/:id/publish` — chỉ từ `approved` → `published`, ghi `published_by_user_id`, `published_at`. |
| Chỉ QTV/CBDT được duyệt và công bố | `requireAuth` + `requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN)` trên hai route PATCH. |
| Không publish lịch chưa approve | `draft` gọi publish → **409** với message nghiệp vụ; không cập nhật sang `published`. |
| Trả về trạng thái sau khi cập nhật | Response `data` có `entry_status` và `status` (cùng giá trị). |
| Cập nhật API contract | `docs/api-contract/api-contract-v1.md` — mục 5.4, 5.5, 5.6. |
| Postman test approve / publish | `LabSchedulePTIT.postman_collection.json` — request 12, 13; test assert `status` + `entry_status`. |
| Lịch published phục vụ tra cứu | `GET /api/schedules/published` trả mảng từ DB; test **14** kỳ vọng `data` là array có `length > 0`. |
| Không đánh dấu hoàn thành nếu chỉ mock | Approve/publish thực hiện `UPDATE` MySQL, không trả stub. |

---

## 3. Chi tiết các Test Case 

### 3.1. tạo lịch draft và gán `schedule_id`

- **Request:** `5.1 Create draft schedule valid` — `POST /api/schedules`
- **Kết quả kỳ vọng:** **201 Created**, `data.schedule.entry_status === "draft"`, script set `pm.environment.set("schedule_id", ...)`.
- **Lưu ý:** Nếu **12** gọi khi `schedule_id` rỗng hoặc id không tồn tại → **404** hoặc sai trạng thái. Luôn chạy **5.1** (hoặc tạo draft tương đương) trước **12**.

### 3.2. Approve schedule (Test 12)

- **API:** `PATCH {{base_url}}/schedules/{{schedule_id}}/approve`
- **Auth:** Token user **CBDT** hoặc **QTV** (cùng rule với tạo lịch).
- **Kỳ vọng:** **200 OK**, `data.status === "approved"`, `data.entry_status === "approved"`, DB `lab_schedule_entries` cùng id có `entry_status = 'approved'`.

### 3.3. Publish schedule (Test 13)

- **API:** `PATCH {{base_url}}/schedules/{{schedule_id}}/publish`
- **Điều kiện:** Cùng `schedule_id` đã được approve ở **3.2**.
- **Kỳ vọng:** **200 OK**, `data.status === "published"`, `data.entry_status === "published"`.

### 3.4. Lookup published (Test 14)

- **API:** `GET {{base_url}}/schedules/published?schedule_request_id=1`
- **Auth:** Bất kỳ role đã đăng nhập (theo contract hiện tại).
- **Kỳ vọng:** **200 OK**, `Array.isArray(data)`, `data.length > 0` khi có ít nhất một bản ghi **published** có `lab_schedule_request_id` khớp query (mặc định `1` phải trùng với `lab_schedule_request_id` trong body **5.1**; nếu khác, sửa query hoặc biến môi trường cho khớp).

### 3.5. Kịch bản âm tính

| Kịch bản | kết quả |
|----------|---------|
| Publish khi lịch vẫn `draft` (bỏ qua bước approve) | **409**, message không cho công bố khi chưa duyệt. |
| Approve/publish bằng token **GV / SV / KTV** | **403 Forbidden**. |
| Approve lần 2 khi đã `approved` | **409** (không còn `draft`). |

** Đã test **

---

## 4. Hướng dẫn chạy test (Postman / Newman)

1. Khởi động backend (`npm run dev` trong thư mục `backend`) và đảm bảo MySQL theo `.env`.
2. Import environment **LabSchedulePTIT.local** (biến `base_url`, `auth_token`, `schedule_request_id`, các `demo_*` — xem `docs/postman/README.md`).
3. Chạy **1.1 Login Success** (user có role CBDT hoặc QTV) để có `auth_token`.
4. Chạy **5.1 Create draft schedule valid** để set `schedule_id` và tạo bản ghi `draft`.
5. Chạy **12 → 13 → 14** theo thứ tự.

