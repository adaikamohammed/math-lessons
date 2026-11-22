"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Gift,
  Trophy,
  Sparkles,
  Search,
  AlertCircle,
  ArrowRight,
  Award,
  Crown,
  Zap,
  CheckCircle2,
  Target,
  Flame,
} from "lucide-react";
import {
  RewardChallengeTier,
  RewardChallengeTierId,
  REWARD_TIERS,
  REWARD_REGULATION_NOTICE,
} from "@/lib/types";
import { Loading } from "@/components/ui";

interface StudentItem {
  studentName: string;
  className: string;
  tierId: RewardChallengeTierId;
}

export default function RewardsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<string[]>(["1م1", "1م2", "1م3", "2م3"]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    fetch(`/api/rewards?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.students) setStudents(data.students);
        if (data.classes) setClasses(data.classes);
      })
      .catch((err) => console.error("Error loading rewards:", err))
      .finally(() => setLoading(false));
  }, []);

  // تصفية التلاميذ حسب القسم وحسب البحث
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClass === "all" || s.className === selectedClass;
      const matchSearch =
        !search.trim() ||
        s.studentName.toLowerCase().includes(search.trim().toLowerCase()) ||
        s.className.toLowerCase().includes(search.trim().toLowerCase());
      return matchClass && matchSearch;
    });
  }, [students, selectedClass, search]);

  // تجميع التلاميذ حسب الفئات الأربعة
  const tierGroups = useMemo(() => {
    const map: Record<RewardChallengeTierId, StudentItem[]> = {
      tier1_remontada: [],
      tier2_full_mark: [],
      tier3_excellence: [],
      tier4_elite: [],
    };

    for (const s of filteredStudents) {
      if (map[s.tierId]) {
        map[s.tierId].push(s);
      }
    }

    return map;
  }, [filteredStudents]);

  const totalCount = filteredStudents.length;

  return (
    <div className="pb-16 pt-3 space-y-6 fade-up">
      {/* رأس الصفحة وزر الرجوع */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-200 transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>
        <div className="text-right">
          <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            مبادرة تحفيزية رسمية 🌟
          </span>
          <h1 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
            تحدي التفوق والهدايا والجوائز
          </h1>
        </div>
      </div>

      {/* بطاقة الواجهة الترحيبية والتحفيزية الفاخرة */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-850 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/40">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-5 text-center sm:text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-black text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>جوائز قيّمة بانتظار المجتهدين في اختبار مادة الرياضيات</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
              تحدي الهدايا والجوائز لجميع التلاميذ 🎁🏆
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              حرصاً من الأستاذ <strong>محمد عدايكة</strong> على بث روح التنافس الشريف وتشجيع كل
              تلميذ(ة) على بذل أقصى جهده في الاختبار، تم وضع هذا التحدي الشامل لجميع الأقسام. لا
              يوجد مستحيل، والفرصة مفتوحة أمام كل تلميذ لتحقيق القفزة ونيل هدية وتكريم استثنائي!
            </p>
          </div>

          {/* تنبيه تنظيمي هام جداً من الأستاذ */}
          <div className="bg-amber-500/15 border-2 border-amber-400/50 rounded-2xl p-4 text-right backdrop-blur-xs shadow-inner">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>تنبيه تنظيمي هام من الأستاذ:</span>
                </div>
                <p className="text-xs text-amber-100 leading-relaxed font-bold">
                  «{REWARD_REGULATION_NOTICE}»
                </p>
              </div>
            </div>
          </div>

          {/* شارة الخصوصية وحماية مشاعر التلاميذ */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-emerald-200/90 font-bold bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span>🔒</span>
            <span>
              <strong>مبدأ الخصوصية:</strong> علامات الفروض سرية تماماً ولا تظهر إطلاقاً، بل يُذكر
              اسم التلميذ ضمن فئة التحدي مع الشرط المطلوب لتحقيقه.
            </span>
          </div>
        </div>
      </div>

      {/* ================= قسم مصفوفة الشروط الأربعة بوضوح فائق ================= */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                ميثاق شروط التحديات الأربعة للفوز بالهدية
              </h3>
              <p className="text-[11px] text-slate-500">
                لكل تلميذ شرط واضح محدد بحسب فئته التنافسية لتحقيق الجائزة
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hidden sm:inline-block">
            4 فئات عادلة ومتكافئة
          </span>
        </div>

        {/* شبكة البطاقات التعريفية للشروط الأربعة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* الفئة 1 */}
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white p-4 rounded-2xl border-2 border-amber-300 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  ⚡
                </span>
                <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                  الفئة 1 (الريمونتادا)
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                تحدي القفزة الكبرى
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                موجه للتلاميذ الراغبين في التعويض وإثبات مستواهم الحقيقي.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-amber-200/80">
              <div className="text-[10px] font-bold text-amber-800 mb-1">شرط الفوز بالهدية:</div>
              <div className="text-xs font-black text-amber-950 bg-amber-100/80 p-2 rounded-xl text-center border border-amber-300/70 shadow-2xs">
                علامة الاختبار أكثر من 17 / 20
              </div>
            </div>
          </div>

          {/* الفئة 2 */}
          <div className="bg-gradient-to-br from-slate-400/10 via-slate-200/20 to-white p-4 rounded-2xl border-2 border-slate-300 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  🥈
                </span>
                <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  الفئة 2 (الفضي)
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                تحدي العلامة الكاملة
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                مضاعفة النتيجة والارتقاء إلى صدارة الرياضيات.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="text-[10px] font-bold text-slate-700 mb-1">شرط الفوز بالهدية:</div>
              <div className="text-xs font-black text-slate-900 bg-slate-100 p-2 rounded-xl text-center border border-slate-300 shadow-2xs">
                العلامة الكاملة 20 / 20 في الاختبار
              </div>
            </div>
          </div>

          {/* الفئة 3 */}
          <div className="bg-gradient-to-br from-yellow-500/15 via-amber-500/5 to-white p-4 rounded-2xl border-2 border-yellow-400 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  🥇
                </span>
                <span className="text-[10px] font-black text-yellow-900 bg-yellow-100 px-2 py-0.5 rounded-md border border-yellow-300">
                  الفئة 3 (الذهبي)
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                تحدي الامتياز الفصلي
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                التألق في مادة الرياضيات مع التميز في كل المواد.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <div className="text-[10px] font-bold text-yellow-800 mb-1">شرط الفوز بالهدية:</div>
              <div className="text-xs font-black text-amber-950 bg-yellow-100/90 p-2 rounded-xl text-center border border-yellow-300 shadow-2xs">
                اختبار 20 + معدل فصلي فوق 15
              </div>
            </div>
          </div>

          {/* الفئة 4 */}
          <div className="bg-gradient-to-br from-purple-500/15 via-indigo-500/5 to-white p-4 rounded-2xl border-2 border-purple-300 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  💎
                </span>
                <span className="text-[10px] font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                  الفئة 4 (الماسي)
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                تحدي النخبة والعباقرة
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                الحفاظ على قمة الهرم الدراسي والتألق المطلق.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <div className="text-[10px] font-bold text-purple-800 mb-1">شرط الفوز بالهدية:</div>
              <div className="text-xs font-black text-purple-950 bg-purple-100/90 p-2 rounded-xl text-center border border-purple-300 shadow-2xs">
                اختبار 20 + معدل فصلي فوق 18
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* شريط اختيار الأقسام ومربع البحث السريع */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* تبويبات الأقسام */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedClass("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                selectedClass === "all"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              جميع الأقسام ({students.length})
            </button>
            {classes.map((cls) => {
              const count = students.filter((s) => s.className === cls).length;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                    selectedClass === cls
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  قسم {cls} ({count})
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-bold text-slate-500">
            معروض الآن: <span className="text-emerald-700 font-black">{totalCount}</span> تلميذ
          </div>
        </div>

        {/* حقل البحث بالاسم */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن اسم التلميذ(ة) لمعرفة فئته والشرط المطلوب..."
            className="w-full text-xs font-bold p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        /* الفئات الأربعة وقوائم التلاميذ بتصميم أنيق ومحدث */
        <div className="space-y-6">
          {/* الفئة 1: تحدي الريمونتادا */}
          <TierCard
            tier={REWARD_TIERS[0]}
            students={tierGroups.tier1_remontada}
            icon={<Zap className="w-5 h-5 text-amber-500" />}
            headerBg="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700"
            borderClass="border-amber-300"
            badgeBg="bg-amber-100 text-amber-900"
            tagColor="text-amber-900 bg-amber-50 border-amber-200"
          />

          {/* الفئة 2: تحدي العلامة الكاملة */}
          <TierCard
            tier={REWARD_TIERS[1]}
            students={tierGroups.tier2_full_mark}
            icon={<Award className="w-5 h-5 text-slate-300" />}
            headerBg="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900"
            borderClass="border-slate-300"
            badgeBg="bg-slate-100 text-slate-800"
            tagColor="text-slate-800 bg-slate-50 border-slate-200"
          />

          {/* الفئة 3: تحدي الامتياز الفصلي */}
          <TierCard
            tier={REWARD_TIERS[2]}
            students={tierGroups.tier3_excellence}
            icon={<Trophy className="w-5 h-5 text-yellow-300" />}
            headerBg="bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-700"
            borderClass="border-yellow-300"
            badgeBg="bg-yellow-100 text-yellow-900"
            tagColor="text-yellow-900 bg-yellow-50 border-yellow-200"
          />

          {/* الفئة 4: تحدي النخبة والعباقرة */}
          <TierCard
            tier={REWARD_TIERS[3]}
            students={tierGroups.tier4_elite}
            icon={<Crown className="w-5 h-5 text-purple-300" />}
            headerBg="bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-950"
            borderClass="border-purple-300"
            badgeBg="bg-purple-100 text-purple-900"
            tagColor="text-purple-900 bg-purple-50 border-purple-200"
          />
        </div>
      )}

      {/* بطاقة توجيهية ختامية للأولياء والتلاميذ */}
      <div className="bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200 text-center space-y-2">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto font-black shadow-xs">
          🏆
        </div>
        <h4 className="text-xs sm:text-sm font-black text-slate-900">
          تمنياتنا بالتوفيق والنجاح لجميع أبنائنا وبناتنا التلاميذ!
        </h4>
        <p className="text-[11px] text-slate-600 max-w-lg mx-auto leading-relaxed">
          التكريم وتوزيع الجوائز والهدايا سيتم رسمياً وحضورياً داخل حجرة الدراسة بعد تصحيح أوراق
          الاختبار واستخراج كشوف النقاط الرسمية من طرف الأستاذ محمد عدايكة.
        </p>
      </div>
    </div>
  );
}

// مكون بطاقة الفئة المخصصة بتصميم أنيق ومحدث بدون أزرار رفع صور
function TierCard({
  tier,
  students,
  icon,
  headerBg,
  borderClass,
  badgeBg,
  tagColor,
}: {
  tier: RewardChallengeTier;
  students: StudentItem[];
  icon: React.ReactNode;
  headerBg: string;
  borderClass: string;
  badgeBg: string;
  tagColor: string;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div
      className={`bg-white rounded-3xl border-2 ${borderClass} shadow-sm overflow-hidden transition-all duration-300`}
    >
      {/* رأس الفئة */}
      <div className={`${headerBg} text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner border border-white/20">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs ${badgeBg}`}>
                {tier.badge}
              </span>
              <span className="text-xs text-white/90 font-bold">
                ({students.length} تلميذ مؤهل)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black leading-snug mt-0.5">
              {tier.name}
            </h3>
          </div>
        </div>

        {/* شارة شرط الجائزة البارزة جداً */}
        <div className="bg-white/20 backdrop-blur-xs border border-white/35 rounded-2xl p-2.5 sm:px-4 text-center shadow-xs">
          <div className="text-[10px] text-white/90 font-bold">شرط الحصول على الهدية 🎁:</div>
          <div className="text-xs sm:text-sm font-black text-white mt-0.5">
            {tier.conditionText}
          </div>
        </div>
      </div>

      {/* شريط توضيح الشرط بالتفصيل */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{tier.detailedCondition}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          {isExpanded ? "طي قائمة الأسماء ▲" : `عرض قائمة الأسماء (${students.length}) ▼`}
        </button>
      </div>

      {/* قائمة التلاميذ في هذه الفئة بتصميم بطاقات نقية بدون أزرار رفع صور */}
      {isExpanded && (
        <div className="p-3.5 sm:p-5">
          {students.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 font-bold">
              لا يوجد تلاميذ مسجلين في هذا القسم ضمن هذه الفئة
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {students.map((s, idx) => (
                <div
                  key={`${s.studentName}_${s.className}`}
                  className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 font-black text-[11px] flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 truncate group-hover:text-emerald-800 transition">
                        {s.studentName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                          قسم {s.className}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-1 rounded-lg border shrink-0 text-center shadow-2xs ${tagColor}`}
                    title={tier.detailedCondition}
                  >
                    {tier.conditionText}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
