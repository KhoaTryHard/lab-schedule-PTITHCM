import Link from 'next/link';

const navItems = [
  { href: '/admin/rooms', label: 'Phòng máy' },
  { href: '/academic/schedule-requests', label: 'Yêu cầu xếp lịch' },
  { href: '/academic/auto-arrange', label: 'Auto Arrange' },
  { href: '/academic/schedules', label: 'Lịch thực hành' },
  { href: '/lecturer/my-schedule', label: 'Lịch GV' },
  { href: '/technician/room-schedule', label: 'Lịch KTV' },
  { href: '/student/my-schedule', label: 'Lịch SV' }
];

export default function AppShell({ children }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Lab Schedule PTIT</h1>
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </aside>
      <main className="content">
        {children}
      </main>
    </div>
  );
}
