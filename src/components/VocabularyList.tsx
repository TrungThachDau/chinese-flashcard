"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Volume2,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  X,
  BookOpen,
  BrainCircuit,
  Loader2,
} from "lucide-react";
import { Card } from "@/models";
import { playChineseAudio } from "@/services/tts.service";
import { fetchCardsApi } from "@/services/client-api";
import { HanziText } from "./HanziHover";

interface VocabularyListProps {
  cards?: Card[];
  initialCards?: Card[];
  totalCards?: number;
  initialTotal?: number;
  categories: Array<{ id: string; name: string; icon: string }>;
  speechRate?: number;
}

const PAGE_SIZE = 30;

export const VocabularyList: React.FC<VocabularyListProps> = ({
  cards: propCards,
  initialCards,
  totalCards,
  initialTotal,
  categories,
  speechRate = 0.85,
}) => {
  const seedCards = initialCards || propCards || [];
  const seedTotal =
    initialTotal ||
    totalCards ||
    (seedCards.length > 0 ? seedCards.length : 500);

  const [cards, setCards] = useState<Card[]>(seedCards);
  const [total, setTotal] = useState<number>(seedTotal);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedHsk, setSelectedHsk] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCardForDetail, setSelectedCardForDetail] =
    useState<Card | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const [isLoadingFilter, setIsLoadingFilter] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(seedCards.length < seedTotal);

  const isFirstMountRef = useRef(true);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Synchronize when parent passes new initial cards (e.g. from SSR)
  useEffect(() => {
    if (
      seedCards.length > 0 &&
      cards.length === 0 &&
      !debouncedSearch &&
      selectedCategory === "all" &&
      selectedStatus === "all" &&
      selectedHsk === "all"
    ) {
      setCards(seedCards);
      setTotal(seedTotal);
      setHasMore(seedCards.length < seedTotal);
    }
  }, [
    seedCards,
    seedTotal,
    cards.length,
    debouncedSearch,
    selectedCategory,
    selectedStatus,
    selectedHsk,
  ]);

  // Fetch first batch when filters change
  useEffect(() => {
    // Skip extra fetch on first mount if we already have initial cards and default filters
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (
        cards.length > 0 &&
        !debouncedSearch &&
        selectedCategory === "all" &&
        selectedStatus === "all" &&
        selectedHsk === "all"
      ) {
        return;
      }
    }

    let isMounted = true;
    setIsLoadingFilter(true);

    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      offset: "0",
    });
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (selectedHsk !== "all") params.set("hsk", selectedHsk);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

    fetchCardsApi(params)
      .then((data) => {
        if (!isMounted) return;
        if (data.ok && Array.isArray(data.cards)) {
          setCards(data.cards);
          if (typeof data.total === "number") setTotal(data.total);
          setHasMore(Boolean(data.hasMore));
        }
      })
      .catch((err) => console.error("Error fetching filtered cards:", err))
      .finally(() => {
        if (isMounted) setIsLoadingFilter(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedCategory, selectedStatus, selectedHsk]);

  // Load next batch (Cuộn tới đâu tải tới đó)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoadingFilter) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: cards.length.toString(),
      });
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedHsk !== "all") params.set("hsk", selectedHsk);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const data = await fetchCardsApi(params);

      if (data.ok && Array.isArray(data.cards)) {
        setCards((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const freshCards = data.cards.filter(
            (c: Card) => !existingIds.has(c.id),
          );
          return [...prev, ...freshCards];
        });
        setHasMore(Boolean(data.hasMore));
        if (typeof data.total === "number") {
          setTotal(data.total);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more cards:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    cards.length,
    debouncedSearch,
    hasMore,
    isLoadingFilter,
    isLoadingMore,
    selectedCategory,
    selectedStatus,
    selectedHsk,
  ]);

  // IntersectionObserver: auto-trigger loadMore when scrolling near the bottom sentinel
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoadingFilter
        ) {
          loadMore();
        }
      },
      {
        rootMargin: "350px", // Preload 350px ahead of reaching bottom
        threshold: 0,
      },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, isLoadingFilter, loadMore]);

  // Secondary Window scroll listener to handle all browser webviews
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoadingMore || isLoadingFilter) return;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight =
        window.innerHeight || document.documentElement.clientHeight;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingMore, isLoadingFilter, loadMore]);

  const getStatusBadge = (card: Card) => {
    const isDue = new Date(card.due_date) <= new Date();
    if (card.status === "mastered") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
          Đã nhớ
        </span>
      );
    }
    if (isDue || card.status === "reviewing") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
          Cần ôn
        </span>
      );
    }
    if (card.status === "learning") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
          Đang học
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
        Mới
      </span>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-lg space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo chữ Hán, pinyin, nghĩa, âm Hán Việt..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-slate-100"
          />
          {isLoadingFilter && (
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Filter selectors + View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* HSK Level Dropdown */}
            <select
              value={selectedHsk}
              onChange={(e) => setSelectedHsk(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">🏷️ Tất cả HSK</option>
              <option value="1">HSK 1</option>
              <option value="2" disabled>HSK 2 (Sắp có)</option>
              <option value="3" disabled>HSK 3 (Sắp có)</option>
            </select>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">📂 Tất cả chủ đề</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">🎯 Tất cả tiến độ</option>
              <option value="new">✨ Thẻ mới</option>
              <option value="learning">📖 Đang học</option>
              <option value="reviewing">⏰ Cần ôn</option>
              <option value="mastered">🏆 Đã nhớ thành thạo</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid blocks vs List rows */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Xem dạng khối ô vuông"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Khối ô</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Xem dạng danh sách"
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500 px-2 font-medium">
        <div className="flex items-center gap-2">
          <span>
            Đang hiển thị <b>{cards.length}</b> / <b>{total}</b> từ vựng
          </span>
        </div>
        <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
          💡 Chạm vào ô để xem chi tiết & câu ví dụ
        </span>
      </div>

      {/* CARDS DISPLAY */}
      {isLoadingFilter && cards.length === 0 ? (
        /* Loading filter skeleton */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-10 w-16 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
          Không tìm thấy từ vựng nào khớp với bộ lọc.
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Khối ô vuông đặt cạnh nhau) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {cards.map((card) => {
            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardForDetail(card)}
                className="group relative flex flex-col justify-between p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-amber-400/50 dark:hover:border-amber-500/40 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 select-none"
              >
                {/* Top: HSK Tag + Category + Audio button */}
                <div className="flex items-center justify-between gap-1 w-full shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                      {card.tags?.[0] || (card.hsk ? `HSK ${card.hsk}` : "HSK 1")}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-20">
                      {card.category_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playChineseAudio(card.hanzi, { rate: speechRate });
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors shrink-0"
                    title="Phát âm từ"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Center: Large Hanzi & Pinyin */}
                <div className="flex flex-col items-center justify-center text-center my-1.5 sm:my-2.5">
                  <div
                    className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white group-hover:scale-105 transition-transform tracking-wide"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HanziText text={card.hanzi} />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 font-sans mt-0.5">
                    {card.pinyin}
                  </div>
                </div>

                {/* Meaning & Sino-Vietnamese */}
                <div className="text-center w-full mt-auto pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {card.meaning}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    HV: {card.sino_vietnamese}
                  </div>
                </div>

                {/* Footer: Status badge & Memory indicator */}
                <div className="mt-2 flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100/60 dark:border-slate-800/50">
                  {getStatusBadge(card)}
                  {card.stability ? (
                    <span
                      className="text-[9px] text-indigo-500 font-semibold font-sans"
                      title={`Đã nhớ được: ${card.stability} ngày, Độ khó: ${card.difficulty}/10`}
                    >
                      Nhớ {card.stability}d
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW (Danh sách truyền thống) */
        <div className="space-y-2.5">
          {cards.map((card) => {
            const isExpanded = expandedCardId === card.id;

            return (
              <div
                key={card.id}
                className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Hanzi + Audio */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        playChineseAudio(card.hanzi, { rate: speechRate })
                      }
                      className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      title="Phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                        <HanziText text={card.hanzi} />
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-sans">
                          {card.pinyin}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          {card.tags?.[0] || (card.hsk ? `HSK ${card.hsk}` : "HSK 1")}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {card.meaning}
                        </span>
                        <span className="ml-2 text-slate-400">
                          (HV: {card.sino_vietnamese})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge & Expand button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(card)}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCardId(isExpanded ? null : card.id)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs animate-in fade-in">
                    {/* FSRS memory info */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 p-2 rounded-xl">
                      <span>
                        Lần ôn:{" "}
                        <b className="text-slate-700 dark:text-slate-200">
                          {card.repetition}
                        </b>
                      </span>
                      <span>
                        Khoảng cách:{" "}
                        <b className="text-slate-700 dark:text-slate-200">
                          {card.interval} ngày
                        </b>
                      </span>
                      {card.stability ? (
                        <>
                          <span title="Stability (Độ bền trí nhớ theo ngày)">
                            Độ bền (S):{" "}
                            <b className="text-indigo-600 dark:text-indigo-400">
                              {card.stability}d
                            </b>
                          </span>
                          <span title="Difficulty (Độ khó từ 1 đến 10)">
                            Độ khó (D):{" "}
                            <b className="text-amber-600 dark:text-amber-400">
                              {card.difficulty}/10
                            </b>
                          </span>
                        </>
                      ) : (
                        <span>Hệ số dễ: {card.ease_factor}</span>
                      )}
                      <span>
                        Cấp độ:{" "}
                        <b className="text-amber-600 dark:text-amber-400 font-bold">
                          {card.tags?.[0] || (card.hsk ? `HSK ${card.hsk}` : "HSK 1")}
                        </b>
                      </span>
                      <span>
                        Chủ đề:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {card.category_name}
                        </span>
                      </span>
                    </div>

                    {/* Example Sentence */}
                    {card.example_sentence && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                            <HanziText text={card.example_sentence} />
                          </div>
                          <div className="text-amber-600 dark:text-amber-400 text-[11px]">
                            {card.example_pinyin}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            {card.example_meaning}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            card.example_sentence &&
                            playChineseAudio(card.example_sentence, {
                              rate: speechRate,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 shrink-0 cursor-pointer"
                          title="Nghe câu ví dụ"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* INFINITE SCROLL SENTINEL & LOADING MORE INDICATOR */}
      <div
        ref={observerTargetRef}
        className="w-full py-4 flex flex-col items-center justify-center"
      >
        {isLoadingMore && (
          <div className="flex flex-col items-center gap-3 py-2 w-full animate-in fade-in">
            {/* Shimmer loading cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5 w-full">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-36 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 animate-pulse p-3 flex flex-col justify-between"
                >
                  <div className="h-2.5 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                  <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                Đang tải thêm từ vựng ({cards.length} / {total})...
              </span>
            </div>
          </div>
        )}

        {hasMore && !isLoadingMore && !isLoadingFilter && cards.length > 0 && (
          <button
            type="button"
            onClick={loadMore}
            className="px-4 py-2 text-xs font-semibold rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-all cursor-pointer hover:shadow-md"
          >
            Cuộn tiếp hoặc bấm để tải thêm (Đã xem {cards.length}/{total})
          </button>
        )}

        {!hasMore && cards.length > 0 && !isLoadingFilter && (
          <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
            🎉 Đã tải toàn bộ {cards.length} từ vựng
          </div>
        )}
      </div>

      {/* DETAIL MODAL (Khi bấm vào một ô trong Grid) */}
      {selectedCardForDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-999999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedCardForDetail(null)}
        >
          <div
            className="w-full max-w-lg p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                  {selectedCardForDetail.tags?.[0] || (selectedCardForDetail.hsk ? `HSK ${selectedCardForDetail.hsk}` : "HSK 1")}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {selectedCardForDetail.category_name}
                </span>
                {getStatusBadge(selectedCardForDetail)}
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Word Centerpiece */}
            <div className="flex flex-col items-center justify-center text-center py-2 bg-linear-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 rounded-2xl">
              <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-wide">
                <HanziText text={selectedCardForDetail.hanzi} />
              </div>
              <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 font-sans mt-1">
                {selectedCardForDetail.pinyin}
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                {selectedCardForDetail.meaning}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Âm Hán Việt:{" "}
                <b className="text-slate-600 dark:text-slate-300">
                  {selectedCardForDetail.sino_vietnamese}
                </b>
              </div>

              <button
                type="button"
                onClick={() =>
                  playChineseAudio(selectedCardForDetail.hanzi, {
                    rate: speechRate,
                  })
                }
                className="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe phát âm chuẩn</span>
              </button>
            </div>

            {/* Example Sentence */}
            {selectedCardForDetail.example_sentence && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Câu ví dụ thực tế:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      selectedCardForDetail.example_sentence &&
                      playChineseAudio(selectedCardForDetail.example_sentence, {
                        rate: speechRate,
                      })
                    }
                    className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                    title="Nghe câu ví dụ"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif">
                  <HanziText text={selectedCardForDetail.example_sentence} />
                </div>
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-sans">
                  {selectedCardForDetail.example_pinyin}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {selectedCardForDetail.example_meaning}
                </div>
              </div>
            )}

            {/* Memory Progress Stats */}
            <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Tiến độ ghi nhớ</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                  {selectedCardForDetail.status === "mastered"
                    ? "Đã thuộc"
                    : selectedCardForDetail.status === "reviewing"
                      ? "Cần ôn tập"
                      : selectedCardForDetail.status === "learning"
                        ? "Đang học"
                        : "Từ mới"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <div>
                  Số lần ôn: <b>{selectedCardForDetail.repetition} lượt</b>
                </div>
                <div>
                  Lần ôn tới sau: <b>{selectedCardForDetail.interval} ngày</b>
                </div>
                {selectedCardForDetail.stability ? (
                  <>
                    <div>
                      Độ nhớ lâu:{" "}
                      <b className="text-indigo-600 dark:text-indigo-400">
                        {selectedCardForDetail.stability} ngày
                      </b>
                    </div>
                    <div>
                      Mức độ khó:{" "}
                      <b className="text-amber-600 dark:text-amber-400">
                        {selectedCardForDetail.difficulty}/10
                      </b>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSelectedCardForDetail(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
