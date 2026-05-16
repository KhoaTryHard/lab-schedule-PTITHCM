"use client";

import { useEffect, useMemo, useState } from "react";

import ActionCard from "../../../components/common/ActionCard.jsx";
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
import { apiClient } from "../../../lib/apiClient";

const REQUEST_STATUS_META = {
  pending: { label: "Chờ xử lý", variant: "warning" },
  approved: { label: "Đã duyệt", variant: "success" },
  rejected: { label: "Từ chối", variant: "danger" },
  draft: { label: "Nháp", variant: "muted" },
  completed: { label: "Hoàn thành", variant: "success" },
  cancelled: { label: "Đã hủy", variant: "danger" },
};

const requestStatusTabs = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "approved", label: "Đã duyệt" },
  { key: "rejected", label: "Từ chối" },
  { key: "draft", label: "Nháp" },
];

const scheduleRequestFallbackItems = [
  {
    id: 1,
    title: "Schedule request for CNPM",
    status: "pending",
    created_at: "2026-04-28T10:00:00Z",
  },
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeScheduleRequestItem(requestItem, index) {
  return {
    id: requestItem?.id ?? requestItem?.request_id ?? index + 1,
    title:
      requestItem?.title ||
      requestItem?.request_title ||
      `Yêu cầu xếp lịch #${index + 1}`,
    status: String(requestItem?.status || "draft").trim().toLowerCase(),
    created_at:
      requestItem?.created_at ||
      requestItem?.createdAt ||
      new Date().toISOString(),
  };
}

function sortScheduleRequests(requestItems) {
  return [...requestItems].sort(
    (firstItem, secondItem) =>
      new Date(secondItem.created_at).getTime() -
      new Date(firstItem.created_at).getTime(),
  );
}

function formatDateTime(value) {
  const resolvedDate = new Date(value);

  if (Number.isNaN(resolvedDate.getTime())) {
    return value || "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(resolvedDate);
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

const normalizedFallbackItems = sortScheduleRequests(
  scheduleRequestFallbackItems.map(normalizeScheduleRequestItem),
);

export default function ScheduleRequestsPage() {
  const [requestItems, setRequestItems] = useState(normalizedFallbackItems);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestSourceCode, setRequestSourceCode] = useState("STUB");
  const [requestSourceLabel, setRequestSourceLabel] = useState(
    "Đang tải dữ liệu yêu cầu xếp lịch...",
  );
  const [requestSourceVariant, setRequestSourceVariant] = useState("info");

  async function loadScheduleRequests() {
    try {
      setIsLoadingRequests(true);

      const response = await apiClient("/schedule-requests", {
        method: "GET",
      });
      const rawRequestItems = Array.isArray(response?.data)
        ? response.data
        : response?.data
          ? [response.data]
          : [];
      const normalizedRequestItems = sortScheduleRequests(
        rawRequestItems.map(normalizeScheduleRequestItem),
      );

      if (normalizedRequestItems.length > 0) {
        setRequestItems(normalizedRequestItems);
        setRequestSourceCode("API");
        setRequestSourceLabel(
          "Đang hiển thị dữ liệu thật từ endpoint /api/schedule-requests.",
        );
        setRequestSourceVariant("success");
        return;
      }

      setRequestItems(normalizedFallbackItems);
      setRequestSourceCode("STUB");
      setRequestSourceLabel(
        "API hiện trả danh sách rỗng, trang đang dùng bản ghi mẫu để hoàn thiện giao diện.",
      );
      setRequestSourceVariant("warning");
    } catch (error) {
      setRequestItems(normalizedFallbackItems);
      setRequestSourceCode("STUB");
      setRequestSourceLabel(
        error?.message
          ? `Không tải được API (${error.message}), trang đang hiển thị dữ liệu mẫu.`
          : "Không tải được API, trang đang hiển thị dữ liệu mẫu.",
      );
      setRequestSourceVariant("warning");
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
        activeStatus === "all" || requestItem.status === activeStatus;
      const searchableText = normalizeText(
        [
          requestItem.id,
          requestItem.title,
          requestItem.status,
          requestItem.created_at,
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
      { key: "title", label: "Tiêu đề" },
      { key: "status", label: "Trạng thái" },
      { key: "created_at", label: "Ngày tạo" },
    ],
    [],
  );

  const requestRows = useMemo(
    () =>
      filteredRequestItems.map((requestItem) => ({
        id: requestItem.id,
        title: requestItem.title,
        status: buildRequestStatusBadge(requestItem.status),
        created_at: formatDateTime(requestItem.created_at),
      })),
    [filteredRequestItems],
  );

  const pendingRequestCount = useMemo(
    () =>
      requestItems.filter((requestItem) => requestItem.status === "pending")
        .length,
    [requestItems],
  );

  const latestRequestItem = requestItems[0] || null;

  const summaryItems = useMemo(
    () => [
      {
        icon: AcademicIcon,
        title: "Tổng yêu cầu",
        value: requestItems.length,
        message: "Danh sách yêu cầu xếp lịch của CBDT",
      },
      {
        icon: UsersIcon,
        title: "Chờ xử lý",
        value: pendingRequestCount,
        message: "Những yêu cầu cần ưu tiên theo dõi",
      },
      {
        icon: LecturerIcon,
        title: "Đang hiển thị",
        value: filteredRequestItems.length,
        message: "Số bản ghi khớp bộ lọc hiện tại",
      },
      {
        icon: AdminIcon,
        title: "Nguồn dữ liệu",
        value: requestSourceCode,
        numberSize: "28px",
        message: latestRequestItem
          ? `Bản ghi mới nhất: ${formatDateTime(latestRequestItem.created_at)}`
          : requestSourceLabel,
      },
    ],
    [
      filteredRequestItems.length,
      latestRequestItem,
      pendingRequestCount,
      requestItems.length,
      requestSourceCode,
      requestSourceLabel,
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
            numberSize={summaryItem.numberSize}
            message={summaryItem.message}
          />
        ))}
      </section>

      <section className="card managementAccount">
        <SectionLayout
          title="YÊU CẦU XẾP LỊCH"
          message={requestSourceLabel}
          direction={0}
          className="card"
        >
          <ActionCard
            icon="API"
            title="Nguồn dữ liệu hiển thị"
            description="Trang ưu tiên gọi GET /api/schedule-requests. Nếu backend vẫn đang để stub rỗng thì giao diện sẽ fallback về đúng bản ghi mẫu để bạn ráp màn hình trước."
            primaryText="Tải lại API"
            onPrimaryClick={handleReloadData}
            secondaryText="Xóa bộ lọc"
            onSecondaryClick={handleResetFilters}
          />

          <ActionCard
            icon="JSON"
            title="Payload đang bám theo"
            description="Bảng bên dưới đang trình bày trực tiếp 4 trường id, title, status và created_at để khớp với shape dữ liệu schedule request hiện tại."
            primaryText={null}
          />
        </SectionLayout>

        <div className="card accountsView accountPrimaryPanel">
          <FilterSearchToolbar
            tabs={requestStatusTabs}
            activeKey={activeStatus}
            onTabChange={setActiveStatus}
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            searchPlaceholder="Tìm theo ID, tiêu đề hoặc trạng thái..."
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
              <StatusBadge variant={requestSourceVariant}>
                {requestSourceCode}
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
              emptyTitle="Chưa có yêu cầu xếp lịch phù hợp"
              emptyDescription="Không tìm thấy bản ghi nào khớp với trạng thái hoặc từ khóa bạn đang lọc."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
