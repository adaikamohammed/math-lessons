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
  FileSpreadsheet,
} from "lucide-react";

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
    behaviorScore?: number | string;
    quiz1Score?: number | string;
    homework1Score?: number | string;
    quiz2Score?: number | string;
    homework2Score?: number | string;
    notebook1Score?: number | string;
    notebook2Score?: number | string;
    bonusScore?: number | string;
    continuousScore?: number | string;
    test1Score?: number | string;
    continuousMonitoring?: number | string;
    examScore?: number | string;
    termAverage?: number | string;
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

  // جلب قائمة تلاميذ القسم المختار
  useEffect(() => {
    setLoadingStudents(true);
    setStudentName("");
    setResult(null);
    setError(null);

    fetch(`/api/grades?className=${encodeURIComponent(selectedClass)}&trimester=${trimester}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.students && Array.isArray(data.students)) {
          const names = data.students.map((s: any) => s.studentName).sort((a: string, b: string) => a.localeCompare(b, "ar"));
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
      setError("يرجى اختيار أو كتابة اسم ولقب التلميذ");
      return;
    }
    if (!birthDate.trim()) {
      setError("يرجى إدخال تاريخ ميلاد التلميذ للتحقق من الهوية وحماية الخصوصية");
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
        throw new Error(data.error || "تعذر العثور على بيانات التلميذ");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الاستعلام");
    } finally {
      setLoading(false);
    }
  };

  const formatCellDisplay = (val: any, max: string) => {
    if (val === "" || val === undefined || val === null) {
      return <span className="text-slate-400 italic font-normal text-[11px]">قيد الرصد</span>;
    }
    if (val === "غ") {
      return <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded">غائب</span>;
    }
    if (val === "—" || val === "ليس الآن") {
      return <span className="text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">معلّق (ليس الآن)</span>;
    }
    return (
      <span className="font-mono font-black text-slate-900">
        {val} <span className="text-[10px] text-slate-400 font-normal">/ {max}</span>
      </span>
    );
  };

  return (
    <div className="pb-16 pt-4 max-w-4xl mx-auto space-y-6 fade-up px-3" dir="rtl">
      {/* رأس الصفحة الترحيبي */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>فضاء أولياء التلاميذ • استعلام آمن بالرقم السري (تاريخ الميلاد)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              كشف النقاط والتقويم المستمر في الرياضيات
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-bold">
              متوسطة المجاهد باهي علي — الأستاذ محمد عدايكة — الوادي
            </p>
          </div>

          <Link
            href="/"
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>

      {/* نموذج الاستعلام المحمي بتاريخ الميلاد */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            🔑
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              بيانات التلميذ للاستعلام الفوري
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              أدخل الفوج واسم التلميذ مع تاريخ ميلاده كما هو مسجل في شهادة الميلاد
            </p>
          </div>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* اختيار القسم */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>القسم (الفوج الدراسي):</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-11 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
              >
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    فوج {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* اسم التلميذ */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>اسم ولقب التلميذ:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="class-students-list"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={loadingStudents ? "جاري تحميل أسماء الفوج..." : "اختر أو اكتب الاسم واللقب..."}
                  className="w-full h-11 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
                  required
                />
                <datalist id="class-students-list">
                  {classStudents.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* تاريخ الميلاد (الرمز السري لدخول الولي) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>تاريخ ميلاد التلميذ (رمز الأمان الخاص بك 🔑):</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-11 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 block">
                يضمن عدم اطلاع أي شخص آخر على نتائج ابنك.
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
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري التحقق واستخراج الكشف...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>استعلام وعرض كشف النقاط والتقويم المفصل</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* كشف النقاط الرسمي المفصل للتلميذ */}
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
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-black flex items-center gap-2 active:scale-95 transition print:hidden cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>طباعة الكشف</span>
            </button>
          </div>

          {/* معلومات التلميذ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs font-bold">
            <div>
              <span className="text-slate-400 block text-[10px]">اسم التلميذ:</span>
              <span className="font-black text-slate-900 text-sm">{result.student.studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">القسم والفوج:</span>
              <span className="font-black text-slate-900">{result.student.className} {result.student.groupName ? `(${result.student.groupName})` : ""}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">المادة:</span>
              <span className="font-black text-emerald-700">الرياضيات</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">حالة التقييم:</span>
              <span className="font-black text-slate-800">
                {result.grade?.examScore !== undefined && result.grade?.examScore !== ""
                  ? "مكتمل (رُصد الاختبار) ✅"
                  : "قيد المتابعة والتقويم ⏳"}
              </span>
            </div>
          </div>

          {/* ─── جدول أعمدة التقويم المستمر المفصلة (مطابق تماماً لدفتر الأستاذ) ─── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                تفاصيل بطاقة التقويم المستمر (المجموع من 20 نقطة):
              </h3>
            </div>

            <div className="overflow-x-auto border border-emerald-200 rounded-2xl shadow-2xs">
              <table className="w-full text-center text-xs">
                <thead className="bg-emerald-50 text-emerald-950 font-black border-b border-emerald-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-2">المشاركة والسلوك</th>
                    <th className="py-2.5 px-2">استجواب 1</th>
                    <th className="py-2.5 px-2">وظيفة 1</th>
                    <th className="py-2.5 px-2">استجواب 2</th>
                    <th className="py-2.5 px-2">وظيفة 2</th>
                    <th className="py-2.5 px-2">كراس 1</th>
                    <th className="py-2.5 px-2">كراس 2</th>
                    <th className="py-2.5 px-2 text-purple-900">نقاط إضافية (+)</th>
                    <th className="py-2.5 px-3 bg-emerald-200/80 text-emerald-950 font-black border-r border-emerald-300">
                      مجموع التقويم
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-emerald-50 font-bold">
                  <tr>
                    <td className="py-3 px-2">
                      {formatCellDisplay(result.grade?.behaviorScore, "4")}
                    </td>
                    <td className="py-3 px-2">
                      {formatCellDisplay(result.grade?.quiz1Score, "4")}
                    </td>
                    <td className="py-3 px-2">
                      {formatCellDisplay(result.grade?.homework1Score, "2")}
                    </td>
                    <td className="py-3 px-2">
                      {formatCellDisplay(result.grade?.quiz2Score, "4")}
                    </td>
                    <td className="py-3 px-2">
                      {formatCellDisplay(result.grade?.homework2Score, "2")}
                    </td>
                    <td className="py-3 px-2">
                      {formatCellDisplay(result.grade?.notebook1Score, "2")}
                    </td>
                    <td className="py-3 px-2">
                      {formatCellDisplay(result.grade?.notebook2Score, "2")}
                    </td>
                    <td className="py-3 px-2">
                      {result.grade?.bonusScore ? (
                        <span className="font-mono font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          +{result.grade.bonusScore}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 bg-emerald-100/70 border-r border-emerald-300">
                      <span className="text-base font-mono font-black text-emerald-900">
                        {result.grade?.continuousScore !== undefined && result.grade?.continuousScore !== ""
                          ? result.grade.continuousScore
                          : <span className="text-slate-400 text-xs">قيد الرصد</span>}
                      </span>
                      <span className="text-[10px] text-emerald-700 block">/ 20</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── شبكة نتائج الفرض والمراقبة والاختبار والمعدل ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {/* بطاقة التقويم الإجمالي */}
            <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-1">
              <span className="text-[11px] font-black text-emerald-800 block">التقويم المستمر</span>
              <div className="text-xl font-mono font-black text-emerald-900">
                {result.grade?.continuousScore !== undefined && result.grade?.continuousScore !== ""
                  ? `${result.grade.continuousScore} / 20`
                  : "قيد الرصد"}
              </div>
              <span className="text-[10px] text-emerald-700/80 block">مجموع العناصر أعلاه</span>
            </div>

            {/* بطاقة الفرض */}
            <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-1">
              <span className="text-[11px] font-black text-blue-800 block">الفرض المحروس</span>
              <div className="text-xl font-mono font-black text-blue-900">
                {result.grade?.test1Score !== undefined && result.grade?.test1Score !== ""
                  ? `${result.grade.test1Score} / 20`
                  : "قيد الرصد"}
              </div>
              <span className="text-[10px] text-blue-700/80 block">فرض كتابي محروس</span>
            </div>

            {/* بطاقة المراقبة المستمرة */}
            <div className="p-3.5 rounded-2xl border border-teal-200 bg-teal-50/70 space-y-1">
              <span className="text-[11px] font-black text-teal-800 block">المراقبة المستمرة</span>
              <div className="text-xl font-mono font-black text-teal-900">
                {result.grade?.continuousMonitoring !== undefined && result.grade?.continuousMonitoring !== ""
                  ? `${result.grade.continuousMonitoring} / 20`
                  : "قيد الحساب"}
              </div>
              <span className="text-[10px] text-teal-700 block">(الفرض + التقويم) ÷ 2</span>
            </div>

            {/* بطاقة الاختبار */}
            <div className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-1">
              <span className="text-[11px] font-black text-indigo-800 block">الاختبار الفصلي</span>
              <div className="text-xl font-mono font-black text-indigo-900">
                {result.grade?.examScore !== undefined && result.grade?.examScore !== ""
                  ? `${result.grade.examScore} / 20`
                  : <span className="text-xs text-amber-700 font-bold">قيد الرصد لاحقاً</span>}
              </div>
              <span className="text-[10px] text-indigo-700/80 block">معامل 2</span>
            </div>
          </div>

          {/* بطاقة المعدل الفصلي والتوجيه */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-50 border-2 border-emerald-300/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black text-slate-800 block">
                  {result.grade?.examScore !== undefined && result.grade?.examScore !== ""
                    ? "المعدل الفصلي النهائي لمادة الرياضيات:"
                    : "معدل المراقبة المستمرة والفرض المحقق حتى الآن:"}
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  {result.grade?.examScore !== undefined && result.grade?.examScore !== ""
                    ? "محسوب طبقاً للمنشور الوزاري: (المراقبة المستمرة + الاختبار × 2) ÷ 3"
                    : "معدل مرحلي لمتابعة مستوى التلميذ قبل أسبوع الاختبارات"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {result.grade?.termAverage !== undefined && result.grade?.termAverage !== "" && (
                  <div className="text-3xl font-black text-emerald-800 font-mono">
                    {result.grade.termAverage} <span className="text-xs text-slate-400 font-normal">/ 20</span>
                  </div>
                )}
                {result.grade?.rank && (
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 shadow-2xs text-center font-bold">
                    <span className="text-[10px] text-slate-400 block">الترتيب بالفوج</span>
                    <span className="text-xs font-black text-emerald-700 font-mono">
                      #{result.grade.rank} {result.grade.totalStudents ? `من ${result.grade.totalStudents}` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ملاحظة وتوجيه الأستاذ */}
            {result.grade?.appreciation && (
              <div className="pt-2 border-t border-emerald-200/60 flex items-start gap-2 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>توجيه الأستاذ:</strong> {result.grade.appreciation}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
