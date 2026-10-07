"use client";

import React, { useState } from "react";
import {
  Sparkles,
  User,
  Target,
  Volume2,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { UserSettings } from "@/lib/types";
import { playChineseAudio } from "@/lib/tts";

export const HSK_LEVELS = [
  {
    level: 1,
    name: "HSK 1",
    stage: "Sơ cấp 1",
    desc: "500 từ vựng cơ bản",
    status: "available",
  },
  {
    level: 2,
    name: "HSK 2",
    stage: "Sơ cấp 2",
    desc: "1.272 từ vựng",
    status: "coming_soon",
  },
  {
    level: 3,
    name: "HSK 3",
    stage: "Sơ cấp 3",
    desc: "2.245 từ vựng",
    status: "coming_soon",
  },
  {
    level: 4,
    name: "HSK 4",
    stage: "Trung cấp 1",
    desc: "3.245 từ vựng",
    status: "coming_soon",
  },
  {
    level: 5,
    name: "HSK 5",
    stage: "Trung cấp 2",
    desc: "4.316 từ vựng",
    status: "coming_soon",
  },
  {
    level: 6,
    name: "HSK 6",
    stage: "Trung cấp 3",
    desc: "5.456 từ vựng",
    status: "coming_soon",
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  initialSettings: UserSettings;
  onSave: (settings: Partial<UserSettings>) => Promise<void>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialSettings,
  onSave,
}) => {
  const [userName, setUserName] = useState(
    initialSettings.user_name === "Học viên" ? "" : initialSettings.user_name,
  );
  const [dailyLimit, setDailyLimit] = useState<number>(
    initialSettings.daily_limit || 15,
  );
  const [speechRate, setSpeechRate] = useState<number>(
    initialSettings.speech_rate || 0.85,
  );
  const [audioEngine, setAudioEngine] = useState<"online" | "browser">(
    initialSettings.audio_engine || "online",
  );
  const [selectedHskLevel, setSelectedHskLevel] = useState<number>(
    initialSettings.hsk_level || 1,
  );
  const [levelNotice, setLevelNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTestAudio = () => {
    playChineseAudio("你好，欢迎来到汉语世界！", {
      rate: speechRate,
      engine: audioEngine,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        user_name: userName.trim() || "Bạn",
        daily_limit: dailyLimit,
        speech_rate: speechRate,
        audio_engine: audioEngine,
        hsk_level: selectedHskLevel,
        has_onboarded: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chào mừng bạn đến với Hán Ngữ"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-500/40 p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Welcome Header */}
        <div className="text-center space-y-1.5 pt-1">
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
            Chào Mừng Bạn! 🎉
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Hãy thiết lập hồ sơ học tập và mục tiêu mỗi ngày của bạn trước khi
            bắt đầu hành trình chinh phục HSK 1.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Chọn cấp độ HSK */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Cấp độ HSK</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300/40">
                HSK 1 Khả dụng
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {HSK_LEVELS.map((item) => {
                const isSelected = selectedHskLevel === item.level;
                const isAvailable = item.status === "available";

                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedHskLevel(item.level);
                        setLevelNotice(null);
                      } else {
                        setLevelNotice(
                          `📌 Hiện tại chỉ khả dụng HSK 1. Cấp độ ${item.name} (${item.stage}) đang được cập nhật!`,
                        );
                      }
                    }}
                    className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-500/25 ring-2 ring-amber-400 scale-[1.02]"
                        : isAvailable
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                          : "bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800/60 hover:border-amber-400/50"
                    }`}
                  >
                    <span className="text-xs font-black">{item.name}</span>
                    <span className="text-[9px] mt-0.5 opacity-80 font-medium truncate max-w-full">
                      {item.stage}
                    </span>
                    {isAvailable ? (
                      <span
                        className={`text-[8px] mt-1 px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        Khả dụng
                      </span>
                    ) : (
                      <span className="text-[8px] mt-1 px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                        Sắp có
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {levelNotice && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-200 font-medium animate-in fade-in duration-200">
                {levelNotice}
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              💡 Hiện tại hệ thống hỗ trợ đầy đủ <strong>HSK 1</strong> (500+ từ
              vựng, bộ thủ, phát âm bản xứ & hội thoại đời sống).
            </p>
          </div>

          {/* 2. Tên người dùng */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              <span>Tên của bạn</span>
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ví dụ: Minh, Sarah, Nguyễn Văn A..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* 2. Mục tiêu số từ học tối đa trong 1 ngày */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-rose-500" />
                <span>Số từ học mỗi ngày</span>
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-sans">
                {dailyLimit} từ / ngày
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[5, 10, 15, 20, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDailyLimit(num)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    dailyLimit === num
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {num} từ
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              💡 Khuyên dùng: 10 - 15 từ/ngày giúp bạn duy trì thói quen bền bỉ
              mà không bị quá tải.
            </p>
          </div>

          {/* 3. Tốc độ đọc & Nguồn âm thanh */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-500" />
                <span>Tốc độ đọc giọng nói:</span>
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                {speechRate}x
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[0.7, 0.85, 1.0, 1.15].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    speechRate === rate
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleTestAudio}
              className="mt-1 w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Nghe thử câu chào (&ldquo;你好，欢迎来到汉语世界！&rdquo;)
              </span>
            </button>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-extrabold text-base shadow-xl shadow-rose-500/25 hover:opacity-95 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {isSubmitting ? "Đang lưu thiết lập..." : "Bắt đầu học ngay 🚀"}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
