import {
  CardCreateAccounts,
  CardUI,
} from "../../../components/accounts/cardCreateAccounts.jsx";
import {
  UsersIcon,
  AdminIcon,
  AcademicIcon,
  LecturerIcon,
  TechnicianIcon,
  StudentIcon,
} from "../../../components/icons/systemIcon.jsx";
import DataTable from "../../../components/common/DataTable.jsx";

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: hiển thị nội dung mẫu cho trang quản lý tài khoản của quản trị viên.
 * Hàm trả về: JSX của trang /admin/accounts.
 */
export default function AccountsPage() {
  const accountColumns = [
    { key: "code", label: "Mã" },
    { key: "lastName", label: "Họ" },
    { key: "firstName", label: "Tên" },
    { key: "email", label: "Email" },
    { key: "status", label: "Trạng thái" },
  ];

  const accountRows = [
    {
      id: 1,
      code: "ADM001",
      lastName: "Nguyễn Văn",
      firstName: "Quản Trị",
      email: "admin01@ptithcm.edu.vn",
      status: "Hoạt động",
    },
    {
      id: 2,
      code: "CB001",
      lastName: "Trần Thị",
      firstName: "Đào Tạo",
      email: "cbdt01@ptithcm.edu.vn",
      status: "Hoạt động",
    },
    {
      id: 3,
      code: "GV001",
      lastName: "Lê Minh",
      firstName: "Giảng",
      email: "gv01@ptithcm.edu.vn",
      status: "Bị khóa",
    },
  ];

  return (
    <div>
      <section className="card card1">
        <CardUI
          IconComponent={UsersIcon}
          nameCard="Tổng tài khoản"
          numbers={5}
          className="card2"
        />

        <CardUI
          IconComponent={AdminIcon}
          nameCard="Quản trị viên"
          numbers={5}
          className="card2"
        />

        <CardUI
          IconComponent={AcademicIcon}
          nameCard="Cán bộ đào tạo"
          numbers={3}
        />

        <CardUI
          IconComponent={LecturerIcon}
          nameCard="Giảng viên"
          numbers={18}
          className="card2"
        />

        <CardUI
          IconComponent={TechnicianIcon}
          nameCard="Kỹ thuật viên"
          numbers={4}
          className="card2"
        />

        <CardUI
          IconComponent={StudentIcon}
          nameCard="Sinh viên"
          numbers={120}
          className="card2"
        />
      </section>

      <section className="card managementAccount">
        <div className="card accountsView">
          <div className="card optionView">
            <div className="buttonsView">
              <button>Tất cả</button>
              <button>Admin</button>
              <button>Cán bộ đào tạo</button>
              <button>Kỹ thuật viên</button>
              <button>Giảng viên</button>
              <button>Sinh viên</button>
            </div>
            <div className="inputFind">
              <button>Tìm kiếm</button>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mã số..."
              />
            </div>
          </div>

          <div className="card option">
            <div>
              <button>Thao tác</button>
            </div>
            <div>
              <select>
                <option>Trạng thái</option>
                <option>Hoạt động</option>
                <option>Bị khóa</option>
                <option>Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          <div className="card">
            <DataTable columns={accountColumns} rows={accountRows} />
          </div>
        </div>
        <div className="card uploadCardGrid">
          <h5>TẠO TÀI KHOẢN</h5>
          <CardCreateAccounts
            IconComponent={AdminIcon}
            NameCard="Quản trị viên"
          />
          <CardCreateAccounts
            IconComponent={AcademicIcon}
            NameCard="Cán bộ đào tạo"
          />
          <CardCreateAccounts
            IconComponent={TechnicianIcon}
            NameCard="Kỹ thuật viên"
          />
          <CardCreateAccounts
            IconComponent={LecturerIcon}
            NameCard="Giảng viên"
          />
          <CardCreateAccounts
            IconComponent={StudentIcon}
            NameCard="Sinh viên"
          />
        </div>
      </section>
    </div>
  );
}
