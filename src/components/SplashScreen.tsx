"use client";

import React, { useState, useEffect } from "react";

interface SplashScreenProps {
  delayMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ delayMs = 200 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show loading splash screen if response/loading takes longer than delayMs (200ms)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-between p-6 bg-gradient-to-br from-amber-50/90 via-rose-50/60 to-indigo-50/90 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 select-none animate-splash-delayed animate-in fade-in duration-300">
      {/* Top spacer for optical balance */}
      <div className="w-full h-8" />

      {/* Centered Mobile App Splash Content */}
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Logo Container with glowing backdrop */}
        <div className="relative">
          <div className="absolute -inset-3 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 rounded-3xl blur-2xl opacity-40 animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shadow-2xl shadow-rose-500/25 border-2 border-white/60 dark:border-white/10 bg-white dark:bg-slate-900 p-2 flex items-center justify-center transform transition-transform hover:scale-105">
            <img
              src="/icons/icon.svg"
              alt="Hán Ngữ"
              width={96}
              height={96}
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
        </div>

        {/* App Title & Slogan */}
        <div className="space-y-1.5 pt-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
            Hán Ngữ
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Học Flashcard &amp; Luyện Phản Xạ HSK 3.0
          </p>
        </div>

        {/* Sleek App Loading Bar */}
        <div className="pt-3 flex flex-col items-center space-y-2">
          <div className="w-36 h-1.5 bg-slate-200/90 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 rounded-full animate-indeterminate" />
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Đang tải dữ liệu...
          </span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-[11px] text-slate-400 dark:text-slate-600 font-bold tracking-wider uppercase">
        
      </div>
    </div>
  );
};

