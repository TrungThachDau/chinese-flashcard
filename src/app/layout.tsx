import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Hán Ngữ | Học Tiếng Trung HSK 3.0 Dễ Nhớ & Hiệu Quả",
  description:
    "Học tiếng Trung chuẩn HSK 3.0 thông minh với phương pháp nhắc ôn đúng lúc, phát âm chuẩn giọng đọc bản xứ, phân tích chi tiết bộ thủ nét chữ Hán và luyện phản xạ câu hỏi đời sống.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hán Ngữ",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
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
