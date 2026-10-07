import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hán Ngữ | Thẻ Flashcard Tiếng Trung HSK 1 Lặp Lại Ngắt Quãng",
  description:
    "Học tiếng Trung HSK 1 thông minh với thuật toán lặp lại ngắt quãng (SM-2 SRS), phát âm chuẩn giọng đọc bản xứ, phân tích chi tiết bộ thủ nét chữ Hán và luyện phản xạ câu hỏi đời sống.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans select-text">
        {children}
      </body>
    </html>
  );
}
