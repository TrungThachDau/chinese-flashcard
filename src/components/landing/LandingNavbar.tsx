"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, BookOpen, Flame, MessageCircle, Menu, X, ArrowRight } from "lucide-react";
import { useLandingEnroll } from "./LandingEnrollProvider";

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openEnroll } = useLandingEnroll();

  return (
    <header className="sticky top-0 z-50 w-full px-3 sm:px-6 pt-3 pb-2 backdrop-blur-md bg-[#fff8f0]/85 transition-all border-b border-orange-100/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/landing" className="flex items-center gap-2.5 group select-none">
          <img
            src="/icons/icon.svg"
            alt="BaoBao Chinese Logo"
            width={44}
            height={44}
            className="w-11 h-11 rounded-2xl shadow-md shadow-orange-300/40 group-hover:scale-105 transition-transform object-contain"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-[#43281c] group-hover:text-orange-600 transition-colors">
                BaoBao<span className="text-orange-500">Chinese</span>
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                HSK 3.0
              </span>
            </div>
            <p className="text-[11px] font-medium text-orange-800/70 -mt-0.5">
              Học Tiếng Trung Vui Vẻ & Nhớ Lâu
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 bg-white/90 px-3 py-1.5 rounded-full border border-orange-200/80 shadow-sm shadow-orange-100">
          <a
            href="#courses"
            className="px-3 py-1.5 rounded-full text-xs font-bold text-[#5c3a21] hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-500" />
            Khóa học
          </a>
          <a
            href="#progress-demo"
            className="px-3 py-1.5 rounded-full text-xs font-bold text-[#5c3a21] hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Cách ghi nhớ
          </a>
          <a
            href="#tones"
            className="px-3 py-1.5 rounded-full text-xs font-bold text-[#5c3a21] hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            Luyện thanh điệu
          </a>
          <a
            href="#testimonials"
            className="px-3 py-1.5 rounded-full text-xs font-bold text-[#5c3a21] hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
            Học viên
          </a>
          <a
            href="#faq"
            className="px-3 py-1.5 rounded-full text-xs font-bold text-[#5c3a21] hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            Hỏi đáp
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/flashcards"
            className="hidden sm:inline-flex clay-btn-white px-3.5 py-2 text-xs font-bold text-[#43281c] hover:text-orange-600"
          >
            Mở Ứng Dụng Học Thẻ
          </Link>
          <button
            onClick={() => openEnroll()}
            className="clay-btn-coral px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold shadow-md flex items-center gap-1.5"
          >
            <span>Học Thử 7 Ngày</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-2xl bg-white border border-orange-200 text-[#43281c] shadow-sm"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 bg-white/95 backdrop-blur-lg rounded-3xl border border-orange-200 shadow-xl space-y-2 animate-in fade-in slide-in-from-top-2">
          <a
            href="#courses"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2.5 rounded-2xl font-bold text-sm text-[#43281c] hover:bg-orange-50"
          >
            <BookOpen className="w-4 h-4 text-orange-500" />
            Khóa học HSK 3.0
          </a>
          <a
            href="#progress-demo"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2.5 rounded-2xl font-bold text-sm text-[#43281c] hover:bg-orange-50"
          >
            <Flame className="w-4 h-4 text-amber-500" />
            Trải nghiệm phương pháp nhớ lâu
          </a>
          <a
            href="#tones"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2.5 rounded-2xl font-bold text-sm text-[#43281c] hover:bg-orange-50"
          >
            <Sparkles className="w-4 h-4 text-rose-500" />
            Luyện 4 thanh điệu chuẩn bản xứ
          </a>
          <a
            href="#testimonials"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2.5 rounded-2xl font-bold text-sm text-[#43281c] hover:bg-orange-50"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            Cảm nhận học viên
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2.5 rounded-2xl font-bold text-sm text-[#43281c] hover:bg-orange-50"
          >
            Câu hỏi thường gặp
          </a>
          <div className="pt-2 border-t border-orange-100 flex flex-col gap-2">
            <Link
              href="/flashcards"
              className="clay-btn-white py-2.5 text-center text-xs font-bold"
            >
              Mở Ứng Dụng Học Thẻ
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openEnroll();
              }}
              className="clay-btn-coral py-2.5 text-center text-xs font-extrabold"
            >
              🎉 Đăng Ký Miễn Phí Ngay
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

