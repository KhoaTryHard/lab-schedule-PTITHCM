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

```bash
mysql -u root -p lab_schedule_ptit_v2 < database/Dump20260428.sql
```

## Quy tắc database trong MVP

1. Không sửa trực tiếp dump gốc nếu không cần.
2. Nếu cần thay đổi schema, tạo file migration mới trong `database/migrations/`.
3. Nếu cần dữ liệu demo, tạo file seed trong `database/seeds/`.
4. Scope phòng luôn giới hạn ở `2B11`, `2B21`, `2B31`.
5. Bảng trung tâm của lịch thực hành là `lab_schedule_entries`.
