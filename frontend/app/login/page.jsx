"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ptitLogo from "../../pictures/PtitLogo.svg";
import { login, getMe } from "../../services/authService";
import { saveToken, saveUser } from "../../lib/authStorage";
import { getHomePathByRole } from "../../lib/roleRoutes";

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: dựng giao diện đăng nhập và gọi API Auth thật.
 * Hàm trả về: JSX hiển thị form đăng nhập, lỗi và trạng thái loading.
 */
export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Hàm nhận vào: event submit form.
   * Hàm xử lý: gọi POST /auth/login, lưu token, gọi /auth/me, lưu user và điều hướng theo role.
   * Hàm trả về: không trả về dữ liệu.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    try {
      setIsSubmitting(true);

      const loginResponse = await login(username.trim(), password);
      const token = loginResponse?.data?.token;

      if (!token) {
        throw new Error("API không trả về token đăng nhập.");
      }

      saveToken(token);

      const meResponse = await getMe();
      const currentUser = meResponse?.data;

      if (!currentUser?.role_code) {
        throw new Error("Không xác định được vai trò tài khoản.");
      }

      saveUser(currentUser);
      router.replace(getHomePathByRole(currentUser.role_code));
    } catch (error) {
      if (error.status === 401) {
        setErrorMessage("Tên đăng nhập hoặc mật khẩu không đúng.");
        return;
      }

      if (error.status === 403) {
        setErrorMessage("Tài khoản không hợp lệ hoặc đang bị khóa.");
        return;
      }

      setErrorMessage(
        error.message || "Không thể đăng nhập. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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

      <form className="authForm" onSubmit={handleSubmit}>
        <div className="authFieldGroup">
          <label className="authLabel" htmlFor="username">
            Tên đăng nhập
          </label>
          <div className="authInputWrap">
            <input
              id="username"
              className="authInput"
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>

        {errorMessage ? (
          <div className="authErrorMessage" role="alert">
            <span className="authErrorIcon">!</span>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <button
          className={`authPrimaryButton ${isSubmitting ? "authPrimaryButtonLoading" : ""}`}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang xác thực..." : "Đăng nhập"}
        </button>
      </form>
    </section>
  );
}
