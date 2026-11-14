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
  Calculator,
  RotateCcw,
  Target,
  HelpCircle,
  Info,
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

  // حالة محاكي وتجربة النقاط التفاعلية للتلميذ والولي
  const [simScores, setSimScores] = useState<Record<string, string | number>>({});
  const [showExplanation, setShowExplanation] = useState(false);

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
          const names = data.students
            .map((s: any) => s.studentName)
            .sort((a: string, b: string) => a.localeCompare(b, "ar"));
          setClassStudents(names);
        } else {
          setClassStudents([]);
        }
      })
      .catch(() => setClassStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass, trimester]);

  // تعبئة بيانات المحاكي فور تحميل نتائج التلميذ
  useEffect(() => {
    if (result && result.grade) {
      setSimScores({
        behaviorScore: result.grade.behaviorScore ?? "",
        quiz1Score: result.grade.quiz1Score ?? "",
        homework1Score: result.grade.homework1Score ?? "",
        quiz2Score: result.grade.quiz2Score ?? "",
        homework2Score: result.grade.homework2Score ?? "",
        notebook1Score: result.grade.notebook1Score ?? "",
        notebook2Score: result.grade.notebook2Score ?? "",
        bonusScore: result.grade.bonusScore ?? "",
        test1Score: result.grade.test1Score ?? "",
        examScore: result.grade.examScore ?? "",
      });
    }
  }, [result]);

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

  // استرجاع العلامات الأصلية للأستاذ
  const handleResetToOfficial = () => {
    if (!result?.grade) return;
    setSimScores({
      behaviorScore: result.grade.behaviorScore ?? "",
      quiz1Score: result.grade.quiz1Score ?? "",
      homework1Score: result.grade.homework1Score ?? "",
      quiz2Score: result.grade.quiz2Score ?? "",
      homework2Score: result.grade.homework2Score ?? "",
      notebook1Score: result.grade.notebook1Score ?? "",
      notebook2Score: result.grade.notebook2Score ?? "",
      bonusScore: result.grade.bonusScore ?? "",
      test1Score: result.grade.test1Score ?? "",
      examScore: result.grade.examScore ?? "",
    });
  };

  // تعديل قيمة في المحاكي من قبل التلميذ أو الولي
  const handleSimChange = (colKey: string, val: string) => {
    const clean = val.replace(/[,،]/g, ".").trim();
    setSimScores((prev) => ({
      ...prev,
      [colKey]: clean,
    }));
  };

  // الحسابات اللحظية للمحاكي
  const calculatedSim = useMemo(() => {
    if (!result?.grade) return null;

    const parseNum = (v: any): number | null => {
      if (v === "" || v === undefined || v === null || v === "—" || v === "ليس الآن" || v === "-") return null;
      if (v === "غ" || v === "غياب") return 0;
      const str = String(v).replace(/[,،]/g, ".").trim();
      if (str === "" || str === ".") return null;
      const n = parseFloat(str);
      return isNaN(n) ? null : n;
    };

    const b = parseNum(simScores.behaviorScore);
    const q1 = parseNum(simScores.quiz1Score);
    const hw1 = parseNum(simScores.homework1Score);
    const q2 = parseNum(simScores.quiz2Score);
    const hw2 = parseNum(simScores.homework2Score);
    const nb1 = parseNum(simScores.notebook1Score);
    const nb2 = parseNum(simScores.notebook2Score);
    const bonus = parseNum(simScores.bonusScore) || 0;

    const evalItems = [b, q1, hw1, q2, hw2, nb1, nb2];
    const hasAnyEval = evalItems.some((x) => x !== null) || bonus > 0;

    let continuousScore: number | null = null;
    if (hasAnyEval) {
      const sum = (b || 0) + (q1 || 0) + (hw1 || 0) + (q2 || 0) + (hw2 || 0) + (nb1 || 0) + (nb2 || 0) + bonus;
      continuousScore = Number(Math.min(20, Math.max(0, sum)).toFixed(2));
    }

    const test1 = parseNum(simScores.test1Score);
    const exam = parseNum(simScores.examScore);

    let continuousMonitoring: number | null = null;
    if (continuousScore !== null && test1 !== null) {
      continuousMonitoring = Number(((continuousScore + test1) / 2).toFixed(2));
    } else if (continuousScore !== null) {
      continuousMonitoring = continuousScore;
    } else if (test1 !== null) {
      continuousMonitoring = test1;
    }

    let termAverage: number | null = null;
    let isPendingExam = true;
    if (continuousMonitoring !== null && exam !== null) {
      termAverage = Number(((continuousMonitoring + exam * 2) / 3).toFixed(2));
      isPendingExam = false;
    } else if (continuousMonitoring !== null) {
      termAverage = continuousMonitoring;
      isPendingExam = true;
    }

    // حساب العلامة المطلوبة في الاختبار لتحقيق هدف معدل معين
    // Avg = (Monitoring + Exam * 2) / 3  =>  Exam = (Avg * 3 - Monitoring) / 2
    const calcRequiredExam = (targetAvg: number): { score: number; possible: boolean; alreadyDone: boolean } => {
      if (continuousMonitoring === null) return { score: 0, possible: false, alreadyDone: false };
      const req = (targetAvg * 3 - continuousMonitoring) / 2;
      if (req <= 0) return { score: 0, possible: true, alreadyDone: true };
      if (req > 20) return { score: Number(req.toFixed(2)), possible: false, alreadyDone: false };
      return { score: Number(req.toFixed(2)), possible: true, alreadyDone: false };
    };

    // التحقق هل تم تعديل أي علامة مقارنة برصد الأستاذ
    const orig = result.grade;
    const isModified =
      String(simScores.behaviorScore ?? "") !== String(orig.behaviorScore ?? "") ||
      String(simScores.quiz1Score ?? "") !== String(orig.quiz1Score ?? "") ||
      String(simScores.homework1Score ?? "") !== String(orig.homework1Score ?? "") ||
      String(simScores.quiz2Score ?? "") !== String(orig.quiz2Score ?? "") ||
      String(simScores.homework2Score ?? "") !== String(orig.homework2Score ?? "") ||
      String(simScores.notebook1Score ?? "") !== String(orig.notebook1Score ?? "") ||
      String(simScores.notebook2Score ?? "") !== String(orig.notebook2Score ?? "") ||
      String(simScores.bonusScore ?? "") !== String(orig.bonusScore ?? "") ||
      String(simScores.test1Score ?? "") !== String(orig.test1Score ?? "") ||
      String(simScores.examScore ?? "") !== String(orig.examScore ?? "");

    // تحديد التقدير التلقائي بناءً على المعدل
    let appreciation = orig.appreciation || "";
    if (isModified && termAverage !== null) {
      if (!isPendingExam) {
        if (termAverage >= 18) appreciation = "ممتاز جداً 🌟 واصل التألق والريادة";
        else if (termAverage >= 15) appreciation = "جيد جداً 👏 نتائج ممتازة ومشرفة";
        else if (termAverage >= 12) appreciation = "مقبول إلى جيد 👍 خطوة طيبة ويمكنك بلوغ الأفضل";
        else if (termAverage >= 10) appreciation = "مقبول، يحتاج لمزيد من المراجعة والتركيز 📖";
        else appreciation = "دون المتوسط، يحتاج مرافقة واجتهاداً أكبر في الاختبارات القادمة ⚠️";
      } else {
        appreciation = "معدل مرحلي مشجع قبل أسبوع الاختبارات ⏳";
      }
    }

    return {
      continuousScore,
      test1,
      continuousMonitoring,
      exam,
      termAverage,
      isPendingExam,
      isModified,
      appreciation,
      target10: calcRequiredExam(10),
      target12: calcRequiredExam(12),
      target14: calcRequiredExam(14),
      target16: calcRequiredExam(16),
    };
  }, [simScores, result]);

  return (
    <div className="pb-16 pt-4 max-w-4xl mx-auto space-y-6 fade-up px-3" dir="rtl">
      {/* رأس الصفحة الترحيبي */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>فضاء أولياء وتلاميذ الرياضيات • كشف نقاط تفاعلي وحساب فوري للمعدل</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900" style={{ fontFamily: "'Cairo', sans-serif" }}>
              كشف النقاط وبطاقة التقويم المستمر والمعدل
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-bold">
              متوسطة المجاهد باهي علي — الأستاذ محمد عدايكة — الوادي
            </p>
          </div>

          <Link
            href="/"
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-black flex items-center gap-2 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للدروس</span>
          </Link>
        </div>
      </div>

      {/* نموذج البحث وتاريخ الميلاد */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5 print:hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-900">
              أدخل معلومات التلميذ للاطلاع على كشف النقاط:
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            تاريخ الميلاد مطلوب لحماية خصوصية التلاميذ 🔒
          </span>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* اختيار القسم */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">1. القسم (الفوج):</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-11 px-3 text-xs font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
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
              <label className="text-xs font-black text-slate-700 block">2. اسم التلميذ:</label>
              {loadingStudents ? (
                <div className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-xs text-slate-400 font-bold">
                  جاري تحميل أسماء القسم...
                </div>
              ) : classStudents.length > 0 ? (
                <select
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full h-11 px-3 text-xs font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                >
                  <option value="">-- اختر اسم التلميذ من القائمة --</option>
                  {classStudents.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="اكتب الاسم واللقب..."
                  className="w-full h-11 px-3 text-xs font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              )}
            </div>

            {/* تاريخ الميلاد */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">
                3. تاريخ الميلاد (الرمز السري):
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-11 px-3 text-xs font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* الفصل الدراسي */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs font-black text-slate-700">الفصل الدراسي:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
              {([1, 2, 3] as const).map((tri) => (
                <button
                  type="button"
                  key={tri}
                  onClick={() => setTrimester(tri)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    trimester === tri
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  الفصل {tri}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-black flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
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

      {/* ─── كشف النقاط الرسمي والمحاكي التفاعلي للتلميذ ─── */}
      {result && calculatedSim && (
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

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>شرح طريقة الحساب</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-black flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>طباعة الكشف</span>
              </button>
            </div>
          </div>

          {/* معلومات التلميذ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs font-bold">
            <div>
              <span className="text-slate-400 block text-[10px]">اسم التلميذ:</span>
              <span className="font-black text-slate-900 text-sm" style={{ fontFamily: "'Cairo', sans-serif" }}>
                {result.student.studentName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">القسم والفوج:</span>
              <span className="font-black text-slate-900 font-mono">
                {result.student.className} {result.student.groupName ? `(${result.student.groupName})` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">المادة:</span>
              <span className="font-black text-emerald-700">الرياضيات</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">حالة الرصد:</span>
              <span className="font-black text-slate-800">
                {result.grade?.examScore !== undefined && result.grade?.examScore !== ""
                  ? "مكتمل (رُصد الاختبار) ✅"
                  : "قيد المتابعة والتقويم ⏳"}
              </span>
            </div>
          </div>

          {/* ─── شريط المحاكي التفاعلي والتلميح للتلميذ والولي ─── */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    محاكي وتجربة العلامات المتوقعة (تفاعلي ⚡)
                  </h4>
                  {calculatedSim.isModified ? (
                    <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-black px-2 py-0.5 rounded-full animate-pulse">
                      وضع التجربة نشط
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                      العلامات الرسمية الحالية
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 font-bold">
                  اكتب أي علامة في الخانات أدناه لتشاهد فوراً كيف ستتغير المراقبة المستمرة ومعدلك الفصلي!
                </p>
              </div>
            </div>

            {calculatedSim.isModified && (
              <button
                type="button"
                onClick={handleResetToOfficial}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>استرجاع علامات الأستاذ ↺</span>
              </button>
            )}
          </div>

          {/* ─── جدول أعمدة التقويم المستمر التفاعلي ─── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  تفاصيل بطاقة التقويم المستمر (المجموع من 20 نقطة):
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
                يمكنك الضغط وتعديل أي خانة لتجربة الحساب
              </span>
            </div>

            <div className="overflow-x-auto border border-emerald-200 rounded-2xl shadow-2xs">
              <table className="w-full text-center text-xs">
                <thead className="bg-emerald-50 text-emerald-950 font-black border-b border-emerald-200 text-[11px]" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  <tr>
                    <th className="py-2.5 px-2">المشاركة والسلوك</th>
                    <th className="py-2.5 px-2">استجواب 1</th>
                    <th className="py-2.5 px-2">وظيفة 1</th>
                    <th className="py-2.5 px-2">استجواب 2</th>
                    <th className="py-2.5 px-2">وظيفة 2</th>
                    <th className="py-2.5 px-2">كراس 1</th>
                    <th className="py-2.5 px-2">كراس 2</th>
                    <th className="py-2.5 px-2 text-purple-900">نقاط إضافية (+)</th>
                    <th className="py-2.5 px-3 bg-emerald-200/90 text-emerald-950 font-black border-r border-emerald-300">
                      مجموع التقويم
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-emerald-50 font-bold">
                  <tr>
                    {/* المشاركة (4) */}
                    <td className="p-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={simScores.behaviorScore ?? ""}
                          onChange={(e) => handleSimChange("behaviorScore", e.target.value)}
                          placeholder="قيد الرصد"
                          className="w-14 h-8 text-center text-xs font-mono font-black text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">/ 4</span>
                      </div>
                    </td>

                    {/* استجواب 1 (4) */}
                    <td className="p-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={simScores.quiz1Score ?? ""}
                          onChange={(e) => handleSimChange("quiz1Score", e.target.value)}
                          placeholder="قيد الرصد"
                          className="w-14 h-8 text-center text-xs font-mono font-black text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">/ 4</span>
                      </div>
                    </td>

                    {/* وظيفة 1 (2) */}
                    <td className="p-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={simScores.homework1Score ?? ""}
                          onChange={(e) => handleSimChange("homework1Score", e.target.value)}
                          placeholder="قيد الرصد"
                          className="w-14 h-8 text-center text-xs font-mono font-black text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">/ 2</span>
                      </div>
                    </td>

                    {/* استجواب 2 (4) */}
                    <td className="p-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={simScores.quiz2Score ?? ""}
                          onChange={(e) => handleSimChange("quiz2Score", e.target.value)}
                          placeholder="لم يقوّم بعد"
                          className="w-16 h-8 text-center text-xs font-mono font-black text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">/ 4</span>
                      </div>
                    </td>

                    {/* وظيفة 2 (2) */}
                    <td className="p-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={simScores.homework2Score ?? ""}
                          onChange={(e) => handleSimChange("homework2Score", e.target.value)}
                          placeholder="لم يقوّم بعد"
                          className="w-16 h-8 text-center text-xs font-mono font-black text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">/ 2</span>
                      </div>
                    </td>

                    {/* كراس 1 (2) */}
                    <td className="p-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={simScores.notebook1Score ?? ""}
                          onChange={(e) => handleSimChange("notebook1Score", e.target.value)}
                          placeholder="لم يقوّم بعد"
                          className="w-16 h-8 text-center text-xs font-mono font-black text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">/ 2</span>
                      </div>
                    </td>

                    {/* كراس 2 (2) */}
                    <td className="p-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={simScores.notebook2Score ?? ""}
                          onChange={(e) => handleSimChange("notebook2Score", e.target.value)}
                          placeholder="لم يقوّم بعد"
                          className="w-16 h-8 text-center text-xs font-mono font-black text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">/ 2</span>
                      </div>
                    </td>

                    {/* نقاط إضافية (+) */}
                    <td className="p-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={simScores.bonusScore ?? ""}
                          onChange={(e) => handleSimChange("bonusScore", e.target.value)}
                          placeholder="+"
                          className="w-12 h-8 text-center text-xs font-mono font-black text-purple-700 bg-purple-50/60 hover:bg-white focus:bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                        />
                        <span className="text-[10px] text-purple-600 font-mono">بونص</span>
                      </div>
                    </td>

                    {/* مجموع التقويم المحسوب آلياً */}
                    <td className="py-2.5 px-3 bg-emerald-100/70 border-r border-emerald-300">
                      <span className="text-lg font-mono font-black text-emerald-950 block">
                        {calculatedSim.continuousScore !== null ? calculatedSim.continuousScore : "-"}
                      </span>
                      <span className="text-[10px] text-emerald-700 block font-bold">من 20 نقطة</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 font-bold text-center">
              * الخانات المكتوب فيها «لم يقوّم بعد» هي عناصر لم يتم تقييمها بعد في القسم، ولا تخصم أي نقطة من حق التلميذ.
            </p>
          </div>

          {/* ─── بطاقات الفرض والمراقبة والاختبار مع إمكانية التعديل ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {/* بطاقة التقويم الإجمالي */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
              <span className="text-xs font-black text-emerald-800 block">التقويم المستمر</span>
              <div className="text-2xl font-mono font-black text-emerald-950">
                {calculatedSim.continuousScore !== null ? `${calculatedSim.continuousScore} / 20` : "قيد الحساب"}
              </div>
              <span className="text-[10px] text-emerald-700 block font-bold">
                مجموع العناصر الـ 8 أعلاه
              </span>
            </div>

            {/* بطاقة الفرض المحروس */}
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-1.5">
              <span className="text-xs font-black text-blue-800 block">الفرض المحروس</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={simScores.test1Score ?? ""}
                  onChange={(e) => handleSimChange("test1Score", e.target.value)}
                  placeholder="20"
                  className="w-16 h-8 text-center text-sm font-mono font-black text-blue-950 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 outline-none"
                />
                <span className="text-sm font-mono font-bold text-slate-500">/ 20</span>
              </div>
              <span className="text-[10px] text-blue-700 block font-bold">
                علامة الفرض الكتابي المحروس
              </span>
            </div>

            {/* بطاقة المراقبة المستمرة */}
            <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/80 space-y-1.5">
              <span className="text-xs font-black text-teal-800 block">المراقبة المستمرة</span>
              <div className="text-2xl font-mono font-black text-teal-950">
                {calculatedSim.continuousMonitoring !== null
                  ? `${calculatedSim.continuousMonitoring} / 20`
                  : "قيد الحساب"}
              </div>
              <span className="text-[10px] text-teal-700 block font-bold font-mono">
                (الفرض + التقويم) ÷ 2
              </span>
            </div>

            {/* بطاقة الاختبار الفصلي مع إدخال لتجربة المعدل */}
            <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 block">الاختبار الفصلي</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">معامل 2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={simScores.examScore ?? ""}
                  onChange={(e) => handleSimChange("examScore", e.target.value)}
                  placeholder="توقع علامتك"
                  className="w-full h-8 text-center text-sm font-mono font-black text-indigo-950 bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
                <span className="text-sm font-mono font-bold text-slate-500">/ 20</span>
              </div>
              <span className="text-[10px] text-indigo-700 block font-bold">
                اكتب علامة الاختبار لمعاينة المعدل
              </span>
            </div>
          </div>

          {/* ─── بطاقة المعدل الفصلي والتوجيه ─── */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/5 border-2 border-emerald-400 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-black text-slate-900 block" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  {!calculatedSim.isPendingExam
                    ? "المعدل الفصلي النهائي المتوقع لمادة الرياضيات:"
                    : "معدل المراقبة المستمرة والفرض المحقق حتى الآن:"}
                </span>
                <span className="text-xs text-slate-500 font-bold block mt-0.5">
                  {!calculatedSim.isPendingExam
                    ? "المعادلة الرسمية للوزارة: (المراقبة المستمرة + الاختبار × 2) ÷ 3"
                    : "معدل مرحلي يمثل أداء التلميذ قبل أسبوع الاختبارات"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {calculatedSim.termAverage !== null && (
                  <div className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono">
                    {calculatedSim.termAverage}{" "}
                    <span className="text-xs sm:text-sm text-slate-400 font-normal">/ 20</span>
                  </div>
                )}
                {result.grade?.rank && (
                  <div className="px-3.5 py-2 rounded-2xl bg-white border border-emerald-200 shadow-xs text-center font-bold">
                    <span className="text-[10px] text-slate-400 block">الترتيب بالفوج</span>
                    <span className="text-xs font-black text-emerald-800 font-mono">
                      #{result.grade.rank} {result.grade.totalStudents ? `من ${result.grade.totalStudents}` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* توجيه الأستاذ والتشجيع */}
            {calculatedSim.appreciation && (
              <div className="pt-3 border-t border-emerald-200/80 flex items-start gap-2.5 text-xs sm:text-sm font-bold text-slate-800">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>تقييم وتوجيه التلميذ:</strong> {calculatedSim.appreciation}
                </span>
              </div>
            )}
          </div>

          {/* ─── حاسبة الهدف: كم تحتاج في الاختبار الفصلي لتحقيق هدفك؟ ─── */}
          {calculatedSim.continuousMonitoring !== null && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3 print:hidden">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  🎯 حاسبة الهدف: كم تحتاج في الاختبار الفصلي لتحقيق معدلك المستهدف؟
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 font-bold">
                بناءً على نقطة مراقبتك المستمرة الحالية ({calculatedSim.continuousMonitoring} / 20)، هذه هي العلامة التي يجب أن تسعى للحصول عليها في الاختبار:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {/* هدف معدل 10 */}
                <div
                  onClick={() => handleSimChange("examScore", String(calculatedSim.target10.score))}
                  className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition cursor-pointer text-center space-y-1 shadow-2xs"
                  title="انقر لتجربة هذه النقطة في الاختبار فوراً"
                >
                  <span className="text-[11px] font-bold text-slate-500 block">لمعدل 10 / 20</span>
                  <div className="text-lg font-black font-mono text-emerald-700">
                    {calculatedSim.target10.alreadyDone
                      ? "ناجح مسبقاً! 🎉"
                      : calculatedSim.target10.possible
                      ? `${calculatedSim.target10.score} / 20`
                      : "تحتاج تعويضاً"}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-bold">انقر لتجربتها 👆</span>
                </div>

                {/* هدف معدل 12 */}
                <div
                  onClick={() => handleSimChange("examScore", String(calculatedSim.target12.score))}
                  className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition cursor-pointer text-center space-y-1 shadow-2xs"
                  title="انقر لتجربة هذه النقطة في الاختبار فوراً"
                >
                  <span className="text-[11px] font-bold text-slate-500 block">لمعدل 12 / 20</span>
                  <div className="text-lg font-black font-mono text-teal-700">
                    {calculatedSim.target12.alreadyDone
                      ? "متحقق بالفعل! 👏"
                      : calculatedSim.target12.possible
                      ? `${calculatedSim.target12.score} / 20`
                      : "غير متاح"}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-bold">انقر لتجربتها 👆</span>
                </div>

                {/* هدف معدل 14 */}
                <div
                  onClick={() => handleSimChange("examScore", String(calculatedSim.target14.score))}
                  className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer text-center space-y-1 shadow-2xs"
                  title="انقر لتجربة هذه النقطة في الاختبار فوراً"
                >
                  <span className="text-[11px] font-bold text-slate-500 block">لمعدل 14 / 20</span>
                  <div className="text-lg font-black font-mono text-blue-700">
                    {calculatedSim.target14.possible
                      ? `${calculatedSim.target14.score} / 20`
                      : "تحتاج معدل أعلى"}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-bold">انقر لتجربتها 👆</span>
                </div>

                {/* هدف معدل 16 */}
                <div
                  onClick={() => handleSimChange("examScore", String(calculatedSim.target16.score))}
                  className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition cursor-pointer text-center space-y-1 shadow-2xs"
                  title="انقر لتجربة هذه النقطة في الاختبار فوراً"
                >
                  <span className="text-[11px] font-bold text-slate-500 block">لمعدل 16 / 20</span>
                  <div className="text-lg font-black font-mono text-indigo-700">
                    {calculatedSim.target16.possible
                      ? `${calculatedSim.target16.score} / 20`
                      : "تتطلب تفوقاً"}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-bold">انقر لتجربتها 👆</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── دليل وشرح طريقة الحساب بالتفصيل للأولياء والتلاميذ ─── */}
          {showExplanation && (
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-100/90 border border-slate-200 space-y-3 text-xs font-bold text-slate-800 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>دليل وقوانين حساب مادة الرياضيات في مرحلة التعليم المتوسط:</span>
              </div>

              <div className="space-y-2 text-slate-600 leading-relaxed pr-2">
                <p>
                  1️⃣ <strong>التقويم المستمر (من 20):</strong> يشمل تقييم جهد التلميذ اليومي: المشاركة والانضباط (4 نقاط) + استجوابان كتابيان (4+4 نقاط) + وظيفتان منزليتان (2+2 نقطتان) + كراسان (2+2 نقطتان) + نقاط إضافية تشجيعية عند حل الواجبات.
                </p>
                <p>
                  2️⃣ <strong>المراقبة المستمرة (من 20):</strong> هي حاصل جمع علامة الفرض المحروس مع نقطة التقويم المستمر مقسومين على 2. المعادلة: <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-900">(الفرض + التقويم) ÷ 2</span>.
                </p>
                <p>
                  3️⃣ <strong>المعدل الفصلي لمادة الرياضيات (من 20):</strong> يُحسب وفق المنشور الوزاري بضرب علامة الاختبار في 2 وإضافتها للمراقبة المستمرة ثم القسمة على 3: <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-900">(المراقبة المستمرة + الاختبار × 2) ÷ 3</span>.
                </p>
                <p>
                  4️⃣ <strong>ما معنى «لم يُقوّم بعد»؟</strong> تعني أن التلميذ لم يتم تفويجه أو مراقبة ذلك العنصر بعد (مثلاً كراس 2)، وهي لا تُخصم إطلاقاً من حق التلميذ في المعدل.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
