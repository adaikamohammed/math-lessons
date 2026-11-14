"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  Trophy,
  BookOpen,
  Award,
  TrendingUp,
  User,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Loading } from "@/components/ui";

const CLASSES = ["1م1", "1م2", "1م3", "2م3"];

type LookupResult = {
  student: {
    id: string;
    studentName: string;
    className: string;
    groupName?: string;
    gender?: string;
  };
  trimester: number;
  grade: {
    continuousScore?: number;
    test1Score?: number;
    test2Score?: number;
    examScore?: number;
    termAverage?: number;
    rank?: number;
    totalStudents?: number;
    appreciation?: string;
    updatedAt?: string;
  } | null;
  stats?: {
    totalStudents: number;
    highestAvg: number | null;
    lowestAvg: number | null;
    classAvg: number | null;
  };
  schoolInfo: {
    schoolName: string;
    teacherName: string;
    subjectName: string;
  };
};

export default function GradesLookupPage() {
  const [selectedClass, setSelectedClass] = useState<string>("1م1");
  const [studentName, setStudentName] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [trimester, setTrimester] = useState<number>(1);
  const [classStudents, setClassStudents] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  // جلب قائمة تلاميذ القسم المختار لتسهيل الاختيار على الولي
  useEffect(() => {
    setLoadingStudents(true);
    setStudentName("");
    setResult(null);
    setError(null);

    fetch(`/api/grades?className=${encodeURIComponent(selectedClass)}&trimester=${trimester}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.students && Array.isArray(data.students)) {
          const names = data.students.map((s: any) => s.studentName).sort();
          setClassStudents(names);
        } else {
          setClassStudents([]);
        }
      })
      .catch(() => setClassStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass, trimester]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!selectedClass) {
      setError("يرجى اختيار القسم (الفوج)");
      return;
    }
    if (!studentName.trim()) {
      setError("يرجى كتابة أو اختيار اسم التلميذ");
      return;
    }
    if (!birthDate.trim()) {
      setError("يرجى إدخال تاريخ ميلاد التلميذ (يوم / شهر / سنة)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/grades/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: selectedClass,
          studentName: studentName.trim(),
          birthDate: birthDate.trim(),
          trimester,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "تعذر الاستعلام عن النتيجة");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الاستعلام. تأكد من صحة تاريخ الميلاد.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (typeof score !== "number" || isNaN(score)) return "text-slate-400";
    if (score >= 15) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 10) return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-amber-700 bg-amber-50 border-amber-200";
  };

  return (
    <div className="pb-16 pt-3 fade-up space-y-4 max-w-4xl mx-auto">
      {/* رأس الصفحة وزر الرجوع */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 active:scale-95 transition shrink-0"
          aria-label="الرجوع للرئيسية"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-black text-slate-900 truncate">
              فضاء استعلام نقاط ومتابعة التلميذ
            </h1>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-200">
              بتاريخ الميلاد 🛡️
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-bold truncate">
            الأستاذ محمد عدايكة — متوسطة المجاهد باهي علي
          </p>
        </div>
      </div>

      {/* بنر توضيحي لطيف للأولياء */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-md shadow-emerald-600/15 border border-emerald-400/30 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-black text-white">
              خدمة استعلام آمنة وخاصة بكل تلميذ وولي أمر
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-50 leading-relaxed font-medium">
              «حرصاً على سرية وخصوصية نتائج أبنائكم، يمكنكم الاطلاع على كشف نقاط مادة الرياضيات والمعدل الفصلي والملاحظات التوجيهية بمجرد إدخال تاريخ ميلاد التلميذ كرمز سري للتحقق.»
            </p>
          </div>
        </div>
      </div>

      {/* نموذج الاستعلام */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* اختيار الفوج */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>القسم (الفوج):</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-11 px-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
              >
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* اسم التلميذ */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>اسم ولقب التلميذ:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="students-list"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={loadingStudents ? "جاري تحميل قائمة الأسماء..." : "اختر أو اكتب اسم التلميذ..."}
                  className="w-full h-11 px-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
                />
                <datalist id="students-list">
                  {classStudents.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* تاريخ الميلاد كود سري */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>تاريخ ميلاد التلميذ (الرمز السري):</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-11 px-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
              />
              <span className="text-[10px] text-slate-400 font-medium block">
                تأكد من إدخال تاريخ الميلاد المسجل رسمياً في شهادة الميلاد
              </span>
            </div>

            {/* الفصل الدراسي */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>الفصل الدراسي:</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrimester(t)}
                    className={`flex-1 h-11 rounded-xl text-xs font-black transition border ${
                      trimester === t
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    الفصل {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 active:scale-[0.99] transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري التحقق من تاريخ الميلاد واستخراج الكشف...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>استعلام وعرض كشف النقاط</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* كشف النقاط الرسمي للتلميذ في حال نجاح الاستعلام */}
      {result && (
        <div id="student-report-card" className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5 fade-up">
          {/* ترويسة الكشف */}
          <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold text-slate-400">الجمهورية الجزائرية الديمقراطية الشعبية</div>
              <div className="text-xs font-black text-slate-800 mt-0.5">
                {result.schoolInfo.schoolName} — {result.schoolInfo.teacherName}
              </div>
              <div className="text-sm font-black text-emerald-800 mt-1 flex items-center gap-2">
                <span>كشف نقاط {result.schoolInfo.subjectName}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  الفصل {result.trimester}
                </span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-black flex items-center gap-2 active:scale-95 transition print:hidden"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>طباعة الكشف</span>
            </button>
          </div>

          {/* معلومات التلميذ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">اسم التلميذ:</span>
              <span className="font-black text-slate-900 text-sm">{result.student.studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">القسم والفوج:</span>
              <span className="font-black text-slate-900">{result.student.className} {result.student.groupName ? `(${result.student.groupName})` : ""}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">المادة:</span>
              <span className="font-black text-emerald-700">الرياضيات</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">حالة التقييم:</span>
              <span className="font-black text-slate-800">
                {result.grade?.examScore !== undefined ? "مكتمل (رُصد الاختبار) ✅" : "قيد المتابعة والتقويم ⏳"}
              </span>
            </div>
          </div>

          {/* شبكة النقاط الفردية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* بطاقة التقويم المستمر */}
            <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-700">التقويم المستمر</span>
                <span className="text-[10px] text-slate-400 font-bold">من 20</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {typeof result.grade?.continuousScore === "number" ? (
                  <span>{result.grade.continuousScore}</span>
                ) : (
                  <span className="text-sm text-slate-400 font-bold">قيد الرصد</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 leading-relaxed font-medium">
                يشمل انضباط وسلوك التلميذ، كراس الدروس، حل الواجبات، والاستجوابات السريعة.
              </div>
            </div>

            {/* بطاقة الفرض الأول */}
            <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-700">الفرض المحروس</span>
                <span className="text-[10px] text-slate-400 font-bold">من 20</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {typeof result.grade?.test1Score === "number" ? (
                  <span>{result.grade.test1Score}</span>
                ) : (
                  <span className="text-sm text-slate-400 font-bold">قيد الرصد</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 leading-relaxed font-medium">
                نقطة الفرض الكتابي المحروس المجرى خلال الفصل الدراسي.
              </div>
            </div>

            {/* بطاقة الاختبار الفصلي */}
            <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-700">الاختبار الفصلي</span>
                <span className="text-[10px] text-slate-400 font-bold">من 20 (معامل 2)</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {typeof result.grade?.examScore === "number" ? (
                  <span>{result.grade.examScore}</span>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-black border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>قيد الرصد والتقييم لاحقاً ⏳</span>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-slate-500 leading-relaxed font-medium">
                {typeof result.grade?.examScore === "number"
                  ? "تم رصد علامة الاختبار الفصلي الرسمي."
                  : "لم يُجرَ الاختبار الفصلي بعد أو هو قيد التصحيح من طرف الأستاذ."}
              </div>
            </div>
          </div>

          {/* بطاقة المعدل الفصلي والتوجيه */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-50 border-2 border-emerald-300/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black text-slate-800 block">
                  {typeof result.grade?.examScore === "number"
                    ? "المعدل الفصلي النهائي لمادة الرياضيات:"
                    : "معدل المراقبة المستمرة والفرض المحقق حتى الآن:"}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {typeof result.grade?.examScore === "number"
                    ? "محسوب طبقاً للمنشور الوزاري الرسمي 272"
                    : "معدل مرحلي لتشجيع ومتابعة التلميذ قبل أسبوع الاختبارات"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {typeof result.grade?.termAverage === "number" && (
                  <div className="text-3xl font-black text-emerald-800">
                    {result.grade.termAverage} <span className="text-xs text-slate-400">/ 20</span>
                  </div>
                )}
                {result.grade?.rank && (
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 shadow-2xs text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">الترتيب</span>
                    <span className="text-xs font-black text-emerald-700">
                      #{result.grade.rank} {result.grade.totalStudents ? `من ${result.grade.totalStudents}` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ملاحظة وتوجيه الأستاذ */}
            {result.grade?.appreciation && (
              <div className="pt-2 border-t border-emerald-200/60 flex items-start gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-500">ملاحظة وتوجيه الأستاذ: </span>
                  <span className="font-black text-slate-900">{result.grade.appreciation}</span>
                </div>
              </div>
            )}
          </div>

          {/* مقارنة مع إحصائيات الفوج */}
          {result.stats && result.stats.totalStudents > 0 && (
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">أعلى معدل في الفوج</span>
                <span className="font-black text-emerald-700">{result.stats.highestAvg ?? "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">معدل الفوج العام</span>
                <span className="font-black text-blue-700">{result.stats.classAvg ?? "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">أدنى معدل في الفوج</span>
                <span className="font-black text-amber-700">{result.stats.lowestAvg ?? "—"}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
