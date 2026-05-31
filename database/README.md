# Database

## File chính

| File | Mục đích |
|---|---|
| `Dump20260428.sql` | SQL dump/schema hiện tại của đề tài |
| `migrations/` | Chứa migration bổ sung khi cần |
| `seeds/` | Chứa seed data demo |

## Database mặc định

```text
lab_schedule_ptit_v2
```

## Import bằng terminal

```powershell
.\scripts\reset-demo-db.ps1
```

Script reset dùng MySQL `SOURCE` với `--default-character-set=utf8mb4` để giữ nguyên dữ liệu tiếng Việt. Tránh `Get-Content | mysql` trong PowerShell vì có thể biến Unicode thành dấu `?`.

## Quy tắc database trong MVP

1. Không sửa trực tiếp dump gốc nếu không cần.
2. Nếu cần thay đổi schema, tạo file migration mới trong `database/migrations/`.
3. Nếu cần dữ liệu demo, tạo file seed trong `database/seeds/`.
4. Scope phòng luôn giới hạn ở `2B11`, `2B21`, `2B31`.
5. Bảng trung tâm của lịch thực hành là `lab_schedule_entries`.
