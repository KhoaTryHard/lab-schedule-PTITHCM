import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 720 }}>
        <span className="badge">MVP Scope: 2B11 / 2B21 / 2B31</span>
        <h1>Lab Schedule PTIT</h1>
        <p>
          Hệ thống quản lý và tự động sắp xếp lịch thực hành phòng máy theo luật.
        </p>
        <Link className="button" href="/login">Đi đến đăng nhập</Link>
      </div>
    </main>
  );
}
