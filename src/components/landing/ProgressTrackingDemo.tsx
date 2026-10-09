"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  Volume2,
  Flame,
  Sparkles,
  RotateCw,
  CheckCircle2,
  Trophy,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { playChineseAudio } from "@/lib/tts";

interface DemoCard {
  hanzi: string;
  pinyin: string;
  tones: string;
  meaning: string;
  exampleZh: string;
  examplePinyin: string;
  exampleVi: string;
  radical: string;
  hskLevel: number;
}

const DEMO_CARDS: DemoCard[] = [
  {
    hanzi: "你好",
    pinyin: "nǐ hǎo",
    tones: "nǐ (ˇ) + hǎo (ˇ)",
    meaning: "Xin chào bạn",
    exampleZh: "你好！很高兴认识你。",
    examplePinyin: "Nǐ hǎo! Hěn gāoxìng rènshi nǐ.",
    exampleVi: "Xin chào! Rất vui được làm quen với bạn.",
    radical: "亻 (Nhân đứng) + 女 (Nữ)",
    hskLevel: 1,
  },
  {
    hanzi: "谢谢",
    pinyin: "xièxie",
    tones: "xiè (`) + xie (thanh nhẹ)",
    meaning: "Cảm ơn",
    exampleZh: "太谢谢你的帮助了！",
    examplePinyin: "Tài xièxie nǐ de bāngzhù le!",
    exampleVi: "Vô cùng cảm ơn sự giúp đỡ của bạn!",
    radical: "讠 (Ngôn)",
    hskLevel: 1,
  },
  {
    hanzi: "苹果",
    pinyin: "píngguǒ",
    tones: "píng (ˊ) + guǒ (ˇ)",
    meaning: "Quả táo",
    exampleZh: "这个红苹果很甜。",
    examplePinyin: "Zhè ge hóng píngguǒ hěn tián.",
    exampleVi: "Quả táo đỏ này rất ngọt.",
    radical: "艹 (Thảo) + 木 (Mộc)",
    hskLevel: 1,
  },
  {
    hanzi: "漂亮",
    pinyin: "piàoliang",
    tones: "piào (`) + liang (thanh nhẹ)",
    meaning: "Xinh đẹp / Đẹp đẽ",
    exampleZh: "这里的风景真漂亮！",
    examplePinyin: "Zhèlǐ de fēngjǐng zhēn piàoliang!",
    exampleVi: "Phong cảnh ở đây thật là đẹp!",
    radical: "氵 (Thủy) + 亠 (Đầu)",
    hskLevel: 1,
  },
  {
    hanzi: "快乐",
    pinyin: "kuàilè",
    tones: "kuài (`) + lè (`)",
    meaning: "Vui vẻ / Hạnh phúc",
    exampleZh: "祝你生日快乐！",
    examplePinyin: "Zhù nǐ shēngrì kuàilè!",
    exampleVi: "Chúc bạn sinh nhật vui vẻ!",
    radical: "忄 (Tâm đứng) + 木 (Mộc)",
    hskLevel: 1,
  },
];

export const ProgressTrackingDemo: React.FC = () => {
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [xp, setXp] = useState(1450);
  const [dailyCompleted, setDailyCompleted] = useState(16);
  const [dailyGoal] = useState(20);
  const [streakDays, setStreakDays] = useState([true, true, true, true, true, true, true]);
  const [studyMinutes, setStudyMinutes] = useState(15);
  const [ratingFeedback, setRatingFeedback] = useState<string | null>(null);

  const currentCard = DEMO_CARDS[cardIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAudio = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlayingAudio(true);
    try {
      await playChineseAudio(currentCard.hanzi);
    } finally {
      setTimeout(() => setIsPlayingAudio(false), 800);
    }
  };

  const handleRate = (type: "hard" | "good" | "easy") => {
    let gainedXp = 20;
    let feedback = "";

    if (type === "hard") {
      gainedXp = 15;
      feedback = "Sẽ ôn lại trong 10 phút! 🔁";
    } else if (type === "good") {
      gainedXp = 35;
      feedback = "Ghi nhớ tốt! Ôn lại sau 3 ngày ✨";
    } else {
      gainedXp = 50;
      feedback = "Xuất sắc! Đã vào trí nhớ dài hạn (sau 7 ngày) 🚀";
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#f97316", "#fbbf24", "#10b981", "#f43f5e"],
      });
    }

    setXp((prev) => prev + gainedXp);
    setDailyCompleted((prev) => Math.min(dailyGoal, prev + 1));
    setRatingFeedback(feedback);

    setTimeout(() => {
      setRatingFeedback(null);
      setIsFlipped(false);
      setCardIndex((prev) => (prev + 1) % DEMO_CARDS.length);
    }, 1100);
  };

  const toggleDay = (idx: number) => {
    setStreakDays((prev) => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  // Calculations for 30-day projection
  const projectedWords = Math.round((studyMinutes / 15) * 300);
  const projectedHskLevel = studyMinutes >= 30 ? "HSK 2 - 3" : studyMinutes >= 15 ? "HSK 1 - 2" : "HSK 1";

  return (
    <section id="progress-demo" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-[#fff8f0] to-[#fff2e4]">
      {/* Background soft glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-300/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clay-badge bg-amber-100 text-amber-900 text-xs font-black">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>Học Thử: Xem Cách Ghi Nhớ Tự Nhiên</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2d1b13] tracking-tight">
            Trải Nghiệm Phương Pháp Nhớ Lâu Thông Minh
          </h2>
          <p className="text-base text-[#5c3a25] font-medium">
            Hãy thử lật thẻ, nghe phát âm và đánh giá mức độ ghi nhớ. Ứng dụng sẽ tự động lên lịch nhắc ôn đúng lúc, giúp bạn tích lũy từ vựng bền vững mỗi ngày!
          </p>
        </div>

        {/* Dual Panels: Left = Interactive Flashcard, Right = Live Progress Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Live Interactive Flashcard Demo */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between text-xs font-bold text-[#68412b] px-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Thẻ học thực tế #{cardIndex + 1}/{DEMO_CARDS.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex((prev) => (prev === 0 ? DEMO_CARDS.length - 1 : prev - 1));
                  }}
                  className="p-1.5 rounded-xl bg-white shadow-sm hover:bg-orange-50 text-slate-700"
                  title="Thẻ trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex((prev) => (prev + 1) % DEMO_CARDS.length);
                  }}
                  className="p-1.5 rounded-xl bg-white shadow-sm hover:bg-orange-50 text-slate-700"
                  title="Thẻ sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clay Flashcard Container with 3D Flip */}
            <div
              onClick={handleFlip}
              className="w-full h-[380px] sm:h-[400px] perspective-1000 cursor-pointer select-none group"
            >
              <div
                className={`w-full h-full relative duration-500 preserve-3d transition-transform ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* FRONT SIDE */}
                <div className="absolute inset-0 backface-hidden clay-card bg-gradient-to-b from-white via-[#fffdfa] to-[#fff6ec] p-6 sm:p-8 flex flex-col justify-between border-4 border-white">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-black">
                      HSK {currentCard.hskLevel} • Cơ Bản
                    </span>
                    <button
                      onClick={handleAudio}
                      className={`clay-btn-white p-3 text-orange-600 hover:text-orange-700 ${
                        isPlayingAudio ? "scale-110 ring-2 ring-orange-400 bg-orange-50" : ""
                      }`}
                      title="Phát âm tiếng Trung"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Center Hanzi */}
                  <div className="text-center space-y-3 my-auto">
                    <div className="text-7xl sm:text-8xl font-black text-[#2d1b13] tracking-widest group-hover:scale-105 transition-transform">
                      {currentCard.hanzi}
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 font-extrabold text-sm">
                      Bộ thủ: {currentCard.radical}
                    </div>
                  </div>

                  {/* Flip Prompt */}
                  <div className="text-center pt-2 border-t border-orange-100 flex items-center justify-center gap-1.5 text-xs text-orange-700 font-bold">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "6s" }} />
                    <span>Chạm vào thẻ để lật xem phiên âm & nghĩa</span>
                  </div>
                </div>

                {/* BACK SIDE */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 clay-card-peach p-6 sm:p-8 flex flex-col justify-between border-4 border-white">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-orange-800 bg-white/80 px-2.5 py-1 rounded-full">
                      Ý Nghĩa & Ví Dụ
                    </span>
                    <button
                      onClick={handleAudio}
                      className="clay-btn-white p-2.5 text-orange-600 hover:text-orange-700"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Character + Pinyin + Meaning */}
                  <div className="text-center space-y-1.5 my-auto">
                    <div className="text-4xl sm:text-5xl font-black text-[#2d1b13]">
                      {currentCard.hanzi}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-orange-700 tracking-wide">
                      {currentCard.pinyin}
                    </div>
                    <div className="text-xs text-orange-900/70 font-mono font-bold">
                      {currentCard.tones}
                    </div>
                    <div className="text-lg font-black text-[#432414] pt-1">
                      {currentCard.meaning}
                    </div>

                    {/* Example sentence box */}
                    <div className="mt-3 p-3 rounded-2xl bg-white/90 text-left text-xs space-y-1 shadow-sm">
                      <div className="text-[10px] text-orange-600 font-bold uppercase">
                        Mẫu câu ứng dụng:
                      </div>
                      <div className="font-bold text-[#2d1b13] text-sm">
                        {currentCard.exampleZh}
                      </div>
                      <div className="text-orange-800/80 text-[11px]">
                        {currentCard.examplePinyin}
                      </div>
                      <div className="text-slate-600 text-[11px]">{currentCard.exampleVi}</div>
                    </div>
                  </div>

                  {/* Flip back hint */}
                  <div className="text-center text-[11px] text-[#7a482e] font-semibold">
                    Chạm để lật lại mặt chữ Hán
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Buttons / SRS Feedback */}
            <div className="w-full space-y-2">
              {ratingFeedback ? (
                <div className="p-3.5 rounded-2xl bg-amber-400 text-[#301809] font-black text-center text-xs animate-bounce shadow-md">
                  {ratingFeedback}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-black text-center text-[#74472f]">
                    Đánh giá mức độ nhớ để tự động hẹn ngày ôn:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleRate("hard")}
                      className="clay-btn-white py-3 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50"
                    >
                      <span className="block text-[10px] text-rose-400 font-normal">Ôn ngay</span>
                      Chưa nhớ (+15 XP)
                    </button>
                    <button
                      onClick={() => handleRate("good")}
                      className="clay-btn-white py-3 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-50"
                    >
                      <span className="block text-[10px] text-amber-500 font-normal">Sau 3 ngày</span>
                      Nhớ vừa (+35 XP)
                    </button>
                    <button
                      onClick={() => handleRate("easy")}
                      className="clay-btn-coral py-3 text-xs font-black shadow-md"
                    >
                      <span className="block text-[10px] text-orange-100 font-normal">Sau 7 ngày</span>
                      Thuộc làu (+50 XP) 🚀
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Live Gamified Dashboard */}
          <div className="lg:col-span-6 space-y-5">
            {/* Top Stat Row: Streak & XP */}
            <div className="grid grid-cols-2 gap-4">
              {/* Streak Card */}
              <div className="clay-card-coral p-5 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-600 shrink-0">
                  <Flame className="w-6 h-6 fill-orange-500 text-orange-500 animate-pulse" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-orange-800/80 uppercase tracking-wide">
                    Chuỗi Streak
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#2d1b13]">7 Ngày Liên Tiếp</div>
                  <div className="text-[10px] text-orange-700 font-semibold">
                    Không bỏ lỡ ngày nào! 🔥
                  </div>
                </div>
              </div>

              {/* XP Points Card */}
              <div className="clay-card-amber p-5 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-600 shrink-0">
                  <Sparkles className="w-6 h-6 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-900/80 uppercase tracking-wide">
                    Tổng Điểm XP
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#2d1b13] flex items-center gap-1.5">
                    <span>{xp.toLocaleString()} XP</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    +Tăng khi bạn vừa ôn thẻ!
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Goal Card */}
            <div className="clay-card p-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-orange-800/80 uppercase">
                    Mục Tiêu Ôn Tập Hôm Nay
                  </div>
                  <h4 className="text-lg font-black text-[#2d1b13]">
                    {dailyCompleted} / {dailyGoal} Từ Vựng Đã Ôn
                  </h4>
                </div>
                <span className="text-sm font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                  {Math.round((dailyCompleted / dailyGoal) * 100)}%
                </span>
              </div>

              {/* Thick Clay Progress Bar */}
              <div className="w-full h-4 rounded-full bg-orange-100 p-0.5 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-500 shadow-sm"
                  style={{ width: `${(dailyCompleted / dailyGoal) * 100}%` }}
                />
              </div>

              {dailyCompleted >= dailyGoal && (
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Chúc mừng bạn đã hoàn thành mục tiêu ôn tập ngày hôm nay!</span>
                </div>
              )}
            </div>

            {/* Weekly Habit Tracker (Interactive Mon-Sun) */}
            <div className="clay-card-peach p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-black uppercase text-orange-900 tracking-wider">
                    Nhật Ký Học Tập 7 Ngày Qua
                  </span>
                </div>
                <span className="text-[11px] text-orange-800/80 font-bold">
                  (Nhấp vào để đổi trạng thái)
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-1">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    className={`p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      streakDays[idx]
                        ? "clay-btn-amber text-amber-900 shadow-sm"
                        : "bg-white/70 text-slate-400 border border-orange-200/50"
                    }`}
                  >
                    <span className="text-[11px] font-bold">{day}</span>
                    <span className="text-sm mt-0.5">{streakDays[idx] ? "🔥" : "⚪"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 30-Day Word Retention Calculator Slider */}
            <div className="clay-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-orange-800/80 uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Dự Phóng Vốn Từ Sau 30 Ngày
                  </span>
                  <div className="text-sm font-black text-[#2d1b13]">
                    Thời gian học mỗi ngày:{" "}
                    <span className="text-orange-600 font-extrabold">{studyMinutes} phút</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-orange-600">~{projectedWords} Từ</div>
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                    Đạt trình độ: {projectedHskLevel}
                  </div>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={studyMinutes}
                onChange={(e) => setStudyMinutes(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-orange-100 rounded-lg"
              />

              <div className="flex justify-between text-[11px] text-[#7a482e] font-semibold">
                <span>5 phút / ngày (Nhẹ nhàng)</span>
                <span>15 phút (Chuẩn khuyến nghị)</span>
                <span>45 phút (Bứt phá)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

