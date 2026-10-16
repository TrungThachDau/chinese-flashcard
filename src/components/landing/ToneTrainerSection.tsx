"use client";

import React, { useState } from "react";
import { Volume2, Sparkles, Music } from "lucide-react";
import { playChineseAudio } from "@/services/tts.service";

interface ToneItem {
  toneNum: number;
  symbol: string;
  pinyin: string;
  hanzi: string;
  meaning: string;
  pitch: string;
  contourDesc: string;
  metaphor: string;
  icon: string;
  colorClass: string;
  svgPath: string;
}

const TONES: ToneItem[] = [
  {
    toneNum: 1,
    symbol: "¯ (Thanh Ngang)",
    pinyin: "mā",
    hanzi: "妈",
    meaning: "Mẹ / Người mẹ",
    pitch: "5 - 5 (Cao & Ngang)",
    contourDesc: "Giữ âm vực cao, đều và bằng phẳng từ đầu tới cuối.",
    metaphor: "Như cánh chim hải âu bay lướt ngang trời 🕊️",
    icon: "🕊️",
    colorClass: "clay-card-peach text-orange-700",
    svgPath: "M10 20 L90 20",
  },
  {
    toneNum: 2,
    symbol: "ˊ (Thanh Sắc)",
    pinyin: "má",
    hanzi: "麻",
    meaning: "Cây gai / Tê rần",
    pitch: "3 - 5 (Vút lên cao)",
    contourDesc: "Bắt đầu từ âm vực trung bình rồi vút nhanh lên cao như dấu hỏi ngạc nhiên.",
    metaphor: "Như phi thuyền cất cánh bay vút lên mây 🚀",
    icon: "🚀",
    colorClass: "clay-card-amber text-amber-700",
    svgPath: "M10 40 L90 10",
  },
  {
    toneNum: 3,
    symbol: "ˇ (Thanh Hỏi - Lượn)",
    pinyin: "mǎ",
    hanzi: "马",
    meaning: "Con ngựa",
    pitch: "2 - 1 - 4 (Hạ sâu rồi nâng)",
    contourDesc: "Hạ giọng xuống thật trầm ở cổ họng, sau đó uốn lượn nhẹ nhàng lên cao.",
    metaphor: "Như đường tàu lượn siêu tốc uốn qua thung lũng 🎢",
    icon: "🐎",
    colorClass: "clay-card-mint text-emerald-700",
    svgPath: "M10 20 Q50 48 90 15",
  },
  {
    toneNum: 4,
    symbol: "` (Thanh Rơi / Dứt Khoát)",
    pinyin: "mà",
    hanzi: "骂",
    meaning: "Mắng / Khiển trách",
    pitch: "5 - 1 (Rơi mạnh dứt khoát)",
    contourDesc: "Bắt đầu từ đỉnh cao độ 5 rơi thật nhanh và dứt khoát xuống đáy như mệnh lệnh.",
    metaphor: "Như nhát chém karate dứt khoát và mạnh mẽ 🥋",
    icon: "⚡",
    colorClass: "clay-card-coral text-rose-700",
    svgPath: "M10 10 L90 45",
  },
];

export const ToneTrainerSection: React.FC = () => {
  const [playingTone, setPlayingTone] = useState<number | null>(null);

  const handlePlay = async (tone: ToneItem) => {
    setPlayingTone(tone.toneNum);
    try {
      await playChineseAudio(`${tone.pinyin} ${tone.hanzi}`, { rate: 0.8 });
    } finally {
      setTimeout(() => setPlayingTone(null), 900);
    }
  };

  return (
    <section id="tones" className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clay-badge bg-rose-100 text-rose-900 text-xs font-black">
            <Music className="w-3.5 h-3.5 text-rose-600" />
            <span>Âm Điệu Chuẩn Bắc Kinh</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2d1b13] tracking-tight">
            Giải Mã 4 Thanh Điệu Không Hề Rối Não
          </h2>
          <p className="text-base text-[#5c3a25] font-medium">
            Người mới học tiếng Trung thường sợ nhầm thanh điệu dẫn đến nói sai nghĩa. Với phương
            pháp mô phỏng cao độ trực quan và ví dụ &ldquo;Mā Má Mǎ Mà&rdquo;, bạn sẽ ghi nhớ trong 5 phút!
          </p>
        </div>

        {/* 4 Tone Claymorphism Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TONES.map((tone) => (
            <div
              key={tone.toneNum}
              className={`${tone.colorClass} p-6 flex flex-col justify-between group relative overflow-hidden`}
            >
              <div className="space-y-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-white/90 shadow-sm">
                    {tone.symbol}
                  </span>
                  <span className="text-2xl group-hover:scale-125 transition-transform">
                    {tone.icon}
                  </span>
                </div>

                {/* Main Big Tone Preview */}
                <div className="text-center py-2 space-y-1">
                  <div className="text-5xl font-black text-[#2d1b13]">{tone.pinyin}</div>
                  <div className="text-2xl font-black text-orange-800">{tone.hanzi}</div>
                  <div className="text-xs font-bold text-slate-700">Nghĩa: {tone.meaning}</div>
                </div>

                {/* Pitch Contour SVG Curve */}
                <div className="p-3 rounded-2xl bg-white/90 border border-orange-100/80 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#683f2a]">
                    <span>Cao độ:</span>
                    <span className="font-mono text-orange-600">{tone.pitch}</span>
                  </div>
                  <div className="h-14 flex items-center justify-center">
                    <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      <line x1="5" y1="10" x2="95" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2" />
                      <line x1="5" y1="25" x2="95" y2="25" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2" />
                      <line x1="5" y1="40" x2="95" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2" />
                      {/* Pitch Curve */}
                      <path
                        d={tone.svgPath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="text-orange-500 drop-shadow-sm"
                      />
                    </svg>
                  </div>
                </div>

                {/* Metaphor hint */}
                <p className="text-xs text-[#52321e] italic leading-relaxed">{tone.metaphor}</p>
              </div>

              {/* Play Audio Button */}
              <div className="pt-5">
                <button
                  onClick={() => handlePlay(tone)}
                  className={`w-full clay-btn-white py-3 text-xs font-extrabold flex items-center justify-center gap-2 border border-orange-200/80 ${
                    playingTone === tone.toneNum ? "scale-105 ring-2 ring-orange-400 bg-orange-50" : ""
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-orange-600" />
                  <span>{playingTone === tone.toneNum ? "Đang phát âm..." : "Nghe Phát Âm Chuẩn"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

