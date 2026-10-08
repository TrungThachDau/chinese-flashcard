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
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, tabId: AppTab) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    setActiveTab(tabId);
  };

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
    <nav className="fixed bottom-3 inset-x-3.5 max-w-md mx-auto z-40 md:hidden liquid-glass rounded-[26px] p-1.5 transition-all duration-300">
      {/* Specular Liquid Light Reflection on Top Rim */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/30 to-transparent rounded-full" />

      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch={false}
              onClick={(e) => handleLinkClick(e, tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-[20px] transition-all duration-200 active:scale-95 ${
                isActive
                  ? "liquid-glass-active text-rose-500 dark:text-rose-400 font-bold scale-[1.03]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "stroke-[2.5] scale-110 drop-shadow-sm" : "stroke-2"
                  }`}
                />
                {tab.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-[10px] font-black text-white flex items-center justify-center shadow-md ring-2 ring-white/80 dark:ring-slate-900/80">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] mt-0.5 tracking-tight font-sans">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
