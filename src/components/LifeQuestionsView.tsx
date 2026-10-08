'use client';

import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  RotateCcw,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { LifeQuestion } from '@/lib/types';
import { playChineseAudio } from '@/lib/tts';
import { HanziText } from './HanziHover';

interface LifeQuestionsViewProps {
  questions: LifeQuestion[];
  onCompleteQuestion: (questionId: number) => Promise<void>;
  speechRate?: number;
}

export const LifeQuestionsView: React.FC<LifeQuestionsViewProps> = ({
  questions,
  onCompleteQuestion,
  speechRate = 0.85,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const topics = [
    { id: 'all', label: 'Tất cả' },
    { id: 'greetings_identity', label: 'Làm quen' },
    { id: 'nationality', label: 'Quốc tịch' },
    { id: 'age', label: 'Tuổi tác' },
    { id: 'time', label: 'Giờ giấc' },
    { id: 'shopping', label: 'Mua sắm' },
    { id: 'dining', label: 'Ăn uống' },
    { id: 'location', label: 'Hỏi đường' },
    { id: 'weather', label: 'Thời tiết' },
    { id: 'family', label: 'Gia đình' },
    { id: 'abilities', label: 'Năng lực' },
  ];

  const filteredQuestions = selectedTopic === 'all'
    ? questions
    : questions.filter((q) => q.topic === selectedTopic);

  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0] || null;

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopic(topicId);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setIsAnswerCorrect(null);
  };

  const handlePlayQuestionAudio = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentQ) {
      playChineseAudio(currentQ.question_hanzi, { rate: speechRate });
    }
  };

  const handlePlayAnswerAudio = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentQ) {
      playChineseAudio(currentQ.answer_hanzi, { rate: speechRate });
    }
  };

  const handleSelectOption = async (option: string) => {
    if (!currentQ || showAnswer) return;

    setSelectedAnswer(option);
    const correct = option.trim() === currentQ.answer_hanzi.trim();
    setIsAnswerCorrect(correct);
    setShowAnswer(true);

    if (correct) {
      import('canvas-confetti')
        .then((m) => {
          m.default({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
          });
        })
        .catch(() => {});
      await onCompleteQuestion(currentQ.id);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < filteredQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setSelectedAnswer(null);
    setShowAnswer(false);
    setIsAnswerCorrect(null);
  };

  if (!currentQ) {
    return (
      <div className="p-8 text-center text-slate-500">
        Không tìm thấy câu hỏi cho chủ đề này.
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Topic filter chips - Horizontal scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {topics.map((t) => {
          const isActive = selectedTopic === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTopic(t.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/20 scale-105'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-4">
        {/* Situation Header */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            {currentQ.topic_name}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Câu {currentIndex + 1} / {filteredQuestions.length}
          </span>
        </div>

        {/* Situation description */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Tình huống: </span>
          {currentQ.situation}
        </div>

        {/* Question Hanzi & Audio */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/20 text-center relative">
          <button
            type="button"
            onClick={handlePlayQuestionAudio}
            className="absolute top-3 right-3 p-2 rounded-full bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-md hover:scale-105 transition-transform"
            title="Nghe câu hỏi"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <div className="text-2xl sm:text-3xl font-bold tracking-wide text-slate-800 dark:text-slate-100 mb-1">
            <HanziText text={currentQ.question_hanzi} />
          </div>

          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {currentQ.question_pinyin}
          </div>

          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
            &ldquo;{currentQ.question_meaning}&rdquo;
          </div>

          <div className="text-[10px] text-slate-400 mt-2">
            💡 Rê chuột / chạm từng chữ Hán để xem chi tiết bộ thủ & số nét
          </div>
        </div>

        {/* Prompt: Choose matching response */}
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-1">
          Chọn câu phản xạ đời sống phù hợp nhất:
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt.trim() === currentQ.answer_hanzi.trim();

            let optionStyle =
              'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-amber-400 dark:hover:border-amber-500 text-slate-700 dark:text-slate-200';

            if (showAnswer) {
              if (isCorrect) {
                optionStyle =
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold';
              } else if (isSelected && !isCorrect) {
                optionStyle =
                  'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 line-through';
              } else {
                optionStyle = 'opacity-50 border-slate-200 dark:border-slate-800';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={showAnswer}
                onClick={() => handleSelectOption(opt)}
                className={`w-full p-3.5 rounded-2xl border text-left text-sm transition-all duration-200 flex items-center justify-between ${optionStyle}`}
              >
                <span className="font-medium">
                  <HanziText text={opt} />
                </span>
                {showAnswer && isCorrect && (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />
                )}
                {showAnswer && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback / Explanation Box */}
        {showAnswer && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-500" />
                Câu trả lời mẫu & Phân tích ngữ pháp:
              </span>
              <button
                type="button"
                onClick={handlePlayAnswerAudio}
                className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:scale-105 transition-transform"
                title="Nghe câu trả lời chuẩn"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              <HanziText text={currentQ.answer_hanzi} />
            </div>

            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {currentQ.answer_pinyin}
            </div>

            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Dịch: &ldquo;{currentQ.answer_meaning}&rdquo;
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-indigo-100 dark:border-indigo-900/40 leading-relaxed">
              💡 {currentQ.explanation}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNextQuestion}
              className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Câu hỏi tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

