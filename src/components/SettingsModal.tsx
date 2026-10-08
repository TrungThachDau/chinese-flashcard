"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Volume2,
  RotateCcw,
  AlertTriangle,
  Check,
  BrainCircuit,
  User,
  Target,
  Save,
  BookOpen,
  GitCommit,
  ExternalLink,
} from "lucide-react";
import { UserSettings } from "@/lib/types";
import { playChineseAudio } from "@/lib/tts";
import { HSK_LEVELS } from "./OnboardingModal";
import {
  APP_VERSION,
  COMMIT_HASH,
  COMMIT_DATE,
  COMMIT_URL,
} from "@/lib/version";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  onResetDatabase: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDatabase,
}) => {
  const [userName, setUserName] = useState(settings.user_name);
  const [dailyLimit, setDailyLimit] = useState(settings.daily_limit);
  const [speechRate, setSpeechRate] = useState(settings.speech_rate);
  const [audioEngine, setAudioEngine] = useState<"online" | "browser">(
    settings.audio_engine,
  );
  const [autoPlayAudio, setAutoPlayAudio] = useState(settings.auto_play_audio);
  const [selectedHskLevel, setSelectedHskLevel] = useState(
    settings.hsk_level || 1,
  );
  const [fsrsRetention, setFsrsRetention] = useState(
    settings.fsrs_retention ?? 0.9,
  );
  const [levelNotice, setLevelNotice] = useState<string | null>(null);

  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync state with incoming settings prop
  useEffect(() => {
    setUserName(settings.user_name);
    setDailyLimit(settings.daily_limit);
    setSpeechRate(settings.speech_rate);
    setAudioEngine(settings.audio_engine);
    setAutoPlayAudio(settings.auto_play_audio);
    setSelectedHskLevel(settings.hsk_level || 1);
    setFsrsRetention(settings.fsrs_retention ?? 0.9);
  }, [settings]);

  if (!isOpen) return null;

  const updateField = async (partial: Partial<UserSettings>) => {
    try {
      await onUpdateSettings(partial);
    } catch (err) {
      console.error("Auto-save setting failed:", err);
    }
  };

  const handleClose = async () => {
    const trimmed = userName.trim() || "Bạn";
    if (trimmed !== settings.user_name) {
      await updateField({ user_name: trimmed });
    }
    onClose();
  };

  const handleTestAudio = () => {
    setIsTestingAudio(true);
    playChineseAudio("你好，很高兴认识你！", {
      rate: speechRate,
      engine: audioEngine,
      onStart: () => setIsTestingAudio(true),
      onEnd: () => setIsTestingAudio(false),
      onError: () => setIsTestingAudio(false),
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings({
        user_name: userName.trim() || "Bạn",
        daily_limit: dailyLimit,
        speech_rate: speechRate,
        audio_engine: audioEngine,
        auto_play_audio: autoPlayAudio,
        hsk_level: selectedHskLevel,
        fsrs_retention: fsrsRetention,
        has_onboarded: true,
      });
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await onResetDatabase();
      setShowConfirmReset(false);
      onClose();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cài đặt hệ thống"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            ⚙️ Cài đặt & Hồ sơ
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: User Profile & Daily Goal */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Hồ sơ & Mục tiêu học tập
          </div>

          {/* HSK Level Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Cấp độ HSK:</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300/40">
                HSK 1 Khả dụng
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
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
                        updateField({ hsk_level: item.level });
                      } else {
                        setLevelNotice(
                          `📌 Hiện tại chỉ khả dụng HSK 1. Cấp độ ${item.name} (${item.stage}) đang được hoàn thiện!`,
                        );
                      }
                    }}
                    className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold shadow-sm ring-1 ring-amber-400"
                        : isAvailable
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                          : "bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800/60 hover:border-amber-400/50"
                    }`}
                  >
                    <span className="text-xs font-bold">{item.name}</span>
                    <span className="text-[8px] opacity-80 mt-0.5">
                      {isAvailable ? "Mở" : "Sắp có"}
                    </span>
                  </button>
                );
              })}
            </div>

            {levelNotice && (
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-200 animate-in fade-in duration-200">
                {levelNotice}
              </div>
            )}
          </div>

          {/* User Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              <span>Tên người học</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onBlur={() => {
                const trimmed = userName.trim() || "Bạn";
                setUserName(trimmed);
                if (trimmed !== settings.user_name) {
                  updateField({ user_name: trimmed });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="Nhập tên của bạn..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Daily Limit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-rose-500" />
                <span>Số từ học tối đa mỗi ngày:</span>
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-sans">
                {dailyLimit} từ / ngày
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[5, 10, 15, 20, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setDailyLimit(num);
                    updateField({ daily_limit: num });
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    dailyLimit === num
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {num} từ
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: TTS Audio */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Phát âm (Audio TTS)
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAudioEngine("online");
                updateField({ audio_engine: "online" });
              }}
              className={`p-2.5 rounded-2xl text-left border text-xs transition-all ${
                audioEngine === "online"
                  ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-sm"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>Giọng bản xứ (Online)</span>
                {audioEngine === "online" && (
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
              <p className="text-[10px] font-normal opacity-80">
                Chuẩn ngữ điệu Bắc Kinh, 100% không phụ thuộc máy
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setAudioEngine("browser");
                updateField({ audio_engine: "browser" });
              }}
              className={`p-2.5 rounded-2xl text-left border text-xs transition-all ${
                audioEngine === "browser"
                  ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold shadow-sm"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>Web Speech API</span>
                {audioEngine === "browser" && (
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                )}
              </div>
              <p className="text-[10px] font-normal opacity-80">
                Dùng bộ giọng cài sẵn trong hệ điều hành máy bạn
              </p>
            </button>
          </div>

          {/* Speed */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Tốc độ đọc giọng nói:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                {speechRate}x
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[0.7, 0.85, 1.0, 1.15].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    setSpeechRate(rate);
                    updateField({ speech_rate: rate });
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    speechRate === rate
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleTestAudio}
              className={`mt-2 w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isTestingAudio
                  ? "bg-amber-500 text-white animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isTestingAudio ? "Đang phát âm..." : "Thử nghe âm thanh"}
              </span>
            </button>
          </div>

          {/* Auto play switch */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tự động phát âm khi hiển thị thẻ
              </div>
              <div className="text-[10px] text-slate-400">
                Tự đọc chữ Hán ngay khi chuyển thẻ mới
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !autoPlayAudio;
                setAutoPlayAudio(nextVal);
                updateField({ auto_play_audio: nextVal });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                autoPlayAudio
                  ? "bg-amber-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoPlayAudio ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 3: Spaced Repetition (FSRS) */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
              <span>Thuật toán lặp lại ngắt quãng (FSRS)</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
              FSRS v5 • Anki
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Mục tiêu độ nhớ (Target Retention):</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 font-sans">
                {Math.round(fsrsRetention * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[0.85, 0.90, 0.92, 0.95].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setFsrsRetention(val);
                    updateField({ fsrs_retention: val });
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    fsrsRetention === val
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700"
                  }`}
                >
                  {Math.round(val * 100)}% {val === 0.9 ? "⭐" : ""}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
              FSRS mô hình hóa trí nhớ bằng 3 biến: <b>Độ khó (D)</b>, <b>Độ bền (S)</b> và <b>Khả năng nhớ lại (R)</b>. Giúp giảm 20–30% số lần ôn so với SM-2 cùng mức ghi nhớ.
            </p>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? "Đang lưu..."
                : showSavedToast
                  ? "✓ Đã lưu cài đặt!"
                  : "Lưu thay đổi"}
            </span>
          </button>
        </div>

        {/* Section 3: Reset database */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          {!showConfirmReset ? (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục dữ liệu ban đầu</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Xác nhận khôi phục dữ liệu?</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Toàn bộ lịch sử ôn tập và cài đặt sẽ được đưa về mặc định.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleConfirmReset}
                  className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
                >
                  {isResetting ? "Đang đặt lại..." : "Đồng ý đặt lại"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: App & Git Commit Version */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <span>Phiên bản v{APP_VERSION}</span>
            {COMMIT_HASH && (
              <>
                <span>•</span>
                <a
                  href={COMMIT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-mono text-[10px] transition-colors border border-slate-200/60 dark:border-slate-700/60"
                  title="Xem commit trên GitHub"
                >
                  <GitCommit className="w-3 h-3 text-amber-500" />
                  <span>{COMMIT_HASH}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </>
            )}
          </div>
          {COMMIT_DATE && (
            <span className="text-[10px] text-slate-400/80">
              Cập nhật: {COMMIT_DATE}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
