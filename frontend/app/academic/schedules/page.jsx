import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function AcademicSchedulesPage() {
  return (
    <ScheduleLookupTable
      title="Tra cứu lịch thực hành"
      emptyTitle="Chưa có lịch thực hành"
      emptyDescription="Chưa có lịch thực hành phù hợp với bộ lọc hiện tại."
      integrationNote="Màn này đã bỏ mock và gọi API thật. Backend develop hiện tại đang trả data.schedules = [] nên chưa thể tick tiêu chí có danh sách lịch thật, nhưng frontend đã sẵn sàng render toàn bộ field API trả về."
    />
  );
}
