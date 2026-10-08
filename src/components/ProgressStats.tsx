'use client';

import React from 'react';
import {
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';
import { StudyStats } from '@/lib/types';

interface ProgressStatsProps {
  stats: StudyStats;
  onStartReview: () => void;
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({ stats, onStartReview }) => {
  const masteredPercent = stats.total_cards > 0
    ? Math.round((stats.mastered_cards / stats.total_cards) * 100)
    : 0;

  const learningPercent = stats.total_cards > 0
    ? Math.round((stats.learning_cards / stats.total_cards) * 100)
    : 0;

  const newPercent = stats.total_cards > 0
    ? Math.round((stats.new_cards / stats.total_cards) * 100)
    : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Top 4 Vibrant KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Đã nhớ (Mastered) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 backdrop-blur-xl shadow-lg shadow-emerald-500/10 text-center relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl" />
          <div className="w-9 h-9 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 mb-2">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats.mastered_cards}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Đã nhớ ({masteredPercent}%)
          </div>
        </div>

        {/* 2. Đang học (Learning) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 backdrop-blur-xl shadow-lg shadow-amber-500/10 text-center relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-12 h-12 bg-amber-500/10 rounded-full blur-xl" />
          <div className="w-9 h-9 mx-auto rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 mb-2">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats.learning_cards}
          </div>
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Đang học ({learningPercent}%)
          </div>
        </div>

        {/* 3. Cần ôn hôm nay (Due) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-500/15 via-pink-500/10 to-rose-500/5 border border-rose-500/30 backdrop-blur-xl shadow-lg shadow-rose-500/10 text-center relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-12 h-12 bg-rose-500/10 rounded-full blur-xl" />
          <div className="w-9 h-9 mx-auto rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30 mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats.due_today}
          </div>
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Cần ôn hôm nay
          </div>
        </div>

        {/* 4. Thẻ mới (New) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-indigo-500/5 border border-indigo-500/30 backdrop-blur-xl shadow-lg shadow-indigo-500/10 text-center relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl" />
          <div className="w-9 h-9 mx-auto rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {stats.new_cards}
          </div>
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Thẻ mới ({newPercent}%)
          </div>
        </div>
      </div>

      {/* SRS Mastery Bar & Call-to-action */}
      <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Chuỗi ngày học: {stats.streak_days} ngày
              </div>
              <div className="text-xs text-slate-400">
                Tỷ lệ nhớ đúng: {stats.retention_rate}% • Tổng {stats.total_reviews} lượt ôn • FSRS
              </div>
            </div>
          </div>

          {stats.due_today > 0 && (
            <button
              type="button"
              onClick={onStartReview}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 hover:opacity-95 transition-transform active:scale-95"
            >
              Ôn {stats.due_today} thẻ ngay
            </button>
          )}
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${masteredPercent}%` }}
              title={`Đã nhớ: ${stats.mastered_cards}`}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${learningPercent}%` }}
              title={`Đang học: ${stats.learning_cards}`}
            />
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${newPercent}%` }}
              title={`Mới: ${stats.new_cards}`}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Đã nhớ ({stats.mastered_cards})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Đang học ({stats.learning_cards})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Mới ({stats.new_cards})
            </span>
          </div>
        </div>
      </div>

      {/* Topic Breakdown Section */}
      <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Tiến độ theo chủ đề HSK 1
          </h3>
          <span className="text-xs text-slate-400">{stats.categories.length} chủ đề</span>
        </div>

        <div className="space-y-3">
          {stats.categories.map((cat) => {
            const catMastered = cat.mastered_count || 0;
            const catLearning = cat.learning_count || 0;
            const catPercent = cat.total > 0 ? Math.round(((catMastered + catLearning) / cat.total) * 100) : 0;

            return (
              <div
                key={cat.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <span className="text-base">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {catMastered + catLearning} / {cat.total} từ ({catPercent}%)
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${cat.color} transition-all duration-300 rounded-full`}
                    style={{ width: `${catPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

