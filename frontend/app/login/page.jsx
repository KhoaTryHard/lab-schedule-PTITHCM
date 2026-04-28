import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="page" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
      <section className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1>Đăng nhập</h1>
        <p>Role được xác định từ tài khoản, người dùng không chọn role thủ công.</p>

        <label className="label">
          Username
          <input className="input" placeholder="academic_officer1" />
        </label>

        <label className="label">
          Password
          <input className="input" type="password" placeholder="••••••" />
        </label>

        <Link className="button" href="/academic/schedule-requests">Demo đăng nhập CBDT</Link>
      </section>
    </main>
  );
}
