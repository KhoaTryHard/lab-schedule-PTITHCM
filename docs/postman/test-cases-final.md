# Bao cao ket qua test Postman Week 4 Final

## 1. Ghi chu du lieu demo

Collection `lab-schedule-week4-final.postman_collection.json` dung seed demo hien tai trong `database/seed_demo_final.sql`.

Tai khoan demo:

| Vai tro | Username | Password |
|:---|:---|:---|
| QTV | `admin` | `123456` |
| CBDT | `cbdt1` | `123456` |
| GV | `gv_phthy` | `123456` |
| KTV | `ktv1` | `123456` |
| SV | `sv1` | `123456` |

## 2. Bang 24 test cases Postman

| STT | Nhom test | Ten request | Expected result | Pass/Fail | Screenshot |
|:---|:---|:---|:---|:---|:---|
| 1 | 1. Auth | 1.1 Login Admin | Status 200, luu `admin_token` | Pass | [image1](screenshot/image1.png) |
| 2 | 1. Auth | 1.2 Login CBDT | Status 200, luu `cbdt_token` | Pass | [image2](screenshot/image2.png) |
| 3 | 1. Auth | 1.3 Login GV | Status 200, luu `gv_token` | Pass | [image3](screenshot/image3.png) |
| 4 | 1. Auth | 1.4 Login KTV | Status 200, luu `ktv_token` | Pass | [image4](screenshot/image4.png) |
| 5 | 1. Auth | 1.5 Login SV | Status 200, luu `sv_token` | Pass | [image5](screenshot/image5.png) |
| 6 | 1. Auth | 1.6 Login Wrong | Status 401 | Pass | [image6](screenshot/image6.png) |
| 7 | 2. Schedule Request | 2.1 POST Schedule Request | Status 201, tao request va luu `schedule_request_id` | Pass | [image7](screenshot/image7.png) |
| 8 | 2. Schedule Request | 2.2 GET Schedule Requests | Status 200, `data` la mang request | Pass | [image8](screenshot/image8.png) |
| 9 | 3. Check Constraint | 3.1 PASS case | Status 200, `passed = true` | Pass | [image9](screenshot/image9.png) |
| 10 | 3. Check Constraint | 3.2 ROOM_CONFLICT | `passed = false`, co code `ROOM_CONFLICT` | Pass | [image10](screenshot/image10.png) |
| 11 | 3. Check Constraint | 3.3 LECTURER_CONFLICT | `passed = false`, co code `LECTURER_CONFLICT` | Pass | [image11](screenshot/image11.png) |
| 12 | 3. Check Constraint | 3.4 ROOM_STATUS | `passed = false`, co code `ROOM_STATUS` | Pass | [image12](screenshot/image12.png) |
| 13 | 3. Check Constraint | 3.5 CAPACITY | Team `practice_team_id=999` co `planned_size=100`, phong chi co 29/30 may nen `CAPACITY_OK.passed = false` | Pass | [image13](screenshot/image13.png) |
| 14 | 3. Check Constraint | 3.6 HOLIDAY_BLOCKED | `passed = false`, co code `HOLIDAY_BLOCKED` | Pass | [image14](screenshot/image14.png) |
| 15 | 4. Auto-Arrange | 4.1 Success case | `auto_arrange_status = success`, `ranked_options.length >= 1` | Pass | [image15](screenshot/image15.png) |
| 16 | 4. Auto-Arrange | 4.2 No valid case | `auto_arrange_status = no_valid_option` | Pass | [image16](screenshot/image16.png) |
| 17 | 4. Auto-Arrange | 4.3 With preferred_day | `status = success`, option dung ngay uu tien co diem cao nhat | Pass | [image17](screenshot/image17.png) |
| 18 | 5. Schedule Lifecycle | 5.1 POST Draft | Status 201, tao draft va luu `schedule_id` | Pass | [image18](screenshot/image18.png) |
| 19 | 5. Schedule Lifecycle | 5.2 PATCH Publish draft | Status 409 vi draft chua duoc approve | Pass | [image19](screenshot/image19.png) |
| 20 | 5. Schedule Lifecycle | 5.3 PATCH Approve | Status 200, `entry_status = approved` | Pass | [image20](screenshot/image20.png) |
| 21 | 5. Schedule Lifecycle | 5.4 PATCH Publish approved | Status 200, `entry_status = published` | Pass | [image21](screenshot/image21.png) |
| 22 | 6. Schedule Lookup | 6.1 GET Student Schedule | Dung `sv_token`, status 200, `data.schedules` la mang | Pass | [image22](screenshot/image22.png) |
| 23 | 6. Schedule Lookup | 6.2 GET Lecturer Schedule | Dung `gv_token`, status 200, `data.schedules` la mang | Pass | [image23](screenshot/image23.png) |
| 24 | 6. Schedule Lookup | 6.3 GET Room Published Schedule | Dung `ktv_token`, status 200, `data` la mang lich published cua phong | Pass | [image24](screenshot/image24.png) |

## 3. Anh xa sang 25 test cases goc

| Nhom TC goc | Trang thai | Coverage |
|:---|:---|:---|
| TC 1-6: Dang nhap phan quyen | Pass | Folder 1. Auth |
| TC 7-8: Quan ly yeu cau xep lich | Pass | Folder 2. Schedule Request |
| TC 9-14: Rang buoc cung | Pass | Folder 3. Check Constraint |
| TC 15-18: Auto arrange | Pass | Folder 4. Auto-Arrange |
| TC 19-22: Vong doi approve/publish | Pass | Folder 5. Schedule Lifecycle |
| TC 23-25: Tra cuu lich | Pass | Folder 6. Schedule Lookup |

Ket qua runner mong doi: co the run collection toan bo de xac nhan 24/24 request pass tren database da import `seed_demo_final.sql`.
