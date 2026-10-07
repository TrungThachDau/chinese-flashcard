import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Hán Ngữ | Thẻ Flashcard Tiếng Trung HSK 1 Lặp Lại Ngắt Quãng",
  description:
    "Học tiếng Trung HSK 1 thông minh với thuật toán lặp lại ngắt quãng (SM-2 SRS), phát âm chuẩn giọng đọc bản xứ, phân tích chi tiết bộ thủ nét chữ Hán và luyện phản xạ câu hỏi đời sống.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hán Ngữ",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
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
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
