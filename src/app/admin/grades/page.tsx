"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Calculator,
  RefreshCw,
  Clock,
  Sparkles,
  HelpCircle,
  Download,
  Users,
  Search,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";

const CLASSES = ["1م1", "1م2", "1م3", "2م3"] as const;

export const EVAL_COLS = [
  "behaviorScore",
  "quiz1Score",
  "homework1Score",
  "quiz2Score",
  "homework2Score",
  "notebook1Score",
  "notebook2Score",
  "bonusScore",
  "test1Score",
  "examScore",
] as const;

export type EvalColKey = (typeof EVAL_COLS)[number];

export type StudentGradeRow = {
  studentId: string;
  studentName: string;
  className: string;
  groupName: string;
  gender?: string;

  // أعمدة التقويم المستمر المفصلة
  behaviorScore: string | number; // 4
  quiz1Score: string | number; // 4
  homework1Score: string | number; // 2
  quiz2Score: string | number; // 4
  homework2Score: string | number; // 2
  notebook1Score: string | number; // 2
  notebook2Score: string | number; // 2
  bonusScore: string | number; // نقاط إضافية
  continuousScore: string | number; // مجموع التقويم (20)

  // الفرض، المراقبة، الاختبار والمعدل
  test1Score: string | number; // الفرض (20)
  test2Score?: string | number;
  continuousMonitoring: string | number; // المراقبة المستمرة = (الفرض + التقويم) / 2
  examScore: string | number; // الاختبار (20)
  termAverage: string | number; // المعدل الفصلي
  appreciation: string;
  rank?: number;
};

// دالة لحساب التقويم والمراقبة والمعدل لأي سطر لحظياً
export function calculateRowScores(row: Partial<StudentGradeRow>): {
  continuousScore: string | number;
  continuousMonitoring: string | number;
  termAverage: string | number;
} {
  const parseVal = (v: any): number | null => {
    if (v === "" || v === undefined || v === null || v === "—" || v === "ليس الآن" || v === "-") return null;
    if (v === "غ" || v === "غياب") return 0;
    const str = String(v).replace(/[,،]/g, ".").trim();
    if (str === "" || str === ".") return null;
    const n = parseFloat(str);
    return isNaN(n) ? null : n;
  };

  const b = parseVal(row.behaviorScore);
  const q1 = parseVal(row.quiz1Score);
  const hw1 = parseVal(row.homework1Score);
  const q2 = parseVal(row.quiz2Score);
  const hw2 = parseVal(row.homework2Score);
  const nb1 = parseVal(row.notebook1Score);
  const nb2 = parseVal(row.notebook2Score);
  const bonus = parseVal(row.bonusScore) || 0;

  const evalItems = [b, q1, hw1, q2, hw2, nb1, nb2];
  const hasAnyEval = evalItems.some((x) => x !== null) || bonus > 0;

  let continuousScore: string | number = "";
  if (hasAnyEval) {
    const sum =
      (b || 0) +
      (q1 || 0) +
      (hw1 || 0) +
      (q2 || 0) +
      (hw2 || 0) +
      (nb1 || 0) +
      (nb2 || 0) +
      bonus;
    continuousScore = Number(Math.min(20, Math.max(0, sum)).toFixed(2));
  } else if (row.continuousScore !== undefined && row.continuousScore !== "") {
    continuousScore = row.continuousScore;
  }

  // حساب المراقبة المستمرة = (الفرض + التقويم) / 2
  const numCont = parseVal(continuousScore);
  const numTest = parseVal(row.test1Score);

  let continuousMonitoring: string | number = "";
  if (numCont !== null && numTest !== null) {
    continuousMonitoring = Number(((numCont + numTest) / 2).toFixed(2));
  } else if (numCont !== null) {
    continuousMonitoring = numCont;
  } else if (numTest !== null) {
    continuousMonitoring = numTest;
  }

  // حساب المعدل الفصلي = (المراقبة المستمرة + الاختبار * 2) / 3
  const numMon = parseVal(continuousMonitoring);
  const numExam = parseVal(row.examScore);

  let termAverage: string | number = "";
  if (numMon !== null && numExam !== null) {
    termAverage = Number(((numMon + numExam * 2) / 3).toFixed(2));
  } else if (numMon !== null) {
    termAverage = numMon;
  }

  return {
    continuousScore,
    continuousMonitoring,
    termAverage,
  };
}

export default function AdminGradesExcelPage() {
  const [selectedClass, setSelectedClass] = useState<string>("1م1");
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [students, setStudents] = useState<StudentGradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [subgroupFilter, setSubgroupFilter] = useState<"all" | "فوج 1" | "فوج 2">("all");
  const [search, setSearch] = useState("");

  // مراجع عناصر الإدخال لدعم التنقل بالكيبورد مثل إكسل
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/grades?className=${encodeURIComponent(selectedClass)}&trimester=${trimester}`
      );
      const data = await res.json();
      if (data.students) {
        const rows: StudentGradeRow[] = data.students.map((s: any) => {
          const calculated = calculateRowScores({
            behaviorScore: s.behaviorScore ?? "",
            quiz1Score: s.quiz1Score ?? "",
            homework1Score: s.homework1Score ?? "",
            quiz2Score: s.quiz2Score ?? "",
            homework2Score: s.homework2Score ?? "",
            notebook1Score: s.notebook1Score ?? "",
            notebook2Score: s.notebook2Score ?? "",
            bonusScore: s.bonusScore ?? "",
            continuousScore: s.continuousScore ?? "",
            test1Score: s.test1Score ?? "",
            examScore: s.examScore ?? "",
          });

          return {
            studentId: s.studentId || s.id,
            studentName: s.studentName,
            className: s.className || selectedClass,
            groupName: s.groupName || "فوج 1",
            gender: s.gender,
            behaviorScore: s.behaviorScore ?? "",
            quiz1Score: s.quiz1Score ?? "",
            homework1Score: s.homework1Score ?? "",
            quiz2Score: s.quiz2Score ?? "",
            homework2Score: s.homework2Score ?? "",
            notebook1Score: s.notebook1Score ?? "",
            notebook2Score: s.notebook2Score ?? "",
            bonusScore: s.bonusScore ?? "",
            continuousScore: calculated.continuousScore,
            test1Score: s.test1Score ?? "",
            continuousMonitoring: calculated.continuousMonitoring,
            examScore: s.examScore ?? "",
            termAverage: calculated.termAverage,
            appreciation: s.appreciation || "",
            rank: s.rank,
          };
        });

        setStudents(rows);
        setIsDirty(false);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "err", text: "تعذر جلب نقاط التلاميذ" });
    } finally {
      setLoading(false);
    }
  }, [selectedClass, trimester]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // تعديل خلية وحساب التقويم والمراقبة والمعدل لحظياً (مع دعم كتابة الفاصلة 0.5 أو 0,5)
  const handleCellChange = (rowIdx: number, col: EvalColKey, val: string) => {
    setStudents((prev) => {
      const next = [...prev];
      const row = { ...next[rowIdx] };

      // قبول الحروف الخاصة: غ (غائب)، — (ليس الآن)، أو الأرقام
      // دعم الفواصل العربية والفرنسية (0,5 -> 0.5)
      const cleanVal = val.replace(/[,،]/g, ".");
      const trimmed = cleanVal.trim();

      let formattedVal: string | number = cleanVal;

      if (trimmed === "غ" || trimmed.toLowerCase() === "g") {
        formattedVal = "غ";
      } else if (trimmed === "-" || trimmed === "—" || trimmed === "/") {
        formattedVal = "—";
      } else if (trimmed === "") {
        formattedVal = "";
      } else if (trimmed === "." || trimmed.endsWith(".")) {
        // أثناء كتابة الفاصلة (مثل "0." أو "1.")، نتركها كما هي تماماً ليتمكن الأستاذ من إكمال كتابة العُشر
        formattedVal = cleanVal;
      } else {
        const num = parseFloat(trimmed);
        if (!isNaN(num)) {
          // التحقق من السقف لكل عمود
          let maxVal = 20;
          if (
            col === "homework1Score" ||
            col === "homework2Score" ||
            col === "notebook1Score" ||
            col === "notebook2Score"
          ) {
            maxVal = 2;
          } else if (
            col === "behaviorScore" ||
            col === "quiz1Score" ||
            col === "quiz2Score"
          ) {
            maxVal = 4;
          } else if (col === "bonusScore") {
            maxVal = 10;
          }

          if (num > maxVal) {
            formattedVal = maxVal;
          } else if (num < 0) {
            formattedVal = 0;
          } else {
            // نترك ما كتبه الأستاذ كنص أو رقم (مثلاً 0.5 أو 1.5) دون اقتطاع
            formattedVal = trimmed;
          }
        }
      }

      (row as any)[col] = formattedVal;

      // إعادة الحساب الفوري
      const scores = calculateRowScores(row);
      row.continuousScore = scores.continuousScore;
      row.continuousMonitoring = scores.continuousMonitoring;
      row.termAverage = scores.termAverage;

      next[rowIdx] = row;
      return next;
    });
    setIsDirty(true);
  };

  // تعيين عمود كامل بشرطة «—» (ليس الآن) أو إرجاعه فارغاً بنقرة واحدة لجميع الأعمدة
  const handleBulkSetColumn = (col: EvalColKey) => {
    setStudents((prev) => {
      const isAllPending = prev.length > 0 && prev.every((s) => s[col] === "—" || s[col] === "-");
      const nextVal = isAllPending ? "" : "—";

      return prev.map((s) => {
        const row = { ...s, [col]: nextVal };
        const scores = calculateRowScores(row);
        return {
          ...row,
          continuousScore: scores.continuousScore,
          continuousMonitoring: scores.continuousMonitoring,
          termAverage: scores.termAverage,
        };
      });
    });
    setIsDirty(true);
  };

  // التنقل الذكي بالكيبورد (إكسل)
  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    const totalRows = filteredStudents.length;
    const totalCols = EVAL_COLS.length;

    let targetRow = rowIdx;
    let targetCol = colIdx;

    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      if (rowIdx < totalRows - 1) targetRow = rowIdx + 1;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIdx > 0) targetRow = rowIdx - 1;
    } else if (e.key === "ArrowLeft") {
      if (colIdx < totalCols - 1) {
        e.preventDefault();
        targetCol = colIdx + 1;
      }
    } else if (e.key === "ArrowRight") {
      if (colIdx > 0) {
        e.preventDefault();
        targetCol = colIdx - 1;
      }
    }

    if (targetRow !== rowIdx || targetCol !== colIdx) {
      const nextKey = `cell_${targetRow}_${targetCol}`;
      const el = inputRefs.current[nextKey];
      if (el) {
        el.focus();
        el.select();
      }
    }
  };

  // حفظ النقاط على السيرفر
  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trimester,
          updates: students.map((s) => ({
            studentId: s.studentId,
            studentName: s.studentName,
            className: s.className,
            behaviorScore: s.behaviorScore,
            quiz1Score: s.quiz1Score,
            homework1Score: s.homework1Score,
            quiz2Score: s.quiz2Score,
            homework2Score: s.homework2Score,
            notebook1Score: s.notebook1Score,
            notebook2Score: s.notebook2Score,
            bonusScore: s.bonusScore,
            continuousScore: s.continuousScore,
            test1Score: s.test1Score,
            continuousMonitoring: s.continuousMonitoring,
            examScore: s.examScore,
            termAverage: s.termAverage,
            appreciation: s.appreciation,
          })),
        }),
      });

      if (!res.ok) throw new Error("فشل الحفظ على السيرفر");

      setIsDirty(false);
      setFeedback({ type: "ok", text: "تم حفظ جميع النقاط والتفاصيل بنجاح في السحابة!" });
      fetchGrades();
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "err", text: err.message || "حدث خطأ أثناء الحفظ" });
    } finally {
      setSaving(false);
    }
  };

  // تصدير دفتر التنقيط المفصل كملف Excel
  const handleExportExcel = () => {
    if (students.length === 0) return;

    const exportRows = students.map((s, idx) => ({
      "الرقم": idx + 1,
      "اسم ولقب التلميذ": s.studentName,
      "الفوج": s.className,
      "الفوج الفرعي": s.groupName,
      "المشاركة والسلوك (4)": s.behaviorScore,
      "استجواب 1 (4)": s.quiz1Score,
      "وظيفة 1 (2)": s.homework1Score,
      "استجواب 2 (4)": s.quiz2Score,
      "وظيفة 2 (2)": s.homework2Score,
      "كراس 1 (2)": s.notebook1Score,
      "كراس 2 (2)": s.notebook2Score,
      "نقاط إضافية": s.bonusScore,
      "مجموع التقويم (20)": s.continuousScore,
      "الفرض (20)": s.test1Score,
      "المراقبة المستمرة (20)": s.continuousMonitoring,
      "الاختبار (20)": s.examScore,
      "المعدل الفصلي (20)": s.termAverage,
      "التقدير": s.appreciation,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `نقاط_${selectedClass}`);
    XLSX.writeFile(workbook, `دفتر_تنقيط_${selectedClass}_الفصل_${trimester}.xlsx`);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSub = subgroupFilter === "all" || s.groupName === subgroupFilter;
      const matchSearch =
        !search.trim() ||
        s.studentName.toLowerCase().includes(search.toLowerCase());
      return matchSub && matchSearch;
    });
  }, [students, subgroupFilter, search]);

  return (
    <div className="pb-24 pt-3 fade-up space-y-4 max-w-7xl mx-auto px-2 sm:px-4" dir="rtl">
      {/* شريط الإشعارات */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-black flex items-center justify-between gap-2 border animate-in fade-in duration-200 shadow-xs ${
            feedback.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "ok" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* ─── الرأس وأزرار التحكم ─── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 active:scale-95 transition shrink-0"
              title="الرجوع للوحة التحكم"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900">
                  دفتر الرصد والتقويم المستمر
                </h1>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                  فوج {selectedClass} • الفصل {trimester}
                </span>
                {isDirty && (
                  <span className="text-[11px] bg-amber-100 text-amber-800 font-black px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                    تعديلات غير محفوظة ⚠️
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-bold">
                حساب تلقائي للتقويم (20) والمراقبة المستمرة والمعدل الفصلي • تنقل بالأسهم والـ Enter كالإكسل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* زر حفظ التعديلات */}
            <button
              onClick={handleSave}
              disabled={saving}
              type="button"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ring-2 ring-emerald-500/20"
            >
              <Save className="w-4 h-4 text-emerald-200" />
              <span>{saving ? "جاري الحفظ..." : "حفظ النقاط الآن 💾"}</span>
            </button>

            {/* تصدير إكسل */}
            <button
              onClick={handleExportExcel}
              type="button"
              className="px-3 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── محدد الأفواج والفصول والفلاتر ─── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* اختيار الفوج */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-slate-700 ml-1">الفوج:</span>
            {CLASSES.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  selectedClass === cls
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                فوج {cls}
              </button>
            ))}
          </div>

          {/* اختيار الفصل */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            {([1, 2, 3] as const).map((tri) => (
              <button
                key={tri}
                onClick={() => setTrimester(tri)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  trimester === tri
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                الفصل {tri}
              </button>
            ))}
          </div>

          {/* فلتر الفوج الفرعي والبحث */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 text-xs font-bold">
              <button
                onClick={() => setSubgroupFilter("all")}
                className={`px-2 py-1 rounded-lg ${subgroupFilter === "all" ? "bg-slate-800 text-white" : "text-slate-600"}`}
              >
                الكل
              </button>
              <button
                onClick={() => setSubgroupFilter("فوج 1")}
                className={`px-2 py-1 rounded-lg ${subgroupFilter === "فوج 1" ? "bg-purple-700 text-white" : "text-slate-600"}`}
              >
                فوج 1
              </button>
              <button
                onClick={() => setSubgroupFilter("فوج 2")}
                className={`px-2 py-1 rounded-lg ${subgroupFilter === "فوج 2" ? "bg-amber-700 text-white" : "text-slate-600"}`}
              >
                فوج 2
              </button>
            </div>

            <div className="relative w-44">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث عن تلميذ..."
                className="w-full h-8 pr-7 pl-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* إرشادات سريعة للأستاذ */}
        <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between flex-wrap gap-2 text-[11px] font-bold text-emerald-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              💡 <strong>تلميح سريع:</strong> اكتب الرقم مباشرة (مثال: 3.5)، اكتب <kbd className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono">غ</kbd> للغائب، أو <kbd className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono">—</kbd> لـ (ليس الآن / معلّق). يتم حساب التقويم والمراقبة والمعدل آلياً!
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <span>المعادلة المعتمدة: المراقبة المستمرة = (الفرض + التقويم) ÷ 2</span>
          </div>
        </div>
      </div>

      {/* ─── جدول الإكسل المتكامل ─── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            {/* الرأس العلوي مع تصنيف الأعمدة */}
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 text-[11px]">
                <th colSpan={3} className="py-2.5 px-2 border-l border-slate-200 bg-slate-100">
                  بيانات التلميذ
                </th>
                <th colSpan={9} className="py-2.5 px-2 border-l border-emerald-200 bg-emerald-50/80 text-emerald-950 font-black">
                  📝 أعمدة التقويم المستمر (المجموع: 20 نقطة)
                </th>
                <th colSpan={4} className="py-2.5 px-2 bg-blue-50/80 text-blue-950 font-black">
                  📊 الفرض والاختبار والمعدل الفصلي
                </th>
              </tr>
              <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 text-[11px]" style={{ fontFamily: "'Cairo', sans-serif" }}>
                <th className="py-2 px-1 w-8">#</th>
                <th className="py-2 px-3 text-right min-w-[160px] font-black text-slate-900">
                  اسم ولقب التلميذ
                </th>
                <th className="py-2 px-2 border-l border-slate-200 w-16">الفوج</th>

                {/* أعمدة التقويم المفصلة مع زر (-) للكل في كل عمود */}
                <th className="py-2 px-1 w-16 bg-emerald-50/50" title="المشاركة والانضباط داخل القسم (4 نقاط)">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">مشاركة</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-emerald-700 font-normal">/ 4</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("behaviorScore")}
                        className="px-1 py-0.2 rounded bg-slate-200/80 hover:bg-emerald-200 text-slate-800 hover:text-emerald-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-1 w-16 bg-emerald-50/50" title="الاستجواب الكتابي الأول (4 نقاط)">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">استجواب 1</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-emerald-700 font-normal">/ 4</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("quiz1Score")}
                        className="px-1 py-0.2 rounded bg-slate-200/80 hover:bg-emerald-200 text-slate-800 hover:text-emerald-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-1 w-16 bg-emerald-50/50" title="الوظيفة المنزلية الأولى (2 نقطتان)">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">وظيفة 1</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-emerald-700 font-normal">/ 2</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("homework1Score")}
                        className="px-1 py-0.2 rounded bg-slate-200/80 hover:bg-emerald-200 text-slate-800 hover:text-emerald-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-1 w-16 bg-emerald-50/50" title="الاستجواب الكتابي الثاني (4 نقاط)">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">استجواب 2</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-emerald-700 font-normal">/ 4</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("quiz2Score")}
                        className="px-1 py-0.2 rounded bg-slate-200/80 hover:bg-emerald-200 text-slate-800 hover:text-emerald-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-1 w-16 bg-emerald-50/50" title="الوظيفة المنزلية الثانية (2 نقطتان)">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">وظيفة 2</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-emerald-700 font-normal">/ 2</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("homework2Score")}
                        className="px-1 py-0.2 rounded bg-slate-200/80 hover:bg-emerald-200 text-slate-800 hover:text-emerald-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-1 w-16 bg-emerald-50/50" title="مراقبة الكراس 1 (2 نقطتان)">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">كراس 1</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-emerald-700 font-normal">/ 2</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("notebook1Score")}
                        className="px-1 py-0.2 rounded bg-slate-200/80 hover:bg-emerald-200 text-slate-800 hover:text-emerald-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-1 w-16 bg-emerald-50/50" title="مراقبة الكراس 2 (2 نقطتان)">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">كراس 2</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-emerald-700 font-normal">/ 2</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("notebook2Score")}
                        className="px-1 py-0.2 rounded bg-slate-200/80 hover:bg-emerald-200 text-slate-800 hover:text-emerald-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-1 w-14 bg-emerald-50/50" title="نقاط إضافية لحل الواجبات والمبادرات">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">إضافي</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-purple-700 font-normal">(+)</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("bonusScore")}
                        className="px-1 py-0.2 rounded bg-slate-200/80 hover:bg-purple-200 text-slate-800 hover:text-purple-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-2 w-20 border-l border-emerald-300 bg-emerald-100/90 text-emerald-950 font-black">
                  التقويم<br/><span className="text-[10px] font-mono">/ 20</span>
                </th>

                {/* الفرض، المراقبة، الاختبار، المعدل */}
                <th className="py-2 px-1.5 w-20 bg-blue-50/40 text-blue-950 font-black" title="علامة الفرض الفصلي من 20">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">الفرض</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-blue-700 font-normal">/ 20</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("test1Score")}
                        className="px-1 py-0.2 rounded bg-blue-200/80 hover:bg-blue-300 text-blue-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-2 w-24 bg-blue-100/90 text-blue-950 font-black" title="المراقبة المستمرة = (الفرض + التقويم) / 2">
                  المراقبة<br/><span className="text-[10px] font-mono text-blue-800">(ف+ت)/2</span>
                </th>
                <th className="py-2 px-1.5 w-20 bg-indigo-50/40 text-indigo-950 font-black" title="علامة الاختبار الفصلي من 20">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="leading-tight">الاختبار</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-indigo-700 font-normal">/ 20</span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetColumn("examScore")}
                        className="px-1 py-0.2 rounded bg-indigo-200/80 hover:bg-indigo-300 text-indigo-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                        title="تعيين (-) لجميع تلاميذ هذا العمود (أو إرجاعه فارغاً)"
                      >
                        - للكل
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-2 w-24 bg-gradient-to-b from-amber-100 to-amber-200 text-amber-950 font-black">
                  المعدل<br/><span className="text-[10px] font-mono text-amber-900">الفصلي</span>
                </th>
              </tr>
            </thead>

            {/* الأسطر */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-400 font-sans">
                    جاري تحميل دفتر التنقيط...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-400 font-sans">
                    لا يوجد تلاميذ في هذا الفوج. يرجى رفع ملف التلاميذ أولاً من صفحة التلاميذ!
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, rowIdx) => {
                  return (
                    <tr key={s.studentId} className="hover:bg-slate-50 transition">
                      <td className="py-1.5 px-1 text-slate-400 text-[11px]">{rowIdx + 1}</td>
                      <td
    className="py-1.5 px-3 text-right font-black text-slate-900 whitespace-nowrap text-xs sm:text-sm tracking-normal"
    style={{ fontFamily: "'Cairo', sans-serif" }}
  >
    {s.studentName}
  </td>
                      <td className="py-1.5 px-2 border-l border-slate-200 font-sans text-[11px] text-slate-500">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            s.groupName === "فوج 1" ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {s.groupName}
                        </span>
                      </td>

                      {/* إدخال خلايا التقويم المفصلة */}
                      {EVAL_COLS.slice(0, 8).map((colKey, colIdx) => {
                        const cellKey = `cell_${rowIdx}_${colIdx}`;
                        const val = (s as any)[colKey] ?? "";
                        const isAbsent = val === "غ";
                        const isPending = val === "—";

                        return (
                          <td key={colKey} className="p-0.5 bg-emerald-50/20">
                            <input
                              ref={(el) => {
                                inputRefs.current[cellKey] = el;
                              }}
                              type="text"
                              inputMode="decimal"
                              value={val}
                              onChange={(e) => handleCellChange(rowIdx, colKey, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                              className={`w-full h-8 text-center text-xs font-mono font-bold rounded-lg transition outline-none border focus:ring-2 focus:ring-emerald-500/30 ${
                                isAbsent
                                  ? "bg-red-50 text-red-700 border-red-300 font-sans font-black"
                                  : isPending
                                  ? "bg-slate-100 text-slate-400 border-slate-200"
                                  : val !== "" && val !== undefined
                                  ? "bg-white text-slate-900 border-slate-200 font-black"
                                  : "bg-white/60 text-slate-400 border-transparent hover:border-slate-200 focus:bg-white"
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* مجموع التقويم المحسوب تلقائياً (من 20) */}
                      <td className="py-1.5 px-2 border-l border-emerald-300 bg-emerald-100/70 text-emerald-950 font-black text-xs">
                        {s.continuousScore !== "" ? s.continuousScore : <span className="text-slate-300">-</span>}
                      </td>

                      {/* الفرض (من 20) */}
                      <td className="p-0.5 bg-blue-50/20">
                        <input
                          ref={(el) => {
                            inputRefs.current[`cell_${rowIdx}_8`] = el;
                          }}
                          type="text"
                          inputMode="decimal"
                          value={s.test1Score ?? ""}
                          onChange={(e) => handleCellChange(rowIdx, "test1Score", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, 8)}
                          placeholder="الفرض"
                          className="w-full h-8 text-center text-xs font-mono font-black text-blue-950 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 outline-none"
                        />
                      </td>

                      {/* المراقبة المستمرة = (الفرض + التقويم) / 2 */}
                      <td className="py-1.5 px-2 bg-blue-100/70 text-blue-950 font-black text-xs">
                        {s.continuousMonitoring !== "" ? (
                          s.continuousMonitoring
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* الاختبار (من 20) */}
                      <td className="p-0.5 bg-indigo-50/20">
                        <input
                          ref={(el) => {
                            inputRefs.current[`cell_${rowIdx}_9`] = el;
                          }}
                          type="text"
                          inputMode="decimal"
                          value={s.examScore ?? ""}
                          onChange={(e) => handleCellChange(rowIdx, "examScore", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, 9)}
                          placeholder="اختبار"
                          className="w-full h-8 text-center text-xs font-mono font-black text-indigo-950 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                        />
                      </td>

                      {/* المعدل الفصلي المحسوب تلقائياً */}
                      <td className="py-1.5 px-2 bg-gradient-to-b from-amber-50 to-amber-100 text-amber-950 font-black text-sm">
                        {s.termAverage !== "" ? s.termAverage : <span className="text-slate-300 text-xs">-</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
