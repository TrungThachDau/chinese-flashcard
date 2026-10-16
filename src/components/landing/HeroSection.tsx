"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Volume2, Sparkles, Flame, CheckCircle2, ArrowRight, Star, Heart, Award } from "lucide-react";
import { playChineseAudio } from "@/lib/tts";

interface HeroSectionProps {
  onOpenEnroll: () => void;
  onScrollToDemo: () => void;
  onScrollToCourses: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenEnroll,
  onScrollToDemo,
  onScrollToCourses,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [previewRating, setPreviewRating] = useState<string | null>(null);
  const [xpPop, setXpPop] = useState(false);

  const handlePlayVoice = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    try {
      await playChineseAudio("熊猫 xióngmāo", { rate: 0.85 });
    } finally {
      setTimeout(() => setIsPlayingAudio(false), 800);
    }
  };

  const handleRatingClick = (rating: string) => {
    setPreviewRating(rating);
    setXpPop(true);
    setTimeout(() => setXpPop(false), 1200);
  };

  return (
    <section className="relative overflow-hidden pt-6 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6">
      {/* Background playful warm blobs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-175 h-125 bg-linear-to-tr from-amber-200/40 via-orange-200/35 to-rose-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -top-24 right-10 w-72 h-72 bg-orange-300/20 rounded-full blur-2xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-200/30 rounded-full blur-2xl -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Headline and Pitch */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          {/* Top Playful Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full clay-badge bg-white/90 text-orange-800 text-xs sm:text-sm font-black shadow-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-ping" />
            <span className="text-base">🏮</span>
            <span>Phương Pháp Ôn Tập Nhớ Lâu Cùng Gấu Trúc</span>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              MỚI HSK 3.0
            </span>
          </div>

          {/* Main Title with warm playful tones */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.15] text-[#2d1b13]">
            Chinh Phục Tiếng Trung{" "}
            <span className="inline-block relative">
              <span className="bg-linear-to-r from-orange-500 via-amber-500 to-rose-500 bg-clip-text text-transparent">
                Vui Như Chơi Game
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-orange-400"
                viewBox="0 0 200 12"
                fill="none"
              >
                <path
                  d="M2 9C50 2 150 2 198 9"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            , Nhớ Sâu Bền Vững!
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-[#5a3a29] font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Không còn nỗi ám ảnh học vẹt chữ Hán khô khan. Với thẻ học hình ảnh sinh động, giải mã câu chuyện
            bộ thủ, phát âm chuẩn bản xứ và chu kỳ nhắc ôn thông minh, bạn sẽ tự tin nói tiếng Trung chỉ sau{" "}
            <strong className="text-orange-700 font-bold">15 phút mỗi ngày</strong>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
            <button
              onClick={onOpenEnroll}
              className="w-full sm:w-auto clay-btn-coral px-7 py-4 text-base font-black shadow-lg shadow-orange-400/30 gap-2.5 group cursor-pointer"
            >
              <span>🚀 Bắt Đầu Miễn Phí Ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onScrollToDemo}
              className="w-full sm:w-auto clay-btn-white px-6 py-4 text-sm font-black text-[#43281c] gap-2 border border-orange-200/80 shadow-sm cursor-pointer"
            >
              <span>🎮 Thử Học Thẻ Ngay</span>
            </button>
          </div>

          {/* Social Proof Mini Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#6e4632] font-semibold">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <span className="w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-xs shadow-sm">
                  👩🏻
                </span>
                <span className="w-8 h-8 rounded-full bg-rose-200 border-2 border-white flex items-center justify-center text-xs shadow-sm">
                  👨🏻‍🎓
                </span>
                <span className="w-8 h-8 rounded-full bg-orange-200 border-2 border-white flex items-center justify-center text-xs shadow-sm">
                  🧑🏻‍💻
                </span>
                <span className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center text-xs shadow-sm">
                  👧🏻
                </span>
              </div>
              <div>
                <div className="flex items-center text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="ml-1 font-black text-[#2d1b13]">4.9/5</span>
                </div>
                <p className="text-[11px] text-[#82543d]">45,000+ học viên tin dùng</p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-orange-200/80 pl-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Giọng đọc Bắc Kinh</span>
            </div>

            <div className="flex items-center gap-2 border-l border-orange-200/80 pl-4">
              <Award className="w-4 h-4 text-orange-600" />
              <span>Chuẩn khung HSK 3.0</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Claymorphism Card Showcase */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          {/* Floating Widget 1: Streak */}
          <div className="absolute -top-5 -left-4 sm:-left-8 z-20 clay-badge bg-white px-3.5 py-2 flex items-center gap-2 shadow-lg animate-clay-float">
            <span className="p-1.5 rounded-full bg-orange-100 text-orange-600">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold text-orange-800/70">Kỷ Lục Streak</div>
              <div className="text-xs font-black text-[#2d1b13]">🔥 14 Ngày Học Liên Tục</div>
            </div>
          </div>

          {/* Floating Widget 2: XP Level */}
          <div className="absolute -bottom-6 -right-2 sm:-right-6 z-20 clay-badge bg-white px-3.5 py-2 flex items-center gap-2 shadow-lg animate-clay-float-slow">
            <span className="p-1.5 rounded-full bg-amber-100 text-amber-600">
              <Sparkles className="w-4 h-4 fill-amber-400 text-amber-400" />
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-800/70">Điểm Thưởng XP</div>
              <div className="text-xs font-black text-[#2d1b13] flex items-center gap-1">
                <span>⚡ +1,480 XP</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 rounded font-bold">
                  Level 3
                </span>
              </div>
            </div>
          </div>

          {/* Big Claymorphism Hero Card */}
          <div className="w-full max-w-sm sm:max-w-md clay-card p-6 sm:p-7 relative bg-linear-to-b from-[#ffffff] via-[#fffbf7] to-[#fff5ec] border-4 border-white/90">
            {/* Pop XP effect */}
            {xpPop && (
              <div className="absolute top-6 right-6 z-30 animate-bounce bg-amber-400 text-[#3d200b] font-black text-xs px-3 py-1.5 rounded-full shadow-md">
                ✨ +50 XP Luyện Tập!
              </div>
            )}

            {/* Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-black">
                  HSK 1 • Thẻ #042
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Bộ thủ: 犬 + 毛
                </span>
              </div>
              <button
                onClick={handlePlayVoice}
                title="Nghe phát âm chuẩn"
                className={`clay-btn-white p-2.5 rounded-2xl text-orange-600 hover:text-orange-700 transition-transform ${
                  isPlayingAudio ? "scale-110 ring-2 ring-orange-400 bg-orange-50" : ""
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Card Main Character Showcase */}
            <div className="my-6 text-center space-y-2">
              <div className="inline-block relative">
                <div className="text-6xl sm:text-7xl font-black tracking-wider text-[#2d1b13] select-none hover:scale-105 transition-transform duration-200 cursor-pointer">
                  熊猫
                </div>
                {/* Tone pill */}
                <div className="mt-1 flex items-center justify-center gap-1.5 text-orange-700 font-extrabold text-lg">
                  <span className="px-2 py-0.5 rounded-lg bg-orange-100/90 text-sm">
                    xióng <span className="text-xs text-orange-500 font-mono">(ˊ)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-100/90 text-sm">
                    māo <span className="text-xs text-amber-600 font-mono">(¯)</span>
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-lg font-black text-[#502f1d]">Gấu trúc (Panda) 🐼</div>
                <p className="text-xs text-[#805036] font-medium italic">
                  &ldquo;Biểu tượng quốc bảo Trung Hoa - Chú gấu đáng yêu ăn tre trúc&rdquo;
                </p>
              </div>

              {/* Example sentence */}
              <div className="mt-4 p-3 rounded-2xl bg-orange-50/80 border border-orange-100 text-left text-xs space-y-1">
                <div className="font-bold text-[#3d2416] flex items-center justify-between">
                  <span>Ví dụ thực tế:</span>
                  <span className="text-[10px] text-orange-600 font-extrabold">HSK 1 Ví Dụ</span>
                </div>
                <div className="text-sm font-semibold text-[#2d1b13]">我非常喜欢大熊猫。</div>
                <div className="text-[11px] text-orange-800/80">Wǒ fēicháng xǐhuan dàxióngmāo.</div>
                <div className="text-[11px] text-[#6d432d]">Tôi rất thích gấu trúc lớn.</div>
              </div>
            </div>

            {/* Rating Buttons */}
            <div className="pt-2 space-y-2">
              <div className="text-[11px] font-black text-center text-[#7c4d35] flex items-center justify-center gap-1">
                <span>Bạn nhớ từ này ở mức độ nào?</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleRatingClick("hard")}
                  className={`clay-btn-white py-2 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 ${
                    previewRating === "hard" ? "ring-2 ring-rose-400 bg-rose-50" : ""
                  }`}
                >
                  <span className="block text-[10px] text-rose-400 font-normal">Ôn lại sớm</span>
                  Chưa nhớ
                </button>
                <button
                  onClick={() => handleRatingClick("good")}
                  className={`clay-btn-white py-2 text-xs font-bold text-amber-600 border border-amber-200 hover:bg-amber-50 ${
                    previewRating === "good" ? "ring-2 ring-amber-400 bg-amber-50" : ""
                  }`}
                >
                  <span className="block text-[10px] text-amber-400 font-normal">Sau 3 ngày</span>
                  Nhớ vừa
                </button>
                <button
                  onClick={() => handleRatingClick("easy")}
                  className={`clay-btn-coral py-2 text-xs font-black shadow-sm ${
                    previewRating === "easy" ? "ring-2 ring-orange-300" : ""
                  }`}
                >
                  <span className="block text-[10px] text-orange-100 font-normal">Sau 7 ngày</span>
                  Quá dễ! ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

