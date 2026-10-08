"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Tôi chưa từng học tiếng Trung và không biết gì về chữ Hán thì có theo được không?",
    answer:
      "Hoàn toàn được! Lộ trình Panda Starter (HSK 1) được thiết kế riêng cho người bắt đầu từ con số 0. Bạn sẽ bắt đầu từ bảng chữ cái Pinyin, cách phát âm 4 thanh điệu với hình ảnh minh họa sinh động, sau đó mới đến các nét chữ Hán và bộ thủ qua câu chuyện liên tưởng dễ nhớ.",
  },
  {
    question: "Phương pháp lặp lại ngắt quãng (SM-2 SRS) hoạt động như thế nào?",
    answer:
      "Não bộ con người thường quên 70% kiến thức mới sau 24-48 giờ nếu không ôn tập. Thuật toán Spaced Repetition (SRS) tính toán chu kỳ quên tự nhiên: từ khó sẽ được nhắc lại sau vài phút hoặc ngày mai, từ bạn đã nhớ vừa sẽ nhắc lại sau 3 ngày, còn từ dễ sẽ xuất hiện sau 1 tuần. Nhờ đó, bạn tốn ít thời gian nhất nhưng nhớ lâu nhất vào trí nhớ dài hạn.",
  },
  {
    question: "Mỗi ngày tôi cần dành bao nhiêu thời gian để có kết quả tốt?",
    answer:
      "Chỉ cần 10 - 15 phút mỗi ngày! Tính nhất quán quan trọng hơn học dồn dập. Với 15 phút mỗi ngày cùng chuỗi streak liên tục, bạn có thể tích lũy và ghi nhớ bền vững hơn 300 từ vựng và đàm thoại cơ bản chỉ sau 1 tháng.",
  },
  {
    question: "Giọng đọc phát âm trên nền tảng có chuẩn giọng Bắc Kinh không?",
    answer:
      "Chính xác 100%. Nền tảng tích hợp công nghệ giọng đọc chuẩn phổ thông (Putonghua) chất lượng cao và video khẩu hình trực quan, giúp bạn nghe rõ sự khác biệt giữa các âm cuốn lưỡi (zh, ch, sh) và các thanh điệu khó.",
  },
  {
    question: "Tôi có thể học trên điện thoại và lưu dữ liệu offline không?",
    answer:
      "Có! Ứng dụng hỗ trợ Progressive Web App (PWA) tối ưu hoàn hảo cho cả iOS và Android. Bạn có thể cài đặt trực tiếp lên màn hình chính, ôn tập flashcard mượt mà và đồng bộ tiến độ tự động khi có kết nối mạng.",
  },
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clay-badge bg-orange-100 text-orange-900 text-xs font-black">
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>Giải Đáp Thắc Mắc</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#2d1b13] tracking-tight">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-base text-[#5c3a25] font-medium">
            Tất cả những điều bạn cần biết trước khi bắt đầu hành trình học tiếng Trung cùng BaoBao Chinese.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
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
      </div>
    </section>
  );
};

