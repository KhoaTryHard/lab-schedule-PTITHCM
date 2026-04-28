import './globals.css';

export const metadata = {
  title: 'Lab Schedule PTIT',
  description: 'MVP phân công lịch thực hành phòng máy'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
