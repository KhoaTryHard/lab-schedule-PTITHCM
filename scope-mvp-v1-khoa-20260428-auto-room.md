# Scope MVP v1 - Đề tài phân công lịch thực hành phòng máy

**Người chốt:** Nguyễn Đăng Khoa - Trưởng nhóm / Tech Lead / Database & Integration Lead  
**Ngày chốt:** 28/04/2026  
**Mục tiêu của tài liệu:** Trả lời rõ: dự án làm gì, không làm gì, dùng dữ liệu nào, phòng nào, luồng nào, ai phụ trách gì.

---

## 1. Quyết định phạm vi chính

MVP của nhóm chỉ tập trung vào **phần mềm quản lý và phân công lịch thực hành tại phòng máy** cho 3 phòng:

- `2B11`
- `2B21`
- `2B31`

Nguồn nghiệp vụ tham chiếu từ ảnh UIS do Khoa cung cấp: các lịch **tô đỏ** hoặc có ký hiệu **TH / Thực hành** được xem là lịch thực hành. Các lịch ở phòng khác như `2A16`, `2A35`, `2A36`, `2E36`, `1A...` không thuộc phạm vi MVP.

---

## 2. Luồng nghiệp vụ MVP bắt buộc

Luồng chính cần demo được sau khi cập nhật scope:

```text
CBDT tạo yêu cầu xếp lịch thực hành
→ hệ thống lấy danh sách phòng in-scope: 2B11/2B21/2B31
→ thuật toán tự động sinh phương án xếp phòng thực hành theo tuần/ngày/ca hợp lệ
→ hệ thống kiểm tra ràng buộc cứng cho từng phương án
→ hệ thống chọn phương án tốt nhất hoặc trả danh sách phương án xếp hạng
→ CBDT xem preview phương án tự động và xác nhận tạo lịch thực hành draft
→ duyệt lịch
→ công bố lịch
→ GV/SV/KTV tra cứu lịch đã công bố
```

MVP **có thuật toán sắp xếp phòng thực hành tự động trong phạm vi 3 phòng máy `2B11`, `2B21`, `2B31`**. Ở luồng chính, CBDT **không chọn phòng thủ công**. CBDT chỉ nhập yêu cầu xếp lịch, ví dụ: học phần, nhóm/tổ thực hành, số sinh viên, số buổi, khoảng tuần, ngày/ca ưu tiên nếu có, giảng viên, phần mềm cần dùng. Hệ thống tự động chọn phòng/ca phù hợp dựa trên dữ liệu phòng, lịch đã có và các ràng buộc.

Thuật toán trong MVP là **rule-based auto assignment**: lọc các phương án vi phạm ràng buộc cứng, sau đó chấm điểm đơn giản để chọn phương án tốt nhất. Nhóm **không làm tối ưu toàn cục toàn học viện** và không giải bài toán thời khóa biểu phức tạp cho mọi phòng/mọi môn; chỉ tự động xếp phòng thực hành cho phạm vi 3 phòng đã chốt.

---

## 3. Quy tắc dữ liệu chốt từ ảnh thời khóa biểu

### 3.1 Phòng nằm trong scope

Chỉ chấp nhận lịch thực hành nếu `room_code` thuộc:

```sql
('2B11', '2B21', '2B31')
```

Trong `Dump20260428.sql`, view `vw_room_pc_inventory` cũng đang lọc đúng 3 phòng này, nên phạm vi DB khớp với phạm vi đề tài.

### 3.2 Ca học nằm trong scope

Ảnh thời khóa biểu thể hiện các buổi thực hành theo block 4 tiết, chủ yếu:

- Tiết `1 → 4`
- Tiết `7 → 10`

Bảng `time_slots` trong database có cấu trúc `start_period`, `end_period`, phù hợp để seed 2 ca chính này.

### 3.3 Trường dữ liệu cần lấy từ UIS/screenshot

| UIS / ảnh | Bảng / cột đề xuất trong DB |
|---|---|
| Mã môn học | `courses.course_code` |
| Tên môn học | `courses.course_name` |
| Nhóm | `course_sections.group_no` |
| Tổ TH | `practice_teams.team_no` |
| Phòng | `rooms.room_code` |
| GV | `users.full_name`, `lecturer_profiles` |
| Thứ | `lab_schedule_entries.day_of_week` |
| Tiết bắt đầu / số tiết | `time_slots.start_period`, `time_slots.end_period` |
| Ngày / khoảng thời gian học | `lab_schedule_entries.start_date`, `lab_schedule_entries.end_date` |
| TH / màu đỏ | đưa vào `lab_schedule_entries`, ghi chú nguồn ở `notes` nếu cần |

---

## 4. Dữ liệu thực hành xác nhận từ ảnh

Các bản ghi dưới đây là dữ liệu demo/scope seed ưu tiên vì xuất hiện trong ảnh dưới dạng lịch đỏ hoặc TH và thuộc phòng 2B11/2B21/2B31.

| STT | Học kỳ / tuần | Ngày | Thứ | Tiết | Môn | Mã môn | Nhóm | Phòng | GV | Trạng thái scope |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | HK2 - Tuần 34 | 31/03/2026 | Thứ 3 | 7-10 | An toàn và bảo mật hệ thống thông tin | INT1303 | 03, tổ TH 01 | 2B31 | Phan Thanh Hy | In-scope, confirmed TH |
| 2 | HK2 - Tuần 38 | 28/04/2026 | Thứ 3 | 7-10 | Lập trình Web | INT1434-3 | 03 | 2B11 | Trần Hoàng Nam | In-scope, lịch đỏ |
| 3 | HK2 - Tuần 38 | 01/05/2026 | Thứ 6 | 7-10 | Lập trình Web | INT1434-3 | 03 | 2B11 | Trần Hoàng Nam | In-scope, lịch đỏ; cần xử lý rule ngày lễ nếu áp dụng |
| 4 | HK1 - Tuần 8 | 01/10/2025 | Thứ 4 | 1-4 | Lập trình hướng đối tượng | INT1332 | 03 | 2B21 | Nguyễn Thị Tuyết Hài | In-scope, lịch đỏ |
| 5 | HK1 - Tuần 8 | 01/10/2025 | Thứ 4 | 7-10 | Lập trình hướng đối tượng | INT1332 | 01 | 2B31 | Nguyễn Thị Bích Nguyễn | In-scope, lịch đỏ |
| 6 | HK1 - Tuần 8 | 02/10/2025 | Thứ 5 | 7-10 | Lập trình hướng đối tượng | INT1332 | 04 | 2B31 | Nguyễn Trung Hiếu | In-scope, lịch đỏ |
| 7 | HK1 - Tuần 6 | 17/09/2025 | Thứ 4 | 7-10 | Lập trình hướng đối tượng | INT1332 | 01 | 2B31 | Nguyễn Thị Bích Nguyên | In-scope, lịch đỏ |
| 8 | HK1 - Tuần 6 | 18/09/2025 | Thứ 5 | 1-4 | An toàn ứng dụng web và cơ sở dữ liệu | INT14105 | 01 | 2B21 | Phan Nghĩa Hiệp | In-scope, lịch đỏ |

Các dòng ở phòng `2A16`, `2A35`, `2A36`, `2E36`, `1A...` bị loại khỏi MVP dù có xuất hiện trong thời khóa biểu.

---

## 5. Candidate dữ liệu cần xác minh thêm

Ảnh học kỳ không hiển thị màu đỏ/TH, nhưng có các dòng dùng phòng 2B11/2B21/2B31. Có thể dùng làm seed phụ sau khi xác minh là lịch thực hành:

| Mã môn | Môn | Nhóm tổ | Thứ | Tiết | Phòng | Thời gian học | Ghi chú |
|---|---|---|---:|---:|---|---|---|
| INT1313 | Cơ sở dữ liệu | 02-02 | 5 | 1-4 | 2B11 | 23/10/2025 đến 30/10/2025 | Candidate |
| INT1319 | Hệ điều hành | 02-02 | 3 | 1-4 | 2B31 | 28/10/2025 đến 04/11/2025 | Candidate |
| INT1332 | Lập trình hướng đối tượng | 02-01 | 2 | 1-4 | 2B31 | 20/10/2025 đến 03/11/2025 | Candidate |
| INT1336 | Mạng máy tính | 01-01 | 5 | 1-4 | 2B31 | 13/11/2025 đến 20/11/2025 | Candidate |
| INT1434-3 | Lập trình Web | 01-01 | 4 | 1-4 | 2B21 | 10/09/2025 đến 24/09/2025 | Candidate |

Không đưa candidate vào demo chính cho đến khi nhóm xác nhận đó là lịch thực hành.

---

## 6. Module Must-have sau khi thu hẹp scope

| Module | Có làm trong MVP? | Ghi chú |
|---|---:|---|
| Auth & RBAC | Có | Đủ 5 vai trò: QTV, CBDT, GV, KTV, SV |
| Quản lý phòng máy | Có | Chỉ bắt buộc 2B11, 2B21, 2B31 |
| Quản lý thiết bị / số máy khả dụng | Có | Phục vụ ràng buộc đủ máy |
| Quản lý phần mềm theo phòng | Có | Phục vụ ràng buộc đủ phần mềm |
| Học kỳ, tuần, ca học | Có | Ca 1-4 và 7-10 là bắt buộc |
| Học phần, nhóm học phần, giảng viên | Có | Phục vụ tạo yêu cầu và lịch |
| Tạo yêu cầu xếp lịch | Có | Vai trò CBDT |
| Kiểm tra ràng buộc | Có | Là bước lọc bắt buộc của thuật toán tự động; không lưu nếu fail |
| Thuật toán sắp xếp phòng tự động | Có | Tự chọn phòng/ca trong `2B11`, `2B21`, `2B31` bằng hard constraints + scoring đơn giản |
| Tạo lịch thực hành | Có | Tạo draft từ phương án tự động đã được CBDT xác nhận; bảng trung tâm: `lab_schedule_entries` |
| Duyệt và công bố lịch | Có | Published mới hiển thị cho GV/SV/KTV |
| Tra cứu lịch | Có | Lọc theo tuần, phòng, môn, giảng viên |
| Đổi/hủy/học bù | Để sau luồng chính | Chỉ làm khi MVP chạy ổn |
| Dashboard đẹp / báo cáo nâng cao | Không ưu tiên | Should-have |
| Export / backup / restore | Không làm trong MVP | Could-have |
| Đồng bộ UIS thật | Không làm | Chỉ nhập/seed dữ liệu mẫu |
| Đăng ký môn học | Không làm | UIS là nguồn tham khảo, không clone UIS |

---

## 7. Ràng buộc xếp lịch bắt buộc

Khi CBDT bấm **Auto Arrange**, tạo lịch hoặc công bố lịch, hệ thống phải kiểm tra:

| Mã rule | Ràng buộc | Bảng/view dùng |
|---|---|---|
| ROOM_SCOPE | Chỉ phòng 2B11, 2B21, 2B31 | `rooms` |
| ROOM_STATUS | Phòng phải khả dụng | `rooms.room_status` |
| ROOM_CONFLICT | Không trùng phòng cùng thứ, ca, khoảng ngày | `lab_schedule_entries` |
| LECTURER_CONFLICT | Không trùng giảng viên cùng thứ, ca, khoảng ngày | `lab_schedule_entries` |
| TEAM_CONFLICT | Một tổ thực hành không bị xếp trùng | `lab_schedule_entries`, `practice_teams` |
| CAPACITY_OK | Phòng đủ máy dùng được | `rooms`, `vw_room_capacity`, `vw_room_pc_inventory` |
| SOFTWARE_OK | Phòng có đủ phần mềm yêu cầu | `course_software_requirements`, `room_software_installations` |
| HOLIDAY_BLOCKED | Không xếp vào ngày nghỉ bị chặn | `calendar_holidays`, `vw_active_calendar_holidays` |
| ROOM_BLOCKED | Không xếp phòng đang bị khóa/bảo trì | `room_block_requests`, `vw_active_room_blocks` |

Riêng ngày 01/05/2026 xuất hiện lịch Lập trình Web trong ảnh. Khi seed/demo, nhóm phải quyết định rõ: hoặc xem đó là lịch hệ thống hiện có nên vẫn seed, hoặc bật rule ngày lễ để demo lỗi `HOLIDAY_BLOCKED`.

---

## 8. Thuật toán sắp xếp phòng thực hành tự động trong MVP

### 8.1 Input của thuật toán

Thuật toán nhận đầu vào từ yêu cầu xếp lịch:

| Nhóm dữ liệu | Trường cần có |
|---|---|
| Học phần / lớp học phần | `course_section_id`, `course_id`, `group_no` |
| Tổ thực hành | `practice_team_id`, `team_no`, `student_count` |
| Giảng viên | `lecturer_user_id` |
| Khoảng thời gian | `semester_id`, `week_start`, `week_end`, `start_date`, `end_date` |
| Ca học | `time_slot_id` hoặc danh sách ca được phép, ưu tiên `1-4` và `7-10` |
| Phòng được phép | chỉ `2B11`, `2B21`, `2B31` |
| Yêu cầu kỹ thuật | số máy tối thiểu, phần mềm bắt buộc |
| Ghi chú ưu tiên | ngày/ca ưu tiên nếu CBDT nhập |

### 8.2 Quy trình thuật toán

```text
Bước 1: Lấy danh sách phòng in-scope: 2B11, 2B21, 2B31
Bước 2: Sinh candidate từ tổ hợp phòng × ngày/tuần × ca học hợp lệ
Bước 3: Loại candidate vi phạm hard constraints
Bước 4: Tính điểm candidate còn hợp lệ
Bước 5: Sắp xếp candidate theo điểm giảm dần
Bước 6: Trả phương án tốt nhất hoặc top 3 phương án cho CBDT xem preview
Bước 7: CBDT xác nhận → hệ thống tạo lịch draft
```

### 8.3 Ràng buộc cứng bắt buộc pass

Một phương án bị loại ngay nếu vi phạm một trong các rule sau:

- Phòng không thuộc `2B11`, `2B21`, `2B31`.
- Phòng không ở trạng thái khả dụng.
- Trùng phòng với lịch thực hành đã có.
- Trùng giảng viên cùng ngày/ca/khoảng thời gian.
- Trùng tổ thực hành hoặc lớp học phần cùng ngày/ca/khoảng thời gian.
- Phòng không đủ số máy khả dụng.
- Phòng thiếu phần mềm bắt buộc của học phần.
- Ngày xếp lịch thuộc ngày nghỉ bị chặn.
- Phòng đang bị khóa/bảo trì trong thời gian đó.

### 8.4 Cách chấm điểm đơn giản

Sau khi lọc ràng buộc cứng, hệ thống chấm điểm để chọn phòng tốt nhất:

| Tiêu chí | Gợi ý điểm |
|---|---:|
| Đúng ngày/ca ưu tiên của CBDT | +30 |
| Phòng có đủ phần mềm bắt buộc | +25 |
| Số máy dư ít nhưng vẫn đủ, tránh lãng phí phòng lớn | +15 |
| Phòng có ít lịch hơn trong tuần, giúp cân bằng tải | +15 |
| Cùng phòng với các buổi trước của cùng học phần/tổ | +10 |
| Phòng có trạng thái ổn định, ít sự cố mở | +5 |

Điểm số chỉ dùng để xếp hạng trong MVP, không cần tối ưu toán học phức tạp. Nếu nhiều phương án bằng điểm, ưu tiên theo thứ tự phòng cố định: `2B11` → `2B21` → `2B31`, hoặc theo cấu hình do nhóm chốt trong seed data.

### 8.5 Output của thuật toán

Endpoint thuật toán nên trả về:

```json
{
  "request_id": 1,
  "auto_arrange_status": "success",
  "selected_option": {
    "room_code": "2B11",
    "day_of_week": 3,
    "time_slot": "7-10",
    "start_date": "2026-04-28",
    "end_date": "2026-04-28",
    "score": 85
  },
  "ranked_options": [],
  "failed_reasons": []
}
```

Nếu không có phương án hợp lệ, hệ thống trả về danh sách lý do để CBDT biết cần đổi tuần, đổi ca, giảm sĩ số, cài thêm phần mềm hoặc mở khóa phòng.

## 9. Phạm vi không làm

- Không quản lý toàn bộ thời khóa biểu cá nhân như UIS.
- Không làm đăng ký môn học, học phí, điểm, lịch thi.
- Không quản lý tất cả phòng học; chỉ 2B11, 2B21, 2B31.
- Không xử lý phòng 2A16, 2A35, 2A36, 2E36, 1A... trong MVP.
- Không làm thuật toán tối ưu toàn cục cho toàn trường; MVP chỉ làm thuật toán xếp phòng thực hành tự động theo luật trong phạm vi 3 phòng `2B11`, `2B21`, `2B31`.
- Không bắt buộc đồng bộ dữ liệu thật từ UIS.
- Không làm mobile app riêng.
- Không làm dashboard nâng cao trước khi luồng chính chạy ổn.

---

## 10. Việc Khoa chốt và giao ngay hôm nay

### Khoa tự làm

1. Ghi tài liệu scope này vào repo: `docs/scope-mvp-v1.md`.
2. Tạo issue: `W1-01 Chốt Scope MVP v1`.
3. Rà `Dump20260428.sql`: xác nhận các bảng dùng cho room, time slot, course, request, entry, constraint.
4. Tạo seed plan cho 3 phòng `2B11`, `2B21`, `2B31`, 8 lịch confirmed từ ảnh và dữ liệu để test thuật toán auto arrange.
5. Chốt với nhóm: không làm ngoài phạm vi 3 phòng và lịch TH.

### Giao Thành

1. Prototype UI chỉ dùng 3 phòng 2B11/2B21/2B31 trong filter.
2. Màn hình lịch tuần chỉ hiển thị lịch thực hành, không clone toàn bộ UIS.
3. Tạo màn hình: login, dashboard, room list, create schedule request, auto arrange preview, schedule calendar/list.

### Giao Duy

1. API contract phải có filter room scope: `room_code in 2B11,2B21,2B31`.
2. Viết endpoint `POST /schedules/auto-arrange` để tự động sinh và xếp hạng phương án phòng/ca.
3. Viết endpoint `POST /schedules/check-constraints` với các rule ở mục 7.
4. Tạo Postman test cho các case: auto arrange thành công, không có phương án hợp lệ, trùng phòng, trùng GV, phòng không khả dụng, thiếu máy, thiếu phần mềm, ngày nghỉ, phòng bị block.

---

## 11. Tiêu chí nghiệm thu Priority 1

Priority 1 được xem là xong khi có đủ:

- Scope MVP đã chốt và cả nhóm đồng ý.
- Danh sách phòng in-scope cố định: 2B11, 2B21, 2B31.
- Danh sách dữ liệu demo confirmed từ ảnh được ghi lại.
- Danh sách module Must/Should/Could đã thu hẹp theo scope mới.
- Mapping ảnh UIS → bảng DB đã rõ.
- Không còn chức năng mơ hồ như đăng ký môn, học phí, điểm, lịch thi.
- Thành biết UI cần làm gì, bao gồm màn preview phương án tự động.
- Duy biết API/ràng buộc/thuật toán auto arrange cần làm gì.
- Luồng chính không còn bước CBDT chọn phòng thủ công; phòng được hệ thống đề xuất/chọn tự động.
- Khoa có cơ sở tạo task board và seed data.

---

## 12. Kết luận cho nhóm

Từ ngày 28/04/2026, đề tài được chốt là:

> Xây dựng web MVP để quản lý, tự động sắp xếp phòng thực hành theo luật, kiểm tra ràng buộc, phân công, duyệt, công bố và tra cứu lịch thực hành cho 3 phòng máy 2B11, 2B21, 2B31. Dữ liệu UIS/screenshot chỉ dùng làm nguồn tham khảo và seed demo; nhóm không clone toàn bộ cổng thông tin sinh viên.
