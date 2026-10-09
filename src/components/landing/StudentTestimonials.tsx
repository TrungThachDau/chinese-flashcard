"use client";

import React, { useState } from "react";
import { Star, Heart, CheckCircle2, Quote, Sparkles } from "lucide-react";

interface Testimonial {
  id: string;
  category: "hsk" | "travel" | "busy";
  name: string;
  role: string;
  achievement: string;
  avatar: string;
  bgClass: string;
  accentBadge: string;
  stars: number;
  content: string;
  favoriteWord: { hanzi: string; pinyin: string; meaning: string };
  initialLikes: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    category: "hsk",
    name: "Linh Đan",
    role: "Nhân viên Marketing • TP.HCM",
    achievement: "Đỗ HSK 4 (285/300) sau 4 tháng",
    avatar: "👩🏻‍💼",
    bgClass: "clay-card-peach",
    accentBadge: "bg-orange-100 text-orange-800",
    stars: 5,
    content:
      "Trước đây mình từng mua rất nhiều sách nhưng chỉ học được 2 tuần là bỏ vì hoa mắt với chữ Hán. Nhờ phương pháp nhắc ôn đúng lúc của BaoBao Chinese, mỗi ngày mình chỉ cần mở ứng dụng 15 phút. Đi thi HSK 4 đạt 285 điểm, vượt xa kỳ vọng!",
    favoriteWord: { hanzi: "坚持", pinyin: "jiānchí", meaning: "Kiên trì" },
    initialLikes: 124,
  },
  {
    id: "2",
    category: "busy",
    name: "Minh Khoa",
    role: "Kỹ sư phần mềm • Hà Nội",
    achievement: "Duy trì Streak 65 ngày liên tục",
    avatar: "🧑🏻‍💻",
    bgClass: "clay-card-amber",
    accentBadge: "bg-amber-100 text-amber-900",
    stars: 5,
    content:
      "Giao diện mềm mại, ấm cúng và cực kỳ hút mắt! Tính năng tự động tính toán thời điểm vàng để ôn từ giúp mình không phải bận tâm 'hôm nay ôn gì'. Đi làm cả ngày về mệt nhưng mở ra học 10 từ thấy thư giãn như chơi game.",
    favoriteWord: { hanzi: "代码", pinyin: "dàimǎ", meaning: "Mã nguồn code" },
    initialLikes: 89,
  },
  {
    id: "3",
    category: "hsk",
    name: "Thảo My",
    role: "Sinh viên ĐHQG Hà Nội",
    achievement: "Điểm tuyệt đối phần Nghe HSK 3",
    avatar: "👧🏻",
    bgClass: "clay-card-coral",
    accentBadge: "bg-rose-100 text-rose-800",
    stars: 5,
    content:
      "Giọng đọc audio trên nền tảng cực kỳ tự nhiên và chuẩn giọng Bắc Kinh. Phần luyện 4 thanh điệu với hình ảnh cánh chim và tên lửa giúp mình sửa hẳn tật ngọng thanh 3 và thanh 4. Bạn bè trong lớp ai cũng khen phát âm hay!",
    favoriteWord: { hanzi: "梦想", pinyin: "mèngxiǎng", meaning: "Ước mơ" },
    initialLikes: 142,
  },
  {
    id: "4",
    category: "travel",
    name: "David Trần",
    role: "Chủ shop thời trang Taobao",
    achievement: "Chat trực tiếp với xưởng không cần dịch",
    avatar: "👨🏻‍💼",
    bgClass: "clay-card-mint",
    accentBadge: "bg-emerald-100 text-emerald-800",
    stars: 5,
    content:
      "Khóa đàm phán Taobao và giao tiếp du lịch quá thực tế. Sau 1 tháng, mình đã có thể tự chat mặc cả với bên xưởng Quảng Châu, giải quyết khiếu nại hoàn tiền ngon lành mà không phải mất phí thuê phiên dịch.",
    favoriteWord: { hanzi: "合作", pinyin: "hézuò", meaning: "Hợp tác" },
    initialLikes: 95,
  },
  {
    id: "5",
    category: "busy",
    name: "Hải Yến",
    role: "Mẹ bỉm sữa • Cùng học với bé 6 tuổi",
    achievement: "Bé thuộc 100 chữ Hán tượng hình",
    avatar: "👩🏻",
    bgClass: "clay-card",
    accentBadge: "bg-purple-100 text-purple-800",
    stars: 5,
    content:
      "Phần giải mã 214 bộ thủ bằng tranh vẽ hoạt hình là đỉnh nhất! Bé nhà mình mê mẩn nhìn chữ 'Hưu' người tựa vào gốc cây hay chữ 'Minh' gồm mặt trời và mặt trăng. Hai mẹ con học cùng nhau rất ấm áp và gắn kết.",
    favoriteWord: { hanzi: "光明", pinyin: "guāngmíng", meaning: "Tươi sáng" },
    initialLikes: 110,
  },
  {
    id: "6",
    category: "travel",
    name: "Quốc Huy",
    role: "Freelance Designer",
    achievement: "Tự túc du lịch Thành Đô - Trùng Khánh",
    avatar: "🎒",
    bgClass: "clay-card-peach",
    accentBadge: "bg-orange-100 text-orange-800",
    stars: 5,
    content:
      "Vừa rồi mình đi du lịch Tứ Xuyên 10 ngày. Nhờ bộ thẻ câu hỏi sinh tồn đời sống của app, mình tự tin gọi món lẩu cay tê, hỏi tàu điện ngầm và bắt chuyện với người bản xứ. Giao diện ứng dụng thì đẹp mắt và dễ thương miễn bàn!",
    favoriteWord: { hanzi: "旅行", pinyin: "lǚxíng", meaning: "Du lịch" },
    initialLikes: 167,
  },
];

export const StudentTestimonials: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "hsk" | "travel" | "busy">("all");
  const [likes, setLikes] = useState<Record<string, number>>(
    TESTIMONIALS.reduce((acc, t) => ({ ...acc, [t.id]: t.initialLikes }), {})
  );
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const handleLike = (id: string) => {
    if (likedMap[id]) {
      setLikes((prev) => ({ ...prev, [id]: prev[id] - 1 }));
      setLikedMap((prev) => ({ ...prev, [id]: false }));
    } else {
      setLikes((prev) => ({ ...prev, [id]: prev[id] + 1 }));
      setLikedMap((prev) => ({ ...prev, [id]: true }));
    }
  };

  const filtered =
    filter === "all"
      ? TESTIMONIALS
      : TESTIMONIALS.filter((t) => t.category === filter);

  return (
    <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clay-badge bg-emerald-100 text-emerald-900 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Câu Chuyện Thực Tế Từ 45,000+ Học Viên</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2d1b13] tracking-tight">
            Niềm Vui Khi Thấy Tiếng Trung Tiến Bộ Từng Ngày
          </h2>
          <p className="text-base text-[#5c3a25] font-medium">
            Lắng nghe cảm nhận chân thực từ những học viên đã thay đổi cách học tiếng Trung nhờ
            giao diện thân thiện và phương pháp ghi nhớ tự nhiên.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "🌟 Tất cả cảm nhận" },
            { id: "hsk", label: "🎯 Thi đỗ chứng chỉ HSK" },
            { id: "travel", label: "✈️ Du lịch & Đặt hàng" },
            { id: "busy", label: "⏰ Người đi làm bận rộn" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
                filter === tab.id
                  ? "clay-btn-coral text-white shadow-md scale-105"
                  : "bg-white/80 text-[#50301d] border border-orange-200/80 hover:bg-orange-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Testimonials Masonry / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`${item.bgClass} p-6 sm:p-7 flex flex-col justify-between group relative`}
            >
              <div className="space-y-4">
                {/* User Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl border border-orange-100">
                      {item.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-black text-[#2d1b13] text-sm">
                        <span>{item.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-[11px] text-[#714730] font-medium">{item.role}</div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex text-amber-400">
                    {Array.from({ length: item.stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Achievement Badge */}
                <div>
                  <span
                    className={`inline-block text-[11px] font-black px-2.5 py-1 rounded-full ${item.accentBadge}`}
                  >
                    🏆 {item.achievement}
                  </span>
                </div>

                {/* Content Quote */}
                <p className="text-xs sm:text-sm text-[#4d2d1b] leading-relaxed relative">
                  &ldquo;{item.content}&rdquo;
                </p>
              </div>

              {/* Bottom: Favorite Word & Heart Like */}
              <div className="pt-5 mt-4 border-t border-orange-100/80 flex items-center justify-between">
                <div className="text-[11px]">
                  <span className="text-orange-700 font-bold">Từ yêu thích: </span>
                  <span className="font-black text-[#2d1b13]">{item.favoriteWord.hanzi}</span>
                  <span className="text-orange-800 font-medium"> ({item.favoriteWord.pinyin})</span>
                </div>

                <button
                  onClick={() => handleLike(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                    likedMap[item.id]
                      ? "bg-rose-100 text-rose-600 scale-105"
                      : "bg-white/80 text-slate-500 hover:text-rose-500"
                  }`}
                  title="Thả tim cảm nhận"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      likedMap[item.id] ? "fill-rose-500 text-rose-500" : ""
                    }`}
                  />
                  <span>{likes[item.id]}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

