# Quy định đóng góp code

## 1. Luồng làm việc

```text
Tạo issue → tạo branch từ develop → code → commit nhỏ → tạo PR → review → merge
```

Không code trực tiếp trên `main`.

## 2. Commit message

Dùng format:

```text
<type>: <nội dung ngắn>
```

Ví dụ:

```text
feat: add auto arrange schedule endpoint
fix: prevent student from accessing admin route
docs: add report outline
test: add postman tests for room conflict
refactor: split schedule service and controller
chore: initialize repo skeleton
```

## 3. Review

| Người làm | Người review chính |
|---|---|
| Khoa làm backend lõi/database | Duy |
| Duy làm schedule/business logic | Khoa |
| Thành làm frontend | Khoa review nghiệp vụ, Duy review API contract |

## 4. Không merge nếu

- API chưa test bằng Postman.
- Query ghi dữ liệu chưa chạy với DB thật.
- Logic auto arrange chưa có test case.
- UI chưa xử lý loading/error/empty.
- Có conflict chưa resolve.
