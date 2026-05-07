import Link from "next/link";
import Image from "next/image";

import ptitLogo from "../../../pictures/PtitLogo.svg";

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: dựng giao diện đặt lại mật khẩu mới sau bước quên mật khẩu.
 * Hàm trả về: JSX hiển thị các trường nhập mật khẩu mới và nút quay lại đăng nhập.
 */
export default function ResetPasswordPage() {
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
        <h1 className="authTitle">Mật khẩu mới</h1>
      </div>

      <div className="authForm">
        <div className="authFieldGroup">
          <label className="authLabel" htmlFor="newPassword">
            Mật khẩu mới
          </label>
          <div className="authInputWrap">
            <input
              id="newPassword"
              className="authInput"
              type="password"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="authFieldGroup">
          <label className="authLabel" htmlFor="confirmPassword">
            Xác nhận mật khẩu mới
          </label>
          <div className="authInputWrap">
            <input
              id="confirmPassword"
              className="authInput"
              type="password"
              placeholder="••••••••"
            />
          </div>
          <p className="authInputHint">
            Mật khẩu nên có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.
          </p>
        </div>

        {/* Tạm thời quay lại đăng nhập sau khi hoàn tất giao diện, chưa tích hợp API đổi mật khẩu thật. */}
        <Link className="authPrimaryButton" href="/login">
          Đổi mật khẩu
        </Link>

        <Link className="authSecondaryButton" href="/login">
          Quay lại đăng nhập
        </Link>
      </div>
    </section>
  );
}
