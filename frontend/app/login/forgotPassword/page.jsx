import Link from "next/link";
import Image from "next/image";

import ptitLogo from "../../../pictures/PtitLogo.svg";

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: dựng giao diện quên mật khẩu để người dùng nhập tài khoản và tiếp tục quy trình phục hồi.
 * Hàm trả về: JSX hiển thị thẻ quên mật khẩu cùng nút điều hướng sang màn hình đặt lại mật khẩu.
 */
export default function ForgotPasswordPage() {
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
        <h1 className="authTitle">Khôi phục mật khẩu</h1>
      </div>

      <div className="authForm">
        <div className="authFieldGroup">
          <label className="authLabel" htmlFor="recoverIdentity">
            Tài khoản
          </label>
          <div className="authInputWrap">
            <input
              id="recoverIdentity"
              className="authInput"
              type="text"
              placeholder="nhập tài khoản của bạn"
            />
          </div>
        </div>

        <div className="authFieldGroup">
          <label className="authLabel" htmlFor="recoverEmail">
            Email
          </label>
          <div className="authInputWrap">
            <input
              id="recoverEmail"
              className="authInput"
              type="email"
              placeholder="nhập email của bạn"
            />
          </div>
        </div>

        {/* Tạm thời điều hướng sang màn hình đặt lại mật khẩu, chưa tích hợp gửi email thật. */}
        <Link className="authPrimaryButton" href="/login/resetPassword">
          Tiếp tục đặt lại mật khẩu
        </Link>

        <Link className="authSecondaryButton" href="/login">
          Quay lại đăng nhập
        </Link>
      </div>
    </section>
  );
}
