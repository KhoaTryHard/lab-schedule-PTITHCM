import AppShell from '../../../components/layout/AppShell';
import DataTable from '../../../components/common/DataTable';
import { ROOM_SCOPE } from '../../../lib/constants';

export default function RoomsPage() {
  const rows = ROOM_SCOPE.map((roomCode, index) => ({
    id: index + 1,
    room_code: roomCode,
    status: 'available',
    scope: 'In-scope MVP'
  }));

  return (
    <AppShell>
      <div className="card">
        <h1>Quản lý phòng máy</h1>
        <p>Chỉ quản lý 3 phòng trong MVP.</p>
        <DataTable
          columns={[
            { key: 'room_code', label: 'Phòng' },
            { key: 'status', label: 'Trạng thái' },
            { key: 'scope', label: 'Scope' }
          ]}
          rows={rows}
        />
      </div>
    </AppShell>
  );
}
