"use client";

import { useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import {
  ButtonUI,
  RefreshButton,
} from "../../../components/common/buttonUI.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../components/common/UiState.jsx";
import { checkScheduleConstraints } from "../../../services/scheduleService.js";

const REQUIRED_RULES = [
  {
    code: "ROOM_SCOPE",
    label: "Phạm vi phòng",
    meaning: "Phòng có thuộc phạm vi cho phép của MVP không.",
    suggestion: "Chọn phòng thuộc phạm vi 2B11, 2B21 hoặc 2B31.",
  },
  {
    code: "ROOM_AVAILABLE",
    label: "Phòng khả dụng",
    meaning: "Phòng có đang ở trạng thái available không.",
    suggestion: "Chọn phòng đang khả dụng hoặc báo kỹ thuật viên mở lại phòng.",
  },
  {
    code: "ROOM_BLOCKED",
    label: "Phòng bị khóa",
    meaning: "Phòng có bị block bởi yêu cầu khóa phòng đã duyệt không.",
    suggestion: "Chọn phòng khác hoặc đổi khoảng thời gian.",
  },
  {
    code: "HOLIDAY_BLOCKED",
    label: "Ngày nghỉ",
    meaning:
      "Ngày học có bị chặn bởi lịch nghỉ hoặc ngày không xếp lịch không.",
    suggestion: "Chọn ngày khác không thuộc lịch nghỉ.",
  },
  {
    code: "ROOM_CONFLICT",
    label: "Trùng phòng",
    meaning: "Phòng có bị trùng lịch cùng thứ, ca và khoảng ngày không.",
    suggestion: "Đổi phòng, đổi ca hoặc đổi khoảng ngày.",
  },
  {
    code: "LECTURER_CONFLICT",
    label: "Trùng giảng viên",
    meaning: "Giảng viên có bị phân công dạy lớp khác cùng thời điểm không.",
    suggestion: "Chọn giảng viên khác hoặc đổi ca thực hành.",
  },
  {
    code: "CAPACITY_OK",
    label: "Đủ sức chứa",
    meaning: "Số máy/sức chứa phòng có đáp ứng tổ thực hành không.",
    suggestion: "Chọn phòng lớn hơn hoặc tách thêm tổ thực hành.",
  },
  {
    code: "SOFTWARE_OK",
    label: "Đủ phần mềm",
    meaning: "Phòng có cài đủ phần mềm yêu cầu không.",
    suggestion:
      "Chọn phòng khác hoặc yêu cầu kỹ thuật viên cài bổ sung phần mềm.",
  },
];

const TIME_SLOT_OPTIONS = [
  { value: "Tiết 1-4", label: "Tiết 1-4" },
  { value: "Tiết 7-10", label: "Tiết 7-10" },
];

const EXTRA_RULE_META = {
  HOLIDAY_BLOCKED: {
    label: "Ngày nghỉ",
    meaning:
      "Ngày học có bị chặn bởi lịch nghỉ hoặc ngày không xếp lịch không.",
    suggestion: "Chọn ngày khác không thuộc lịch nghỉ.",
  },
};

const INITIAL_FORM = {
  request_id: "1",
  course_section_id: "6",
  practice_team_id: "1",
  lecturer_user_id: "8",
  room_id: "1",
  room_code: "2B11",
  day_of_week: "4",
  time_slot: "Tiết 1-4",
  start_date: "2026-04-29",
  end_date: "2026-04-29",
  student_count: "40",
  required_software_ids: "",
};

const DEMO_VALID_FORM = {
  request_id: "1",
  course_section_id: "6",
  practice_team_id: "1",
  lecturer_user_id: "8",
  room_id: "1",
  room_code: "2B11",
  day_of_week: "4",
  time_slot: "Tiết 1-4",
  start_date: "2026-04-29",
  end_date: "2026-04-29",
  student_count: "40",
  required_software_ids: "",
};

const DEMO_INVALID_FORM = {
  request_id: "1",
  course_section_id: "6",
  practice_team_id: "1",
  lecturer_user_id: "8",
  room_id: "99",
  room_code: "2B99",
  day_of_week: "6",
  time_slot: "Tiết 7-10",
  start_date: "2026-05-01",
  end_date: "2026-05-01",
  student_count: "45",
  required_software_ids: "1,2,6,8",
};

const RULE_CODE_ALIASES = {
  ROOM_STATUS: "ROOM_AVAILABLE",
};

function normalizeRuleCode(code) {
  const normalizedCode = String(code || "UNKNOWN_RULE")
    .trim()
    .toUpperCase();

  return RULE_CODE_ALIASES[normalizedCode] || normalizedCode;
}

function toPositiveInteger(value, fieldLabel) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${fieldLabel} phải là số nguyên dương.`);
  }

  return parsedValue;
}

function parseSoftwareIds(value) {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function buildPayload(formData) {
  if (!formData.room_code.trim()) {
    throw new Error("Vui lòng nhập mã phòng.");
  }

  if (!formData.time_slot.trim()) {
    throw new Error("Vui lòng chọn ca học.");
  }

  if (!formData.start_date || !formData.end_date) {
    throw new Error("Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc.");
  }

  if (formData.end_date < formData.start_date) {
    throw new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
  }

  // Payload bám đúng backend POST /api/schedules/check-constraints.
  // Các field request_id, course_section_id, room_id, student_count chỉ dùng cho UI demo,
  // không gửi lên API vì backend hiện không validate/không dùng.
  return {
    room_code: formData.room_code.trim().toUpperCase(),
    lecturer_user_id: toPositiveInteger(
      formData.lecturer_user_id,
      "ID giảng viên",
    ),
    practice_team_id: toPositiveInteger(
      formData.practice_team_id,
      "ID tổ thực hành",
    ),
    day_of_week: toPositiveInteger(formData.day_of_week, "Thứ trong tuần"),
    time_slot: formData.time_slot.trim(),
    start_date: formData.start_date,
    end_date: formData.end_date,
    required_software_ids: parseSoftwareIds(formData.required_software_ids),
  };
}

function normalizeConstraintResults(apiData) {
  const rawResults = Array.isArray(apiData?.results)
    ? apiData.results
    : Array.isArray(apiData?.constraints)
      ? apiData.constraints
      : [];

  return rawResults.map((item, index) => ({
    id: `${item?.code || "RULE"}-${index + 1}`,
    code: normalizeRuleCode(item?.code),
    passed:
      typeof item?.passed === "boolean"
        ? item.passed
        : typeof item?.is_passed === "boolean"
          ? item.is_passed
          : null,
    message:
      item?.message || item?.detail || "API không trả message cho rule này.",
    raw: item,
  }));
}

function getRuleMeta(code) {
  return (
    REQUIRED_RULES.find((rule) => rule.code === code) ||
    EXTRA_RULE_META[code] || {
      label: code,
      meaning: "Rule bổ sung do backend trả về.",
      suggestion: "Đọc message backend để xử lý.",
    }
  );
}

function buildRuleRows(constraintResults) {
  const resultMap = new Map(
    constraintResults.map((result) => [result.code, result]),
  );

  const requiredRows = REQUIRED_RULES.map((rule) => {
    const matchedResult = resultMap.get(rule.code);

    if (!matchedResult) {
      return {
        id: rule.code,
        code: rule.code,
        label: rule.label,
        meaning: rule.meaning,
        passed: null,
        message: "Backend chưa trả kết quả cho rule này.",
        suggestion: rule.suggestion,
        isRequired: true,
      };
    }

    return {
      id: rule.code,
      code: rule.code,
      label: rule.label,
      meaning: rule.meaning,
      passed: matchedResult.passed,
      message: matchedResult.message,
      suggestion: rule.suggestion,
      isRequired: true,
    };
  });

  const extraRows = constraintResults
    .filter(
      (result) => !REQUIRED_RULES.some((rule) => rule.code === result.code),
    )
    .map((result) => {
      const meta = getRuleMeta(result.code);

      return {
        id: result.id,
        code: result.code,
        label: meta.label,
        meaning: meta.meaning,
        passed: result.passed,
        message: result.message,
        suggestion: meta.suggestion,
        isRequired: false,
      };
    });

  return [...requiredRows, ...extraRows];
}

function getResultVariant(passed) {
  if (passed === true) {
    return "success";
  }

  if (passed === false) {
    return "danger";
  }

  return "muted";
}

function getResultLabel(passed) {
  if (passed === true) {
    return "PASS";
  }

  if (passed === false) {
    return "FAIL";
  }

  return "CHƯA TRẢ";
}

function getValidationDetailText(detail) {
  if (typeof detail === "string") {
    return detail;
  }

  return (
    detail?.msg ||
    detail?.message ||
    detail?.error ||
    detail?.detail ||
    JSON.stringify(detail)
  );
}

function getApiErrorMessage(error, fallbackMessage) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return error.details.map(getValidationDetailText).join(", ");
  }

  if (error?.details && typeof error.details === "object") {
    return Object.values(error.details)
      .filter(Boolean)
      .map(getValidationDetailText)
      .join(", ");
  }

  return error?.message || fallbackMessage;
}

function formatDayOfWeek(value) {
  const dayMap = {
    1: "Chủ nhật",
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
  };

  return dayMap[value] || "—";
}

export default function AutoArrangePage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [constraintData, setConstraintData] = useState(null);
  const [constraintRows, setConstraintRows] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [localMessage, setLocalMessage] = useState("");

  const failedRows = useMemo(
    () => constraintRows.filter((row) => row.passed === false),
    [constraintRows],
  );

  const passedRows = useMemo(
    () => constraintRows.filter((row) => row.passed === true),
    [constraintRows],
  );

  const missingRequiredRows = useMemo(
    () => constraintRows.filter((row) => row.isRequired && row.passed === null),
    [constraintRows],
  );

  const hasChecked = Boolean(constraintData);
  const hasFailedRule = failedRows.length > 0;
  const apiPassed = Boolean(constraintData?.passed);
  const canCreateSchedule = hasChecked && apiPassed && !hasFailedRule;

  const summaryStatus = useMemo(() => {
    if (errorMessage) {
      return {
        variant: "danger",
        label: "API lỗi",
        title: "Không thể kiểm tra ràng buộc",
        message: errorMessage,
      };
    }

    if (!hasChecked) {
      return {
        variant: "muted",
        label: "",
        title: "Sẵn sàng kiểm tra",
        message: "Nhập thông tin lịch rồi bấm Kiểm tra ràng buộc.",
      };
    }

    if (hasFailedRule || !apiPassed) {
      return {
        variant: "danger",
        label: "Không hợp lệ",
        title: "Không thể tạo lịch",
        message:
          "Có ít nhất một ràng buộc chưa đạt. Nút tạo lịch đang bị khóa để tránh lưu lịch sai.",
      };
    }

    if (missingRequiredRows.length > 0) {
      return {
        variant: "warning",
        label: "Hợp lệ có cảnh báo",
        title: "API báo pass nhưng còn rule chưa trả về",
        message:
          "Backend chưa trả đủ rule theo issue. Có thể chụp minh chứng pass, nhưng nên yêu cầu backend bổ sung rule còn thiếu.",
      };
    }

    return {
      variant: "success",
      label: "Hợp lệ",
      title: "Có thể tạo lịch",
      message:
        "Tất cả ràng buộc đã đạt. Nút tạo lịch được mở theo kết quả kiểm tra từ API.",
    };
  }, [
    apiPassed,
    errorMessage,
    hasChecked,
    hasFailedRule,
    missingRequiredRows.length,
  ]);

  const columns = useMemo(
    () => [
      {
        key: "code",
        label: "Rule",
        render: (value, row) => (
          <div className="constraintRuleCodeCell">
            <strong>{value}</strong>
            <span>{row.label}</span>
          </div>
        ),
      },
      { key: "meaning", label: "Ý nghĩa" },
      {
        key: "passed",
        label: "Kết quả",
        render: (value) => (
          <StatusBadge variant={getResultVariant(value)}>
            {getResultLabel(value)}
          </StatusBadge>
        ),
      },
      { key: "message", label: "Thông báo" },
      { key: "suggestion", label: "Gợi ý xử lý" },
    ],
    [],
  );

  function updateFormData(fieldName, value) {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));
  }

  function resetResultState() {
    setConstraintData(null);
    setConstraintRows([]);
    setErrorMessage("");
    setLocalMessage("");
  }

  function loadDemoForm(nextForm) {
    setFormData(nextForm);
    resetResultState();
  }

  async function handleCheckConstraints(event) {
    event.preventDefault();

    try {
      setIsChecking(true);
      setErrorMessage("");
      setLocalMessage("");

      const payload = buildPayload(formData);
      const response = await checkScheduleConstraints(payload);
      const apiData = response?.data || {};
      const normalizedResults = normalizeConstraintResults(apiData);

      setConstraintData(apiData);
      setConstraintRows(buildRuleRows(normalizedResults));
    } catch (error) {
      setConstraintData(null);
      setConstraintRows([]);
      setErrorMessage(
        getApiErrorMessage(error, "Không thể kiểm tra ràng buộc xếp lịch."),
      );
    } finally {
      setIsChecking(false);
    }
  }

  function handleCreateSchedule() {
    if (!canCreateSchedule) {
      setLocalMessage(
        "Không thể tạo lịch vì còn ràng buộc chưa đạt hoặc chưa có kết quả kiểm tra hợp lệ.",
      );
      return;
    }

    setLocalMessage("Ràng buộc đã đạt. Có thể tiếp tục tạo lịch.");
  }

  return (
    <section className="constraintPage adminPageStack">
      <div className="commonPageHeader">
        <div className="commonPageHeaderBody">
          <h1 className="commonTitle">Kiểm tra ràng buộc xếp lịch</h1>
        </div>

        {summaryStatus.label ? (
          <div className="commonHeaderActions">
            <StatusBadge variant={summaryStatus.variant}>
              {summaryStatus.label}
            </StatusBadge>
          </div>
        ) : null}
      </div>

      <div className="constraintMainGrid">
        <form
          className="card constraintFormCard"
          onSubmit={handleCheckConstraints}
        >
          <div className="constraintSectionHeader">
            <div>
              <p className="commonEyebrow">Thông tin lịch cần kiểm tra</p>
              <h2 className="constraintSectionTitle">Thông tin lịch</h2>
            </div>

            <div className="constraintButtonGroup">
              <RefreshButton
                onClick={() => loadDemoForm(DEMO_VALID_FORM)}
                disabled={isChecking}
              >
                Nạp case hợp lệ
              </RefreshButton>

              <RefreshButton
                onClick={() => loadDemoForm(DEMO_INVALID_FORM)}
                disabled={isChecking}
              >
                Nạp case không hợp lệ
              </RefreshButton>
            </div>
          </div>

          <div className="constraintFormGrid">
            <label className="label">
              ID yêu cầu
              <input
                className="input"
                type="number"
                min="1"
                value={formData.request_id}
                onChange={(event) =>
                  updateFormData("request_id", event.target.value)
                }
                disabled={isChecking}
              />
            </label>

            <label className="label">
              ID lớp học phần
              <input
                className="input"
                type="number"
                min="1"
                value={formData.course_section_id}
                onChange={(event) =>
                  updateFormData("course_section_id", event.target.value)
                }
                disabled={isChecking}
              />
            </label>

            <label className="label">
              ID tổ thực hành
              <input
                className="input"
                type="number"
                min="1"
                value={formData.practice_team_id}
                onChange={(event) =>
                  updateFormData("practice_team_id", event.target.value)
                }
                disabled={isChecking}
              />
            </label>

            <label className="label">
              ID giảng viên
              <input
                className="input"
                type="number"
                min="1"
                value={formData.lecturer_user_id}
                onChange={(event) =>
                  updateFormData("lecturer_user_id", event.target.value)
                }
                disabled={isChecking}
              />
            </label>

            <label className="label">
              ID phòng
              <input
                className="input"
                type="number"
                min="1"
                value={formData.room_id}
                onChange={(event) =>
                  updateFormData("room_id", event.target.value)
                }
                disabled={isChecking}
              />
            </label>

            <label className="label">
              Mã phòng
              <input
                className="input"
                value={formData.room_code}
                placeholder="Ví dụ: 2B11"
                onChange={(event) =>
                  updateFormData("room_code", event.target.value)
                }
                disabled={isChecking}
              />
            </label>

            <label className="label">
              Thứ trong tuần
              <select
                className="select"
                value={formData.day_of_week}
                onChange={(event) =>
                  updateFormData("day_of_week", event.target.value)
                }
                disabled={isChecking}
              >
                <option value="1">Chủ nhật</option>
                <option value="2">Thứ 2</option>
                <option value="3">Thứ 3</option>
                <option value="4">Thứ 4</option>
                <option value="5">Thứ 5</option>
                <option value="6">Thứ 6</option>
                <option value="7">Thứ 7</option>
              </select>
            </label>

            <label className="label">
              Ca học
              <select
                className="select"
                value={formData.time_slot}
                onChange={(event) =>
                  updateFormData("time_slot", event.target.value)
                }
                disabled={isChecking}
              >
                {TIME_SLOT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="label">
              Từ ngày
              <input
                className="input"
                type="date"
                value={formData.start_date}
                onChange={(event) =>
                  updateFormData("start_date", event.target.value)
                }
                disabled={isChecking}
              />
            </label>

            <label className="label">
              Đến ngày
              <input
                className="input"
                type="date"
                value={formData.end_date}
                onChange={(event) =>
                  updateFormData("end_date", event.target.value)
                }
                disabled={isChecking}
              />
            </label>

            <label className="label">
              Số sinh viên
              <input
                className="input"
                type="number"
                min="1"
                value={formData.student_count}
                onChange={(event) =>
                  updateFormData("student_count", event.target.value)
                }
                disabled={isChecking}
              />
            </label>

            <label className="label">
              ID phần mềm yêu cầu
              <input
                className="input"
                value={formData.required_software_ids}
                placeholder="Ví dụ: 1,2,6,8"
                onChange={(event) =>
                  updateFormData("required_software_ids", event.target.value)
                }
                disabled={isChecking}
              />
            </label>
          </div>

          <div className="constraintPayloadPreview">
            <p>
              <strong>Preview:</strong> Phòng {formData.room_code || "—"} ·{" "}
              {formatDayOfWeek(formData.day_of_week)} ·{" "}
              {formData.time_slot || "—"} · {formData.start_date || "—"} đến{" "}
              {formData.end_date || "—"}
            </p>
          </div>

          <div className="constraintActions">
            <ButtonUI
              tone="primary"
              shape="rounded"
              type="submit"
              disabled={isChecking}
            >
              {isChecking ? "Đang kiểm tra..." : "Kiểm tra ràng buộc"}
            </ButtonUI>

            <ButtonUI
              tone={canCreateSchedule ? "primary" : "secondary"}
              shape="rounded"
              type="button"
              onClick={handleCreateSchedule}
              disabled={!canCreateSchedule || isChecking}
            >
              Tạo lịch
            </ButtonUI>

            <RefreshButton onClick={resetResultState} disabled={isChecking}>
              Xóa kết quả
            </RefreshButton>
          </div>
        </form>

        <aside className="card constraintSummaryCard">
          <p className="commonEyebrow">Kết quả tổng quan</p>
          <h2 className="constraintSummaryTitle">{summaryStatus.title}</h2>
          <p className="constraintSummaryText">{summaryStatus.message}</p>

          <div className="constraintSummaryStats">
            <div className="constraintStatBox">
              <span>Tổng rule</span>
              <strong>{constraintRows.length || REQUIRED_RULES.length}</strong>
            </div>

            <div className="constraintStatBox">
              <span>Pass</span>
              <strong>{passedRows.length}</strong>
            </div>

            <div className="constraintStatBox">
              <span>Fail</span>
              <strong>{failedRows.length}</strong>
            </div>

            <div className="constraintStatBox">
              <span>Chưa trả</span>
              <strong>{missingRequiredRows.length}</strong>
            </div>
          </div>

          {localMessage ? (
            <p
              className={
                canCreateSchedule
                  ? "constraintAlert constraintAlertSuccess"
                  : "constraintAlert constraintAlertDanger"
              }
            >
              {localMessage}
            </p>
          ) : null}

          {missingRequiredRows.length > 0 && hasChecked ? (
            <p className="constraintAlert constraintAlertWarning">
              Backend hiện chưa trả đủ rule bắt buộc:{" "}
              {missingRequiredRows.map((row) => row.code).join(", ")}.
            </p>
          ) : null}

          <div className="constraintDemoNote">
            <h3>Ghi chú test demo</h3>
            <p>
              Case hợp lệ: phòng <strong>2B11</strong>, ngày{" "}
              <strong>2026-04-28</strong>.
            </p>
            <p>
              Case không hợp lệ: phòng <strong>2B99</strong>, ngày{" "}
              <strong>2026-05-01</strong>.
            </p>
          </div>
        </aside>
      </div>

      <section className="card constraintResultCard">
        <div className="constraintSectionHeader">
          <div>
            <p className="commonEyebrow">Checklist rule</p>
            <h2 className="constraintSectionTitle">Kết quả từng ràng buộc</h2>
          </div>

          {hasChecked ? (
            <StatusBadge variant={canCreateSchedule ? "success" : "danger"}>
              {canCreateSchedule ? "Được phép tạo lịch" : "Đang block tạo lịch"}
            </StatusBadge>
          ) : null}
        </div>

        {isChecking ? (
          <LoadingState
            title="Đang kiểm tra ràng buộc..."
            description="Hệ thống đang xử lý thông tin lịch."
          />
        ) : errorMessage ? (
          <ErrorState
            title="Không thể kiểm tra ràng buộc"
            error={errorMessage}
          />
        ) : hasChecked ? (
          <DataTable
            columns={columns}
            rows={constraintRows}
            emptyTitle="API chưa trả rule"
            emptyDescription="Backend chưa trả danh sách results/constraints."
          />
        ) : (
          <EmptyState
            title="Chưa có kết quả kiểm tra"
            description="Nhập dữ liệu lịch thực hành rồi bấm Kiểm tra ràng buộc."
          />
        )}
      </section>
    </section>
  );
}
