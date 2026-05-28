"use client";

import { useMemo, useState } from "react";

const REPORT_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả báo cáo" },
  { value: "feedback", label: "Phản ánh" },
  { value: "room_issue", label: "Báo cáo sự cố phòng máy" },
  { value: "room_block", label: "Báo cáo khóa phòng" },
  { value: "change_request", label: "Báo cáo xin thay đổi lịch" },
];

const MOCK_REPORTS = [
  {
    id: "report-feedback-1",
    report_title: "Sinh viên phản ánh sai thông tin phòng thực hành",
    reporter_name: "Nguyễn Đăng Khoa",
    reporter_contact: "n23dccn030@hvcs.demo",
    report_type: "feedback",
    report_content:
      "Sinh viên phản ánh lịch hiển thị phòng 2B31 nhưng thông báo lớp lại ghi phòng 2B21. Cần CBDT kiểm tra lại lịch đã công bố.",
    created_at: "2026-04-28T08:20:00",
  },
  {
    id: "report-issue-1",
    report_title: "Sự cố mạng LAN phòng 2B21",
    reporter_name: "Phan Thanh Hy",
    reporter_contact: "phanthanhhy@hvcs.demo",
    report_type: "room_issue",
    report_content:
      "Giảng viên báo cáo nhiều máy mất kết nối trong ca thực hành. KTV cần kiểm tra switch và dây mạng trước ca học tiếp theo.",
    created_at: "2026-04-28T09:00:00",
  },
  {
    id: "report-block-1",
    report_title: "Đề xuất khóa phòng 2B21 để bảo trì",
    reporter_name: "Kỹ thuật viên phòng máy HVCS",
    reporter_contact: "ktv.lab@hvcs.demo",
    report_type: "room_block",
    report_content:
      "KTV đề xuất khóa phòng 2B21 theo khung tiết 1-4 để xử lý bảo trì định kỳ, tránh ảnh hưởng lịch thực hành.",
    created_at: "2026-04-28T10:10:00",
  },
  {
    id: "report-change-1",
    report_title: "Giảng viên xin đổi lịch thực hành INT1332",
    reporter_name: "Nguyễn Thị Bích Nguyên",
    reporter_contact: "nguyenthibichnguyen@hvcs.demo",
    report_type: "change_request",
    report_content:
      "Giảng viên đề xuất đổi lịch do bận công tác. Yêu cầu cần được CBDT kiểm tra phòng, ca và ràng buộc lịch trước khi duyệt.",
    created_at: "2026-04-28T11:25:00",
  },
];

function translateReportType(value) {
  const map = {
    feedback: "Phản ánh",
    room_issue: "Báo cáo sự cố phòng máy",
    room_block: "Báo cáo khóa phòng",
    change_request: "Báo cáo xin thay đổi lịch",
  };

  return map[value] || value || "—";
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getReportIcon(type) {
  const map = {
    feedback: "💬",
    room_issue: "🛠️",
    room_block: "🚧",
    change_request: "🔁",
  };

  return map[type] || "📄";
}

export default function AcademicReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState(MOCK_REPORTS[0]?.id);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const visibleReports = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    return MOCK_REPORTS.filter((report) => {
      const matchedType =
        typeFilter === "all" || report.report_type === typeFilter;
      const searchableText = [
        report.report_title,
        report.reporter_name,
        report.reporter_contact,
        translateReportType(report.report_type),
        report.report_content,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchedType &&
        (!normalizedKeyword || searchableText.includes(normalizedKeyword))
      );
    });
  }, [searchKeyword, typeFilter]);

  const selectedReport = useMemo(
    () => MOCK_REPORTS.find((report) => report.id === selectedReportId),
    [selectedReportId],
  );

  return (
    <div className="academicPageStack">
      <section className="academicHero">
        <div className="academicHeroBody">
          <p className="academicEyebrow">Cán bộ đào tạo</p>
          <h1 className="academicHeroTitle">Báo cáo</h1>
          <p className="academicHeroText">
            Tổng hợp phản ánh, báo cáo sự cố phòng máy, báo cáo khóa phòng và
            báo cáo xin thay đổi lịch để CBDT theo dõi xử lý.
          </p>
        </div>

        <span className="academicDataBadge academicDataBadge--warning">
          Thiếu API reports
        </span>
      </section>

      <section className="academicAlert academicAlert--warning">
        <h3>Thiếu API tổng hợp báo cáo</h3>
        <p>
          Backend hiện chưa có endpoint đọc student_feedback,
          room_issue_reports, room_block_requests hoặc
          lab_schedule_change_requests. Danh sách bên dưới là mock để chốt giao
          diện.
        </p>
      </section>

      <section className="academicPanel">
        <div className="academicPanelHeader">
          <div>
            <p className="academicEyebrow">Bộ lọc</p>
            <h2>Danh sách thẻ báo cáo</h2>
            <p>Bấm vào từng thẻ để mở form chi tiết ở bên phải.</p>
          </div>
        </div>

        <div className="academicToolbar academicToolbar--compact">
          <label className="academicField">
            <span>Tìm kiếm</span>
            <input
              className="academicControl"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm theo tiêu đề, người báo cáo, nội dung..."
            />
          </label>

          <label className="academicField">
            <span>Kiểu báo cáo</span>
            <select
              className="academicControl"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              {REPORT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="academicTwoColumnLayout">
        <section className="academicReportGrid">
          {visibleReports.length === 0 ? (
            <div className="academicEmptyBox">
              <h2>Không có báo cáo phù hợp</h2>
              <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : null}

          {visibleReports.map((report) => (
            <button
              key={report.id}
              type="button"
              className={
                selectedReportId === report.id
                  ? "academicReportCard academicReportCard--active"
                  : "academicReportCard"
              }
              onClick={() => setSelectedReportId(report.id)}
            >
              <span className="academicReportIcon">
                {getReportIcon(report.report_type)}
              </span>

              <span className="academicReportContent">
                <span className="academicReportType">
                  {translateReportType(report.report_type)}
                </span>
                <strong>{report.report_title}</strong>
                <small>Người báo cáo: {report.reporter_name}</small>
                <small>Gửi lúc: {formatDateTime(report.created_at)}</small>
              </span>
            </button>
          ))}
        </section>

        <aside className="academicPanel academicAsidePanel">
          <div className="academicPanelHeader">
            <div>
              <p className="academicEyebrow">Form báo cáo</p>
              <h2>Chi tiết báo cáo</h2>
              <p>Nội dung hiển thị theo đúng các trường người dùng yêu cầu.</p>
            </div>
          </div>

          {selectedReport ? (
            <div className="academicFormGrid">
              <label className="academicField academicFieldFull">
                <span>Tiêu đề báo cáo</span>
                <input
                  className="academicControl academicReadonlyControl"
                  value={selectedReport.report_title}
                  readOnly
                />
              </label>

              <label className="academicField">
                <span>Người báo cáo</span>
                <input
                  className="academicControl academicReadonlyControl"
                  value={selectedReport.reporter_name}
                  readOnly
                />
              </label>

              <label className="academicField">
                <span>Thông tin liên hệ người báo cáo</span>
                <input
                  className="academicControl academicReadonlyControl"
                  value={selectedReport.reporter_contact}
                  readOnly
                />
              </label>

              <label className="academicField academicFieldFull">
                <span>Loại báo cáo</span>
                <input
                  className="academicControl academicReadonlyControl"
                  value={translateReportType(selectedReport.report_type)}
                  readOnly
                />
              </label>

              <label className="academicField academicFieldFull">
                <span>Nội dung báo cáo</span>
                <textarea
                  className="academicControl academicTextarea"
                  value={selectedReport.report_content}
                  readOnly
                />
              </label>
            </div>
          ) : (
            <div className="academicEmptyBox">
              <h2>Chưa chọn báo cáo</h2>
              <p>Bấm vào một thẻ báo cáo để xem chi tiết.</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
