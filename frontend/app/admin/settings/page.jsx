const guideBadgeItems = [
  "QTV",
  "MVP",
  "Phòng máy",
  "Quản trị hệ thống",
];

const guideTocItems = [
  { id: "tong-quan", label: "Tổng quan vai trò quản trị viên" },
  { id: "quy-trinh", label: "Quy trình thao tác khuyến nghị" },
  { id: "tai-khoan", label: "Hướng dẫn quản lý tài khoản" },
  { id: "phong-may", label: "Hướng dẫn quản lý phòng máy và thiết bị" },
  { id: "du-lieu-dao-tao", label: "Hướng dẫn quản lý dữ liệu đào tạo" },
  { id: "tra-cuu", label: "Hướng dẫn tra cứu toàn hệ thống" },
  { id: "bao-cao", label: "Hướng dẫn thống kê và báo cáo" },
  { id: "trang-thai", label: "Quy tắc trạng thái thường gặp" },
  { id: "loi-thuong-gap", label: "Lỗi thường gặp và cách xử lý" },
  { id: "checklist-demo", label: "Checklist trước khi demo/bàn giao" },
];

const guideQuickChecklistItems = [
  "Có tài khoản QTV, CBDT, GV, KTV và SV để demo phân quyền.",
  "Sinh viên không truy cập được route admin.",
  "Có đủ 3 phòng 2B11, 2B21, 2B31 với trạng thái rõ ràng.",
  "Có ít nhất một tình huống phòng bảo trì hoặc thiết bị lỗi để minh họa.",
  "Có học kỳ hiện hành, tuần học, ca học, học phần và lớp học phần.",
  "Tra cứu được lịch, phòng, thiết bị, phần mềm và điều kiện xếp lịch.",
  "Có card thống kê, biểu đồ và nút xuất thống kê hoặc CSV.",
];

const guideStatusGroups = [
  {
    title: "Trạng thái lịch thực hành",
    items: [
      { label: "Draft", toneClassName: "roomStatusNeutral" },
      { label: "Approved", toneClassName: "roomStatusNeutral" },
      { label: "Published", toneClassName: "roomStatusPositive" },
      { label: "Cancelled", toneClassName: "roomStatusDanger" },
      { label: "Completed", toneClassName: "trainingStatusMuted" },
    ],
  },
  {
    title: "Trạng thái phòng",
    items: [
      { label: "Khả dụng", toneClassName: "roomStatusPositive" },
      { label: "Đang sử dụng", toneClassName: "roomStatusNeutral" },
      { label: "Bảo trì", toneClassName: "roomStatusWarning" },
      { label: "Hỏng", toneClassName: "roomStatusDanger" },
      { label: "Tạm khóa", toneClassName: "roomStatusDanger" },
    ],
  },
  {
    title: "Trạng thái thiết bị",
    items: [
      { label: "Hoạt động", toneClassName: "roomStatusPositive" },
      { label: "Lỗi nhẹ", toneClassName: "roomStatusWarning" },
      { label: "Hỏng", toneClassName: "roomStatusDanger" },
      { label: "Đang sửa", toneClassName: "roomStatusWarning" },
      { label: "Đã thay", toneClassName: "trainingStatusMuted" },
    ],
  },
  {
    title: "Trạng thái tài khoản",
    items: [
      { label: "Hoạt động", toneClassName: "roomStatusPositive" },
      { label: "Bị khóa", toneClassName: "roomStatusDanger" },
      { label: "Ngừng hoạt động", toneClassName: "roomStatusWarning" },
      { label: "Chờ kích hoạt", toneClassName: "roomStatusNeutral" },
    ],
  },
];

/**
 * Hàm nhận vào: title là tiêu đề section, sectionId là id neo trang, children là nội dung hiển thị bên trong.
 * Hàm xử lý: dựng một card hướng dẫn có tiêu đề rõ ràng để chia tài liệu thành từng phần dễ đọc.
 * Hàm trả về: JSX của một section hướng dẫn trong cột nội dung chính.
 */
function GuideSection({ title, sectionId, children }) {
  return (
    <section id={sectionId} className="card guideSection">
      <h2 className="guideSectionTitle">{title}</h2>
      <div className="guideSectionBody">{children}</div>
    </section>
  );
}

/**
 * Hàm nhận vào: label là nội dung badge, toneClassName là class màu trạng thái cần áp dụng.
 * Hàm xử lý: tái sử dụng style badge chung của admin để hiển thị các trạng thái nghiệp vụ trong tài liệu hướng dẫn.
 * Hàm trả về: JSX của một badge trạng thái.
 */
function GuideStatusBadge({ label, toneClassName }) {
  return (
    <span className={`roomStatusBadge ${toneClassName}`}>{label}</span>
  );
}

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: dựng trang hướng dẫn sử dụng dành cho hệ Admin/QTV với mục lục, checklist và các phần mô tả thao tác nghiệp vụ.
 * Hàm trả về: JSX của route /admin/settings.
 */
export default function SettingsPage() {
  return (
    <div className="guidePage">
      <section className="card guideHero">
        <div className="guideActionBar">
          <button type="button" className="button roomSearchButton">
            Tải hướng dẫn
          </button>
          <button type="button" className="button secondary roomRefreshButton">
            In hướng dẫn
          </button>
          <button type="button" className="button secondary guideCopyButton">
            Sao chép checklist
          </button>
        </div>

        <h1 className="guideHeroTitle">Hướng dẫn sử dụng hệ Admin</h1>
        <p className="guideHeroText">
          Tài liệu thao tác dành cho Quản trị viên hệ thống trong phần mềm phân
          công lịch thực hành phòng máy PTIT HCM.
        </p>

        <div className="guideBadgeList">
          {guideBadgeItems.map((badgeItem) => (
            <span key={badgeItem} className="guideBadge">
              {badgeItem}
            </span>
          ))}
        </div>
      </section>

      <section className="guideLayout">
        <div className="guideMain">
          <GuideSection
            title="1. Tổng quan vai trò quản trị viên"
            sectionId="tong-quan"
          >
            <p>
              Quản trị viên hệ thống, viết tắt là QTV, là người chịu trách
              nhiệm quản lý dữ liệu nền và theo dõi vận hành tổng thể của hệ
              thống phân công lịch thực hành phòng máy.
            </p>
            <p>
              Trong phạm vi MVP, quản trị viên tập trung vào các nhóm công việc
              chính:
            </p>
            <ul>
              <li>Quản lý tài khoản người dùng và phân quyền theo vai trò.</li>
              <li>
                Quản lý phòng máy, thiết bị và phần mềm phục vụ thực hành.
              </li>
              <li>
                Quản lý dữ liệu đào tạo như học kỳ, tuần học, ca học, học phần
                và lớp học phần.
              </li>
              <li>
                Tra cứu toàn hệ thống để kiểm tra lịch, phòng, thiết bị, phần
                mềm và điều kiện xếp lịch.
              </li>
              <li>
                Thống kê và xuất báo cáo phục vụ quản trị vận hành.
              </li>
            </ul>
            <p>
              Quản trị viên không trực tiếp thay thế toàn bộ nghiệp vụ của cán
              bộ đào tạo. Các thao tác như tạo yêu cầu xếp lịch, xếp lịch tự
              động, duyệt và công bố lịch sẽ thuộc nhóm chức năng của cán bộ
              đào tạo. Admin chủ yếu đảm bảo dữ liệu nền chính xác và hệ thống
              vận hành ổn định.
            </p>
          </GuideSection>

          <GuideSection
            title="2. Quy trình thao tác khuyến nghị"
            sectionId="quy-trinh"
          >
            <p>
              Để hệ thống hoạt động đúng nghiệp vụ, quản trị viên nên thao tác
              theo trình tự sau:
            </p>
            <ol className="guideStepList">
              <li>
                <strong>Bước 1: Kiểm tra tài khoản và vai trò</strong>
                <p>
                  Trước khi bắt đầu học kỳ, vào mục Quản lý tài khoản để kiểm
                  tra danh sách người dùng. Đảm bảo mỗi người dùng có đúng vai
                  trò: QTV, CBDT, GV, KTV hoặc SV.
                </p>
              </li>
              <li>
                <strong>Bước 2: Kiểm tra phòng máy và thiết bị</strong>
                <p>
                  Vào mục Quản phòng máy và thiết bị để rà soát 3 phòng trong
                  phạm vi MVP gồm 2B11, 2B21 và 2B31. Kiểm tra số máy hoạt
                  động, số máy hỏng, máy chiếu, WiFi, LAN, kỹ thuật viên phụ
                  trách và trạng thái phòng.
                </p>
              </li>
              <li>
                <strong>Bước 3: Kiểm tra dữ liệu đào tạo</strong>
                <p>
                  Vào mục Quản lý dữ liệu đào tạo để đảm bảo học kỳ, tuần học,
                  ca học, học phần và lớp học phần đã được khai báo đầy đủ. Đây
                  là dữ liệu đầu vào quan trọng cho việc tạo yêu cầu xếp lịch.
                </p>
              </li>
              <li>
                <strong>Bước 4: Tra cứu và đối chiếu</strong>
                <p>
                  Vào mục Tra cứu để kiểm tra lịch thực hành toàn hệ thống, tình
                  trạng phòng, thiết bị, phần mềm và điều kiện xếp lịch. Nếu
                  phát hiện phòng bảo trì, thiếu phần mềm hoặc thiết bị lỗi thì
                  cần cập nhật lại dữ liệu trước khi giáo vụ xếp lịch.
                </p>
              </li>
              <li>
                <strong>Bước 5: Thống kê và xuất báo cáo</strong>
                <p>
                  Vào mục Thống kê &amp; báo cáo để tổng hợp số buổi thực hành,
                  tần suất sử dụng phòng, lịch đã công bố, lịch bị hủy, tình
                  trạng thiết bị và phần mềm. Có thể xuất thống kê hoặc báo cáo
                  dạng CSV/Excel để phục vụ minh chứng.
                </p>
              </li>
            </ol>
          </GuideSection>

          <GuideSection
            title="3. Hướng dẫn quản lý tài khoản"
            sectionId="tai-khoan"
          >
            <p>
              Mục Quản lý tài khoản dùng để theo dõi và quản trị người dùng
              trong hệ thống.
            </p>
            <p>Các nhóm vai trò chính:</p>
            <ul>
              <li>QTV: Quản trị viên hệ thống.</li>
              <li>CBDT: Cán bộ đào tạo hoặc giáo vụ.</li>
              <li>GV: Giảng viên.</li>
              <li>KTV: Kỹ thuật viên.</li>
              <li>SV: Sinh viên.</li>
            </ul>
            <p>Khi quản lý tài khoản, quản trị viên cần kiểm tra:</p>
            <ul>
              <li>Mã người dùng hoặc tên đăng nhập.</li>
              <li>Họ tên.</li>
              <li>Email.</li>
              <li>Vai trò.</li>
              <li>Trạng thái tài khoản.</li>
            </ul>
            <p>Các trạng thái tài khoản thường gặp:</p>
            <ul>
              <li>
                Hoạt động: Tài khoản được phép đăng nhập và sử dụng hệ thống.
              </li>
              <li>
                Bị khóa: Tài khoản tạm thời không được sử dụng.
              </li>
              <li>
                Ngừng hoạt động: Tài khoản không còn dùng trong hệ thống.
              </li>
            </ul>
            <div className="guideNoteBox">
              <strong>Lưu ý</strong>
              <ul>
                <li>Không cấp sai vai trò cho người dùng.</li>
                <li>Sinh viên không được truy cập chức năng admin.</li>
                <li>
                  Giảng viên chỉ nên truy cập lịch dạy và các yêu cầu liên quan
                  đến lớp mình phụ trách.
                </li>
                <li>
                  Kỹ thuật viên chỉ nên truy cập nghiệp vụ phòng máy, thiết bị
                  và sự cố.
                </li>
                <li>
                  Cán bộ đào tạo phụ trách yêu cầu xếp lịch, duyệt và công bố
                  lịch.
                </li>
                <li>
                  Tài khoản đã phát sinh dữ liệu lịch sử không nên xóa cứng, chỉ
                  nên khóa hoặc chuyển trạng thái ngừng hoạt động.
                </li>
              </ul>
            </div>
          </GuideSection>

          <GuideSection
            title="4. Hướng dẫn quản lý phòng máy và thiết bị"
            sectionId="phong-may"
          >
            <p>
              Mục Quản phòng máy và thiết bị dùng để quản lý dữ liệu cơ sở vật
              chất phục vụ xếp lịch thực hành.
            </p>
            <p>Trong phạm vi MVP, hệ thống chỉ theo dõi 3 phòng:</p>
            <ul>
              <li>2B11</li>
              <li>2B21</li>
              <li>2B31</li>
            </ul>
            <p>Khi kiểm tra phòng máy, quản trị viên cần quan sát:</p>
            <ul>
              <li>Mã phòng.</li>
              <li>Tổng số máy.</li>
              <li>Số máy hỏng.</li>
              <li>Số máy dùng được.</li>
              <li>Số máy dành cho giảng viên nếu có.</li>
              <li>Máy chiếu.</li>
              <li>WiFi.</li>
              <li>Mạng LAN.</li>
              <li>Trạng thái phòng.</li>
              <li>Kỹ thuật viên phụ trách.</li>
            </ul>
            <p>Các trạng thái phòng thường gặp:</p>
            <ul>
              <li>Khả dụng: Phòng có thể được sử dụng để xếp lịch.</li>
              <li>
                Đang sử dụng: Phòng đang có lịch hoặc đang trong ca sử dụng.
              </li>
              <li>
                Bảo trì: Phòng đang được bảo trì, không nên xếp lịch mới.
              </li>
              <li>Hỏng: Phòng không đủ điều kiện sử dụng.</li>
              <li>
                Tạm khóa: Phòng bị khóa tạm thời để xử lý sự cố hoặc phục vụ mục
                đích khác.
              </li>
            </ul>
            <p>Khi quản lý thiết bị, cần kiểm tra:</p>
            <ul>
              <li>Mã thiết bị.</li>
              <li>Tên thiết bị.</li>
              <li>Phòng chứa thiết bị.</li>
              <li>Loại thiết bị.</li>
              <li>Cấu hình hoặc phiên bản.</li>
              <li>Trạng thái thiết bị.</li>
              <li>Thời gian cập nhật gần nhất.</li>
              <li>Ghi chú kỹ thuật.</li>
            </ul>
            <p>Các loại thiết bị thường gặp:</p>
            <ul>
              <li>Máy tính.</li>
              <li>Máy chiếu.</li>
              <li>Mạng.</li>
              <li>Phần mềm.</li>
              <li>Khác.</li>
            </ul>
            <p>Các trạng thái thiết bị thường gặp:</p>
            <ul>
              <li>Hoạt động.</li>
              <li>Lỗi nhẹ.</li>
              <li>Hỏng.</li>
              <li>Đang sửa.</li>
              <li>Đã thay.</li>
            </ul>
            <div className="guideNoteBox">
              <strong>Lưu ý</strong>
              <ul>
                <li>
                  Số máy dùng được phải đáp ứng sĩ số lớp thực hành.
                </li>
                <li>
                  Phòng đang bảo trì, hỏng hoặc tạm khóa không nên được đưa vào
                  gợi ý xếp lịch.
                </li>
                <li>
                  Phần mềm trong phòng cần phù hợp với yêu cầu của học phần.
                </li>
                <li>
                  Nếu thiết bị lỗi ảnh hưởng đến buổi học, kỹ thuật viên cần cập
                  nhật trạng thái để cán bộ đào tạo biết khi xếp lịch.
                </li>
              </ul>
            </div>
          </GuideSection>

          <GuideSection
            title="5. Hướng dẫn quản lý dữ liệu đào tạo"
            sectionId="du-lieu-dao-tao"
          >
            <p>
              Mục Quản lý dữ liệu đào tạo dùng để quản lý dữ liệu nền phục vụ
              tạo yêu cầu và phân công lịch thực hành.
            </p>
            <p>Các nhóm dữ liệu chính:</p>
            <ul>
              <li>Học kỳ.</li>
              <li>Tuần học.</li>
              <li>Ca học.</li>
              <li>Học phần.</li>
              <li>Lớp học phần.</li>
              <li>Lớp hành chính.</li>
              <li>Phân công giảng viên.</li>
            </ul>
            <p>Thứ tự khai báo khuyến nghị:</p>
            <ol className="guideStepList">
              <li>
                <strong>Bước 1: Khai báo học kỳ</strong>
                <p>
                  Học kỳ là phạm vi thời gian lớn nhất để quản lý lịch. Mỗi học
                  kỳ cần có năm học, tên học kỳ, ngày bắt đầu, ngày kết thúc và
                  trạng thái hiện hành.
                </p>
              </li>
              <li>
                <strong>Bước 2: Khai báo tuần học</strong>
                <p>
                  Tuần học thuộc về một học kỳ. Tuần học giúp lọc lịch và xác
                  định các khoảng thời gian xếp lịch.
                </p>
              </li>
              <li>
                <strong>Bước 3: Khai báo ca học</strong>
                <p>
                  Ca học chuẩn hóa khung giờ thực hành. Ví dụ: Tiết 1-4 hoặc
                  Tiết 7-10. Ca học là dữ liệu quan trọng để kiểm tra trùng
                  lịch.
                </p>
              </li>
              <li>
                <strong>Bước 4: Khai báo học phần</strong>
                <p>
                  Học phần cần có mã học phần, tên học phần, số tín chỉ, số tiết
                  lý thuyết, số tiết thực hành và trạng thái. Những học phần có
                  tiết thực hành sẽ cần phòng máy.
                </p>
              </li>
              <li>
                <strong>Bước 5: Khai báo lớp học phần</strong>
                <p>
                  Lớp học phần là đơn vị trung tâm để tạo yêu cầu xếp lịch. Cần
                  có học phần, học kỳ, nhóm, sĩ số dự kiến, sĩ số đăng ký, ngày
                  bắt đầu, ngày kết thúc và trạng thái.
                </p>
              </li>
              <li>
                <strong>Bước 6: Gán giảng viên</strong>
                <p>
                  Giảng viên được gán vào lớp học phần để phục vụ kiểm tra trùng
                  lịch giảng viên và hiển thị lịch dạy cá nhân.
                </p>
              </li>
            </ol>
            <div className="guideNoteBox">
              <strong>Lưu ý</strong>
              <ul>
                <li>
                  Học kỳ phải tồn tại trước khi tạo tuần học và lớp học phần.
                </li>
                <li>Học phần phải tồn tại trước khi tạo lớp học phần.</li>
                <li>
                  Ca học phải được khai báo trước khi hệ thống kiểm tra trùng
                  lịch.
                </li>
                <li>
                  Lớp học phần cần có sĩ số rõ ràng để so sánh với số máy dùng
                  được trong phòng.
                </li>
                <li>
                  Không nên xếp lịch cho lớp học phần chưa mở hoặc đã hủy.
                </li>
              </ul>
            </div>
          </GuideSection>

          <GuideSection
            title="6. Hướng dẫn tra cứu toàn hệ thống"
            sectionId="tra-cuu"
          >
            <p>
              Mục Tra cứu dùng để tìm kiếm và theo dõi dữ liệu toàn hệ thống.
              Đây là nơi quản trị viên kiểm tra nhanh các thông tin liên quan
              trước khi đối chiếu hoặc xuất báo cáo.
            </p>
            <p>Các nhóm tra cứu chính:</p>
            <ul>
              <li>Tất cả.</li>
              <li>Lịch thực hành.</li>
              <li>Phòng máy.</li>
              <li>Thiết bị.</li>
              <li>Phần mềm.</li>
              <li>Điều kiện xếp lịch.</li>
              <li>Người dùng.</li>
            </ul>
            <p>
              Khi tra cứu lịch thực hành, quản trị viên có thể kiểm tra:
            </p>
            <ul>
              <li>Mã lịch.</li>
              <li>Học phần.</li>
              <li>Lớp hoặc nhóm.</li>
              <li>Tổ thực hành.</li>
              <li>Giảng viên.</li>
              <li>Phòng.</li>
              <li>Thứ.</li>
              <li>Ca.</li>
              <li>Thời gian.</li>
              <li>Trạng thái.</li>
            </ul>
            <p>Khi tra cứu phòng máy, quản trị viên có thể kiểm tra:</p>
            <ul>
              <li>Phòng nào đang sử dụng.</li>
              <li>Phòng nào khả dụng.</li>
              <li>Phòng nào đang bảo trì.</li>
              <li>Số máy dùng được.</li>
              <li>Số máy hỏng.</li>
              <li>Kỹ thuật viên phụ trách.</li>
            </ul>
            <p>Khi tra cứu thiết bị, quản trị viên có thể kiểm tra:</p>
            <ul>
              <li>Thiết bị nào đang hoạt động.</li>
              <li>Thiết bị nào lỗi nhẹ.</li>
              <li>Thiết bị nào hỏng.</li>
              <li>Thiết bị nào đang sửa.</li>
              <li>Thiết bị thuộc phòng nào.</li>
            </ul>
            <p>Khi tra cứu phần mềm, quản trị viên có thể kiểm tra:</p>
            <ul>
              <li>Phần mềm đã cài ở phòng nào.</li>
              <li>Phiên bản phần mềm.</li>
              <li>Phần mềm có cần cập nhật không.</li>
              <li>Phần mềm liên quan đến học phần nào.</li>
            </ul>
            <p>
              Khi tra cứu điều kiện xếp lịch, quản trị viên có thể kiểm tra:
            </p>
            <ul>
              <li>Học phần cần phần mềm gì.</li>
              <li>Phòng đề xuất có đủ máy không.</li>
              <li>Phòng có đủ phần mềm không.</li>
              <li>Phòng có đang bảo trì không.</li>
              <li>Kết quả kiểm tra là đạt hay chưa đạt.</li>
            </ul>
            <div className="guideNoteBox">
              <strong>Lưu ý</strong>
              <ul>
                <li>Tra cứu không phải là nơi tạo mới dữ liệu.</li>
                <li>
                  Nếu phát hiện dữ liệu sai, cần quay lại màn quản lý tương ứng
                  để cập nhật.
                </li>
                <li>
                  Nếu phòng không đạt điều kiện, cần kiểm tra lại phòng máy,
                  thiết bị và phần mềm trước khi xếp lịch.
                </li>
              </ul>
            </div>
          </GuideSection>

          <GuideSection
            title="7. Hướng dẫn thống kê và báo cáo"
            sectionId="bao-cao"
          >
            <p>
              Mục Thống kê &amp; báo cáo dùng để tổng hợp số liệu vận hành và xuất
              báo cáo phục vụ quản trị.
            </p>
            <p>Các loại thống kê chính:</p>
            <ul>
              <li>Tổng số buổi thực hành.</li>
              <li>Số buổi đã duyệt.</li>
              <li>Số buổi đã công bố.</li>
              <li>Số buổi bị hủy.</li>
              <li>Số buổi hoàn thành.</li>
              <li>Tỷ lệ sử dụng phòng.</li>
              <li>Số sự cố đang xử lý.</li>
              <li>Số thiết bị lỗi.</li>
              <li>Số phần mềm cần cập nhật.</li>
            </ul>
            <p>Các nhóm báo cáo chính:</p>
            <ul>
              <li>Tổng quan.</li>
              <li>Sử dụng phòng.</li>
              <li>Lịch thực hành.</li>
              <li>Thiết bị và sự cố.</li>
              <li>Phần mềm.</li>
              <li>Đổi lịch, hủy lịch, học bù.</li>
              <li>Mẫu báo cáo.</li>
            </ul>
            <p>Khi tạo thống kê, quản trị viên nên chọn:</p>
            <ul>
              <li>Khoảng thời gian.</li>
              <li>Học kỳ.</li>
              <li>Tuần học.</li>
              <li>Phòng.</li>
              <li>Loại báo cáo.</li>
              <li>Trạng thái lịch.</li>
            </ul>
            <p>Các nút chức năng:</p>
            <ul>
              <li>
                Tạo thống kê: Tổng hợp dữ liệu theo bộ lọc đang chọn.
              </li>
              <li>
                Làm mới: Đưa bộ lọc về trạng thái ban đầu.
              </li>
              <li>
                Xuất thống kê: Xuất dữ liệu thống kê đang hiển thị.
              </li>
              <li>
                Xuất báo cáo Excel: Xuất báo cáo dạng CSV/Excel để lưu hoặc nộp
                minh chứng.
              </li>
              <li>
                Xuất PDF hoặc In báo cáo: Chức năng mô phỏng để chuẩn bị cho bản
                hoàn thiện sau.
              </li>
            </ul>
            <p>Mẫu báo cáo quản trị viên nên thể hiện:</p>
            <ul>
              <li>Từ ngày.</li>
              <li>Đến ngày.</li>
              <li>Người lập.</li>
              <li>Chỉ tiêu.</li>
              <li>Số liệu.</li>
              <li>Ghi chú.</li>
              <li>Ngày lập báo cáo.</li>
            </ul>
          </GuideSection>

          <GuideSection
            title="8. Quy tắc trạng thái thường gặp"
            sectionId="trang-thai"
          >
            <p>
              Các trạng thái dưới đây là nhóm giá trị thường gặp khi quản trị
              tài khoản, phòng máy, thiết bị, lịch thực hành và yêu cầu xếp
              lịch trong MVP.
            </p>
            <div className="guideStatusGrid">
              {guideStatusGroups.map((statusGroup) => (
                <article key={statusGroup.title} className="guideStatusCard">
                  <h3 className="guideStatusTitle">{statusGroup.title}</h3>
                  <div className="guideStatusBadgeWrap">
                    {statusGroup.items.map((statusItem) => (
                      <GuideStatusBadge
                        key={`${statusGroup.title}-${statusItem.label}`}
                        label={statusItem.label}
                        toneClassName={statusItem.toneClassName}
                      />
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="guideNoteBox">
              <strong>Chi tiết trạng thái</strong>
              <p>Trạng thái lịch thực hành:</p>
              <ul>
                <li>Draft: Lịch nháp, chưa duyệt.</li>
                <li>Approved: Lịch đã duyệt.</li>
                <li>Published: Lịch đã công bố.</li>
                <li>Cancelled: Lịch đã hủy.</li>
                <li>Completed: Lịch đã hoàn thành.</li>
              </ul>
              <p>Trạng thái yêu cầu xếp lịch:</p>
              <ul>
                <li>Draft: Yêu cầu nháp.</li>
                <li>Pending review: Chờ xem xét.</li>
                <li>Approved: Đã duyệt.</li>
                <li>Rejected: Từ chối.</li>
                <li>Scheduled: Đã xếp lịch.</li>
                <li>Published: Đã công bố.</li>
                <li>Cancelled: Đã hủy.</li>
              </ul>
              <p>Trạng thái phòng:</p>
              <ul>
                <li>Khả dụng.</li>
                <li>Đang sử dụng.</li>
                <li>Bảo trì.</li>
                <li>Hỏng.</li>
                <li>Tạm khóa.</li>
              </ul>
              <p>Trạng thái thiết bị:</p>
              <ul>
                <li>Hoạt động.</li>
                <li>Lỗi nhẹ.</li>
                <li>Hỏng.</li>
                <li>Đang sửa.</li>
                <li>Đã thay.</li>
              </ul>
              <p>Trạng thái tài khoản:</p>
              <ul>
                <li>Hoạt động.</li>
                <li>Bị khóa.</li>
                <li>Ngừng hoạt động.</li>
                <li>Chờ kích hoạt nếu có.</li>
              </ul>
            </div>
          </GuideSection>

          <GuideSection
            title="9. Lỗi thường gặp và cách xử lý"
            sectionId="loi-thuong-gap"
          >
            <ul className="guideProblemList">
              <li>
                <strong>Không đăng nhập được:</strong>
                <ul>
                  <li>Kiểm tra tên đăng nhập và mật khẩu.</li>
                  <li>
                    Kiểm tra tài khoản có bị khóa hoặc ngừng hoạt động không.
                  </li>
                  <li>
                    Kiểm tra backend và database có đang chạy không nếu dùng API
                    thật.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Vào sai quyền bị chuyển đến trang không có quyền:</strong>
                <ul>
                  <li>Kiểm tra vai trò của tài khoản.</li>
                  <li>Đảm bảo tài khoản admin có role QTV.</li>
                  <li>Không dùng tài khoản sinh viên để vào khu vực admin.</li>
                </ul>
              </li>
              <li>
                <strong>Không thấy dữ liệu trong bảng:</strong>
                <ul>
                  <li>Kiểm tra bộ lọc đang chọn.</li>
                  <li>Bấm Làm mới để reset bộ lọc.</li>
                  <li>Kiểm tra từ khóa tìm kiếm có quá hẹp không.</li>
                </ul>
              </li>
              <li>
                <strong>Phòng không đạt điều kiện xếp lịch:</strong>
                <ul>
                  <li>Kiểm tra trạng thái phòng.</li>
                  <li>Kiểm tra số máy dùng được.</li>
                  <li>Kiểm tra thiết bị lỗi.</li>
                  <li>Kiểm tra phần mềm đã cài trong phòng.</li>
                  <li>Kiểm tra sĩ số lớp học phần.</li>
                </ul>
              </li>
              <li>
                <strong>Số liệu báo cáo không khớp:</strong>
                <ul>
                  <li>Kiểm tra khoảng thời gian lọc.</li>
                  <li>Kiểm tra học kỳ và tuần học.</li>
                  <li>
                    Kiểm tra trạng thái lịch được đưa vào báo cáo.
                  </li>
                  <li>
                    Kiểm tra dữ liệu phòng, thiết bị và lịch có được cập nhật
                    đồng bộ không.
                  </li>
                </ul>
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            title="10. Checklist trước khi demo hoặc bàn giao"
            sectionId="checklist-demo"
          >
            <p>Trước khi demo, quản trị viên nên kiểm tra:</p>
            <p>Tài khoản:</p>
            <ul className="guideChecklist">
              <li>Có tài khoản QTV.</li>
              <li>Có tài khoản CBDT.</li>
              <li>Có tài khoản GV.</li>
              <li>Có tài khoản KTV.</li>
              <li>Có tài khoản SV.</li>
              <li>Sinh viên không vào được route admin.</li>
            </ul>
            <p>Phòng máy:</p>
            <ul className="guideChecklist">
              <li>Có đủ 3 phòng 2B11, 2B21, 2B31.</li>
              <li>Mỗi phòng có số máy và trạng thái rõ ràng.</li>
              <li>Có ít nhất một phòng khả dụng.</li>
              <li>
                Có ít nhất một tình huống phòng bảo trì hoặc thiết bị lỗi để
                minh họa nghiệp vụ.
              </li>
            </ul>
            <p>Dữ liệu đào tạo:</p>
            <ul className="guideChecklist">
              <li>Có học kỳ hiện hành.</li>
              <li>Có tuần học.</li>
              <li>Có ca học.</li>
              <li>Có học phần thực hành.</li>
              <li>Có lớp học phần.</li>
              <li>Có phân công giảng viên.</li>
            </ul>
            <p>Tra cứu:</p>
            <ul className="guideChecklist">
              <li>Tra cứu được lịch thực hành.</li>
              <li>Tra cứu được phòng máy.</li>
              <li>Tra cứu được thiết bị.</li>
              <li>Tra cứu được phần mềm.</li>
              <li>Tra cứu được điều kiện xếp lịch.</li>
            </ul>
            <p>Báo cáo:</p>
            <ul className="guideChecklist">
              <li>Có card thống kê tổng quan.</li>
              <li>Có biểu đồ sử dụng phòng.</li>
              <li>Có báo cáo lịch thực hành.</li>
              <li>Có báo cáo thiết bị và sự cố.</li>
              <li>Có nút tạo thống kê.</li>
              <li>
                Có nút xuất thống kê hoặc xuất báo cáo Excel/CSV.
              </li>
            </ul>
            <div className="guideNoteBox">
              <strong>Kết luận</strong>
              <p>
                Trang hướng dẫn này giúp quản trị viên hiểu cách thao tác hệ
                thống theo đúng trình tự nghiệp vụ. Khi hệ thống chuyển từ dữ
                liệu mô phỏng sang API thật, các bước thao tác vẫn giữ nguyên,
                chỉ thay phần dữ liệu hiển thị bằng dữ liệu từ cơ sở dữ liệu.
              </p>
            </div>
          </GuideSection>
        </div>

        <aside className="guideAside">
          <section className="card guideTocCard">
            <h2 className="guideSectionTitle">Mục lục nhanh</h2>
            <ol className="guideTocList">
              {guideTocItems.map((tocItem) => (
                <li key={tocItem.id}>
                  <a href={`#${tocItem.id}`}>{tocItem.label}</a>
                </li>
              ))}
            </ol>
          </section>

          <section className="card guideTocCard">
            <h2 className="guideSectionTitle">Checklist nhanh</h2>
            <ul className="guideChecklist guideChecklistCompact">
              {guideQuickChecklistItems.map((checkItem) => (
                <li key={checkItem}>{checkItem}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
}
