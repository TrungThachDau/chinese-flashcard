import Link from "next/link";
import { Heart } from "lucide-react";
import { FooterNewsletter } from "./FooterNewsletter";
import { FooterWordOfDay } from "./FooterWordOfDay";

export const LandingFooter = () => {
  return (
    <footer className="pt-16 pb-12 px-4 sm:px-6 bg-[#fff2e4] border-t border-orange-200/80 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Col 1: Brand Info & Hanzi Sticker */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-3xl">
                🐼
              </div>
              <div>
                <span className="font-black text-xl text-[#2d1b13]">
                  BaoBao<span className="text-orange-500">Chinese</span>
                </span>
                <p className="text-xs text-orange-800/80 font-medium">
                  Nền Tảng Học Hán Ngữ Playful & Thông Minh
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#5c3a25] leading-relaxed max-w-sm">
              Ứng dụng phương pháp ghi nhớ khoa học kết hợp hình tượng hóa chữ Hán và ngữ âm
              chuẩn bản xứ để giúp việc học tiếng Trung trở nên dễ dàng, thú vị và tự nhiên.
            </p>

            <FooterWordOfDay />
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-950">
              Khám Phá & Học Tập
            </h4>
            <ul className="space-y-2 text-xs font-bold text-[#5c3a25]">
              <li>
                <Link href="/flashcards" className="hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span>🎴 Học Thẻ Từ Vựng (Học ngay)</span>
                </Link>
              </li>
              <li>
                <Link href="/vocab" className="hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span>📖 Kho Từ Vựng HSK 3.0</span>
                </Link>
              </li>
              <li>
                <Link href="/life-questions" className="hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span>💬 Phản Xạ Câu Hỏi Đời Sống</span>
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span>📊 Thống Kê Tiến Độ Học</span>
                </Link>
              </li>
              <li>
                <a href="#tones" className="hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span>🎵 Luyện 4 Thanh Điệu Chuẩn</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Newsletter & Daily tips */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-950">
              Mỗi Ngày 1 Mẹo Học Chữ Hán
            </h4>
            <p className="text-xs text-[#5c3a25] leading-relaxed">
              Đăng ký nhận bản tin ngắn 3 phút mỗi sáng: 1 câu chuyện bộ thủ, 1 thành ngữ đời sống
              và 3 từ vựng ứng dụng thực tế.
            </p>

            <FooterNewsletter />
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 border-t border-orange-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7c4d35] gap-3">
          <div>
            © 2026 BaoBao Chinese (Hán Ngữ Bảo Bảo). Bản quyền được bảo lưu.
          </div>
          <div className="flex items-center gap-1.5">
            <span>Thiết kế thân thiện, ấm áp</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline" />
            <span>dành cho người yêu tiếng Trung</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

