"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { getBasicReport } from "../../../services/reportService";

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
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

function getSummaryValue(report, groupKey, itemKey) {
  return Number(report?.[groupKey]?.[itemKey] || 0);
}

export default function AcademicReportsPage() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReport() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await getBasicReport();

        if (!isMounted) return;

        setReport(response?.data || null);
      } catch (error) {
        if (!isMounted) return;

        setReport(null);
        setLoadError(error?.message || "Không thể tải báo cáo cơ bản từ API.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReport();

    return () => {
      isMounted = false;
    };
  }, []);

  const metricCards = useMemo(
    () => [
      {
        label: "Tổng buổi đã xếp",
        value: getSummaryValue(report, "schedule_summary", "total_scheduled"),
        source: "lab_schedule_entries",
      },
      {
        label: "Buổi đã công bố",
        value: getSummaryValue(report, "schedule_summary", "published_sessions"),
        source: "lab_schedule_entries.entry_status",
      },
      {
        label: "Sự cố phòng máy",
        value: getSummaryValue(report, "issue_summary", "total_issues"),
        source: "room_issue_reports",
      },
      {
        label: "Yêu cầu đổi/hủy",
        value: getSummaryValue(
          report,
          "change_request_summary",
          "total_change_requests",
        ),
        source: "lab_schedule_change_requests",
      },
      {
        label: "Yêu cầu hủy lịch",
        value: getSummaryValue(report, "change_request_summary", "cancel_requests"),
        source: "lab_schedule_change_requests.change_type",
      },
      {
        label: "Phản ánh sinh viên",
        value: getSummaryValue(report, "feedback_summary", "total_feedback"),
        source: "student_feedback",
      },
    ],
    [report],
  );

  const roomUsageRows = useMemo(
    () =>
      (report?.room_usage || []).map((room) => ({
        ...room,
        total_sessions_label: formatNumber(room.total_sessions),
        published_sessions_label: formatNumber(room.published_sessions),
        cancelled_sessions_label: formatNumber(room.cancelled_sessions),
        completed_sessions_label: formatNumber(room.completed_sessions),
      })),
    [report],
  );

  const sourceRows = useMemo(
    () =>
      (report?.data_sources || []).map((source, index) => ({
        id: index + 1,
        ...source,
      })),
    [report],
  );

  const roomUsageColumns = useMemo(
    () => [
      { key: "room_code", label: "Phòng" },
      { key: "total_sessions_label", label: "Tổng buổi" },
      { key: "published_sessions_label", label: "Đã công bố" },
      { key: "cancelled_sessions_label", label: "Đã hủy" },
      { key: "completed_sessions_label", label: "Hoàn thành" },
    ],
    [],
  );

  const sourceColumns = useMemo(
    () => [
      { key: "metric", label: "Chỉ số" },
      { key: "source", label: "Nguồn dữ liệu" },
    ],
    [],
  );

  return (
    <div className="academicPageStack">
      <section className="academicHero">
        <div className="academicHeroBody">
          <p className="academicEyebrow">Cán bộ đào tạo</p>
          <h1 className="academicHeroTitle">Báo cáo thống kê cơ bản</h1>
          <p className="academicHeroText">
            Đường báo cáo tối thiểu cho demo cuối kỳ, đọc trực tiếp từ các bảng
            lịch thực hành, phòng, sự cố, yêu cầu đổi lịch và phản ánh sinh viên.
          </p>
        </div>

        <span className="academicDataBadge">API reports/basic</span>
      </section>

      {loadError ? (
        <section className="academicAlert academicAlert--error" role="alert">
          <h3>Không tải được báo cáo</h3>
          <p>{loadError}</p>
        </section>
      ) : null}

      <section className="academicPanel">
        <div className="academicPanelHeader">
          <div>
            <p className="academicEyebrow">Tổng quan</p>
            <h2>Chỉ số chính</h2>
            <p>
              Cập nhật lúc:{" "}
              {isLoading ? "Đang tải..." : formatDateTime(report?.generated_at)}
            </p>
          </div>
        </div>

        <div className="academicInfoGrid">
          {metricCards.map((metric) => (
            <div key={metric.label} className="academicInfoItem">
              <span>{metric.label}</span>
              <strong>{isLoading ? "..." : formatNumber(metric.value)}</strong>
              <small>Nguồn: {metric.source}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="academicTwoColumnLayout">
        <section className="academicPanel">
          <div className="academicPanelHeader">
            <div>
              <p className="academicEyebrow">Sử dụng phòng</p>
              <h2>Buổi thực hành theo phòng</h2>
              <p>
                Tổng hợp từ `rooms` và `lab_schedule_entries`, hiển thị theo mã
                phòng.
              </p>
            </div>
          </div>

          <DataTable
            columns={roomUsageColumns}
            rows={roomUsageRows}
            rowKey="room_code"
            loading={isLoading}
            emptyTitle="Chưa có dữ liệu phòng"
            emptyDescription="API reports/basic chưa trả về dữ liệu room_usage."
            pageSize={8}
          />
        </section>

        <aside className="academicPanel academicAsidePanel">
          <div className="academicPanelHeader">
            <div>
              <p className="academicEyebrow">Nguồn dữ liệu</p>
              <h2>Phạm vi báo cáo</h2>
              <p>
                Các chỉ số bên dưới là phạm vi thật của MVP. Export nâng cao và
                dashboard admin chi tiết nằm ngoài #50.
              </p>
            </div>
          </div>

          <DataTable
            columns={sourceColumns}
            rows={sourceRows}
            rowKey="id"
            loading={isLoading}
            emptyTitle="Chưa có nguồn dữ liệu"
            emptyDescription="Không có metadata nguồn dữ liệu từ API."
            pageSize={8}
          />
        </aside>
      </section>
    </div>
  );
}
