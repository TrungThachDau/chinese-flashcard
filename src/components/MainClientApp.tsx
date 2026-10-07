"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  RotateCw,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquareText,
} from "lucide-react";
import {
  Card,
  LifeQuestion,
  ReviewRating,
  StudyStats,
  UserSettings,
} from "@/lib/types";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { FlashcardView } from "./FlashcardView";
import { LifeQuestionsView } from "./LifeQuestionsView";
import { VocabularyList } from "./VocabularyList";
import { ProgressStats } from "./ProgressStats";
import { SettingsModal } from "./SettingsModal";
import { OnboardingModal } from "./OnboardingModal";

interface MainClientAppProps {
  initialDueCards: Card[];
  initialAllCards: Card[];
  initialQuestions: LifeQuestion[];
  initialStats: StudyStats;
  initialSettings?: UserSettings;
}

export const MainClientApp: React.FC<MainClientAppProps> = ({
  initialDueCards,
  initialAllCards,
  initialQuestions,
  initialStats,
  initialSettings,
}) => {
  const [activeTab, setActiveTab] = useState<
    "flashcards" | "life_questions" | "vocab" | "stats"
  >("flashcards");
  const [dueCards, setDueCards] = useState<Card[]>(initialDueCards);
  const [allCards, setAllCards] = useState<Card[]>(initialAllCards);
  const [questions, setQuestions] = useState<LifeQuestion[]>(initialQuestions);
  const [stats, setStats] = useState<StudyStats>(initialStats);
  const [selectedReviewCategory, setSelectedReviewCategory] =
    useState<string>("all");

  // User Settings state
  const [settings, setSettings] = useState<UserSettings>(
    initialSettings || {
      user_name: "Học viên",
      daily_limit: 15,
      speech_rate: 0.85,
      audio_engine: "online",
      auto_play_audio: false,
      has_onboarded: false,
      hsk_level: 1,
    },
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.ok && data.settings) {
        setSettings(data.settings);
        if (newSettings.daily_limit !== undefined) {
          handleRefreshDue(newSettings.daily_limit);
        }
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  // Review card action handler
  const handleReviewCard = async (cardId: number, rating: ReviewRating) => {
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, rating }),
      });
      const data = await res.json();
      if (data.ok && data.card) {
        // Update in all cards
        setAllCards((prev) =>
          prev.map((c) => (c.id === data.card.id ? data.card : c)),
        );
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error reviewing card:", err);
    }
  };

  // Refresh due cards
  const handleRefreshDue = async (customLimit?: number) => {
    try {
      const limit = customLimit ?? settings.daily_limit;
      const url =
        selectedReviewCategory === "all"
          ? `/api/cards?dueOnly=true&limit=${limit}`
          : `/api/cards?category=${selectedReviewCategory}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.ok && data.cards) {
        setDueCards(data.cards);
      }

      // Refresh stats
      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json();
      if (statsData.ok && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error("Error refreshing due cards:", err);
    }
  };

  // Switch category filter for review session
  const handleSelectReviewCategory = async (catId: string) => {
    setSelectedReviewCategory(catId);
    try {
      const url =
        catId === "all"
          ? `/api/cards?dueOnly=true&limit=${settings.daily_limit}`
          : `/api/cards?category=${catId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok && data.cards) {
        setDueCards(data.cards);
      }
    } catch (err) {
      console.error("Error filtering category cards:", err);
    }
  };

  // Complete a life question
  const handleCompleteQuestion = async (questionId: number) => {
    try {
      await fetch("/api/life-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, completed: true } : q)),
      );
    } catch (err) {
      console.error("Error completing life question:", err);
    }
  };

  // Reset database handler
  const handleResetDatabase = async () => {
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error resetting database:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50/50 via-rose-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
      {/* Navbar */}
      <Navbar
        stats={stats}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as typeof activeTab)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 md:py-8 pb-24 md:pb-12">
        {/* TAB 1: FLASHCARDS SRS */}
        {activeTab === "flashcards" && (
          <div className="space-y-4">
            {/* User Greeting & Daily Goal Progress */}
            <div className="max-w-md mx-auto p-3.5 sm:p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 text-white flex items-center justify-center text-base font-bold shadow-md shadow-rose-500/20 shrink-0">
                  👋
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                    <span>Chào {settings.user_name}!</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-300/40">
                      HSK {settings.hsk_level || 1}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mục tiêu:{" "}
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {stats.today_reviewed_count || 0}
                    </span>{" "}
                    / {settings.daily_limit} từ hôm nay
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <div className="w-24 sm:w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60 mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((stats.today_reviewed_count || 0) / Math.max(1, settings.daily_limit)) * 100))}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {Math.min(
                    100,
                    Math.round(
                      ((stats.today_reviewed_count || 0) /
                        Math.max(1, settings.daily_limit)) *
                        100,
                    ),
                  )}
                  % mục tiêu
                </span>
              </div>
            </div>

            {/* Flashcard Component */}
            <FlashcardView
              cards={
                dueCards.length > 0
                  ? dueCards
                  : allCards.slice(0, settings.daily_limit)
              }
              categories={stats.categories}
              selectedCategory={selectedReviewCategory}
              onSelectCategory={handleSelectReviewCategory}
              onReviewCard={handleReviewCard}
              onRefreshDue={() => handleRefreshDue()}
              speechRate={settings.speech_rate}
              autoPlayAudio={settings.auto_play_audio}
              audioEngine={settings.audio_engine}
            />
          </div>
        )}

        {/* TAB 2: LIFE QUESTIONS PRACTICE */}
        {activeTab === "life_questions" && (
          <div className="space-y-4">
            <div className="text-center max-w-md mx-auto mb-4">
              <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-600 bg-clip-text text-transparent">
                Hội Thoại Đời Sống HSK 1
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Luyện phản xạ giao tiếp các tình huống hàng ngày: hỏi đường, giờ
                giấc, gọi món, làm quen,...
              </p>
            </div>

            <LifeQuestionsView
              questions={questions}
              onCompleteQuestion={handleCompleteQuestion}
              speechRate={settings.speech_rate}
            />
          </div>
        )}

        {/* TAB 3: VOCABULARY LIST */}
        {activeTab === "vocab" && (
          <div className="space-y-4">
            <div className="text-center max-w-md mx-auto mb-4">
              <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Kho Từ Vựng HSK 1 ({allCards.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tra cứu đầy đủ 500+ từ vựng HSK 1, bộ thủ, số nét, âm Hán Việt
                và ví dụ câu.
              </p>
            </div>

            <VocabularyList
              cards={allCards}
              categories={stats.categories}
              speechRate={settings.speech_rate}
            />
          </div>
        )}

        {/* TAB 4: STATS & PROGRESS DASHBOARD */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="text-center max-w-md mx-auto mb-4">
              <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 bg-clip-text text-transparent">
                Thống Kê Tiến Độ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi hiệu quả ghi nhớ, chuỗi ngày học và độ thành thạo theo
                từng chủ đề.
              </p>
            </div>

            <ProgressStats
              stats={stats}
              onStartReview={() => {
                setActiveTab("flashcards");
                setSelectedReviewCategory("all");
                handleRefreshDue();
              }}
            />
          </div>
        )}
      </main>

      {/* Bottom Nav for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as typeof activeTab)}
        stats={stats}
      />

      {/* Onboarding Welcome Modal (First Time Opening) */}
      <OnboardingModal
        isOpen={!settings.has_onboarded}
        initialSettings={settings}
        onSave={handleUpdateSettings}
      />

      {/* Settings Modal (Configurable anytime) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetDatabase={handleResetDatabase}
      />
    </div>
  );
};
