"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <div
          key={idx}
          className="clay-card bg-white p-5 sm:p-6 transition-all border border-orange-100"
        >
          <button
            onClick={() => toggle(idx)}
            className="w-full flex items-center justify-between text-left gap-4"
          >
            <span className="text-sm sm:text-base font-black text-[#2d1b13] flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs flex items-center justify-center shrink-0 font-bold">
                Q
              </span>
              {faq.question}
            </span>
            <div
              className={`p-1.5 rounded-full bg-orange-50 text-orange-600 shrink-0 transition-transform duration-200 ${
                openIdx === idx ? "rotate-180 bg-orange-200" : ""
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>

          {openIdx === idx && (
            <div className="pt-4 mt-3 border-t border-orange-100 text-xs sm:text-sm text-[#5c3a25] leading-relaxed animate-in fade-in slide-in-from-top-1">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}