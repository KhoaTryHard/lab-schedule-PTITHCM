"use client";

import { useEffect, useMemo, useState } from "react";

import { CardUI } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import FilterSearchToolbar from "../../../components/common/FilterSearchToolbar.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import { RefreshButton } from "../../../components/common/buttonUI.jsx";
import {
  AcademicIcon,
  AdminIcon,
  LecturerIcon,
  UsersIcon,
} from "../../../components/icons/systemIcon.jsx";
import { listScheduleRequests } from "../../../services/scheduleRequestService";

const REQUEST_STATUS_META = {
  draft: { label: "Nháp", variant: "muted" },
  pending: { label: "Chờ xử lý", variant: "warning" },
  pending_review: { label: "Chờ duyệt", variant: "warning" },
  approved: { label: "Đã duyệt", variant: "success" },
  rejected: { label: "Từ chối", variant: "danger" },
  cancelled: { label: "Đã hủy", variant: "danger" },
  completed: { label: "Hoàn thành", variant: "success" },
};

const requestStatusTabs = [
  { key: "all", label: "Tất cả" },
  { key: "draft", label: "Nháp" },
  { key: "pending_review", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "rejected", label: "Từ chối" },
  { key: "completed", label: "Hoàn thành" },
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeStatus(value) {
  return String(value || "draft").trim().toLowerCase();
}

function formatDateTime(value) {
  const resolvedDate = new Date(value);

  if (!value || Number.isNaN(resolvedDate.getTime())) {
    return value || "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(resolvedDate);
}

function buildCourseLabel(requestItem, index) {
  const courseCode = requestItem?.course_code || "";
  const courseName = requestItem?.course_name || "";

  if (courseCode && courseName) {
    return `${courseCode} - ${courseName}`;
  }

  if (courseName) {
    return courseName;
  }

  if (courseCode) {
    return courseCode;
  }

  if (requestItem?.title) {
    return requestItem.title;
  }

  return `Yêu cầu xếp lịch #${index + 1}`;
}

function normalizeScheduleRequestItem(requestItem, index) {
  const requestStatus = normalizeStatus(
    requestItem?.request_status || requestItem?.status,
  );

  return {
    id: requestItem?.id ?? requestItem?.request_id ?? index + 1,
    courseLabel: buildCourseLabel(requestItem, index),
    groupNo: requestItem?.group_no || "—",
    requestedTeamCount: requestItem?.requested_team_count ?? "—",
    totalRequiredSessions: requestItem?.total_required_sessions ?? "—",
    requestStatus,
    requestedByName: requestItem?.requested_by_name || "—",
    createdAt:
      requestItem?.created_at ||
      requestItem?.createdAt ||
      requestItem?.updated_at ||
      "",
    raw: requestItem,
  };
}

function sortScheduleRequests(requestItems) {
  return [...requestItems].sort(
    (firstItem, secondItem) =>
      new Date(secondItem.createdAt).getTime() -
      new Date(firstItem.createdAt).getTime(),
  );
}

function buildRequestStatusBadge(status) {
  const resolvedMeta = REQUEST_STATUS_META[status] || {
    label: status || "Không rõ",
    variant: "muted",
  };

  return (
    <StatusBadge value={status} variant={resolvedMeta.variant}>
      {resolvedMeta.label}
    </StatusBadge>
  );
}

export default function ScheduleRequestsPage() {
  const [requestItems, setRequestItems] = useState([]);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadScheduleRequests() {
    try {
      setIsLoadingRequests(true);
      setErrorMessage("");

      const response = await listScheduleRequests({
        status: activeStatus,
      });

      const rawRequestItems = Array.isArray(response?.data)
        ? response.data
        : response?.data
          ? [response.data]
          : [];

      const normalizedRequestItems = sortScheduleRequests(
        rawRequestItems.map(normalizeScheduleRequestItem),
      );

      setRequestItems(normalizedRequestItems);
    } catch (error) {
      setRequestItems([]);
      setErrorMessage(error?.message || "Không tải được yêu cầu xếp lịch.");
    } finally {
      setIsLoadingRequests(false);
    }
  }

  useEffect(() => {
    loadScheduleRequests();
  }, []);

  const filteredRequestItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return requestItems.filter((requestItem) => {
      const matchesStatus =
        activeStatus === "all" || requestItem.requestStatus === activeStatus;

      const searchableText = normalizeText(
        [
          requestItem.id,
          requestItem.courseLabel,
          requestItem.groupNo,
          requestItem.requestStatus,
          requestItem.requestedByName,
          requestItem.createdAt,
        ].join(" "),
      );

      const matchesKeyword =
        !normalizedKeyword || searchableText.includes(normalizedKeyword);

      return matchesStatus && matchesKeyword;
    });
  }, [activeStatus, requestItems, searchKeyword]);

  const requestColumns = useMemo(
    () => [
      { key: "id", label: "ID" },
      { key: "courseLabel", label: "Học phần" },
      { key: "groupNo", label: "Nhóm" },
      { key: "requestedTeamCount", label: "Số tổ" },
      { key: "totalRequiredSessions", label: "Số buổi" },
      { key: "requestStatus", label: "Trạng thái" },
      { key: "requestedByName", label: "Người tạo" },
      { key: "createdAt", label: "Ngày tạo" },
    ],
    [],
  );

  const requestRows = useMemo(
    () =>
      filteredRequestItems.map((requestItem) => ({
        id: requestItem.id,
        courseLabel: requestItem.courseLabel,
        groupNo: requestItem.groupNo,
        requestedTeamCount: requestItem.requestedTeamCount,
        totalRequiredSessions: requestItem.totalRequiredSessions,
        requestStatus: buildRequestStatusBadge(requestItem.requestStatus),
        requestedByName: requestItem.requestedByName,
        createdAt: formatDateTime(requestItem.createdAt),
      })),
    [filteredRequestItems],
  );

  const draftCount = useMemo(
    () =>
      requestItems.filter((requestItem) => requestItem.requestStatus === "draft")
        .length,
    [requestItems],
  );

  const pendingReviewCount = useMemo(
    () =>
      requestItems.filter(
        (requestItem) => requestItem.requestStatus === "pending_review",
      ).length,
    [requestItems],
  );

  const latestRequestItem = requestItems[0] || null;

  const summaryItems = useMemo(
    () => [
      {
        icon: AcademicIcon,
        title: "Tổng yêu cầu",
        value: requestItems.length,
        message: "Dữ liệu từ endpoint GET /api/schedule-requests",
      },
      {
        icon: UsersIcon,
        title: "Nháp",
        value: draftCount,
        message: "Yêu cầu chưa gửi duyệt",
      },
      {
        icon: LecturerIcon,
        title: "Chờ duyệt",
        value: pendingReviewCount,
        message: "Yêu cầu đang chờ xử lý",
      },
      {
        icon: AdminIcon,
        title: "Đang hiển thị",
        value: requestRows.length,
        message: latestRequestItem
          ? `Mới nhất: ${formatDateTime(latestRequestItem.createdAt)}`
          : "Chưa có bản ghi phù hợp",
      },
    ],
    [
      draftCount,
      latestRequestItem,
      pendingReviewCount,
      requestItems.length,
      requestRows.length,
    ],
  );

  function handleResetFilters() {
    setActiveStatus("all");
    setSearchKeyword("");
  }

  async function handleReloadData() {
    await loadScheduleRequests();
  }

  return (
    <div className="adminPageStack">
      <section className="card summaryCardGrid summaryCardGridCompact">
        {summaryItems.map((summaryItem) => (
          <CardUI
            key={summaryItem.title}
            icon={summaryItem.icon}
            title={summaryItem.title}
            number={summaryItem.value}
            message={summaryItem.message}
          />
        ))}
      </section>

      <section className="card managementAccount">
        <SectionLayout
          title="YÊU CẦU XẾP LỊCH"
          message={
            errorMessage
              ? errorMessage
              : "Danh sách yêu cầu xếp lịch thực hành được tải trực tiếp từ backend."
          }
          direction={0}
          className="card"
        />

        <div className="card accountsView accountPrimaryPanel">
          <FilterSearchToolbar
            tabs={requestStatusTabs}
            activeKey={activeStatus}
            onTabChange={setActiveStatus}
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            searchPlaceholder="Tìm theo học phần, nhóm, người tạo hoặc trạng thái..."
            searchButtonLabel="Tìm kiếm"
          />

          <div className="card roomFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">Danh sách yêu cầu xếp lịch</h3>
              <p className="roomSectionText">
                Hiển thị {requestRows.length} bản ghi phù hợp với bộ lọc hiện tại.
              </p>
            </div>

            <div className="roomFilterControls">
              <StatusBadge variant={errorMessage ? "danger" : "success"}>
                {errorMessage ? "API lỗi" : "API"}
              </StatusBadge>

              <RefreshButton onClick={handleResetFilters}>
                Đặt lại bộ lọc
              </RefreshButton>

              <RefreshButton
                onClick={handleReloadData}
                disabled={isLoadingRequests}
              >
                Đồng bộ lại
              </RefreshButton>
            </div>
          </div>

          <div className="card roomTableCard">
            <DataTable
              columns={requestColumns}
              rows={requestRows}
              loading={isLoadingRequests}
              error={errorMessage}
              emptyTitle="Chưa có yêu cầu xếp lịch"
              emptyDescription="Backend chưa trả bản ghi nào hoặc không có dữ liệu khớp bộ lọc."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
