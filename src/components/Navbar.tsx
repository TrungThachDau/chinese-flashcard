"use client";

import React, { useState, useRef, useEffect } from "react";
import { Flame, Settings, LogOut, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { StudyStats, UserSettings } from "@/lib/types";
import { AppTab } from "./MainClientApp";

interface NavbarProps {
  stats: StudyStats | null;
  settings?: UserSettings;
  authUser?: { id: string; username: string; email?: string | null } | null;
  onOpenSettings: () => void;
  onLogout?: () => void;
  activeTab: AppTab | string;
  setActiveTab: (tab: AppTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  settings,
  authUser,
  onOpenSettings,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    settings?.user_name?.trim() || authUser?.username || "Học viên";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    tab: AppTab,
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shrink-0">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-13 sm:h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          prefetch={false}
          onClick={(e) => handleLinkClick(e, "flashcards")}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <img
            src="/icons/icon.svg"
            alt="Logo Hán Ngữ"
            width={36}
            height={36}
            loading="eager"
            decoding="async"
            className="w-9 h-9 rounded-xl shadow-xs object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          <div>
            <div className="font-extrabold text-base tracking-tight bg-linear-to-r from-slate-900 via-indigo-900 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent flex items-center gap-1.5">
              <span>Hán Ngữ</span>
            </div>
          </div>
        </Link>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
          <Link
            href="/"
            prefetch={false}
            onClick={(e) => handleLinkClick(e, "flashcards")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "flashcards"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            🎴 Thẻ
          </Link>
          <Link
            href="/life-questions"
            prefetch={false}
            onClick={(e) => handleLinkClick(e, "life_questions")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "life_questions"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            💬 Câu hỏi đời sống
          </Link>
          <Link
            href="/vocab"
            prefetch={false}
            onClick={(e) => handleLinkClick(e, "vocab")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "vocab"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            📚 Từ vựng ({stats?.total_cards || 0})
          </Link>
          <Link
            href="/stats"
            prefetch={false}
            onClick={(e) => handleLinkClick(e, "stats")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "stats"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            📊 Tiến độ
          </Link>
        </nav>

        {/* Right Action Icons: User Display Name Dropdown, Streak & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
              title="Tài khoản & Đăng xuất"
            >
              <div className="w-5 h-5 rounded-full bg-linear-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-24 truncate">{displayName}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-indigo-500/80 transition-transform duration-200 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {authUser?.username
                        ? `@${authUser.username}`
                        : "Tài khoản học viên"}
                    </div>
                  </div>
                </div>

                {/* Menu Actions */}
                <div className="p-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Hồ sơ &amp; Cài đặt học tập</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout?.();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {stats && (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 font-bold text-xs shadow-sm shrink-0">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{stats.streak_days} ngày</span>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Cài đặt phát âm & mục tiêu"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
