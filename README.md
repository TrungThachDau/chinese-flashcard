This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies and run the development server:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tài khoản (tùy chọn)

Bạn có thể học mà không cần đăng nhập. Khi chưa đăng nhập, thanh điều hướng luôn có hai nút **Đăng nhập** và **Đăng ký**, cả khi chạy với SQLite cục bộ.

- **Đăng nhập** mở `/login`; **Đăng ký** mở thẳng tab tạo tài khoản tại `/login?mode=register`.
- Sau khi xác thực tài khoản Supabase, tiến độ học khách trên thiết bị được import vào tài khoản. Nếu import thất bại, dữ liệu cục bộ vẫn được giữ để thử lại.

## Kiểm thử (Vitest)

Chạy test một lần hoặc ở chế độ theo dõi thay đổi:

```bash
bun run test:run
bun run test
```

Đặt test cạnh mã nguồn trong `src/` với hậu tố `.test.ts`, `.test.tsx`, `.spec.ts` hoặc `.spec.tsx`. Test cần môi trường Node có thể khai báo `// @vitest-environment node` ở đầu file. Lưu ý `bun test` chạy test runner tích hợp của Bun, không phải Vitest. Vitest 5 và jsdom 31 yêu cầu Node.js 22.22.2 trở lên, 24.15 trở lên hoặc phiên bản 26 trở lên.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Backup & chuyển sang Supabase

Tiến độ học (thẻ SRS, lịch sử ôn, câu hỏi đời sống, cài đặt) được xuất ra một file JSON độc lập với database:

1. Sao lưu: mở `http://localhost:3000/api/export` (tải file `flashcard-progress-YYYY-MM-DD.json`). Khôi phục: `POST /api/import` với nội dung file đó (chạy lại nhiều lần vẫn an toàn).
2. Tạo bảng: chạy [`supabase/schema.sql`](supabase/schema.sql) trong SQL editor của Supabase.
3. Đẩy dữ liệu: 
   ```bash
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_USER_ID=<uuid> \
     node scripts/migrate-to-supabase.mjs flashcard-progress-YYYY-MM-DD.json --dry-run
   ```
   Bỏ `--dry-run` để ghi thật. Script upsert theo khóa tự nhiên nên chạy lại không bị trùng.

Thẻ được định danh bằng khóa ổn định `hanzi|pinyin` thay vì `id` tự tăng, nên không phụ thuộc vào database cục bộ. Khi bấm "Reset database", app tự lưu bản sao vào `data/backups/` trước khi xóa.
