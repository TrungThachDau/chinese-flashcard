"use client";

import React, { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, HeartHandshake, Zap } from "lucide-react";
import { useLandingEnroll } from "./LandingEnrollProvider";

export const EnrollmentCTA: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetGoal, setTargetGoal] = useState("hsk");
  const [currentLevel, setCurrentLevel] = useState("zero");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedCourseTitle } = useLandingEnroll();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f97316", "#fbbf24", "#f43f5e", "#10b981", "#8b5cf6"],
      });
    }, 600);
  };

  return (
    <section id="enroll" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Big Claymorphism Warm Container */}
        <div className="clay-card p-8 sm:p-12 lg:p-16 relative bg-gradient-to-br from-[#fff7f0] via-[#fff1e6] to-[#ffe9db] border-4 border-white shadow-2xl overflow-hidden">
          {/* Decorative Floating Badges */}
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-orange-300/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-amber-300/25 rounded-full blur-2xl pointer-events-none" />

          {isSubmitted ? (
            /* SUCCESS STATE */
            <div className="text-center space-y-6 py-6 animate-in zoom-in-95 duration-300 max-w-xl mx-auto">
              <div className="w-20 h-20 rounded-3xl clay-bubble bg-white mx-auto flex items-center justify-center text-5xl">
                🐼🎉
              </div>
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Đăng Ký Thành Công
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#2d1b13]">
                  Chào mừng {name} đến với BaoBao Chinese!
                </h3>
                <p className="text-sm text-[#5c3a25] leading-relaxed">
                  Tài khoản học thử 7 ngày miễn phí đã sẵn sàng. Bạn có thể bắt đầu lật thẻ từ vựng
                  hoặc làm quen với bài tập phản xạ ngay lúc này!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/90 border border-orange-200/80 text-xs text-left space-y-2">
                <div className="font-bold text-[#2d1b13] flex items-center justify-between">
                  <span>Thông tin đăng ký:</span>
                  <span className="text-orange-600 font-extrabold">Đã kích hoạt</span>
                </div>
                <div className="text-slate-600">Email: <strong className="text-[#2d1b13]">{email}</strong></div>
                <div className="text-slate-600">
                  Mục tiêu: <strong className="text-[#2d1b13]">{targetGoal === "hsk" ? "Thi chứng chỉ HSK" : targetGoal === "travel" ? "Du lịch & Giao tiếp" : "Công việc & Kinh doanh"}</strong>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/flashcards"
                  className="w-full sm:w-auto clay-btn-coral px-8 py-3.5 text-sm font-black shadow-lg"
                >
                  🚀 Bắt Đầu Học Từ Vựng Ngay
                </Link>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="w-full sm:w-auto clay-btn-white px-6 py-3.5 text-xs font-bold text-[#43281c]"
                >
                  Đăng ký người khác
                </button>
              </div>
            </div>
          ) : (
            /* ENROLLMENT FORM STATE */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Heading & Value props */}
              <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full clay-badge bg-orange-100 text-orange-900 text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Ưu Đãi Đặc Biệt Hôm Nay</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-[#2d1b13] tracking-tight leading-tight">
                  Bắt Đầu Hành Trình Tiếng Trung Ngay Hôm Nay
                </h2>

                <p className="text-sm sm:text-base text-[#5c3a25] leading-relaxed">
                  Nhận ngay trọn gói 7 ngày trải nghiệm miễn phí: toàn bộ khóa học HSK 1-3, kho
                  1,200 thẻ ghi nhớ thông minh và giọng đọc phát âm chuẩn không giới hạn.
                </p>

                {/* Trust Points */}
                <div className="space-y-2.5 pt-2 text-xs sm:text-sm font-semibold text-[#4e2f1c]">
                  <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Miễn phí 100% trong 7 ngày - Không cần thẻ tín dụng</span>
                  </div>
                  <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Kích hoạt tự động tức thì, vào học chỉ sau 10 giây</span>
                  </div>
                  <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                    <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Lưu tiến độ mượt mà trên Điện thoại & Máy tính</span>
                  </div>
                </div>
              </div>

              {/* Right Column: High-touch Form */}
              <div className="lg:col-span-6">
                <form
                  onSubmit={handleSubmit}
                  className="clay-card bg-white/95 p-6 sm:p-8 space-y-4 shadow-xl border-2 border-white"
                >
                  <div className="text-center pb-2 border-b border-orange-100">
                    <h3 className="text-lg font-black text-[#2d1b13]">Đăng Ký Học Thử Miễn Phí</h3>
                    <p className="text-xs text-[#7c4d35]">
                      {selectedCourseTitle
                        ? `Đăng ký khóa học: ${selectedCourseTitle}`
                        : "Điền thông tin để nhận tài khoản trải nghiệm 7 ngày"}
                    </p>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#432414] block">Họ và tên của bạn</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full px-4 py-2.5 rounded-2xl bg-orange-50/60 border border-orange-200 text-sm font-medium text-[#2d1b13] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#432414] block">Email nhận tài khoản</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tenban@gmail.com"
                      className="w-full px-4 py-2.5 rounded-2xl bg-orange-50/60 border border-orange-200 text-sm font-medium text-[#2d1b13] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  {/* Target Goal Select */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#432414] block">Mục tiêu học chính</label>
                    <select
                      value={targetGoal}
                      onChange={(e) => setTargetGoal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-orange-50/60 border border-orange-200 text-xs sm:text-sm font-medium text-[#2d1b13] focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="hsk">Thi chứng chỉ HSK 1 - 4</option>
                      <option value="travel">Giao tiếp du lịch & Đặt hàng Taobao</option>
                      <option value="work">Công việc & Giao tiếp thương mại</option>
                      <option value="fun">Sở thích, xem phim & thần tượng</option>
                    </select>
                  </div>

                  {/* Current Level Select */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#432414] block">Trình độ hiện tại</label>
                    <select
                      value={currentLevel}
                      onChange={(e) => setCurrentLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-orange-50/60 border border-orange-200 text-xs sm:text-sm font-medium text-[#2d1b13] focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="zero">Chưa biết gì (Người mới bắt đầu số 0)</option>
                      <option value="pinyin">Đã biết phát âm Pinyin cơ bản</option>
                      <option value="hsk1">Đã học xong HSK 1</option>
                      <option value="hsk2">Đã học xong HSK 2 trở lên</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full clay-btn-coral py-3.5 text-sm font-black shadow-lg shadow-orange-400/30 flex items-center justify-center gap-2 group disabled:opacity-70"
                    >
                      <span>{isLoading ? "Đang chuẩn bị..." : "🎉 Nhận Tài Khoản Học Thử Miễn Phí"}</span>
                      {!isLoading && (
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-[#82543d]">
                    Bằng việc đăng ký, bạn đồng ý trải nghiệm miễn phí 7 ngày không cam kết ràng buộc.
                  </p>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

