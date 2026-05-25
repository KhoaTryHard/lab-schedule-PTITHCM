import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function TechnicianRoomSchedulePage() {
  return (
    <ScheduleLookupTable
      title="Lịch sử dụng phòng máy"
      usePublishedEndpoint
      showStatusFilter={false}
      showLecturerFilter={false}
      showScheduleRequestFilter
      emptyTitle="Chưa có lịch phòng máy"
      emptyDescription="Chưa có lịch thực hành đã công bố cho phòng máy."
    />
  );
}
