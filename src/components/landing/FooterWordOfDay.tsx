"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { playChineseAudio } from "@/services/tts.service";

export function FooterWordOfDay() {
  const [isPlayingWord, setIsPlayingWord] = useState(false);

  const handlePlayWord = async () => {
    setIsPlayingWord(true);
    try {
      await playChineseAudio("快乐 kuàilè", { rate: 0.85 });
    } finally {
      setTimeout(() => setIsPlayingWord(false), 900);
    }
  };

  return (
    <div className="clay-card bg-white p-3.5 max-w-xs flex items-center justify-between border border-orange-200/80">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-2xl text-orange-800">
          乐
        </div>
        <div>
          <div className="text-[10px] font-extrabold text-orange-600 uppercase">
            Chữ Hán Hôm Nay
          </div>
          <div className="text-xs font-black text-[#2d1b13]">快乐 (kuàilè)</div>
          <div className="text-[11px] text-slate-500">Ý nghĩa: Niềm vui, vui vẻ</div>
        </div>
      </div>
      <button
        onClick={handlePlayWord}
        title="Nghe phát âm"
        className={`p-2 rounded-xl bg-orange-50 text-orange-600 hover:scale-110 transition-transform ${
          isPlayingWord ? "ring-2 ring-orange-400" : ""
        }`}
      >
        <Volume2 className="w-4 h-4" />
      </button>
    </div>
  );
}