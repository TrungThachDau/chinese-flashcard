'use client';

import React, { useState } from 'react';
import {
  Search,
  Volume2,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardStatus } from '@/lib/types';
import { playChineseAudio } from '@/lib/tts';
import { HanziText } from './HanziHover';

interface VocabularyListProps {
  cards: Card[];
  categories: Array<{ id: string; name: string; icon: string }>;
  speechRate?: number;
}

export const VocabularyList: React.FC<VocabularyListProps> = ({
  cards,
  categories,
  speechRate = 0.85,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const filteredCards = cards.filter((c) => {
    // Category match
    if (selectedCategory !== 'all' && c.category !== selectedCategory) {
      return false;
    }

    // Status match
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'reviewing') {
        const isDue = new Date(c.due_date) <= new Date();
        if (!isDue) return false;
      } else if (c.status !== selectedStatus) {
        return false;
      }
    }

    // Search match
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchHanzi = c.hanzi.toLowerCase().includes(term);
      const matchPinyin = c.pinyin.toLowerCase().includes(term);
      const matchMeaning = c.meaning.toLowerCase().includes(term);
      const matchSino = c.sino_vietnamese.toLowerCase().includes(term);
      return matchHanzi || matchPinyin || matchMeaning || matchSino;
    }

    return true;
  });

  const getStatusBadge = (card: Card) => {
    const isDue = new Date(card.due_date) <= new Date();
    if (card.status === 'mastered') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
          Đã nhớ
        </span>
      );
    }
    if (isDue || card.status === 'reviewing') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
          Cần ôn
        </span>
      );
    }
    if (card.status === 'learning') {
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
    <div className="w-full max-w-2xl mx-auto space-y-4">
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
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">📂 Tất cả chủ đề ({cards.length})</option>
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
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center text-xs text-slate-500 px-2 font-medium">
        <span>Hiển thị {filteredCards.length} từ vựng</span>
        <span className="text-amber-600 dark:text-amber-400 font-semibold">
          💡 Rê chuột/chạm chữ để xem bộ thủ & nét
        </span>
      </div>

      {/* Cards List */}
      <div className="space-y-2.5">
        {filteredCards.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
            Không tìm thấy từ vựng nào khớp với bộ lọc.
          </div>
        ) : (
          filteredCards.map((card) => {
            const isExpanded = expandedCardId === card.id;

            return (
              <div
                key={card.id}
                className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Hanzi + Audio */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => playChineseAudio(card.hanzi, { rate: speechRate })}
                      className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                      title="Phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <HanziText text={card.hanzi} />
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-sans">
                          {card.pinyin}
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
                      onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs animate-in fade-in">
                    {/* SRS info */}
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                      <span>Lần ôn: {card.repetition}</span>
                      <span>Khoảng cách: {card.interval} ngày</span>
                      <span>Hệ số dễ (EF): {card.ease_factor}</span>
                      <span>Chủ đề: {card.category_name}</span>
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
                          onClick={() => playChineseAudio(card.example_sentence, { rate: speechRate })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 shrink-0"
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
          })
        )}
      </div>
    </div>
  );
};

