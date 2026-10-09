import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hán Ngữ - Học Từ Vựng Tiếng Trung HSK 3.0',
    short_name: 'Hán Ngữ',
    description: 'Học từ vựng tiếng Trung chuẩn HSK 3.0 thông minh với phương pháp nhắc ôn đúng lúc và phát âm chuẩn bản xứ',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#f59e0b',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

