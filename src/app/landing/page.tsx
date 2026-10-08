import { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';
import './landing.css';

export const metadata: Metadata = {
  title: 'BaoBao Chinese | Nền Tảng Học Tiếng Trung Claymorphism Thú Vị',
  description:
    'Chinh phục tiếng Trung chuẩn HSK 3.0 với thẻ học Claymorphism 3D, thuật toán lặp lại ngắt quãng (SM-2 SRS), phát âm chuẩn bản xứ và lộ trình gamified từng bước.',
};

export default function LandingPageRoute() {
  return <LandingPage />;
}
