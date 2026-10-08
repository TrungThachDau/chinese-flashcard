"use client";

import React from "react";
import { Flame, Sparkles, Settings, Volume2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { StudyStats, UserSettings } from "@/lib/types";
import { AppTab } from "./MainClientApp";

interface NavbarProps {
  stats: StudyStats | null;
  settings?: UserSettings;
  onOpenSettings: () => void;
  activeTab: AppTab | string;
  setActiveTab: (tab: AppTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  settings,
  onOpenSettings,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          onClick={() => setActiveTab("flashcards")}
          className="flex flex-col cursor-pointer select-none group"
        >
          <div>
            <div className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent flex items-center gap-1.5">
              <span>Hán Ngữ</span>
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenSettings();
                }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-300/40 transition-colors"
                title="Nhấn để đổi cấp độ HSK hoặc cài đặt"
              >
                HSK {settings?.hsk_level || 1} ▾
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Spaced Repetition System
            </div>
          </div>
        </Link>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
          <Link
            href="/"
            onClick={() => setActiveTab("flashcards")}
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
            onClick={() => setActiveTab("life_questions")}
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
            onClick={() => setActiveTab("vocab")}
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
            onClick={() => setActiveTab("stats")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "stats"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            📊 Tiến độ
          </Link>
        </nav>

        {/* Right Action Icons: User Badge, Streak & Settings */}
        <div className="flex items-center gap-2">
          {settings?.user_name && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              title="Cài đặt hồ sơ & mục tiêu"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                {settings.user_name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline-block max-w-[90px] truncate">
                {settings.user_name}
              </span>
            </button>
          )}

          {stats && (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 font-bold text-xs shadow-sm">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{stats.streak_days} ngày</span>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Cài đặt phát âm & mục tiêu"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
