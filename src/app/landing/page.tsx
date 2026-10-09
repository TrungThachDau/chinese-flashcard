import { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';
import './landing.css';

export const metadata: Metadata = {
  title: 'BaoBao Chinese | Học Tiếng Trung Chuẩn HSK 3.0 Nhớ Lâu & Vui Vẻ',
  description:
    'Chinh phục tiếng Trung chuẩn HSK 3.0 với thẻ học hình ảnh sinh động, phương pháp ôn tập nhớ lâu khoa học, phát âm chuẩn bản xứ và lộ trình từng bước dễ dàng.',
};

export default function LandingPageRoute() {
  return <LandingPage />;
}
