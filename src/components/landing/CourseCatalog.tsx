"use client";

import React, { useState } from "react";
import { BookOpen, Clock, Users, Star, ArrowRight, Check, Volume2, X, Sparkles } from "lucide-react";
import { playChineseAudio } from "@/lib/tts";

interface Course {
  id: string;
  category: "beginner" | "intermediate" | "hanzi" | "practical";
  levelBadge: string;
  titleZh: string;
  titleVi: string;
  icon: string;
  bgClass: string;
  accentColor: string;
  lessons: number;
  vocabCount: number;
  rating: number;
  studentsCount: string;
  description: string;
  highlights: string[];
  sampleWord: {
    hanzi: string;
    pinyin: string;
    meaning: string;
  };
  syllabus: string[];
}

const COURSES: Course[] = [
  {
    id: "hsk1",
    category: "beginner",
    levelBadge: "HSK 1 • Vỡ Lòng",
    titleZh: "零基础入门",
    titleVi: "Panda Starter: Phát Âm Pinyin & 150 Chữ Hán Cốt Lõi",
    icon: "🐼",
    bgClass: "clay-card-peach",
    accentColor: "text-orange-600 bg-orange-100",
    lessons: 36,
    vocabCount: 150,
    rating: 4.9,
    studentsCount: "12,400+",
    description:
      "Dành cho người chưa biết gì. Làm chủ 4 thanh điệu, ngữ âm Pinyin chuẩn Bắc Kinh, 150 từ vựng và tự tin chào hỏi cơ bản.",
    highlights: [
      "Luyện phát âm chuẩn với video khẩu hình",
      "150 Thẻ flashcard SRS có audio bản xứ",
      "Ghi nhớ các nét và quy tắc bút thuận",
    ],
    sampleWord: {
      hanzi: "你好",
      pinyin: "nǐ hǎo",
      meaning: "Xin chào bạn",
    },
    syllabus: [
      "Bài 1-4: Làm chủ 21 thanh mẫu, 36 vận mẫu và 4 thanh điệu",
      "Bài 5-10: Các nét chữ Hán, thứ tự bút thuận và bộ thủ thường gặp",
      "Bài 11-20: Đại từ nhân xưng, số đếm, ngày tháng và chào hỏi xã giao",
      "Bài 21-30: Giới thiệu bản thân, quốc gia, sở thích và gia đình",
      "Bài 31-36: Ôn tập tổng hợp, mô phỏng bài thi HSK 1 đạt điểm tối đa",
    ],
  },
  {
    id: "hsk2",
    category: "beginner",
    levelBadge: "HSK 2 • Tiền Trung Cấp",
    titleZh: "生活日常对话",
    titleVi: "Dim Sum Daily: Đàm Thoại Đời Sống & Mua Sắm",
    icon: "🥟",
    bgClass: "clay-card-amber",
    accentColor: "text-amber-700 bg-amber-100",
    lessons: 48,
    vocabCount: 300,
    rating: 4.9,
    studentsCount: "9,800+",
    description:
      "Tự tin đi lại, mua sắm, gọi món dim sum và hỏi đường tại Trung Quốc. Nâng vốn từ lên 300 chữ với 50 tình huống sinh tồn.",
    highlights: [
      "50 Tình huống giao tiếp thực chiến đời sống",
      "300 Thẻ SRS lặp lại ngắt quãng SM-2",
      "Mẹo ghép từ logic không cần học vẹt",
    ],
    sampleWord: {
      hanzi: "多少钱",
      pinyin: "duōshao qián",
      meaning: "Bao nhiêu tiền?",
    },
    syllabus: [
      "Bài 1-10: Mua sắm hàng hóa, hỏi giá cả và mặc cả nhẹ nhàng",
      "Bài 11-20: Đi nhà hàng gọi món lẩu, trà sữa và thanh toán WeChat/Alipay",
      "Bài 21-30: Đi lại bằng tàu điện ngầm, taxi, máy bay và hỏi đường",
      "Bài 31-40: Thời tiết, sức khỏe, khám bệnh và sinh hoạt hàng ngày",
      "Bài 41-48: Luyện đề HSK 2 và phản xạ đàm thoại với người bản ngữ",
    ],
  },
  {
    id: "hsk3",
    category: "intermediate",
    levelBadge: "HSK 3 • Trung Cấp",
    titleZh: "流利表达进阶",
    titleVi: "Dragon Explorer: Diễn Đạt Tự Nhiên & Du Lịch",
    icon: "🐉",
    bgClass: "clay-card-coral",
    accentColor: "text-rose-600 bg-rose-100",
    lessons: 60,
    vocabCount: 600,
    rating: 4.8,
    studentsCount: "7,500+",
    description:
      "Bứt phá rào cản ngữ pháp phức. Tự do diễn đạt cảm xúc, kể chuyện đời thường và giao lưu công việc bằng tiếng Trung trôi chảy.",
    highlights: [
      "600 Thẻ SRS từ vựng liên kết theo chủ đề",
      "Luyện viết đoạn văn và cấu trúc câu phức",
      "10 Bộ đề thi thử HSK 3 sát đề thật 100%",
    ],
    sampleWord: {
      hanzi: "明白",
      pinyin: "míngbai",
      meaning: "Hiểu rõ / Rõ ràng",
    },
    syllabus: [
      "Bài 1-15: Cấu trúc câu bổ ngữ kết quả, bổ ngữ xu hướng",
      "Bài 16-30: Đàm thoại công sở, trao đổi công việc và thư từ",
      "Bài 31-45: Kể lại trải nghiệm, biểu đạt cảm xúc và quan điểm",
      "Bài 46-60: Chiến lược làm bài thi HSK 3 phần Nghe, Đọc, Viết",
    ],
  },
  {
    id: "hsk4",
    category: "intermediate",
    levelBadge: "HSK 4 • Nâng Cao",
    titleZh: "文化与商务精通",
    titleVi: "Silk Road Master: Đọc Báo, Văn Hóa & Thành Ngữ",
    icon: "📜",
    bgClass: "clay-card-mint",
    accentColor: "text-emerald-700 bg-emerald-100",
    lessons: 72,
    vocabCount: 1200,
    rating: 4.9,
    studentsCount: "5,200+",
    description:
      "Chinh phục 1,200 từ vựng cốt lõi. Đọc hiểu bài báo tin tức, hiểu 80% lời thoại phim ảnh và dùng thành ngữ (成语) tự nhiên.",
    highlights: [
      "Kho 1,200 thẻ từ vựng nâng cao kèm ngữ cảnh",
      "Phân tích 50 thành ngữ Trung Hoa phổ biến",
      "Kỹ năng dịch thuật và giao tiếp thương mại",
    ],
    sampleWord: {
      hanzi: "坚持",
      pinyin: "jiānchí",
      meaning: "Kiên trì / Bền chí",
    },
    syllabus: [
      "Bài 1-20: Cụm từ cố định, liên từ phức hợp và phong cách văn viết",
      "Bài 21-40: Đọc hiểu bài luận ngắn, tin tức kinh tế xã hội",
      "Bài 41-60: Điển tích thành ngữ thông dụng và văn hóa ứng xử",
      "Bài 61-72: Luyện đề tổng hợp HSK 4 cam kết đạt điểm cao",
    ],
  },
  {
    id: "hanzi-magic",
    category: "hanzi",
    levelBadge: "Chuyên Đề • 214 Bộ Thủ",
    titleZh: "汉字演变魔法",
    titleVi: "Hanzi Magic: Giải Mã 214 Bộ Thủ Bằng Tranh Vẽ",
    icon: "🖌️",
    bgClass: "clay-card",
    accentColor: "text-purple-700 bg-purple-100",
    lessons: 30,
    vocabCount: 450,
    rating: 4.9,
    studentsCount: "8,900+",
    description:
      "Biến những nét chữ vuông vức thành câu chuyện tranh vẽ thú vị. Hiểu nguồn gốc chữ Giáp Cốt Văn để nhìn chữ là nhớ ngay nghĩa.",
    highlights: [
      "Minh họa hoạt hình từng bước chuyển đổi từ Giáp cốt đến Chữ giản thể",
      "Mẹo ghép bộ thủ đoán nghĩa từ mới không cần tra từ điển",
      "Tập viết chữ đẹp với thước đo nét bút chuẩn xác",
    ],
    sampleWord: {
      hanzi: "休",
      pinyin: "xiū",
      meaning: "Nghỉ ngơi (Người 亻 tựa vào Cây 木)",
    },
    syllabus: [
      "Chuyên đề 1: Lục thư và bí ẩn nguồn gốc chữ Hán",
      "Chuyên đề 2: Bộ thủ về Tự nhiên (Nhật, Nguyệt, Thủy, Hỏa, Mộc, Thổ)",
      "Chuyên đề 3: Bộ thủ về Con người & Bộ phận cơ thể (Nhân, Khẩu, Mục, Thủ)",
      "Chuyên đề 4: Bộ thủ về Động vật & Cuộc sống (Mã, Điểu, Ngư, Khuyển)",
      "Chuyên đề 5: Mẹo chiết tự nhớ 500 chữ Hán khó nhất",
    ],
  },
  {
    id: "practical-travel",
    category: "practical",
    levelBadge: "Cấp Tốc • Du Lịch & Taobao",
    titleZh: "实战速成指南",
    titleVi: "Thực Chiến: Du Lịch Trung Quốc & Chat Đặt Hàng Taobao",
    icon: "🛍️",
    bgClass: "clay-card-peach",
    accentColor: "text-amber-700 bg-amber-100",
    lessons: 24,
    vocabCount: 250,
    rating: 4.9,
    studentsCount: "6,100+",
    description:
      "Khóa học bỏ túi dành cho người đi du lịch tự túc hoặc chủ shop đánh hàng Quảng Châu, trao đổi trực tiếp với xưởng không cần qua môi giới.",
    highlights: [
      "Bộ mẫu câu copy-paste chat trực tiếp với shop Taobao/1688",
      "Xử lý khiếu nại, vận chuyển và đổi trả hàng",
      "Audio offline phát âm khẩn cấp khi đi du lịch",
    ],
    sampleWord: {
      hanzi: "包邮",
      pinyin: "bāoyóu",
      meaning: "Freeship (Bao cước vận chuyển)",
    },
    syllabus: [
      "Phần 1: Cài đặt và sử dụng ứng dụng thanh toán Alipay, WeChat Pay",
      "Phần 2: Mẫu câu hỏi kích thước, chất liệu, số lượng và trả giá sỉ",
      "Phần 3: Check-in khách sạn, đặt vé tàu cao tốc và gọi xe Didi",
      "Phần 4: Xử lý tình huống khẩn cấp: thất lạc hành lý, hỏi đường",
    ],
  },
];

interface CourseCatalogProps {
  onOpenEnroll: (courseTitle?: string) => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ onOpenEnroll }) => {
  const [activeTab, setActiveTab] = useState<"all" | "beginner" | "intermediate" | "hanzi" | "practical">("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const filteredCourses =
    activeTab === "all"
      ? COURSES
      : COURSES.filter((c) => c.category === activeTab);

  const handlePlaySample = async (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlayingAudio(text);
    try {
      await playChineseAudio(text);
    } finally {
      setTimeout(() => setPlayingAudio(null), 1000);
    }
  };

  return (
    <section id="courses" className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clay-badge bg-orange-100 text-orange-800 text-xs font-black">
            <span>📚 Kho Khóa Học HSK 3.0 Toàn Diện</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2d1b13] tracking-tight">
            Lộ Trình Học Rõ Ràng Cho Mọi Mục Tiêu
          </h2>
          <p className="text-base text-[#5c3a25] font-medium">
            Từng khóa học được thiết kế bằng tư duy gamification trực quan, tích hợp thuật toán
            lặp lại ngắt quãng để bạn tiến bộ nhanh nhất mà không bị quá tải.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {[
            { id: "all", label: "✨ Tất cả khóa học" },
            { id: "beginner", label: "🐼 Vỡ lòng (HSK 1-2)" },
            { id: "intermediate", label: "🐉 Trung cấp (HSK 3-4)" },
            { id: "hanzi", label: "🖌️ Chữ Hán & Bộ thủ" },
            { id: "practical", label: "🛍️ Du lịch & Taobao" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all ${
                activeTab === tab.id
                  ? "clay-btn-coral shadow-md text-white scale-105"
                  : "bg-white/80 hover:bg-orange-50 text-[#50301d] border border-orange-200/80 shadow-sm"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Course Grid with Claymorphism Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`${course.bgClass} p-6 sm:p-7 flex flex-col justify-between group relative overflow-hidden`}
            >
              {/* Top Row: Badge & Rating */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${course.accentColor}`}
                  >
                    {course.levelBadge}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{course.rating}</span>
                    <span className="text-amber-500 font-normal">({course.studentsCount})</span>
                  </div>
                </div>

                {/* Course Icon & Chinese Title */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-14 h-14 rounded-2xl clay-bubble bg-white flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    {course.icon}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-orange-600/80 tracking-widest uppercase">
                      {course.titleZh}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-[#2d1b13] leading-snug line-clamp-2">
                      {course.titleVi}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#5c3a25] leading-relaxed line-clamp-3">
                  {course.description}
                </p>

                {/* Quick Metrics */}
                <div className="flex items-center gap-4 py-2 text-xs font-bold text-[#6d4630] border-y border-orange-100">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                    <span>{course.lessons} bài học</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{course.vocabCount} từ vựng SRS</span>
                  </div>
                </div>

                {/* Highlights List */}
                <ul className="space-y-1.5 pt-1">
                  {course.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#52331f]">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample Interactive Chip & Buttons */}
              <div className="pt-6 space-y-3">
                {/* Sample Pronunciation Chip */}
                <div className="clay-inset p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-orange-700 font-bold uppercase block">
                      Từ mẫu bài 1:
                    </span>
                    <span className="font-black text-sm text-[#2d1b13] mr-1.5">
                      {course.sampleWord.hanzi}
                    </span>
                    <span className="text-orange-700 font-bold text-xs mr-1">
                      ({course.sampleWord.pinyin})
                    </span>
                    <span className="text-slate-600 text-[11px]">- {course.sampleWord.meaning}</span>
                  </div>
                  <button
                    onClick={(e) => handlePlaySample(course.sampleWord.hanzi, e)}
                    title="Nghe phát âm từ mẫu"
                    className="p-1.5 rounded-xl bg-white shadow-sm text-orange-600 hover:scale-110 transition-transform"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="clay-btn-white py-2.5 text-xs font-bold text-[#43281c] hover:text-orange-600 border border-orange-200"
                  >
                    Xem Đề Cương
                  </button>
                  <button
                    onClick={() => onOpenEnroll(course.titleVi)}
                    className="clay-btn-coral py-2.5 text-xs font-black shadow-sm"
                  >
                    Đăng Ký Học
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Detail Syllabus Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl clay-card bg-white p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl shadow-sm">
                  {selectedCourse.icon}
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    {selectedCourse.levelBadge}
                  </span>
                  <h3 className="text-xl font-black text-[#2d1b13] mt-1">{selectedCourse.titleVi}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-2 rounded-full hover:bg-orange-50 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#5c3a25] leading-relaxed">{selectedCourse.description}</p>

            {/* Syllabus Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-[#2d1b13] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-orange-500" />
                Đề cương chi tiết ({selectedCourse.lessons} bài học)
              </h4>
              <div className="space-y-2">
                {selectedCourse.syllabus.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-2xl bg-orange-50/70 border border-orange-100/80 text-xs font-medium text-[#402617] flex items-center gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="pt-4 border-t border-orange-100 flex items-center justify-between gap-4">
              <div className="text-xs text-[#6e4632]">
                <span className="font-bold">Đã bao gồm:</span> 100% video bài giảng, audio native & thẻ
                SRS không giới hạn.
              </div>
              <button
                onClick={() => {
                  const title = selectedCourse.titleVi;
                  setSelectedCourse(null);
                  onOpenEnroll(title);
                }}
                className="clay-btn-coral px-5 py-3 text-xs sm:text-sm font-black shrink-0"
              >
                Nhận Khóa Học Miễn Phí
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

