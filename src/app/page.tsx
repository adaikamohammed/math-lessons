import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Megaphone,
  Users,
  BookOpen,
  Trophy,
  Scale,
  MessageSquare,
  Lock,
  Calculator,
  Eye,
  Gift,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Award,
} from "lucide-react";
import { getLessonsData } from "@/lib/storage";
import HomeAnnouncements from "@/components/HomeAnnouncements";
import PublicStatsToggle from "@/components/PublicStatsToggle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const years = [
  {
    level: 1,
    title: "السنة الأولى متوسط",
    subtitle: "دروس مصورة للسبورة • حلول الواجبات والتمارين",
    tag: "1م",
    gradient: "from-emerald-600 to-teal-700",
    shadow: "shadow-emerald-600/20",
    border: "border-emerald-200/90 hover:border-emerald-400",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    level: 2,
    title: "السنة الثانية متوسط",
    subtitle: "دروس مصورة للسبورة • حلول الواجبات والتمارين",
    tag: "2م",
    gradient: "from-teal-600 to-cyan-700",
    shadow: "shadow-teal-600/20",
    border: "border-teal-200/90 hover:border-teal-400",
    badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
  },
];

export default async function Home() {
  const data = await getLessonsData();
  const announcements = data.announcements || [];
  const level1Lessons = (data.lessons || []).filter((l) => l.level === 1);
  const level2Lessons = (data.lessons || []).filter((l) => l.level === 2);
  const level1Views = level1Lessons.reduce((sum, l) => sum + (l.views || 0), 0);
  const level2Views = level2Lessons.reduce((sum, l) => sum + (l.views || 0), 0);
  const totalLessonViews = level1Views + level2Views;
  const totalLessons = (data.lessons || []).length;
  const totalVisits = data.siteAnalytics?.totalVisits || 0;
  const uniqueDevices =
    data.siteAnalytics?.uniqueDevicesCount ||
    Object.keys(data.siteAnalytics?.knownDevices || {}).length ||
    102;
  const todayVisits = data.siteAnalytics?.todayVisits || 0;

  return (
    <div className="pt-3 pb-12 fade-up space-y-4 max-w-5xl mx-auto px-1 sm:px-2" dir="rtl">
      {/* 1. رأس الصفحة الرسمي الأنيق */}
      <div className="text-center pt-2">
        <div className="relative inline-block mx-auto">
          <img
            src="/icons/icon-192.png"
            alt="شعار مادة الرياضيات - الأستاذ محمد عدايكة"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-xl shadow-emerald-900/20 object-cover border-2 border-emerald-500/30 mx-auto transition-transform hover:scale-105"
          />
        </div>
        <h1 className="mt-2.5 text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          دروس مادة الرياضيات
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm font-bold text-emerald-700">
          الأستاذ محمد عدايكة — متوسطة المجاهد باهي علي
        </p>
      </div>

      {/* 2. شريط الإحصائيات المدمج القابل للتوسيع (يأخذ مساحة صغيرة افتراضياً ويفتح عند الضغط) */}
      <PublicStatsToggle
        totalViews={totalLessonViews}
        uniqueDevices={uniqueDevices}
        totalVisits={totalVisits}
        totalLessons={totalLessons}
        todayVisits={todayVisits}
      />

      {/* 3. شريط الإعلانات والتنبيهات المباشرة (إن وُجدت) */}
      <HomeAnnouncements announcements={announcements} />

      {/* 4. [في القمة والصدارة]: الدروس المصورة للسنة الأولى والثانية متوسط */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>اختر سنتك الدراسية لعرض الدروس والواجبات:</span>
          </span>
          <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
            1 متوسط • 2 متوسط
          </span>
        </div>

        {/* بطاقتا 1م و 2م بتصميم بارز وواضح جداً */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {years.map((y) => {
            const count = y.level === 1 ? level1Lessons.length : level2Lessons.length;
            const views = y.level === 1 ? level1Views : level2Views;

            return (
              <Link
                key={y.level}
                href={`/year/${y.level}`}
                className={`flex items-center gap-3.5 bg-white rounded-2xl p-4 sm:p-5 shadow-xs border-2 ${y.border} active:scale-[0.98] transition group relative overflow-hidden`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${y.gradient} text-white flex items-center justify-center text-xl font-black shadow-md ${y.shadow} shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {y.tag}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 group-hover:text-emerald-800 transition">
                      {y.title}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${y.badgeBg}`}>
                      {y.tag}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium line-clamp-1">
                    {y.subtitle}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-bold">
                      {count} مورداً تعليمياً
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md font-black border border-purple-200/70 shadow-2xs">
                      <Eye className="w-3.5 h-3.5 text-purple-600" />
                      <span>{views} مشاهدة</span>
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-700 group-hover:bg-emerald-50 transition shrink-0 border border-slate-100">
                  <ChevronLeft className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. [خدمات المتابعة والنتائج والجوائز]: كشف النقاط + محاكي المعدل + تحدي الجوائز */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>خدمات المتابعة والنتائج والجوائز (للتلاميذ والأولياء):</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
            استعلام • محاكاة • تحفيز
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* كشف النقاط بالاستعلام بتاريخ الميلاد */}
          <Link
            href="/grades"
            className="flex flex-col justify-between bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white rounded-2xl p-4 border border-emerald-300/80 shadow-2xs hover:border-emerald-400 hover:shadow-xs active:scale-[0.98] transition group"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Calculator className="w-5 h-5 text-emerald-100" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900 truncate">كشف نقاط التلميذ</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded border border-emerald-200">
                    بتاريخ الميلاد 🛡️
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 font-medium">
                  استعلام عن علامات التقويم، الفروض والمعدل الفصلي لمادة الرياضيات
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-emerald-100/60 text-xs font-bold text-emerald-700 group-hover:text-emerald-900">
              <span>عرض كشف النقاط</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          </Link>

          {/* محاكي معدل مادة الرياضيات (مبسط بدون قوانين) */}
          <Link
            href="/calculator"
            className="flex flex-col justify-between bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-white rounded-2xl p-4 border border-teal-300/80 shadow-2xs hover:border-teal-400 hover:shadow-xs active:scale-[0.98] transition group"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-teal-100" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900 truncate">محاكي معدل الرياضيات</span>
                  <span className="text-[9px] bg-teal-100 text-teal-800 font-black px-1.5 py-0.2 rounded border border-teal-200">
                    معامل 2 و 3 🧮
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 font-medium">
                  جرّب علامة الاختبار وتعرف على معدلك ومجموع نقاطك بلمسة واحدة
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-teal-100/60 text-xs font-bold text-teal-700 group-hover:text-teal-900">
              <span>بدء المحاكاة الفورية</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          </Link>

          {/* هدايا وجوائز الرياضيات (تحدي الاختبار) */}
          <Link
            href="/rewards"
            className="flex flex-col justify-between bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-white rounded-2xl p-4 border border-amber-300/80 shadow-2xs hover:border-amber-400 hover:shadow-xs active:scale-[0.98] transition group"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5 text-amber-100" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900 truncate">هدايا وجوائز التفوق</span>
                  <span className="text-[9px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded border border-amber-200">
                    4 فئات 🎁
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 font-medium">
                  جوائز تحفيزية قيّمة • شروط استحقاق الهدية وقوائم التحدي للأقسام
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-amber-100/60 text-xs font-bold text-amber-800 group-hover:text-amber-950">
              <span>عرض شروط وقوائم التحدي</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* 6. [فضاءات التميز والتواصل المدرسي]: أولياء أود استقبالهم + لوحة الشرف + صندوق الصراحة */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sky-600" />
            <span>فضاءات التواصل والتميز المدرسي:</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
            تشاور • تكريم • سرية تامة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* أولياء أود استقبالهم */}
          <Link
            href="/parents"
            className="flex items-center gap-3 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-white rounded-2xl p-3.5 border border-sky-200/90 shadow-2xs hover:border-sky-300 hover:shadow-xs active:scale-[0.98] transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/20 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-sky-100" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-slate-900 truncate">أولياء أود استقبالهم</span>
                <span className="text-[9px] bg-sky-100 text-sky-800 font-black px-1.5 py-0.2 rounded border border-sky-200">
                  تشاور 🤝
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-medium">
                مواعيد المقابلة وقوائم التلاميذ للتشاور لمصلحة أبنائكم
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-sky-600 group-hover:text-sky-800 transition shrink-0" />
          </Link>

          {/* لوحة الشرف */}
          <Link
            href="/honor"
            className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white rounded-2xl p-3.5 border border-amber-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs active:scale-[0.98] transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-amber-100" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-slate-900 truncate">لوحة الشرف والنجوم</span>
                <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.2 rounded">
                  تميز 🏆
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-medium">
                أفضل التلاميذ انضباطاً وإتقاناً في الأقسام الأربعة
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-amber-600 group-hover:text-amber-800 transition shrink-0" />
          </Link>

          {/* صندوق الصراحة والتواصل */}
          <Link
            href="/messages"
            className="flex items-center gap-3 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-white rounded-2xl p-3.5 border border-purple-200/90 shadow-2xs hover:border-purple-300 hover:shadow-xs active:scale-[0.98] transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/20 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5 text-purple-100" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-slate-900 truncate">صندوق الصراحة والتواصل</span>
                <span className="text-[9px] bg-purple-100 text-purple-800 font-black px-1.5 py-0.2 rounded border border-purple-200">
                  سرية 💬
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-medium">
                اطرح استفسارك وتابع رد الأستاذ محمد بسرية وشفافية
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-purple-600 group-hover:text-purple-800 transition shrink-0" />
          </Link>
        </div>
      </div>

      {/* 7. [التوجيهات التربوية والدليل المدرسي]: ميثاق التقويم + دليل تنظيم الكراريس */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-teal-600" />
            <span>التوجيهات التربوية وتنظيم العمل:</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* ميثاق ومعايير التقويم المستمر (20/20) */}
          <Link
            href="/assessment"
            className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs hover:border-emerald-200 active:scale-[0.98] transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-slate-900">ميثاق التقويم المستمر (20/20)</span>
                <span className="text-[9px] bg-teal-50 text-teal-800 font-bold px-1.5 py-0.2 rounded">شفافية ⚖️</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                توزيع الـ 20 نقطة: الكراريس 5ن • الواجبات 5ن • السلوك 5ن • النشاط 5ن
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition shrink-0" />
          </Link>

          {/* دليل تنظيم الكراريس والتوجيهات */}
          <Link
            href="/announcement"
            className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs hover:border-slate-300 active:scale-[0.98] transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-slate-900">دليل تنظيم الكراريس والتوجيهات</span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded">دليل 📚</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                تنظيم كراس الدروس والأعمال الموجهة • الأدوات المدرسية • ساعة الاستقبال
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
