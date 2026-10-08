"use client";

import React, { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { X, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

interface EnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourseTitle?: string;
}

export const EnrollModal: React.FC<EnrollModalProps> = ({
  isOpen,
  onClose,
  selectedCourseTitle,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("hsk");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSuccess(true);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#fbbf24", "#10b981", "#f43f5e"],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg clay-card bg-white p-6 sm:p-8 space-y-5 relative shadow-2xl border-4 border-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-orange-50 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center space-y-5 py-4 animate-in zoom-in-95">
            <div className="text-5xl">🐼✨</div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[#2d1b13]">Kích Hoạt Thành Công!</h3>
              <p className="text-xs sm:text-sm text-[#5c3a25]">
                Tài khoản học thử 7 ngày miễn phí của <strong>{name}</strong> đã sẵn sàng.
                {selectedCourseTitle && (
                  <span className="block mt-1 text-orange-600 font-bold">
                    Khóa học đã chọn: {selectedCourseTitle}
                  </span>
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-50 text-xs text-left text-slate-700 space-y-1 border border-orange-100">
              <div>Email: <strong>{email}</strong></div>
              <div>Quyền lợi: Miễn phí 100% kho từ vựng SRS & audio bản xứ.</div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/flashcards"
                onClick={onClose}
                className="clay-btn-coral py-3 text-sm font-black shadow-md"
              >
                🚀 Vào Học Flashcard SRS Ngay
              </Link>
              <button
                onClick={onClose}
                className="clay-btn-white py-2.5 text-xs font-bold text-[#43281c]"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center space-y-1 pr-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full clay-badge bg-orange-100 text-orange-900 text-[11px] font-black">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>Trải Nghiệm 7 Ngày Không Ràng Buộc</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#2d1b13]">
                {selectedCourseTitle ? "Đăng Ký Học Khóa" : "Bắt Đầu Học Tiếng Trung"}
              </h3>
              {selectedCourseTitle ? (
                <p className="text-xs text-orange-700 font-bold">{selectedCourseTitle}</p>
              ) : (
                <p className="text-xs text-[#7c4d35]">
                  Điền thông tin để nhận tài khoản học thử miễn phí ngay
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#432414] block">Họ và tên</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 rounded-2xl bg-orange-50/60 border border-orange-200 text-sm font-medium text-[#2d1b13] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#432414] block">Email của bạn</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@gmail.com"
                className="w-full px-4 py-2.5 rounded-2xl bg-orange-50/60 border border-orange-200 text-sm font-medium text-[#2d1b13] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#432414] block">Mục tiêu học tập</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-orange-50/60 border border-orange-200 text-xs sm:text-sm font-medium text-[#2d1b13] focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="hsk">Chinh phục chứng chỉ HSK</option>
                <option value="travel">Giao tiếp du lịch & Đặt hàng</option>
                <option value="work">Công việc & Thương mại</option>
                <option value="hobby">Sở thích & Xem phim</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full clay-btn-coral py-3.5 text-sm font-black shadow-md flex items-center justify-center gap-2 group"
              >
                <span>Nhận Tài Khoản Trải Nghiệm</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Không cần nhập thẻ tín dụng • Hủy bất cứ lúc nào</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

