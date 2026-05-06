import Link from "next/link";
import "./unauthoried.css";

export default function UnauthorizedPage() {
  return (
    <main className="page unauthorizedPage">
      <section className="card" id="unau">
        <h1>Không có quyền truy cập</h1>
        <p>Tài khoản hiện tại không được phép truy cập chức năng này.</p>
        <Link className="button" href="/login">
          Quay về đăng nhập
        </Link>
      </section>
    </main>
  );
}
