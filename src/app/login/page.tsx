import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginFormContent } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập | Hán Ngữ",
  description: "Đăng nhập hoặc tạo tài khoản để tiếp tục lộ trình học tiếng Trung.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 text-sm font-medium">
          Đang tải trang đăng nhập...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
