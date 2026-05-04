import Link from "next/link";
import Image from "next/image";

import ptitLogo from "../../pictures/PtitLogo.svg";

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: dựng giao diện đăng nhập dạng glassmorphism cho hệ thống PTIT HCM.
 * Hàm trả về: JSX hiển thị khung đăng nhập, các trường nhập và liên kết điều hướng liên quan.
 */
export default function LoginPage() {
  return (
    <section className="authCard">
      <div className="authCardBrand">
        <span className="authCardLogo">
          <Image
            src={ptitLogo}
            alt="Logo PTIT HCM"
            fill
            sizes="88px"
            className="authCardLogoImage"
          />
        </span>
      </div>

      <div className="authHeading">
        <h1 className="authTitle">Đăng nhập</h1>
      </div>

      <div className="authForm">
        <div className="authFieldGroup">
          <label className="authLabel" htmlFor="identity">
            Email
          </label>
          <div className="authInputWrap">
            <input
              id="identity"
              className="authInput"
              type="text"
              placeholder="Nhập tài khoản của bạn"
            />
          </div>
        </div>

        <div className="authFieldGroup">
          <label className="authLabel" htmlFor="password">
            Mật khẩu
          </label>
          <div className="authInputWrap">
            <input
              id="password"
              className="authInput"
              type="password"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="authRowBetween">
          <label className="authCheckboxRow" htmlFor="rememberLogin">
            <input
              id="rememberLogin"
              className="authCheckbox"
              type="checkbox"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <Link className="authInlineLink" href="/login/forgotPassword">
            Quên mật khẩu
          </Link>
        </div>

        {/* Tạm thời điều hướng sang màn hình demo, chưa tích hợp xác thực thật. */}
        <Link className="authPrimaryButton" href="/academic/schedule-requests">
          Đăng nhập
        </Link>
      </div>
    </section>
  );
}
