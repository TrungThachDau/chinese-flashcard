"use client";

import Link from "next/link";
import { Layers, MessageSquareText, BookMarked, BarChart3 } from "lucide-react";
import { StudyStats } from "@/lib/types";
import { AppTab } from "./MainClientApp";

interface BottomNavProps {
  activeTab: AppTab | string;
  setActiveTab: (tab: AppTab) => void;
  stats: StudyStats | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  stats,
}) => {
  const tabs: Array<{
    id: AppTab;
    label: string;
    href: string;
    icon: typeof Layers;
    badge: number | null;
  }> = [
    {
      id: "flashcards",
      label: "Thẻ",
      href: "/",
      icon: Layers,
      badge: stats && stats.due_today > 0 ? stats.due_today : null,
    },
    {
      id: "life_questions",
      label: "Đời sống",
      href: "/life-questions",
      icon: MessageSquareText,
      badge: null,
    },
    {
      id: "vocab",
      label: "Từ vựng",
      href: "/vocab",
      icon: BookMarked,
      badge: null,
    },
    {
      id: "stats",
      label: "Tiến độ",
      href: "/stats",
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 px-3 py-2 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "text-rose-500 dark:text-rose-400 font-bold scale-105"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`}
                />
                {tab.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center shadow-md">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
