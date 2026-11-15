"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { clearLocalDbForUserSwitch } from "@/repositories/local/indexeddb.repository";
import { createBrowserSupabaseClient } from "@/repositories/supabase/browser.client";
import { importGuestDataToAccount } from "@/services/guest.service";

export function LoginFormContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [mode, setMode] = useState<"login" | "register">(() =>
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSwitchMode = (targetMode: "login" | "register") => {
    setMode(targetMode);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
          displayName: displayName.trim() || trimmedUsername,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(
          data.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
        );
        setIsLoading(false);
        return;
      }

      // Sync session tokens into browser client to ensure persistent cookies across reloads
      if (data.session?.access_token && data.session?.refresh_token) {
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
      }

      // Clear local IndexedDB cache if switching to a different user
      if (data.user?.id) {
        await clearLocalDbForUserSwitch(data.user.id);
      }

      // Move progress studied as a guest into this account
      const imported = await importGuestDataToAccount();
      if (typeof window !== "undefined") {
        if (imported) {
          window.sessionStorage.removeItem("guest-import-pending");
        } else {
          window.sessionStorage.setItem("guest-import-pending", "true");
        }
      }

      setSuccessMsg(
        mode === "login"
          ? "Đăng nhập thành công! Đang vào bàn học..."
          : "Tạo tài khoản thành công! Đang chuẩn bị lộ trình học...",
      );

      window.location.href = nextPath;
    } catch (err) {
      console.error("Auth request error:", err);
      setError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-linear-to-br from-amber-50/70 via-rose-50/40 to-indigo-50/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-slate-200/80 dark:border-slate-800 mb-1">
            <img
              src="/icons/icon.svg"
              alt="Logo Hán Ngữ"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-linear-to-r from-slate-900 via-indigo-900 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
            Hán Ngữ
          </h1>
        </div>

        {/* Auth Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-5">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchMode("login")}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("register")}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng ký mới</span>
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="username-input"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tên đăng nhập (Username)</span>
                </span>
              </label>
              <input
                id="username-input"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: trung123, minh_hsk..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Display Name (Register only) */}
            {mode === "register" && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label
                  htmlFor="display-name-input"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Tên hiển thị khi học (Tùy chọn)</span>
                  </span>
                </label>
                <input
                  id="display-name-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Minh, Nguyễn Văn A..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password-input"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>Mật khẩu</span>
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {mode === "register" && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label
                  htmlFor="confirm-password-input"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Nhập lại mật khẩu</span>
                </label>
                <input
                  id="confirm-password-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 hover:opacity-95 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {mode === "login" ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập vào học"}
                  </span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản mới"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Feature Highlights */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>HSK 3.0</span>
            </span>
            <a
              href="/"
              className="font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
            >
              Học ngay không cần đăng nhập →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}