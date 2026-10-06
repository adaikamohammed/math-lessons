import Link from "next/link";
import { ChevronLeft, Sparkles, BookOpen, Calendar, Clock, Megaphone } from "lucide-react";

const years = [
  {
    level: 1,
    title: "السنة الأولى متوسط",
    subtitle: "دروس وملخصات السبورة",
    tag: "1م",
    gradient: "from-emerald-600 to-teal-600",
    shadow: "shadow-emerald-600/15",
  },
  {
    level: 2,
    title: "السنة الثانية متوسط",
    subtitle: "دروس وملخصات السبورة",
    tag: "2م",
    gradient: "from-sky-600 to-indigo-600",
    shadow: "shadow-sky-600/15",
  },
];

export default function Home() {
  return (
    <div className="pt-6 pb-12 fade-up space-y-5">
      {/* رأس الصفحة والهوية */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-emerald-600/20">
          ∑
        </div>
        <h1 className="mt-3.5 text-2xl font-black text-slate-800 tracking-tight">
          دروس مادة الرياضيات
        </h1>
        <p className="mt-1 text-xs font-bold text-emerald-700">
          الأستاذ محمد عدايكة — متوسطة المجاهد باهي علي
        </p>
      </div>

      {/* بطاقة الإعلان الهام والتوجيهات (بارزة جداً للأولياء والتلاميذ) */}
      <Link
        href="/announcement"
        className="block bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-3xl p-5 text-white shadow-md shadow-amber-600/20 active:scale-[0.98] transition group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-10 -translate-y-10 pointer-events-none"></div>

        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[11px] font-black border border-white/20">
              <Megaphone className="w-3.5 h-3.5 animate-pulse" /> إعلان هام وتوجيهات العام
            </span>
            <span className="text-[11px] bg-white text-amber-900 font-extrabold px-2.5 py-0.5 rounded-lg shadow-2xs">
              جديد
            </span>
          </div>

          <div>
            <h2 className="text-base font-black text-white leading-snug">
              حصص الدعم المدرسي، تنظيم الكراريس واستقبال الأولياء
            </h2>
            <p className="text-xs text-amber-100 mt-1 line-clamp-2 leading-relaxed">
              انطلاق دروس الدعم بأكاديمية ستار سكول (1م و 2م)، شروط الكراريس والـ 5 نقاط في التقويم، وميثاق العدل في التنقيط.
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs font-bold text-white border-t border-white/20">
            <span className="text-[11px] text-amber-100 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> الانطلاق 10 أكتوبر 2026
            </span>
            <span className="inline-flex items-center gap-1 text-white font-extrabold group-hover:translate-x-1 transition-transform">
              <span>قراءة التفاصيل كاملة</span>
              <ChevronLeft className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>

      {/* قسم اختيار المستوى الدراسي */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold text-slate-700">اختر سنتك الدراسية لعرض الدروس:</span>
          <span className="text-[11px] text-slate-400">1 متوسط • 2 متوسط</span>
        </div>

        <div className="space-y-3">
          {years.map((y) => (
            <Link
              key={y.level}
              href={`/year/${y.level}`}
              className={`flex items-center gap-4 bg-white rounded-2xl p-4.5 shadow-sm border border-slate-100 active:scale-[0.98] transition hover:border-slate-200 group`}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${y.gradient} text-white flex items-center justify-center text-xl font-black shadow-md ${y.shadow} shrink-0 group-hover:scale-105 transition-transform`}
              >
                {y.tag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-extrabold text-slate-800">{y.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{y.subtitle}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition">
                <ChevronLeft className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
