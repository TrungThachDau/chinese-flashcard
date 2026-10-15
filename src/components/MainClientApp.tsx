"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import dynamic from "next/dynamic";
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
import { usePathname, useRouter } from "next/navigation";
import { calculateFSRS } from "@/lib/srs";
import {
  makeCardKey,
  LocalReviewQueueItem,
  getLocalDb,
  clearLocalDbForUserSwitch,
  clearAllLocalData,
} from "@/lib/localDb";
import {
  enqueueReview,
  initSyncListeners,
  cacheCardsInLocalDb,
  flushSyncQueue,
} from "@/lib/syncManager";

const LifeQuestionsView = dynamic(
  () => import("./LifeQuestionsView").then((mod) => mod.LifeQuestionsView),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400 font-medium">
        Đang tải câu hỏi đời sống...
      </div>
    ),
  },
);

const VocabularyList = dynamic(
  () => import("./VocabularyList").then((mod) => mod.VocabularyList),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400 font-medium">
        Đang tải kho từ vựng...
      </div>
    ),
  },
);

const ProgressStats = dynamic(
  () => import("./ProgressStats").then((mod) => mod.ProgressStats),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400 font-medium">
        Đang tải thống kê tiến độ...
      </div>
    ),
  },
);

const SettingsModal = dynamic(
  () => import("./SettingsModal").then((mod) => mod.SettingsModal),
  { ssr: false },
);

const OnboardingModal = dynamic(
  () => import("./OnboardingModal").then((mod) => mod.OnboardingModal),
  { ssr: false },
);

const GoalCompletionModal = dynamic(
  () => import("./GoalCompletionModal").then((mod) => mod.GoalCompletionModal),
  { ssr: false },
);

export type AppTab = "flashcards" | "life_questions" | "vocab" | "stats";

export function getTabFromPath(path: string): AppTab {
  if (path.startsWith("/life-questions")) return "life_questions";
  if (path.startsWith("/vocab")) return "vocab";
  if (path.startsWith("/stats")) return "stats";
  return "flashcards";
}

export function getPathFromTab(tab: AppTab): string {
  switch (tab) {
    case "life_questions":
      return "/life-questions";
    case "vocab":
      return "/vocab";
    case "stats":
      return "/stats";
    case "flashcards":
    default:
      return "/";
  }
}

interface MainClientAppProps {
  initialDueCards: Card[];
  initialAllCards: Card[];
  initialTotalCards?: number;
  initialQuestions: LifeQuestion[];
  initialStats: StudyStats;
  initialSettings?: UserSettings;
  initialTab?: AppTab;
}

export const MainClientApp: React.FC<MainClientAppProps> = ({
  initialDueCards,
  initialAllCards,
  initialTotalCards,
  initialQuestions,
  initialStats,
  initialSettings,
  initialTab,
}) => {
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (initialTab) return initialTab;
    if (pathname) return getTabFromPath(pathname);
    return "flashcards";
  });

  const handleTabChange = (newTab: AppTab) => {
    setActiveTab(newTab);
    const targetPath = getPathFromTab(newTab);
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== targetPath
    ) {
      window.history.pushState({ tab: newTab }, "", targetPath);
    }
  };

  // Synchronize activeTab when browser Back/Forward is clicked
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname);
      setActiveTab(tab);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [dueCards, setDueCards] = useState<Card[]>(initialDueCards);
  const [allCards, setAllCards] = useState<Card[]>(initialAllCards);
  const [totalCards, setTotalCards] = useState<number>(
    initialTotalCards ||
      (initialAllCards.length > 0 ? initialAllCards.length : 500),
  );
  const [questions, setQuestions] = useState<LifeQuestion[]>(initialQuestions);
  const [stats, setStats] = useState<StudyStats>(initialStats);
  const [selectedReviewCategory, setSelectedReviewCategory] =
    useState<string>("all");
  const [isLoadingAllCards, setIsLoadingAllCards] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Synchronize totalCards when server prop changes
  useEffect(() => {
    if (initialTotalCards) {
      setTotalCards(initialTotalCards);
    }
  }, [initialTotalCards]);

  // Lazy-load all vocabulary cards when user visits or switches to the vocab tab
  useEffect(() => {
    if (
      (activeTab === "vocab" || pathname?.startsWith("/vocab")) &&
      allCards.length === 0 &&
      !isLoadingAllCards
    ) {
      setIsLoadingAllCards(true);
      fetch("/api/cards?limit=30&offset=0")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.cards) {
            setAllCards(data.cards);
            if (typeof data.total === "number") {
              setTotalCards(data.total);
            }
          }
        })
        .catch((err) => console.error("Error loading initial cards:", err))
        .finally(() => setIsLoadingAllCards(false));
    }
  }, [activeTab, pathname, allCards.length, isLoadingAllCards]);

  // Lazy-load life questions when user visits or switches to the questions tab
  useEffect(() => {
    if (
      (activeTab === "life_questions" ||
        pathname?.startsWith("/life-questions")) &&
      questions.length === 0 &&
      !isLoadingQuestions
    ) {
      setIsLoadingQuestions(true);
      fetch("/api/life-questions")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.questions) {
            setQuestions(data.questions);
          }
        })
        .catch((err) => console.error("Error loading life questions:", err))
        .finally(() => setIsLoadingQuestions(false));
    }
  }, [activeTab, pathname, questions.length, isLoadingQuestions]);

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

  // Check if user already has config (onboarded flag, or has configured custom settings)
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    if (initialSettings?.has_onboarded) return true;
    if (initialSettings?.user_name && initialSettings.user_name !== "Học viên")
      return true;
    return false;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [authUser, setAuthUser] = useState<{
    id: string;
    username: string;
    email?: string | null;
  } | null>(null);
  const router = useRouter();

  // Check active authenticated Supabase user on mount
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then(async (data) => {
        if (data?.ok && data.user) {
          await clearLocalDbForUserSwitch(data.user.id);
          setAuthUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await flushSyncQueue({ keepalive: true });
      await fetch("/api/auth/logout", { method: "POST" });
      await clearAllLocalData();
      setAuthUser(null);
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Error signing out:", err);
      window.location.href = "/login";
    }
  };

  // Sync state if initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      setSettings((prev) => ({ ...prev, ...initialSettings }));
      if (initialSettings.has_onboarded) setHasOnboarded(true);
    }
  }, [initialSettings]);

  // Sync dueCards when server props change (ensures reload always shows fresh cards)
  useEffect(() => {
    if (initialDueCards) {
      setDueCards(initialDueCards);
    }
  }, [initialDueCards]);

  // Sync stats when server props change
  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // Initialize Dexie background sync listeners (startup flush, exit sync on pagehide/visibilitychange)
  useEffect(() => {
    const cleanupSync = initSyncListeners((freshStats) => {
      if (freshStats) setStats(freshStats);
    });

    if (initialDueCards && initialDueCards.length > 0) {
      cacheCardsInLocalDb(initialDueCards);
    }

    return () => {
      cleanupSync();
    };
  }, [initialDueCards]);

  // Sync settings: Server (Supabase/SSR) settings are authoritative
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      if (
        initialSettings.has_onboarded ||
        (initialSettings.user_name && initialSettings.user_name !== "Học viên")
      ) {
        setHasOnboarded(true);
      }
      try {
        localStorage.setItem(
          "chinese_flashcard_settings",
          JSON.stringify(initialSettings),
        );
        if (initialSettings.has_onboarded) {
          localStorage.setItem("hsk_has_onboarded", "true");
        }
        const db = getLocalDb();
        if (db) {
          db.settings.put({
            key: "user_settings",
            value: initialSettings as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          });
        }
      } catch {}
    } else {
      // Fallback only if no server settings provided
      try {
        const localSettingsStr = localStorage.getItem(
          "chinese_flashcard_settings",
        );
        if (localSettingsStr) {
          const parsed = JSON.parse(localSettingsStr);
          if (parsed && typeof parsed === "object") {
            setSettings((prev) => ({ ...prev, ...parsed }));
            if (
              parsed.has_onboarded ||
              (parsed.user_name && parsed.user_name !== "Học viên")
            ) {
              setHasOnboarded(true);
            }
          }
        }
      } catch {}

      fetch("/api/settings", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.settings) {
            setSettings(data.settings);
            try {
              localStorage.setItem(
                "chinese_flashcard_settings",
                JSON.stringify(data.settings),
              );
              if (data.settings.has_onboarded) {
                localStorage.setItem("hsk_has_onboarded", "true");
                setHasOnboarded(true);
              }
            } catch {}
          }
        })
        .catch((err) => {
          console.warn("Could not fetch fresh settings on mount:", err);
        });
    }
  }, [initialSettings]);

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const payload: Partial<UserSettings> = {
      ...newSettings,
      has_onboarded: true,
    };

    setHasOnboarded(true);

    // 1. Optimistic UI update immediately (0ms)
    const merged = { ...settings, ...newSettings, has_onboarded: true };
    setSettings(merged);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hsk_has_onboarded", "true");
        localStorage.setItem(
          "chinese_flashcard_settings",
          JSON.stringify(merged),
        );
        const db = getLocalDb();
        if (db) {
          db.settings.put({
            key: "user_settings",
            value: merged as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          });
        }
      } catch {}
    }

    if (newSettings.daily_limit !== undefined) {
      handleRefreshDue(newSettings.daily_limit);
    }

    // 2. Sync to Supabase IMMEDIATELY (with keepalive: true so browser delivers even if user navigates)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      const data = await res.json();
      if (data.ok && data.settings) {
        setSettings(data.settings);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              "chinese_flashcard_settings",
              JSON.stringify(data.settings),
            );
          } catch {}
        }
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  // Handle Learn More (load next new cards)
  const handleLearnMore = async (count: number = 5) => {
    try {
      const res = await fetch(`/api/cards?mode=learn_more&limit=${count}`);
      const data = await res.json();
      if (data.ok && data.cards && data.cards.length > 0) {
        setDueCards(data.cards);
      } else {
        handleRefreshDue(count);
      }
    } catch (err) {
      console.error("Error loading more cards:", err);
    }
  };

  // Handle Review Learned (load previously learned cards)
  const handleReviewLearned = async (count: number = 10) => {
    try {
      const res = await fetch(`/api/cards?mode=review_learned&limit=${count}`);
      const data = await res.json();
      if (data.ok && data.cards && data.cards.length > 0) {
        setDueCards(data.cards);
      } else {
        setDueCards(allCards.slice(0, count));
      }
    } catch (err) {
      console.error("Error loading learned cards:", err);
    }
  };

  // Review card action handler (Local-First: 0ms response + Dexie queue + Background Sync)
  const handleReviewCard = async (cardId: number, rating: ReviewRating) => {
    try {
      const currentCard =
        allCards.find((c) => c.id === cardId) ||
        dueCards.find((c) => c.id === cardId);

      if (!currentCard) return;

      const now = new Date();
      const targetRetention = settings.fsrs_retention ?? 0.9;
      const srsResult = calculateFSRS(
        currentCard,
        rating,
        now,
        targetRetention,
      );

      const updatedCard: Card = {
        ...currentCard,
        repetition: srsResult.repetition,
        interval: srsResult.interval,
        ease_factor: srsResult.ease_factor,
        due_date: srsResult.due_date,
        last_reviewed: now.toISOString(),
        status: srsResult.status,
        stability: srsResult.stability,
        difficulty: srsResult.difficulty,
        retrievability: srsResult.retrievability,
        lapses: srsResult.lapses,
        state: srsResult.state,
      };

      // 1. Optimistic UI update (0ms, instant feedback)
      setAllCards((prev) =>
        prev.map((c) => (c.id === cardId ? updatedCard : c)),
      );
      setDueCards((prev) =>
        prev.map((c) => (c.id === cardId ? updatedCard : c)),
      );

      // Optimistic stats update
      const prevCount = stats.today_reviewed_count || 0;
      const nextCount = prevCount + 1;
      setStats((prev) => ({
        ...prev,
        today_reviewed_count: nextCount,
        learning_cards:
          srsResult.status === "learning" || srsResult.status === "reviewing"
            ? currentCard.status === "new"
              ? prev.learning_cards + 1
              : prev.learning_cards
            : prev.learning_cards,
        mastered_cards:
          srsResult.status === "mastered" && currentCard.status !== "mastered"
            ? prev.mastered_cards + 1
            : prev.mastered_cards,
      }));

      if (
        nextCount >= settings.daily_limit &&
        prevCount < settings.daily_limit
      ) {
        setShowGoalModal(true);
      }

      // 2. Queue in Dexie and schedule background sync (with exit sync support)
      const queueItem: LocalReviewQueueItem = {
        card_id: cardId,
        card_key: makeCardKey(currentCard),
        rating,
        reviewed_at: now.toISOString(),
        repetition: srsResult.repetition,
        interval: srsResult.interval,
        ease_factor: srsResult.ease_factor,
        due_date: srsResult.due_date,
        status: srsResult.status,
        stability: srsResult.stability,
        difficulty: srsResult.difficulty,
        lapses: srsResult.lapses,
        state: srsResult.state,
      };

      await enqueueReview(queueItem, (freshStats) => {
        if (freshStats) setStats(freshStats);
      });
    } catch (err) {
      console.error("Error reviewing card:", err);
    }
  };

  // Fetch fresh progress stats (always bypass caches, use the learner's timezone)
  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/stats?tz=${new Date().getTimezoneOffset()}`,
        {
          cache: "no-store",
        },
      );
      const data = await res.json();
      if (data.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error refreshing stats:", err);
    }
  }, []);

  // Re-sync "today" / streak with client timezone when user views stats tab
  const isFirstMountStatsRef = useRef(true);
  useEffect(() => {
    if (isFirstMountStatsRef.current) {
      isFirstMountStatsRef.current = false;
      if (activeTab === "stats") {
        refreshStats();
      }
      return;
    }
    if (activeTab === "stats") {
      refreshStats();
    }
  }, [activeTab, refreshStats]);

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
      await refreshStats();
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
        await clearAllLocalData();
        window.location.reload();
      }
    } catch (err) {
      console.error("Error resetting database:", err);
    }
  };

  return (
    <div
      className={`flex flex-col bg-linear-to-br from-amber-50/50 via-rose-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 ${
        activeTab === "flashcards"
          ? "h-screen h-dvh overflow-hidden max-h-screen max-h-dvh"
          : "min-h-screen"
      }`}
    >
      {/* Navbar */}
      <Navbar
        stats={stats}
        settings={settings}
        authUser={authUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* Main Container */}
      <main
        className={`w-full mx-auto px-3 sm:px-4 ${
          activeTab === "flashcards"
            ? "overflow-hidden max-w-md md:max-w-xl flex-1 min-h-0 flex flex-col pt-1 sm:pt-2 pb-18 md:pb-2"
            : "max-w-5xl flex-1 py-4 sm:py-8 pb-24 overflow-y-auto"
        }`}
      >
        {/* TAB 1: FLASHCARDS SRS */}
        {activeTab === "flashcards" && (
          <div className="flex-1 min-h-0 flex flex-col w-full gap-1 sm:gap-1.5 overflow-hidden">
            {/* User Greeting & Daily Goal Progress (Compact on mobile) */}
            <div
              className={`shrink-0 w-full mx-auto px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2.5 transition-all ${
                (stats.today_reviewed_count || 0) >= settings.daily_limit
                  ? "ring-1 ring-emerald-500/40 cursor-pointer hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
                  : ""
              }`}
              onClick={() => {
                if ((stats.today_reviewed_count || 0) >= settings.daily_limit) {
                  setShowGoalModal(true);
                }
              }}
              title={
                (stats.today_reviewed_count || 0) >= settings.daily_limit
                  ? "Bấm để xem tùy chọn học thêm hoặc ôn lại từ cũ"
                  : undefined
              }
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-linear-to-tr from-amber-400 via-rose-500 to-indigo-600 text-white flex items-center justify-center text-xs sm:text-base font-bold shadow-xs shadow-rose-500/20 shrink-0">
                  👋
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                    <span>Chào {settings.user_name}!</span>
                    <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-300/40">
                      HSK {settings.hsk_level || 1}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-1 flex-wrap">
                    <span>Mục tiêu:</span>{" "}
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {stats.today_reviewed_count || 0}
                    </span>{" "}
                    <span>/ {settings.daily_limit} từ</span>
                    {(stats.today_reviewed_count || 0) >=
                      settings.daily_limit && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300/40 inline-flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Đã đạt</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <div className="w-16 sm:w-28 h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60 mb-0.5 sm:mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((stats.today_reviewed_count || 0) / Math.max(1, settings.daily_limit)) * 100))}%`,
                    }}
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {(stats.today_reviewed_count || 0) >= settings.daily_limit ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Hoàn thành!
                    </span>
                  ) : (
                    `${Math.min(
                      100,
                      Math.round(
                        ((stats.today_reviewed_count || 0) /
                          Math.max(1, settings.daily_limit)) *
                          100,
                      ),
                    )}% mục tiêu`
                  )}
                </span>
              </div>
            </div>

            {/* Flashcard Component */}
            <FlashcardView
              cards={dueCards}
              categories={stats.categories}
              selectedCategory={selectedReviewCategory}
              onSelectCategory={handleSelectReviewCategory}
              onReviewCard={handleReviewCard}
              onRefreshDue={() => handleRefreshDue()}
              speechRate={settings.speech_rate}
              autoPlayAudio={settings.auto_play_audio}
              audioEngine={settings.audio_engine}
              isGoalReached={
                (stats.today_reviewed_count || 0) >= settings.daily_limit
              }
              todayReviewedCount={stats.today_reviewed_count || 0}
              dailyLimit={settings.daily_limit}
              targetRetention={settings.fsrs_retention ?? 0.9}
              onLearnMore={handleLearnMore}
              onReviewLearned={handleReviewLearned}
              onDeckCompleted={() => {
                if ((stats.today_reviewed_count || 0) >= settings.daily_limit) {
                  setShowGoalModal(true);
                }
              }}
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
                Kho Từ Vựng HSK 1 ({totalCards})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tra cứu đầy đủ 500+ từ vựng HSK 1, bộ thủ, số nét, âm Hán Việt
                và ví dụ câu.
              </p>
            </div>

            <VocabularyList
              cards={allCards}
              initialCards={allCards}
              initialTotal={totalCards}
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
                handleTabChange("flashcards");
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
        setActiveTab={handleTabChange}
        stats={stats}
      />

      {/* Onboarding Welcome Modal (Only shown once when no config yet) */}
      {!hasOnboarded && !settings.has_onboarded && (
        <OnboardingModal
          isOpen={true}
          initialSettings={settings}
          onSave={handleUpdateSettings}
          onClose={() => {
            setHasOnboarded(true);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("hsk_has_onboarded", "true");
              } catch {}
            }
          }}
        />
      )}

      {/* Settings Modal (Configurable anytime) */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={true}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          authUser={authUser}
          onLogout={handleLogout}
          onUpdateSettings={handleUpdateSettings}
          onResetDatabase={handleResetDatabase}
        />
      )}

      {/* Goal Completion Celebration Modal */}
      {showGoalModal && (
        <GoalCompletionModal
          isOpen={true}
          onClose={() => setShowGoalModal(false)}
          reviewedCount={stats.today_reviewed_count || 0}
          dailyLimit={settings.daily_limit}
          onLearnMore={handleLearnMore}
          onReviewLearned={handleReviewLearned}
        />
      )}
    </div>
  );
};
