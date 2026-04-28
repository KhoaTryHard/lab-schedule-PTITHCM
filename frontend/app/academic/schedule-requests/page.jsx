import Link from 'next/link';
import AppShell from '../../../components/layout/AppShell';
import { TIME_SLOTS } from '../../../lib/constants';

export default function ScheduleRequestsPage() {
  return (
    <AppShell>
      <div className="grid grid-2">
        <section className="card">
          <h1>Tạo yêu cầu xếp lịch thực hành</h1>

          <label className="label">
            Lớp học phần
            <input className="input" placeholder="INT1434-3 - Lập trình Web - Nhóm 03" />
          </label>

          <label className="label">
            Tổ thực hành / số sinh viên
            <input className="input" placeholder="Tổ TH 01 - 40 sinh viên" />
          </label>

          <label className="label">
            Khoảng ngày
            <input className="input" placeholder="28/04/2026 đến 03/05/2026" />
          </label>

          <label className="label">
            Ca ưu tiên
            <select className="select">
              {TIME_SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
          </label>

          <label className="label">
            Ghi chú
            <textarea className="textarea" placeholder="Yêu cầu phần mềm, ưu tiên giảng viên..." />
          </label>

          <Link className="button" href="/academic/auto-arrange">Auto Arrange</Link>
        </section>

        <aside className="card">
          <h2>Ràng buộc bắt buộc</h2>
          <ul>
            <li>Chỉ phòng 2B11, 2B21, 2B31</li>
            <li>Không trùng phòng</li>
            <li>Không trùng giảng viên</li>
            <li>Phòng đủ máy</li>
            <li>Phòng đủ phần mềm</li>
            <li>Không bị ngày nghỉ/phòng block</li>
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
