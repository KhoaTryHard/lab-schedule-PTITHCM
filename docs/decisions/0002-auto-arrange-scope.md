# ADR 0002 - Auto arrange trong MVP

## Date

28/04/2026

## Decision

MVP có thuật toán tự động sắp xếp phòng thực hành trong phạm vi 3 phòng:

```text
2B11, 2B21, 2B31
```

Thuật toán dạng rule-based:

```text
Sinh candidate → lọc hard constraints → chấm điểm → trả top options → CBDT xác nhận
```

## Not doing

- Không tối ưu toàn cục toàn trường.
- Không xếp lịch cho tất cả phòng.
- Không clone toàn bộ UIS.

## Consequence

Backend cần endpoint:

```text
POST /api/schedules/auto-arrange
POST /api/schedules/check-constraints
```

Frontend cần màn:

```text
/academic/auto-arrange
```
