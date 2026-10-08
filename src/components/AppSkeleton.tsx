import React from 'react';

export function AppSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50/50 via-rose-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
      {/* Navbar Skeleton */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-13 sm:h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-1.5 select-none">
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
              Hán Ngữ
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-300/40">
              HSK 1
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
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-5 pb-20 sm:pb-24">
        <div className="space-y-2 sm:space-y-4">
          {/* User Greeting & Daily Goal Skeleton */}
          <div className="max-w-md mx-auto p-2 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 text-white flex items-center justify-center text-xs sm:text-base font-bold shadow-xs shadow-rose-500/20 shrink-0">
                👋
              </div>
              <div className="min-w-0 space-y-1">
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                <div className="h-2.5 w-32 bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 space-y-1">
              <div className="w-16 sm:w-28 h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                <div className="h-full w-1/3 bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 rounded-full" />
              </div>
              <div className="h-2 w-12 bg-slate-100 dark:bg-slate-800/60 rounded-sm animate-pulse" />
            </div>
          </div>

          {/* Flashcard Skeleton */}
          <div className="w-full max-w-md mx-auto flex flex-col items-center">
            {/* Category header placeholder */}
            <div className="w-full mb-1.5 sm:mb-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>

            {/* Progress bar placeholder */}
            <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-200 dark:bg-slate-800 mb-2 sm:mb-4 overflow-hidden">
              <div className="h-full w-1/5 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 rounded-full" />
            </div>

            {/* Flashcard Box (matches exact height clamp(280px,38vh,380px) to prevent CLS) */}
            <div className="w-full relative h-[clamp(280px,38vh,380px)] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 flex flex-col justify-between items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-indigo-500/10">
              <div className="w-full flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>

              {/* Central Hanzi character placeholder */}
              <div className="flex flex-col items-center justify-center my-auto space-y-2">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center animate-pulse">
                  <span className="text-4xl text-amber-500/40 font-black">中</span>
                </div>
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>

              {/* Bottom hint placeholder */}
              <div className="w-full text-center">
                <div className="h-3 w-36 mx-auto bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>
            </div>

            {/* Rating Buttons Placeholder */}
            <div className="w-full mt-3 sm:mt-5 grid grid-cols-4 gap-1.5 sm:gap-2">
              <div className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-100/50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/30 animate-pulse" />
              <div className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/30 animate-pulse" />
              <div className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-100/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/30 animate-pulse" />
              <div className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100/50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 animate-pulse" />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav Placeholder */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 py-1.5 px-4 flex justify-around items-center">
        <div className="w-12 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 animate-pulse" />
        <div className="w-12 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="w-12 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="w-12 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
}

