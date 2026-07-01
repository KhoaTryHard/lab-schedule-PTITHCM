import Image from "next/image";
import { Inter } from "next/font/google";

import campusBackground from "../../pictures/HocVienCoSoHomePage.png";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function LoginLayout({ children }) {
  return (
    <div className={`${inter.className} authPageShell`}>
      <div className="authBackdrop" aria-hidden="true">
        <Image
          src={campusBackground}
          alt="Ảnh nền PTIT HCM"
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
