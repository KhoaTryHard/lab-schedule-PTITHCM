import AppShell from '../../../components/layout/AppShell';
import DataTable from '../../../components/common/DataTable';
import { ButtonUI } from '../../../components/common/buttonUI.jsx';

const rankedOptions = [
  {
    rank: 1,
    room_code: '2B11',
    day_of_week: 'Thứ 3',
    time_slot: 'Tiết 7-10',
    score: 90,
    status: 'Đề xuất chọn'
  },
  {
    rank: 2,
    room_code: '2B21',
    day_of_week: 'Thứ 3',
    time_slot: 'Tiết 7-10',
    score: 85,
    status: 'Phương án dự phòng'
  },
  {
    rank: 3,
    room_code: '2B31',
    day_of_week: 'Thứ 3',
    time_slot: 'Tiết 7-10',
    score: 80,
    status: 'Phương án dự phòng'
  }
];

export default function AutoArrangePage() {
  return (
    <AppShell>
      <section className="card">
        <h1>Preview phương án xếp phòng tự động</h1>
        <p>
          CBDT không chọn phòng thủ công. Hệ thống sinh phương án, lọc ràng buộc cứng,
          chấm điểm và đề xuất phương án tốt nhất trong 3 phòng.
        </p>

        <DataTable
          columns={[
            { key: 'rank', label: 'Hạng' },
            { key: 'room_code', label: 'Phòng' },
            { key: 'day_of_week', label: 'Thứ' },
            { key: 'time_slot', label: 'Ca' },
            { key: 'score', label: 'Điểm' },
            { key: 'status', label: 'Trạng thái' }
          ]}
          rows={rankedOptions}
        />

        <div style={{ marginTop: 16 }}>
          <ButtonUI tone="primary" shape="rounded">Xác nhận tạo lịch draft</ButtonUI>
          {' '}
          <ButtonUI tone="secondary" shape="rounded">Chạy lại thuật toán</ButtonUI>
        </div>
      </section>
    </AppShell>
  );
}
