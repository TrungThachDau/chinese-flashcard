'use client';

import React, { useEffect } from 'react';
import {
  Trophy,
  Sparkles,
  RotateCw,
  CheckCircle2,
  X,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface GoalCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewedCount: number;
  dailyLimit: number;
  onLearnMore: (count?: number) => void;
  onReviewLearned: (count?: number) => void;
}

export const GoalCompletionModal: React.FC<GoalCompletionModalProps> = ({
  isOpen,
  onClose,
  reviewedCount,
  dailyLimit,
  onLearnMore,
  onReviewLearned,
}) => {
  // Trigger celebration confetti when opened
  useEffect(() => {
    if (isOpen) {
      import('canvas-confetti')
        .then((m) => {
          m.default({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'],
          });
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chúc mừng hoàn thành mục tiêu"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Animation */}
        <div className="flex flex-col items-center pt-2">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/25 mb-3 animate-bounce">
            <Trophy className="w-9 h-9" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mục tiêu hoàn thành!</span>
          </span>

          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Xuất sắc! Bạn đã đạt mục tiêu!
          </h3>

          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
            Hôm nay bạn đã hoàn thành{' '}
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {reviewedCount}
            </span>{' '}
            /{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {dailyLimit}
            </span>{' '}
            từ vựng mục tiêu. Bạn muốn tiếp tục như thế nào?
          </p>
        </div>

        {/* 2 Main Action Choices */}
        <div className="space-y-2.5 pt-1">
          {/* Option 1: Learn More (New Cards) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onLearnMore(5);
            }}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 text-white font-bold text-left shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all flex items-center justify-between group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span>Học thêm từ mới</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                    +5 từ
                  </span>
                </div>
                <div className="text-[11px] text-white/80 font-normal">
                  Khám phá thêm từ vựng mới trong bộ HSK 1
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Option 2: Review Old Words */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onReviewLearned(10);
            }}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all flex items-center justify-between group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center shrink-0">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Ôn tập lại các từ cũ</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Củng cố lại các từ vừa học để nhớ sâu hơn
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>

        {/* Option 3: Rest today */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Nghỉ ngơi hôm nay (Đã hoàn thành xuất sắc)
          </button>
        </div>
      </div>
    </div>
  );
};

