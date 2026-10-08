'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  RotateCw,
  Eye,
  EyeOff,
  Sparkles,
  Trophy,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Check,
  Flame,
} from 'lucide-react';
import { Card, CategoryInfo, ReviewRating } from '@/lib/types';
import { getIntervalPreviews } from '@/lib/srs';
import { playChineseAudio } from '@/lib/tts';
import { HanziText } from './HanziHover';

interface FlashcardViewProps {
  cards: Card[];
  categories?: CategoryInfo[];
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  onReviewCard: (cardId: number, rating: ReviewRating) => Promise<void>;
  onRefreshDue: () => void;
  speechRate?: number;
  autoPlayAudio?: boolean;
  audioEngine?: 'online' | 'browser';
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  cards,
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  onReviewCard,
  onRefreshDue,
  speechRate = 0.85,
  autoPlayAudio = false,
  audioEngine = 'online',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPinyinOnFront, setShowPinyinOnFront] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const currentCard = cards[currentIndex] || null;

  // Close category dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };
    if (isCategoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCategoryMenuOpen]);

  // Auto-play audio when switching cards if enabled
  useEffect(() => {
    if (currentCard && autoPlayAudio && !isFlipped) {
      setIsPlayingAudio(true);
      playChineseAudio(currentCard.hanzi, {
        rate: speechRate,
        engine: audioEngine,
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  }, [currentCard, autoPlayAudio, isFlipped, speechRate, audioEngine]);

  // Flip reset on card change
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handlePlayAudio = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!currentCard) return;
      setIsPlayingAudio(true);
      playChineseAudio(currentCard.hanzi, {
        rate: speechRate,
        engine: audioEngine,
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    },
    [currentCard, speechRate, audioEngine]
  );

  const handlePlaySentenceAudio = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!currentCard || !currentCard.example_sentence) return;
      setIsPlayingAudio(true);
      playChineseAudio(currentCard.example_sentence, {
        rate: speechRate,
        engine: audioEngine,
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    },
    [currentCard, speechRate, audioEngine]
  );

  const handleRating = async (rating: ReviewRating) => {
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReviewCard(currentCard.id, rating);

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        setIsCompleted(true);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'],
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRating(1);
        else if (e.key === '2') handleRating(2);
        else if (e.key === '3') handleRating(3);
        else if (e.key === '4') handleRating(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isCompleted, currentCard, handleRating]);

  // If no cards or completed
  if (!cards || cards.length === 0 || isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-rose-500/25 mb-5 text-white animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Tuyệt vời! Đã hoàn thành bộ thẻ!
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xs">
          Bạn đã ôn tập xong tất cả thẻ trong phiên này. Thuật toán SRS đã lên lịch cho lần học kế tiếp.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              setIsCompleted(false);
              setCurrentIndex(0);
              onRefreshDue();
            }}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            <span>Tiếp tục ôn tập</span>
          </button>
        </div>
      </div>
    );
  }

  const intervalPreviews = getIntervalPreviews(currentCard);
  const progressPercent = Math.round(((currentIndex) / cards.length) * 100);

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const categoryLabel = selectedCategory === 'all'
    ? '🔥 Thẻ cần ôn hôm nay'
    : currentCategoryObj
    ? `${currentCategoryObj.icon} ${currentCategoryObj.name}`
    : currentCard.category_name;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Top Header with Compact Deck Dropdown */}
      <div className="w-full mb-1.5 sm:mb-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        {/* Category Dropdown Pill */}
        <div className="relative" ref={categoryMenuRef}>
          <button
            type="button"
            onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:border-amber-400 transition-colors text-xs"
          >
            <span className="truncate max-w-[170px] sm:max-w-[210px]">{categoryLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {isCategoryMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Chọn chủ đề ôn tập
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory?.('all');
                  setIsCategoryMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🔥 Cần ôn hôm nay</span>
                {selectedCategory === 'all' && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory?.(cat.id);
                      setIsCategoryMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-[10px] opacity-80 shrink-0 ml-1">({cat.total})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Counters & Status */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-sans">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {currentCard.status === 'new'
              ? 'Mới'
              : currentCard.status === 'mastered'
              ? 'Đã nhớ'
              : 'Đang ôn'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-200 dark:bg-slate-800 mb-2 sm:mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="w-full relative h-[clamp(280px,38vh,380px)] cursor-pointer select-none perspective-1000"
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        <div
          className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT SIDE */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 flex flex-col justify-between items-center backface-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Top utility row */}
            <div className="w-full flex justify-between items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPinyinOnFront((prev) => !prev);
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Bật/Tắt Pinyin"
              >
                {showPinyinOnFront ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPinyinOnFront ? 'Ẩn pinyin' : 'Xem pinyin'}</span>
              </button>

              <button
                type="button"
                onClick={handlePlayAudio}
                className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all shadow-sm active:scale-95 ${
                  isPlayingAudio
                    ? 'bg-amber-500 text-white animate-pulse ring-4 ring-amber-500/25'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                }`}
                title="Bấm để phát âm chuẩn (Mandarin)"
              >
                <Volume2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Main Hanzi */}
            <div
              className="flex flex-col items-center justify-center my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl sm:text-7xl font-extrabold tracking-wider mb-2 sm:mb-3 text-slate-900 dark:text-white drop-shadow-sm">
                <HanziText text={currentCard.hanzi} />
              </div>

              {showPinyinOnFront && (
                <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 animate-in fade-in slide-in-from-top-1 font-sans">
                  {currentCard.pinyin}
                </div>
              )}

              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 sm:mt-2 font-sans">
                💡 Rê chuột / chạm từng chữ để xem bộ thủ & nét
              </p>
            </div>

            {/* Bottom flip guide */}
            <div className="w-full flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-400 font-sans">
              <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Chạm thẻ hoặc phím Cách để lật mặt sau</span>
            </div>
          </div>

          {/* BACK SIDE */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 flex flex-col justify-between backface-hidden bg-gradient-to-b from-white via-slate-50 to-amber-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-amber-950/20 backdrop-blur-2xl border-2 border-amber-500/30 dark:border-amber-500/20 shadow-2xl shadow-amber-500/10 text-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                Âm Hán Việt: {currentCard.sino_vietnamese}
              </span>
              <button
                type="button"
                onClick={handlePlayAudio}
                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors ${
                  isPlayingAudio
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                }`}
                title="Phát âm từ"
              >
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Middle Meaning */}
            <div className="my-auto space-y-1 sm:space-y-2 max-h-[calc(100%-48px)] overflow-y-auto no-scrollbar py-1 w-full">
              <div
                className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <HanziText text={currentCard.hanzi} />
              </div>

              <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 font-sans">
                {currentCard.pinyin}
              </div>

              <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white border-t border-slate-200/60 dark:border-slate-800/80 pt-1.5 sm:pt-2 font-sans">
                {currentCard.meaning}
              </div>

              {/* Example sentence */}
              {currentCard.example_sentence && (
                <div
                  className="mt-1.5 sm:mt-3 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-left cursor-pointer hover:border-amber-300 transition-colors font-sans"
                  onClick={handlePlaySentenceAudio}
                  title="Bấm để nghe câu ví dụ"
                >
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5 sm:mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Ví dụ thực tế:
                    </span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div
                    className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 font-serif"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HanziText text={currentCard.example_sentence} />
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-sans">
                    {currentCard.example_pinyin}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                    {currentCard.example_meaning}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom reminder */}
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans">
              Chọn mức độ nhớ bên dưới để SRS lên lịch ôn tập
            </div>
          </div>
        </div>
      </div>

      {/* SRS RATING BUTTONS (SM-2) */}
      <div className="w-full mt-2.5 sm:mt-5">
        {isFlipped ? (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {/* 1. LẠI (Again) */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRating(1)}
              className="group flex flex-col items-center justify-center py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bold transition-all active:scale-95 shadow-sm"
            >
              <span className="text-xs group-hover:scale-105 transition-transform font-sans">Quên</span>
              <span className="text-[10px] font-normal text-rose-500 dark:text-rose-400 opacity-90 font-sans">
                {intervalPreviews[1]}
              </span>
              <span className="hidden sm:inline text-[9px] text-rose-400/80 font-mono mt-0.5">[1]</span>
            </button>

            {/* 2. KHÓ (Hard) */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRating(2)}
              className="group flex flex-col items-center justify-center py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 font-bold transition-all active:scale-95 shadow-sm"
            >
              <span className="text-xs group-hover:scale-105 transition-transform font-sans">Khó</span>
              <span className="text-[10px] font-normal text-amber-500 dark:text-amber-400 opacity-90 font-sans">
                {intervalPreviews[2]}
              </span>
              <span className="hidden sm:inline text-[9px] text-amber-400/80 font-mono mt-0.5">[2]</span>
            </button>

            {/* 3. TỐT (Good) */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRating(3)}
              className="group flex flex-col items-center justify-center py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold transition-all active:scale-95 shadow-sm"
            >
              <span className="text-xs group-hover:scale-105 transition-transform font-sans">Tốt</span>
              <span className="text-[10px] font-normal text-emerald-500 dark:text-emerald-400 opacity-90 font-sans">
                {intervalPreviews[3]}
              </span>
              <span className="hidden sm:inline text-[9px] text-emerald-400/80 font-mono mt-0.5">[3]</span>
            </button>

            {/* 4. DỄ (Easy) */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRating(4)}
              className="group flex flex-col items-center justify-center py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-900/60 text-sky-700 dark:text-sky-300 font-bold transition-all active:scale-95 shadow-sm"
            >
              <span className="text-xs group-hover:scale-105 transition-transform font-sans">Dễ</span>
              <span className="text-[10px] font-normal text-sky-500 dark:text-sky-400 opacity-90 font-sans">
                {intervalPreviews[4]}
              </span>
              <span className="hidden sm:inline text-[9px] text-sky-400/80 font-mono mt-0.5">[4]</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className="w-full py-2.5 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-bold shadow-lg shadow-rose-500/20 hover:opacity-95 transition-transform active:scale-98 flex items-center justify-center gap-2 text-sm sm:text-base font-sans"
          >
            <span>Lật thẻ xem đáp án</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
