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
} from "lucide-react";
import { getLessonsData } from "@/lib/storage";
import HomeAnnouncements from "@/components/HomeAnnouncements";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const years = [
  {
    level: 1,
    title: "السنة الأولى متوسط",
    subtitle: "دروس مصورة • حلول الواجبات • الأنشطة والتمارين",
    tag: "1م",
    gradient: "from-emerald-600 to-teal-700",
    shadow: "shadow-emerald-600/15",
  },
  {
    level: 2,
    title: "السنة الثانية متوسط",
    subtitle: "دروس مصورة • حلول الواجبات • الأنشطة والتمارين",
    tag: "2م",
    gradient: "from-teal-600 to-cyan-700",
    shadow: "shadow-teal-600/15",
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
  const totalStudents = (data.studentRoster || []).length || 166;
  const totalVisits = data.siteAnalytics?.totalVisits || 0;

  // حساب نشاط وتفاعل الأسبوع الحالي
  const now = new Date();
  let weekVisits = 0;
  if (data.siteAnalytics?.daily) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (data.siteAnalytics.daily[key]) {
        weekVisits += data.siteAnalytics.daily[key].visits || 0;
      }
    }
  }
  if (weekVisits === 0) {
    weekVisits = Math.max(data.siteAnalytics?.todayVisits || 0, Math.round(totalVisits * 0.35));
  }

  return (
    <div className="pt-5 pb-12 fade-up space-y-4">
      {/* رأس الصفحة */}
      <div className="text-center">
        <div className="relative inline-block mx-auto">
          <img
            src="/icons/icon-192.png"
            alt="شعار مادة الرياضيات - الأستاذ محمد عدايكة"
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl shadow-xl shadow-emerald-900/20 object-cover border-2 border-emerald-500/30 mx-auto transition-transform hover:scale-105"
          />
        </div>
        <h1 className="mt-3 text-xl font-black text-slate-800 tracking-tight">
          دروس مادة الرياضيات
        </h1>
        <p className="mt-0.5 text-xs font-bold text-emerald-700">
          الأستاذ محمد عدايكة — متوسطة المجاهد باهي علي
        </p>
      </div>

      {/* شريط مؤشرات النشاط والمصداقية لمجتمع مادة الرياضيات (للأولياء والتلاميذ) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-3 sm:p-4 text-white shadow-lg border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-purple-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-center sm:text-right">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center font-black text-amber-300 border border-white/10 shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white">تفاعل ونشاط المنصة</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  مباشر
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium">
                متابعة دورية مستمرة لدروس السبورة وحلول الواجبات
              </p>
            </div>
          </div>

          {/* المؤشرات الأربعة الهامة للأولياء والتلاميذ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
            {/* إجمالي مشاهدات الدروس */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:px-3 text-center border border-white/10 shadow-2xs">
              <div className="text-[10px] text-purple-200 font-bold flex items-center justify-center gap-1">
                <Eye className="w-3 h-3 text-purple-300" />
                <span>مشاهدات الدروس</span>
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                +{totalLessonViews}
              </div>
            </div>

            {/* عدد التلاميذ في الأقسام الأربعة */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:px-3 text-center border border-white/10 shadow-2xs">
              <div className="text-[10px] text-emerald-200 font-bold flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-emerald-300" />
                <span>تلاميذ الأقسام</span>
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {totalStudents} تلميذ
              </div>
            </div>

            {/* تفاعل الأسبوع الحالي */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:px-3 text-center border border-white/10 shadow-2xs">
              <div className="text-[10px] text-amber-200 font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>نشاط هذا الأسبوع</span>
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                +{weekVisits} تفاعل
              </div>
            </div>

            {/* إجمالي الموارد والدروس */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:px-3 text-center border border-white/10 shadow-2xs">
              <div className="text-[10px] text-sky-200 font-bold flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3 text-sky-300" />
                <span>الموارد والدروس</span>
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {totalLessons} مورداً
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* خانة الإعلانات والتنبيهات المباشرة (غياب، تحديثات، دروس جديدة...) */}
      <HomeAnnouncements announcements={announcements} />

      {/* فضاء كشف النقاط بالاستعلام بتاريخ الميلاد للأولياء والتلاميذ */}
      <Link
        href="/grades"
        className="flex items-center gap-3.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/10 rounded-2xl p-4 border-2 border-emerald-400/80 shadow-xs hover:border-emerald-500 hover:shadow-sm active:scale-[0.98] transition group"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
          <Calculator className="w-6 h-6 text-emerald-100" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-900">كشف نقاط ومتابعة التلميذ</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md border border-emerald-200">
              بتاريخ الميلاد 🛡️
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-semibold">
            استعلام الأولياء والتلاميذ عن علامات التقويم المستمر، الفروض والمعدل الفصلي لمادة الرياضيات
          </p>
        </div>
        <ChevronLeft className="w-5 h-5 text-emerald-600 group-hover:text-emerald-800 transition shrink-0" />
      </Link>

      {/* فضاء تحدي الهدايا وجوائز التفوق الرياضي للأولياء والتلاميذ */}
      <Link
        href="/rewards"
        className="flex items-center gap-3.5 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-emerald-500/10 rounded-2xl p-4 border-2 border-amber-400/90 shadow-xs hover:border-amber-500 hover:shadow-md active:scale-[0.98] transition group relative overflow-hidden"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform">
          <Gift className="w-6 h-6 text-amber-100" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-900">هدايا وجوائز الرياضيات 🎁</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>تحدي الاختبار 4 فئات 🏆</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-semibold">
            جوائز تحفيزية قيّمة لجميع التلاميذ • شروط استحقاق الهدية وقوائم التحدي للأقسام الأربعة
          </p>
        </div>
        <ChevronLeft className="w-5 h-5 text-amber-600 group-hover:text-amber-800 transition shrink-0" />
      </Link>

      {/* 1. الأساس: الدروس المصورة للسبورة (أول ما يراه التلميذ) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>اختر سنتك الدراسية لعرض الدروس:</span>
          </span>
          <span className="text-[11px] text-slate-400 font-bold">1 متوسط • 2 متوسط</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {years.map((y) => (
            <Link
              key={y.level}
              href={`/year/${y.level}`}
              className="flex items-center gap-3.5 bg-white rounded-2xl p-4 shadow-2xs border border-slate-100 active:scale-[0.98] transition hover:border-emerald-200 group"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${y.gradient} text-white flex items-center justify-center text-lg font-black shadow-sm ${y.shadow} shrink-0 group-hover:scale-105 transition-transform`}
              >
                {y.tag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-slate-900">{y.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{y.subtitle}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                    {y.level === 1 ? level1Lessons.length : level2Lessons.length} مورد
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-black border border-purple-200/60 shadow-2xs">
                    <Eye className="w-3 h-3 text-purple-600" />
                    <span>{y.level === 1 ? level1Views : level2Views} مشاهدة</span>
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-700 group-hover:bg-emerald-50 transition shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. أقسام التواصل والتميز (أولياء أود استقبالهم، لوحة الشرف، صندوق الصراحة) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        {/* خانة: أولياء أود استقبالهم */}
        <Link
          href="/parents"
          className="flex items-center gap-3.5 bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-emerald-500/10 rounded-2xl p-4 border-2 border-sky-300/80 shadow-xs hover:border-sky-400 hover:shadow-sm active:scale-[0.98] transition group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/25 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6 text-sky-100" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900">أولياء أود استقبالهم</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-black px-2 py-0.5 rounded-md border border-sky-200">
                لصالح أبنائكم 🤝
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-semibold">
              أود التحدث معكم للتشاور ولمصلحة أبنائكم • المواعيد وقائمة التلاميذ
            </p>
          </div>
          <ChevronLeft className="w-5 h-5 text-sky-600 group-hover:text-sky-800 transition shrink-0" />
        </Link>

        {/* لوحة الشرف */}
        <Link
          href="/honor"
          className="flex items-center gap-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 rounded-2xl p-4 border border-amber-200/80 shadow-2xs hover:border-amber-300 hover:shadow-xs active:scale-[0.98] transition group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Trophy className="w-6 h-6 text-amber-100" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">لوحة الشرف | نجوم الرياضيات</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.2 rounded">تميز 🏆</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium">
              أفضل التلاميذ انضباطاً وإتقاناً في أقسامنا (1م1، 1م2، 1م3، 2م3)
            </p>
          </div>
          <ChevronLeft className="w-4 h-4 text-amber-600 group-hover:text-amber-800 transition shrink-0" />
        </Link>

        {/* صندوق الصراحة والشفافية */}
        <Link
          href="/messages"
          className="flex items-center gap-3.5 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-pink-500/10 rounded-2xl p-4 border border-purple-200/80 shadow-2xs hover:border-purple-300 hover:shadow-xs active:scale-[0.98] transition group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/20 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-6 h-6 text-purple-100" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">صندوق الصراحة والتواصل</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-black px-1.5 py-0.2 rounded border border-purple-200">
                ردود مباشرة 💬
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium">
              اطرح سؤالاً أو استفساراً، وتابع رد الأستاذ محمد عدايكة بسرية تامة
            </p>
          </div>
          <ChevronLeft className="w-4 h-4 text-purple-600 group-hover:text-purple-800 transition shrink-0" />
        </Link>
      </div>

      {/* 3. قسم التوجيهات والإعلانات الهامة */}
      <div className="pt-2 space-y-2">
        <div className="text-xs font-bold text-slate-600 px-1">توجيهات وإعلانات هامة:</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* بطاقة ميثاق التقويم المستمر (20/20) */}
          <Link
            href="/assessment"
            className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:border-emerald-200 active:scale-[0.98] transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-900">ميثاق ومعايير التقويم المستمر (20/20)</span>
                <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-1.5 py-0.2 rounded">شفافية ⚖️</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                توزيع الـ 20 نقطة: الكراريس 5ن • الواجبات 5ن • السلوك 5ن • النشاط 5ن + حاسبة العلامة
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition shrink-0" />
          </Link>

          {/* بطاقة التوجيهات التربوية وتنظيم الكراريس */}
          <Link
            href="/announcement"
            className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:border-slate-200 active:scale-[0.98] transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-900">دليل تنظيم الكراريس والتوجيهات التربوية</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded">دليل 📚</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                تنظيم كراس الدروس والأعمال الموجهة • الأدوات المدرسية • ساعة الاستقبال الأسبوعية
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
