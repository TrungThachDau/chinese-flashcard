import React from "react";

export function AppSkeleton() {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-linear-to-br from-amber-50/50 via-rose-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
      {/* Navbar Skeleton */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-13 sm:h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-1.5 select-none">
            <span className="font-extrabold text-base tracking-tight bg-linear-to-r from-slate-900 via-indigo-900 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
              Hán Ngữ
            </span>
          </div>

          {/* Desktop Nav Tabs Placeholder */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
            <span className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm">
              🎴 Thẻ
            </span>
            <span className="px-3.5 py-1.5 rounded-xl text-slate-500 dark:text-slate-400">
              💬 Câu hỏi đời sống
            </span>
            <span className="px-3.5 py-1.5 rounded-xl text-slate-500 dark:text-slate-400">
              📚 Từ vựng
            </span>
            <span className="px-3.5 py-1.5 rounded-xl text-slate-500 dark:text-slate-400">
              📊 Tiến độ
            </span>
          </nav>

          {/* Right Skeleton */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-7 rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 animate-pulse hidden sm:block" />
            <div className="w-8 h-8 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full mx-auto px-3 sm:px-4 max-w-md md:max-w-xl flex-1 min-h-0 flex flex-col pt-1 sm:pt-2 pb-14 md:pb-2 overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col w-full gap-1 sm:gap-1.5 overflow-hidden">
          {/* User Greeting & Daily Goal Skeleton */}
          <div className="shrink-0 w-full mx-auto px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-linear-to-tr from-amber-400 via-rose-500 to-indigo-600 text-white flex items-center justify-center text-xs sm:text-base font-bold shadow-xs shadow-rose-500/20 shrink-0">
                👋
              </div>
              <div className="min-w-0 space-y-1">
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                <div className="h-2.5 w-32 bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 space-y-1">
              <div className="w-16 sm:w-28 h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                <div className="h-full w-1/3 bg-linear-to-r from-amber-500 via-rose-500 to-emerald-500 rounded-full" />
              </div>
              <div className="h-2 w-12 bg-slate-100 dark:bg-slate-800/60 rounded-sm animate-pulse" />
            </div>
          </div>

          {/* Flashcard Skeleton */}
          <div className="w-full flex flex-col items-center overflow-hidden">
            {/* Category header placeholder */}
            <div className="w-full mb-1 sm:mb-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 shrink-0">
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>

            {/* Progress bar placeholder */}
            <div className="w-full shrink-0 h-1 sm:h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mb-1.5 sm:mb-2 overflow-hidden">
              <div className="h-full w-1/5 bg-linear-to-r from-amber-400 via-rose-500 to-indigo-500 rounded-full" />
            </div>

            {/* Flashcard Box responsive height */}
            <div className="w-full h-[clamp(310px,44vh,380px)] relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 overflow-hidden shrink-0">
              <div className="w-full shrink-0 flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>

              {/* Central Hanzi character placeholder */}
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center my-auto space-y-2">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center animate-pulse">
                  <span className="text-3xl sm:text-4xl text-amber-500/40 font-black">
                    中
                  </span>
                </div>
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>

              {/* Bottom hint placeholder */}
              <div className="w-full shrink-0 text-center">
                <div className="h-3 w-36 mx-auto bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>
            </div>

            {/* Rating Buttons Placeholder */}
            <div className="w-full shrink-0 mt-2 sm:mt-2.5 grid grid-cols-4 gap-1.5 sm:gap-2">
              <div className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-100/50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/30 animate-pulse" />
              <div className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/30 animate-pulse" />
              <div className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-100/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/30 animate-pulse" />
              <div className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100/50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 animate-pulse" />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav Placeholder */}
      <div className="md:hidden fixed bottom-3 inset-x-3.5 max-w-md mx-auto z-40 liquid-glass rounded-[26px] p-1.5 flex justify-around items-center">
        <div className="w-12 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 animate-pulse" />
        <div className="w-12 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="w-12 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="w-12 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
}
