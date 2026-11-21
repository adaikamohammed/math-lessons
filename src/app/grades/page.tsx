"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  X,
  HeartHandshake,
  Share2,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";

const CLASSES = ["1م1", "1م2", "1م3", "2م3"];

export const COLUMN_MAX_LIMITS: Record<string, number> = {
  behaviorScore: 4,
  quiz1Score: 4,
  homework1Score: 2,
  quiz2Score: 4,
  homework2Score: 2,
  notebook1Score: 2,
  notebook2Score: 2,
  bonusScore: 5,
  continuousScore: 20,
  test1Score: 20,
  examScore: 20,
};

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
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  // حالة محاكي وتجربة النقاط التفاعلية للتلميذ والولي
  const [simScores, setSimScores] = useState<Record<string, string | number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [parentViewMode, setParentViewMode] = useState<"cards" | "table">("cards");

  // مرجع حقل التاريخ المخفي للرزنامة البديلة
  const hiddenDateInputRef = useRef<HTMLInputElement | null>(null);

  // مشاركة كشف النقاط عبر واتساب
  const handleShareWhatsApp = () => {
    if (!result || !calculatedSim) return;
    const name = result.student.studentName;
    const cls = result.student.className;
    const tri = result.trimester;
    const cont = calculatedSim.continuousScore !== null ? `${calculatedSim.continuousScore} / 20` : "قيد الرصد";
    const test = simScores.test1Score ? `${simScores.test1Score} / 20` : "قيد الرصد";
    const mon = calculatedSim.continuousMonitoring !== null ? `${calculatedSim.continuousMonitoring} / 20` : "قيد الرصد";
    const avg = calculatedSim.termAverage !== null ? `${calculatedSim.termAverage} / 20` : "معلق للاختبار";
    const notes = result.grade?.appreciation ? `\n💬 ملاحظة الأستاذ: ${result.grade.appreciation}` : "";

    const text = `السلام عليكم ورحمة الله 🌸\nنتائج مادة الرياضيات — متوسطة المجاهد باهي علي:\n👤 التلميذ(ة): ${name} (${cls})\n📅 الفصل الدراسي: ${tri}\n📝 مجموع التقويم: ${cont}\n📊 الفرض المحروس: ${test}\n📈 المراقبة المستمرة: ${mon}\n🏆 المعدل الفصلي: ${avg}${notes}\n\n🔗 رابط المنصة للاطلاع والمحاكاة التفاعلية:\nhttps://math-lessons-eta.vercel.app/grades`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // معالجة وتنسيق كتابة تاريخ الميلاد تلقائياً (الكتابة السريعة الفورية 8 أرقام متتالية)
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw.trim()) {
      setBirthDate("");
      return;
    }

    // استخراج الأرقام فقط (حد أقصى 8 أرقام: يومان + شهران + 4 للعام)
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (!digits) {
      setBirthDate("");
      return;
    }

    let formatted = "";
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
    }

    setBirthDate(formatted);
  };

  // دعم مسح السلاش بسلاسة عند الضغط على Backspace
  const handleBirthDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const input = e.currentTarget;
      const selStart = input.selectionStart;
      const selEnd = input.selectionEnd;
      if (selStart === selEnd && selStart === birthDate.length) {
        if (birthDate.endsWith(" / ")) {
          e.preventDefault();
          const digits = birthDate.replace(/\D/g, "");
          const nextDigits = digits.slice(0, -1);
          let formatted = "";
          if (nextDigits.length <= 2) formatted = nextDigits;
          else if (nextDigits.length <= 4) formatted = `${nextDigits.slice(0, 2)} / ${nextDigits.slice(2)}`;
          else formatted = `${nextDigits.slice(0, 2)} / ${nextDigits.slice(2, 4)} / ${nextDigits.slice(4)}`;
          setBirthDate(formatted);
        }
      }
    }
  };

  // دعم اللصق الذكي (إذا كان المنسوخ YYYY-MM-DD أو DD-MM-YYYY)
  const handleBirthDatePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").trim();
    const isoMatch = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (isoMatch) {
      e.preventDefault();
      const [_, y, m, d] = isoMatch;
      setBirthDate(`${d.padStart(2, "0")} / ${m.padStart(2, "0")} / ${y}`);
      return;
    }
  };

  // أزرار سريعة للأعوام الأكثر شيوعاً في المتوسط
  const handleQuickYear = (year: string) => {
    const digits = birthDate.replace(/\D/g, "");
    if (digits.length >= 4) {
      const day = digits.slice(0, 2);
      const month = digits.slice(2, 4);
      setBirthDate(`${day} / ${month} / ${year}`);
    } else if (digits.length >= 2) {
      setBirthDate(`${digits.slice(0, 2)} / 01 / ${year}`);
    } else {
      setBirthDate(`01 / 01 / ${year}`);
    }
  };

  // جلب قائمة تلاميذ القسم المختار
  // جلب قائمة أسماء تلاميذ القسم المختار (متاح لجميع الزوار عبر endpoint الاستعلام العام)
  useEffect(() => {
    setLoadingStudents(true);
    setStudentName("");
    setIsStudentListOpen(false);
    setResult(null);
    setError(null);

    fetch(`/api/grades/lookup?className=${encodeURIComponent(selectedClass)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.students && Array.isArray(data.students)) {
          setClassStudents(data.students);
        } else {
          setClassStudents([]);
        }
      })
      .catch(() => setClassStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass]);

  // تطبيع الحروف العربية للبحث المرن (أ/إ/آ -> ا، ة -> ه، ى -> ي)
  const normalizeArabicSearch = (text: string) => {
    return text
      .trim()
      .replace(/[إأآا]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/\s+/g, " ")
      .toLowerCase();
  };

  const filteredStudents = useMemo(() => {
    if (!studentName.trim()) return classStudents;
    const query = normalizeArabicSearch(studentName);
    return classStudents.filter((name) =>
      normalizeArabicSearch(name).includes(query)
    );
  }, [classStudents, studentName]);

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

  // تعديل قيمة في المحاكي من قبل التلميذ أو الولي مع التحقق الصارم من الحد الأقصى لكل خانة
  const handleSimChange = (colKey: string, val: string) => {
    const clean = val.replace(/[,،]/g, ".").trim();
    if (clean === "" || clean === "غ" || clean === "غياب" || clean === "—" || clean === "-") {
      setSimScores((prev) => ({
        ...prev,
        [colKey]: clean,
      }));
      return;
    }

    const maxLimit = COLUMN_MAX_LIMITS[colKey] ?? 20;
    const num = parseFloat(clean);
    if (!isNaN(num)) {
      if (num > maxLimit) {
        setSimScores((prev) => ({
          ...prev,
          [colKey]: String(maxLimit),
        }));
        return;
      }
      if (num < 0) {
        setSimScores((prev) => ({
          ...prev,
          [colKey]: "0",
        }));
        return;
      }
    }

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
      if (v === "غ" || v === "غياب") return null;
      const str = String(v).replace(/[,،]/g, ".").trim();
      if (str === "" || str === ".") return null;
      const n = parseFloat(str);
      return isNaN(n) ? null : n;
    };

    const clampVal = (v: any, max: number): number | null => {
      const n = parseNum(v);
      if (n === null) return null;
      return Math.min(max, Math.max(0, n));
    };

    const b = clampVal(simScores.behaviorScore, 4);
    const q1 = clampVal(simScores.quiz1Score, 4);
    const hw1 = clampVal(simScores.homework1Score, 2);
    const q2 = clampVal(simScores.quiz2Score, 4);
    const hw2 = clampVal(simScores.homework2Score, 2);
    const nb1 = clampVal(simScores.notebook1Score, 2);
    const nb2 = clampVal(simScores.notebook2Score, 2);
    const bonus = clampVal(simScores.bonusScore, 5) || 0;

    const evalItems = [b, q1, hw1, q2, hw2, nb1, nb2];
    const hasAnyEval = evalItems.some((x) => x !== null) || bonus > 0;

    let continuousScore: number | null = null;
    if (hasAnyEval) {
      const sum = (b || 0) + (q1 || 0) + (hw1 || 0) + (q2 || 0) + (hw2 || 0) + (nb1 || 0) + (nb2 || 0) + bonus;
      continuousScore = Number(Math.min(20, Math.max(0, sum)).toFixed(2));
    }

    const isTestAbsent = simScores.test1Score === "غ" || simScores.test1Score === "غياب";
    const isExamAbsent = simScores.examScore === "غ" || simScores.examScore === "غياب";

    const test1 = clampVal(simScores.test1Score, 20);
    const exam = clampVal(simScores.examScore, 20);

    let continuousMonitoring: number | null = null;
    if (isTestAbsent) {
      continuousMonitoring = null;
    } else if (continuousScore !== null && test1 !== null) {
      continuousMonitoring = Number(((continuousScore + test1) / 2).toFixed(2));
    } else if (continuousScore !== null) {
      continuousMonitoring = continuousScore;
    } else if (test1 !== null) {
      continuousMonitoring = test1;
    }

    let termAverage: number | null = null;
    let isPendingExam = true;
    if (isExamAbsent || isTestAbsent) {
      termAverage = null;
      isPendingExam = true;
    } else if (continuousMonitoring !== null && exam !== null) {
      termAverage = Number(((continuousMonitoring + exam * 2) / 3).toFixed(2));
      isPendingExam = false;
    } else if (continuousMonitoring !== null) {
      termAverage = continuousMonitoring;
      isPendingExam = true;
    }

    // التحقق هل يحتوي الكشف على أي غياب "غ" لتوجيه الولي برسالة الطمأنة
    const hasAnyAbsent = Object.values(simScores).some(
      (v) => v === "غ" || v === "غياب"
    );

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
      hasAnyAbsent,
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
          <div className="flex items-center gap-3.5">
            <img
              src="/icons/icon-192.png"
              alt="شعار مادة الرياضيات"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-md shadow-emerald-900/15 object-cover border border-emerald-500/20 shrink-0"
            />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
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

            {/* اسم التلميذ - يدعم البحث المباشر بالكتابة والاقتراحات الفورية والقائمة المنسدلة */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 block">2. اسم ولقب التلميذ:</label>
                <span className="text-[10px] text-emerald-700 font-bold">
                  اكتب اسمك للبحث ⚡ أو اختر من القائمة
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  list="class-students-datalist"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    setIsStudentListOpen(true);
                  }}
                  onFocus={() => setIsStudentListOpen(true)}
                  placeholder={loadingStudents ? "جاري جلب أسماء القسم..." : "اكتب الاسم واللقب للبحث مباشرة..."}
                  disabled={loadingStudents}
                  className="w-full h-11 pr-9 pl-16 text-xs font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition"
                  autoComplete="off"
                />

                {/* أيقونة البحث في اليمين */}
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />

                {/* أزرار الحذف وفتح القائمة في اليسار */}
                <div className="absolute left-2 top-2 flex items-center gap-1">
                  {studentName && (
                    <button
                      type="button"
                      onClick={() => {
                        setStudentName("");
                        setIsStudentListOpen(true);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="مسح الاسم"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsStudentListOpen((prev) => !prev)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                    title="فتح / إغلاق قائمة تلاميذ القسم"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isStudentListOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {/* datalist للمتصفحات والهواتف المحمولة */}
                <datalist id="class-students-datalist">
                  {classStudents.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>

                {/* القائمة المقترحة المنسدلة التفاعلية */}
                {isStudentListOpen && classStudents.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsStudentListOpen(false)}
                    />
                    <div className="absolute top-full mt-1.5 right-0 left-0 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-30 divide-y divide-slate-100 py-1 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-black text-slate-500 flex items-center justify-between">
                        <span>
                          {filteredStudents.length > 0
                            ? `النتائج المطابقة (${filteredStudents.length} تلميذ)`
                            : "لا يوجد تلميذ مطابق للاسم المكتوب"}
                        </span>
                        <span className="text-emerald-700">اضغط للاختيار</span>
                      </div>

                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((name, idx) => {
                          const isSelected = studentName.trim() === name.trim();
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setStudentName(name);
                                setIsStudentListOpen(false);
                              }}
                              className={`w-full text-right px-3.5 py-2 text-xs font-black flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-50 text-emerald-900"
                                  : "text-slate-800 hover:bg-slate-50"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center font-mono font-bold">
                                  {idx + 1}
                                </span>
                                <span style={{ fontFamily: "'Cairo', sans-serif" }}>{name}</span>
                              </span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400 font-bold">
                          لم يتم العثور على اسم مطابق في هذا الفوج، يمكنك متابعة كتابة اسمك مباشرة
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* تاريخ الميلاد الذكي والفوري */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 block">
                  3. تاريخ الميلاد (الرمز السري):
                </label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  اكتب 8 أرقام متتالية ⚡
                </span>
              </div>

              {/* حقل إدخال التاريخ الذكي التلقائي */}
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={birthDate}
                  onChange={handleBirthDateChange}
                  onKeyDown={handleBirthDateKeyDown}
                  onPaste={handleBirthDatePaste}
                  placeholder="مثال: 30 / 09 / 2012"
                  maxLength={14}
                  className="w-full h-11 pr-3 pl-16 text-xs font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-mono tracking-wider transition"
                />

                {/* زر التقويم ومسح الحقل في يسار الحقل */}
                <div className="absolute left-2 top-2 flex items-center gap-1">
                  {birthDate && (
                    <button
                      type="button"
                      onClick={() => setBirthDate("")}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="مسح التاريخ"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (hiddenDateInputRef.current) {
                        if ("showPicker" in HTMLInputElement.prototype) {
                          hiddenDateInputRef.current.showPicker();
                        } else {
                          hiddenDateInputRef.current.click();
                        }
                      }
                    }}
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer shadow-2xs"
                    title="فتح الرزنامة لاختيار التاريخ"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* حقل تاريخ مخفي لدعم الرزنامة الأصلية لمن يرغب بها */}
                <input
                  ref={hiddenDateInputRef}
                  type="date"
                  tabIndex={-1}
                  className="sr-only"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const [y, m, d] = val.split("-");
                      setBirthDate(`${d} / ${m} / ${y}`);
                    }
                  }}
                />
              </div>

              {/* أزرار سريعة للأعوام الأكثر شيوعاً في المتوسط */}
              <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold ml-1">سنوات سريعة:</span>
                {["2012", "2013", "2014", "2011", "2010"].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleQuickYear(yr)}
                    className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-mono text-[10px] font-bold transition cursor-pointer border border-slate-200/60 active:scale-95"
                    title={`اختيار سنة ${yr}`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
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

      {/* ─── رسالة توضيحية وطمأنة لأولياء الأمور الكرام ─── */}
      <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-white rounded-3xl p-5 sm:p-6 border border-emerald-200/90 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-700/20">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-emerald-950" style={{ fontFamily: "'Cairo', sans-serif" }}>
              توضيح ورسالة طمأنة لأولياء الأمور الكرام 🌸
            </h3>
            <p className="text-xs text-emerald-800 font-bold">
              حرصاً منا على الشفافية والراحة النفسية لأبنائنا التلاميذ وأوليائهم الأفاضل:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* بطاقة 1: معنى رمز غ */}
          <div className="bg-white/95 rounded-2xl p-4 border border-emerald-100 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-red-100 border border-red-200 text-red-700 font-black text-xs flex items-center justify-center font-sans">غ</span>
              <h4 className="text-xs font-black text-slate-900">ماذا يعني رمز (غ)؟</h4>
            </div>
            <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
              رمز <span className="text-red-700 font-black">(غ)</span> يعني أن التلميذ كان غائباً أثناء إجراء الاستجواب أو لم يتمكن من تسليم الوظيفة في موعدها.
            </p>
          </div>

          {/* بطاقة 2: الطمأنة بالتعويض */}
          <div className="bg-white/95 rounded-2xl p-4 border border-teal-100 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-teal-100 border border-teal-200 text-teal-800 font-black text-xs flex items-center justify-center">🔄</span>
              <h4 className="text-xs font-black text-slate-900">لا تقلقوا (التعويض مضمون)</h4>
            </div>
            <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
              تطميناً للأولياء، سيتم تلقائياً وضع علامة <strong>استجواب 2</strong> نفسها كعلامة لـ <strong>استجواب 1</strong>، وكذلك علامة <strong>وظيفة 2</strong> نفسها لـ <strong>وظيفة 1</strong>.
            </p>
          </div>

          {/* بطاقة 3: اكتمال التقويم */}
          <div className="bg-white/95 rounded-2xl p-4 border border-emerald-100 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center justify-center">📅</span>
              <h4 className="text-xs font-black text-slate-900">جاهزية التقويم قبل الاختبارات</h4>
            </div>
            <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
              كامل نقاط التقويم المستمر ستكون جاهزة ومرصودة بنسبة 100% قبل انطلاق الاختبارات، بما في ذلك علامة الكراس والمشاركة والسلوك.
            </p>
          </div>
        </div>
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

            <div className="flex items-center gap-2 print:hidden flex-wrap">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 active:scale-95 transition cursor-pointer shadow-xs"
                title="مشاركة كشف النقاط عبر واتساب"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة واتساب 📱</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>طريقة الحساب</span>
              </button>

              <button
                type="button"
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

          {/* ─── بطاقة توجيه وملاحظة الأستاذ للولي ─── */}
          {result.grade?.appreciation && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-white border-2 border-teal-300 shadow-2xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-teal-950 font-black text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>💬 ملاحظة وتوجيه الأستاذ محمد عدايكة للتلميذ وولي أمره:</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed pr-6" style={{ fontFamily: "'Cairo', sans-serif" }}>
                "{result.grade.appreciation}"
              </p>
            </div>
          )}

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

          {/* ─── تنبيه خاص للتلميذ والولي في حال وجود غياب (غ) ─── */}
          {calculatedSim.hasAnyAbsent && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs font-bold flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-black text-amber-900 block text-xs sm:text-sm">
                  ملاحظة طمأنة لولي أمر التلميذ(ة):
                </span>
                <p className="text-[11px] text-amber-900/90 leading-relaxed font-bold">
                  يظهر رمز <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-black border border-red-200 font-sans">غ</span> في إحدى خانات التقييم أدناه؛ لا داعي للقلق إطلاقاً، حيث سيتم تلقائياً احتساب علامة الاستجواب الثاني كبديل ونفس علامة الاستجواب الأول، وكذلك الوظيفة الثانية كبديل للوظيفة الأولى لمن تغيب عنها، وستكون كامل نقاط التقويم المستمر مكتملة 100% بحول الله قبل أسبوع الاختبارات الرسمية.
                </p>
              </div>
            </div>
          )}

          {/* ─── محدد نمط العرض للأولياء: بطاقات ذكية vs جدول مدمج ─── */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 print:hidden">
            <span className="text-xs font-black text-slate-700">طريقة عرض علامات التقويم:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setParentViewMode("cards")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  parentViewMode === "cards"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>بطاقات ذكية 📱</span>
              </button>
              <button
                type="button"
                onClick={() => setParentViewMode("table")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  parentViewMode === "table"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>جدول مدمج 📊</span>
              </button>
            </div>
          </div>

          {/* 1. نمط البطاقات الذكية الواضحة للجوال */}
          {parentViewMode === "cards" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    بطاقات عناصر التقويم المستمر (8 عناصر تفصيلية):
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
                  اضغط على أي خانة لتجربة الحساب
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. المشاركة والسلوك */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 transition shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">المشاركة والسلوك</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded">/ 4</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={simScores.behaviorScore ?? ""}
                      onChange={(e) => handleSimChange("behaviorScore", e.target.value)}
                      placeholder="قيد الرصد"
                      className={`w-full h-10 text-center text-base font-mono font-black rounded-xl border transition outline-none ${
                        simScores.behaviorScore === "غ"
                          ? "bg-red-50 text-red-700 border-red-300 font-sans"
                          : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block text-center">الانضباط والتفاعل بالقسم</span>
                </div>

                {/* 2. استجواب 1 */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 transition shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">استجواب 1</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded">/ 4</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={simScores.quiz1Score ?? ""}
                      onChange={(e) => handleSimChange("quiz1Score", e.target.value)}
                      placeholder="قيد الرصد"
                      className={`w-full h-10 text-center text-base font-mono font-black rounded-xl border transition outline-none ${
                        simScores.quiz1Score === "غ"
                          ? "bg-red-50 text-red-700 border-red-300 font-sans"
                          : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block text-center">استجواب كتابي فجائي 1</span>
                </div>

                {/* 3. وظيفة 1 */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 transition shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">وظيفة 1</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded">/ 2</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={simScores.homework1Score ?? ""}
                      onChange={(e) => handleSimChange("homework1Score", e.target.value)}
                      placeholder="قيد الرصد"
                      className={`w-full h-10 text-center text-base font-mono font-black rounded-xl border transition outline-none ${
                        simScores.homework1Score === "غ"
                          ? "bg-red-50 text-red-700 border-red-300 font-sans"
                          : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block text-center">وظيفة منزلية أولى</span>
                </div>

                {/* 4. استجواب 2 */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 transition shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">استجواب 2</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded">/ 4</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={simScores.quiz2Score ?? ""}
                      onChange={(e) => handleSimChange("quiz2Score", e.target.value)}
                      placeholder="لم يقوّم بعد"
                      className={`w-full h-10 text-center text-base font-mono font-black rounded-xl border transition outline-none ${
                        simScores.quiz2Score === "غ"
                          ? "bg-red-50 text-red-700 border-red-300 font-sans"
                          : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block text-center">استجواب كتابي ثانٍ</span>
                </div>

                {/* 5. وظيفة 2 */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 transition shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">وظيفة 2</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded">/ 2</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={simScores.homework2Score ?? ""}
                      onChange={(e) => handleSimChange("homework2Score", e.target.value)}
                      placeholder="لم يقوّم بعد"
                      className={`w-full h-10 text-center text-base font-mono font-black rounded-xl border transition outline-none ${
                        simScores.homework2Score === "غ"
                          ? "bg-red-50 text-red-700 border-red-300 font-sans"
                          : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block text-center">وظيفة منزلية ثانية</span>
                </div>

                {/* 6. كراس 1 */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 transition shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">كراس 1</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded">/ 2</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={simScores.notebook1Score ?? ""}
                      onChange={(e) => handleSimChange("notebook1Score", e.target.value)}
                      placeholder="لم يقوّم بعد"
                      className={`w-full h-10 text-center text-base font-mono font-black rounded-xl border transition outline-none ${
                        simScores.notebook1Score === "غ"
                          ? "bg-red-50 text-red-700 border-red-300 font-sans"
                          : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block text-center">مراقبة الكراس الأولى</span>
                </div>

                {/* 7. كراس 2 */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 transition shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">كراس 2</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded">/ 2</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={simScores.notebook2Score ?? ""}
                      onChange={(e) => handleSimChange("notebook2Score", e.target.value)}
                      placeholder="لم يقوّم بعد"
                      className={`w-full h-10 text-center text-base font-mono font-black rounded-xl border transition outline-none ${
                        simScores.notebook2Score === "غ"
                          ? "bg-red-50 text-red-700 border-red-300 font-sans"
                          : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block text-center">مراقبة الكراس الثانية</span>
                </div>

                {/* 8. نقاط إضافية (بونص) */}
                <div className="bg-purple-50/50 p-3.5 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-950">نقاط إضافية</span>
                    <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">(+)</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={simScores.bonusScore ?? ""}
                      onChange={(e) => handleSimChange("bonusScore", e.target.value)}
                      placeholder="+"
                      className="w-full h-10 text-center text-base font-mono font-black rounded-xl border border-purple-200 bg-white text-purple-900 outline-none focus:border-purple-500 transition"
                    />
                  </div>
                  <span className="text-[10px] text-purple-700 font-bold block text-center">بونص الواجبات والمبادرة</span>
                </div>
              </div>
            </div>
          ) : (
            /* 2. نمط الجدول المدمج مع المعايير */
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
                            min="0"
                            max={COLUMN_MAX_LIMITS.behaviorScore}
                            title="الحد الأقصى: 4 نقاط"
                            placeholder="قيد الرصد"
                            className={`w-14 h-8 text-center text-xs font-mono font-black rounded-lg outline-none transition ${
                              simScores.behaviorScore === "غ" || simScores.behaviorScore === "غياب"
                                ? "bg-red-100 text-red-700 border-2 border-red-400 font-sans font-black shadow-xs ring-1 ring-red-400"
                                : "text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500/30"
                            }`}
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
                            min="0"
                            max={COLUMN_MAX_LIMITS.quiz1Score}
                            title="الحد الأقصى: 4 نقاط"
                            placeholder="قيد الرصد"
                            className={`w-14 h-8 text-center text-xs font-mono font-black rounded-lg outline-none transition ${
                              simScores.quiz1Score === "غ" || simScores.quiz1Score === "غياب"
                                ? "bg-red-100 text-red-700 border-2 border-red-400 font-sans font-black shadow-xs ring-1 ring-red-400"
                                : "text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500/30"
                            }`}
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
                            min="0"
                            max={COLUMN_MAX_LIMITS.homework1Score}
                            title="الحد الأقصى: نقطتان"
                            placeholder="قيد الرصد"
                            className={`w-14 h-8 text-center text-xs font-mono font-black rounded-lg outline-none transition ${
                              simScores.homework1Score === "غ" || simScores.homework1Score === "غياب"
                                ? "bg-red-100 text-red-700 border-2 border-red-400 font-sans font-black shadow-xs ring-1 ring-red-400"
                                : "text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500/30"
                            }`}
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
                            min="0"
                            max={COLUMN_MAX_LIMITS.quiz2Score}
                            title="الحد الأقصى: 4 نقاط"
                            placeholder="لم يقوّم بعد"
                            className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg outline-none transition ${
                              simScores.quiz2Score === "غ" || simScores.quiz2Score === "غياب"
                                ? "bg-red-100 text-red-700 border-2 border-red-400 font-sans font-black shadow-xs ring-1 ring-red-400"
                                : "text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500/30"
                            }`}
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
                            min="0"
                            max={COLUMN_MAX_LIMITS.homework2Score}
                            title="الحد الأقصى: نقطتان"
                            placeholder="لم يقوّم بعد"
                            className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg outline-none transition ${
                              simScores.homework2Score === "غ" || simScores.homework2Score === "غياب"
                                ? "bg-red-100 text-red-700 border-2 border-red-400 font-sans font-black shadow-xs ring-1 ring-red-400"
                                : "text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500/30"
                            }`}
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
                            min="0"
                            max={COLUMN_MAX_LIMITS.notebook1Score}
                            title="الحد الأقصى: نقطتان"
                            placeholder="لم يقوّم بعد"
                            className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg outline-none transition ${
                              simScores.notebook1Score === "غ" || simScores.notebook1Score === "غياب"
                                ? "bg-red-100 text-red-700 border-2 border-red-400 font-sans font-black shadow-xs ring-1 ring-red-400"
                                : "text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500/30"
                            }`}
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
                            min="0"
                            max={COLUMN_MAX_LIMITS.notebook2Score}
                            title="الحد الأقصى: نقطتان"
                            placeholder="لم يقوّم بعد"
                            className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg outline-none transition ${
                              simScores.notebook2Score === "غ" || simScores.notebook2Score === "غياب"
                                ? "bg-red-100 text-red-700 border-2 border-red-400 font-sans font-black shadow-xs ring-1 ring-red-400"
                                : "text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500/30"
                            }`}
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
                            min="0"
                            max={COLUMN_MAX_LIMITS.bonusScore}
                            title="الحد الأقصى: 5 نقاط"
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
          )}

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
            <div className={`p-4 rounded-2xl border ${simScores.test1Score === "غ" || simScores.test1Score === "غياب" ? "border-red-200 bg-red-50/50" : "border-blue-200 bg-blue-50/50"} space-y-1.5`}>
              <span className="text-xs font-black text-blue-800 block">الفرض المحروس</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={simScores.test1Score ?? ""}
                  onChange={(e) => handleSimChange("test1Score", e.target.value)}
                  min="0"
                  max={COLUMN_MAX_LIMITS.test1Score}
                  title="الحد الأقصى: 20 نقطة"
                  placeholder="20"
                  className={`w-16 h-8 text-center text-sm font-mono rounded-lg outline-none transition ${
                    simScores.test1Score === "غ" || simScores.test1Score === "غياب"
                      ? "bg-red-100 text-red-700 border-2 border-red-400 font-sans font-black shadow-xs ring-1 ring-red-400"
                      : "text-blue-950 bg-white border border-blue-300 font-black focus:ring-2 focus:ring-blue-500/30"
                  }`}
                />
                <span className="text-sm font-mono font-bold text-slate-500">/ 20</span>
              </div>
              <span className="text-[10px] text-blue-700 block font-bold">
                {simScores.test1Score === "غ" || simScores.test1Score === "غياب" ? "غائب عن الفرض الأول" : "علامة الفرض الكتابي المحروس"}
              </span>
            </div>

            {/* بطاقة المراقبة المستمرة */}
            <div className={`p-4 rounded-2xl border ${simScores.test1Score === "غ" || simScores.test1Score === "غياب" ? "border-red-200 bg-red-50/50" : "border-teal-200 bg-teal-50/80"} space-y-1.5`}>
              <span className="text-xs font-black text-teal-800 block">المراقبة المستمرة</span>
              <div className={`text-2xl font-mono font-black ${simScores.test1Score === "غ" || simScores.test1Score === "غياب" ? "text-red-700 font-sans text-xl" : "text-teal-950"}`}>
                {simScores.test1Score === "غ" || simScores.test1Score === "غياب"
                  ? "غ (معلق)"
                  : calculatedSim.continuousMonitoring !== null
                  ? `${calculatedSim.continuousMonitoring} / 20`
                  : "قيد الحساب"}
              </div>
              <span className="text-[10px] text-teal-700 block font-bold font-mono">
                {simScores.test1Score === "غ" || simScores.test1Score === "غياب" ? "يتطلب الفرض" : "(الفرض + التقويم) ÷ 2"}
              </span>
            </div>

            {/* بطاقة الاختبار الفصلي مع إدخال لتجربة المعدل */}
            <div className={`p-4 rounded-2xl border ${simScores.examScore === "غ" || simScores.examScore === "غياب" ? "border-red-200 bg-red-50/50" : "border-indigo-200 bg-indigo-50/60"} space-y-1.5`}>
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
                  min="0"
                  max={COLUMN_MAX_LIMITS.examScore}
                  title="الحد الأقصى: 20 نقطة"
                  placeholder="توقع علامتك"
                  className={`w-full h-8 text-center text-sm font-mono rounded-lg outline-none transition ${
                    simScores.examScore === "غ" || simScores.examScore === "غياب"
                      ? "bg-red-100 text-red-700 border-2 border-red-400 font-sans font-black shadow-xs ring-1 ring-red-400"
                      : "text-indigo-950 bg-white border border-indigo-300 font-black focus:ring-2 focus:ring-indigo-500/30"
                  }`}
                />
                <span className="text-sm font-mono font-bold text-slate-500">/ 20</span>
              </div>
              <span className="text-[10px] text-indigo-700 block font-bold">
                {simScores.examScore === "غ" || simScores.examScore === "غياب" ? "غائب عن الاختبار" : "اكتب علامة الاختبار لمعاينة المعدل"}
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
                {calculatedSim.termAverage !== null ? (
                  <div className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono">
                    {calculatedSim.termAverage}{" "}
                    <span className="text-xs sm:text-sm text-slate-400 font-normal">/ 20</span>
                  </div>
                ) : (simScores.examScore === "غ" || simScores.examScore === "غياب" || simScores.test1Score === "غ" || simScores.test1Score === "غياب") ? (
                  <div className="px-3.5 py-1.5 rounded-2xl bg-red-100 border border-red-300 text-red-700 font-sans font-black text-base">
                    غ (معلق للغياب)
                  </div>
                ) : null}
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
