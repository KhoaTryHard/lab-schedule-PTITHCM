import AppShell from '../../../components/layout/AppShell';
import DataTable from '../../../components/common/DataTable';

const schedules = [
  {
    id: 1,
    course: 'Lập trình Web',
    room: '2B11',
    time: 'Thứ 3, tiết 7-10',
    lecturer: 'Trần Hoàng Nam',
    status: 'draft'
  }
];

export default function AcademicSchedulesPage() {
  return (
    <AppShell>
      <section className="card">
        <h1>Lịch thực hành</h1>
        <DataTable
          columns={[
            { key: 'course', label: 'Môn' },
            { key: 'room', label: 'Phòng' },
            { key: 'time', label: 'Thời gian' },
            { key: 'lecturer', label: 'GV' },
            { key: 'status', label: 'Trạng thái' }
          ]}
          rows={schedules}
        />
      </section>
    </AppShell>
  );
}
