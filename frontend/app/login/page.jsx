"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ptitLogo from "../../pictures/PtitLogo.svg";
import { login, getMe } from "../../services/authService";
import { saveToken, saveUser } from "../../lib/authStorage";
import { getHomePathByRole } from "../../lib/roleRoutes";

function AuthFeedback({ type = "error", title, message, onRetry }) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 18,
        border: isError
          ? "1px solid rgba(139, 0, 0, 0.18)"
          : "1px solid rgba(4, 120, 87, 0.18)",
        background: "rgba(255, 255, 255, 0.92)",
        color: isError ? "#610000" : "#047857",
        boxShadow: "0 14px 28px rgba(15, 23, 42, 0.08)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-grid",
          placeItems: "center",
          width: 38,
          height: 38,
          flex: "0 0 auto",
          borderRadius: 14,
          background: isError ? "#fff1f2" : "#ecfdf5",
          fontSize: 20,
        }}
      >
        {isError ? "⚠️" : "⏳"}
      </span>

      <div style={{ minWidth: 0, flex: 1 }}>
        <strong
          style={{
            display: "block",
            color: isError ? "#610000" : "#047857",
            fontSize: 15,
            lineHeight: 1.35,
          }}
        >
          {title}
        </strong>
        <p
          style={{
            margin: "4px 0 0",
            color: "#64748b",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
      </div>

      {isError && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          style={{
            minHeight: 36,
            padding: "0 14px",
            borderRadius: 12,
            border: "1px solid rgba(139, 0, 0, 0.24)",
            background: "#ffffff",
            color: "#8b0000",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  function handleRetry() {
    setErrorMessage("");
    setPassword("");
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>
        </div>

        {errorMessage ? (
          <AuthFeedback
            type="error"
            title="Đăng nhập thất bại"
            message={errorMessage}
            onRetry={handleRetry}
          />
        ) : null}

        {isSubmitting ? (
          <AuthFeedback
            type="loading"
            title="Đang xác thực"
            message="Hệ thống đang kiểm tra tài khoản và phân quyền."
          />
        ) : null}

        <button
          className={`authPrimaryButton ${
            isSubmitting ? "authPrimaryButtonLoading" : ""
          }`}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Đang xác thực..."
            : errorMessage
              ? "Thử lại"
              : "Đăng nhập"}
        </button>
      </form>
    </section>
  );
}
