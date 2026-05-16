"use client";

import { useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { autoArrangeSchedule } from "../../../services/scheduleService";

const DEMO_AUTO_ARRANGE_PAYLOAD = {
  request_id: 1,
  course_section_id: 1,
  practice_team_id: 1,
  lecturer_user_id: 1,
  student_count: 40,
  preferred_day_of_week: 3,
  preferred_time_slot: "7-10",
  start_date: "2026-04-28",
  end_date: "2026-05-28",
  required_software_ids: [1, 2],
};

function normalizeRankedOption(option, index) {
  return {
    id: `${option?.room_code || "room"}-${index + 1}`,
    rank: index + 1,
    room_code: option?.room_code || "—",
    day_of_week: option?.day_of_week || "—",
    time_slot: option?.time_slot || "—",
    start_date: option?.start_date || "—",
    end_date: option?.end_date || "—",
    score: option?.score ?? "—",
    reasons: Array.isArray(option?.reasons) ? option.reasons.join("; ") : "—",
  };
}

export default function AutoArrangePage() {
  const [rankedOptions, setRankedOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRunAutoArrange() {
    try {
      setIsRunning(true);
      setErrorMessage("");

      const response = await autoArrangeSchedule(DEMO_AUTO_ARRANGE_PAYLOAD);
      const data = response?.data || {};
      const options = Array.isArray(data.ranked_options)
        ? data.ranked_options
        : [];

      setSelectedOption(data.selected_option || null);
      setRankedOptions(options.map(normalizeRankedOption));
    } catch (error) {
      setSelectedOption(null);
      setRankedOptions([]);
      setErrorMessage(error?.message || "Không chạy được thuật toán xếp lịch.");
    } finally {
      setIsRunning(false);
    }
  }

  const columns = useMemo(
    () => [
      { key: "rank", label: "Hạng" },
      { key: "room_code", label: "Phòng" },
      { key: "day_of_week", label: "Thứ" },
      { key: "time_slot", label: "Ca" },
      { key: "start_date", label: "Bắt đầu" },
      { key: "end_date", label: "Kết thúc" },
      { key: "score", label: "Điểm" },
      { key: "reasons", label: "Lý do" },
    ],
    [],
  );

  return (
    <section className="card">
      <div className="roomFilterBar">
        <div className="roomFilterSummary">
          <h2 className="roomSectionTitle">Preview phương án xếp phòng tự động</h2>
          <p className="roomSectionText">
            Trang gọi endpoint POST /api/schedules/auto-arrange. Backend hiện vẫn là stub/demo.
          </p>
        </div>

        <ButtonUI
          tone="primary"
          shape="rounded"
          onClick={handleRunAutoArrange}
          disabled={isRunning}
        >
          {isRunning ? "Đang chạy..." : "Chạy thuật toán"}
        </ButtonUI>
      </div>

      {selectedOption ? (
        <div className="card">
          <h3 className="roomSectionTitle">Phương án đề xuất</h3>
          <p className="roomSectionText">
            Phòng {selectedOption.room_code} · Ca {selectedOption.time_slot} · Điểm{" "}
            {selectedOption.score}
          </p>
        </div>
      ) : null}

      <div className="card roomTableCard">
        <DataTable
          columns={columns}
          rows={rankedOptions}
          loading={isRunning}
          error={errorMessage}
          emptyTitle="Chưa có phương án"
          emptyDescription="Bấm Chạy thuật toán để gọi API auto-arrange."
        />
      </div>
    </section>
  );
}
