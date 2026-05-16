import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";

import campusBackground from "../../pictures/HocVienCoSoHomePage.png";
import ptitLogo from "../../pictures/PtitLogo.svg";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

// Mảng liên kết footer dùng chung cho nhóm trang xác thực.
const authFooterLinks = [
  { label: "Quyền riêng tư", href: "#" },
  { label: "Điều khoản", href: "#" },
  { label: "Hỗ trợ", href: "/login/forgotPassword" },
];

/**
 * Hàm nhận vào: children là nội dung trang con bên trong khu vực xác thực.
 * Hàm xử lý: dựng layout dùng chung cho các màn hình đăng nhập, quên mật khẩu và đặt lại mật khẩu.
 * Hàm trả về: JSX chứa nền campus làm mờ, header, vùng nội dung trung tâm và footer.
 */
export default function LoginLayout({ children }) {
  return (
    <div className={`${inter.className} authPageShell`}>
      <div className="authBackdrop" aria-hidden="true">
        <Image
          src={campusBackground}
          alt="Ảnh nền cơ sở PTIT HCM cho nhóm trang xác thực."
          fill
          priority
          sizes="100vw"
          className="authBackgroundImage"
        />
        <div className="authBackgroundBlur" />
        <div className="authBackgroundTint" />
        <div className="authGlow authGlowLeft" />
        <div className="authGlow authGlowRight" />
      </div>
        <main className="authStage">{children}</main>
    </div>
  );
}
