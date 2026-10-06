import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "دروس الرياضيات | الأستاذ محمد عدايكة",
  description: "دروس الرياضيات للسنة الأولى والثانية متوسط - متوسطة باهي علي",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="mx-auto max-w-xl min-h-screen flex flex-col">
          <main className="flex-1 px-4 pb-10">{children}</main>
          <footer className="text-center text-xs text-slate-400 py-4">
            الأستاذ محمد عدايكة — متوسطة باهي علي
          </footer>
        </div>
      </body>
    </html>
  );
}
