import { Be_Vietnam_Pro } from "next/font/google";

import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Lab Schedule PTIT",
  description: "MVP phân công lịch thực hành phòng máy",
};

/**
 * Hàm nhận vào: children là toàn bộ nội dung các route của ứng dụng.
 * Hàm xử lý: nạp font có hỗ trợ tiếng Việt và bọc nội dung chung cho toàn app.
 * Hàm trả về: JSX của root layout.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={beVietnamPro.className}>{children}</body>
    </html>
  );
}
