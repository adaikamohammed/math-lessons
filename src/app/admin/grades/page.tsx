"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
} from "lucide-react";

const CLASSES = ["1م1", "1م2", "1م3", "2م3"];
const COLS = ["continuousScore", "test1Score", "test2Score", "examScore"] as const;
type ColKey = (typeof COLS)[number];

type StudentRow = {
  studentId: string;
  studentName: string;
  className: string;
  groupName: string;
  continuousScore: string | number;
  test1Score: string | number;
  test2Score: string | number;
  examScore: string | number;
  termAverage: string | number;
  appreciation: string;
  rank?: number;
};

export default function AdminGradesExcelPage() {
  const [selectedClass, setSelectedClass] = useState("1م1");
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // مصفوفة مراجع لعناصر الإدخال لدعم التنقل بالكيبورد مثل إكسل
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/grades?className=${encodeURIComponent(selectedClass)}&trimester=${trimester}`);
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
        setIsDirty(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, trimester]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // دالة حساب المعدل الفصلي لحظياً في المتصفح
  const computeRowAverage = (contRaw: any, t1Raw: any, t2Raw: any, examRaw: any): string => {
    const cont = contRaw === "" || contRaw === undefined ? null : Number(contRaw);
    const t1 = t1Raw === "" || t1Raw === undefined ? null : Number(t1Raw);
    const t2 = t2Raw === "" || t2Raw === undefined ? null : Number(t2Raw);
    const exam = examRaw === "" || examRaw === undefined ? null : Number(examRaw);

    let testAvg: number | null = null;
    if (t1 !== null && t2 !== null) testAvg = (t1 + t2) / 2;
    else if (t1 !== null) testAvg = t1;

    let contAndTest: number | null = null;
    if (cont !== null && testAvg !== null) contAndTest = (cont + testAvg) / 2;
    else if (cont !== null) contAndTest = cont;
    else if (testAvg !== null) contAndTest = testAvg;

    if (contAndTest === null) return "";

    if (exam !== null) {
      const finalAvg = (contAndTest + exam * 2) / 3;
      return finalAvg.toFixed(2);
    }

    return contAndTest.toFixed(2);
  };

  // تعديل خلية
  const handleCellChange = (rowIdx: number, col: ColKey, val: string) => {
    setStudents((prev) => {
      const next = [...prev];
      const row = { ...next[rowIdx] };

      // قبول الأرقام من 0 إلى 20 مع الفاصلة
      if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
        const num = parseFloat(val);
        if (val === "" || (num >= 0 && num <= 20)) {
          (row as any)[col] = val;
          row.termAverage = computeRowAverage(
            col === "continuousScore" ? val : row.continuousScore,
            col === "test1Score" ? val : row.test1Score,
            col === "test2Score" ? val : row.test2Score,
            col === "examScore" ? val : row.examScore
          );
          next[rowIdx] = row;
          setIsDirty(true);
        }
      }
      return next;
    });
  };

  // التحكم في التنقل بالكيبورد كملف Excel
  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    let nextRow = rowIdx;
    let nextCol = colIdx;

    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      nextRow = Math.min(students.length - 1, rowIdx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nextRow = Math.max(0, rowIdx - 1);
    } else if (e.key === "ArrowLeft") {
      // في الاتجاه العربي RTL، السهم لليسار ينقل للخانة التالية لليسار
      e.preventDefault();
      nextCol = Math.min(COLS.length - 1, colIdx + 1);
    } else if (e.key === "ArrowRight") {
      // السهم لليمين ينقل للخانة السابقة لليمين
      e.preventDefault();
      nextCol = Math.max(0, colIdx - 1);
    } else {
      return;
    }

    const nextKey = `${nextRow}_${nextCol}`;
    const targetInput = inputRefs.current[nextKey];
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  };

  // حفظ النقاط
  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const updates = students.map((s) => ({
        studentId: s.studentId,
        studentName: s.studentName,
        className: s.className,
        continuousScore: s.continuousScore,
        test1Score: s.test1Score,
        test2Score: s.test2Score,
        examScore: s.examScore,
      }));

      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates, trimester }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");

      setIsDirty(false);
      setFeedback("تم حفظ جميع النقاط بنجاح ومزامنتها سحابياً ✅");
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert("حدث خطأ أثناء الحفظ: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-16 pt-3 fade-up space-y-4 max-w-6xl mx-auto">
      {/* رأس الصفحة وزر الرجوع */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
        <Link
          href="/admin"
          className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 active:scale-95 transition shrink-0"
          aria-label="الرجوع للوحة التحكم"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-black text-slate-900 truncate">
              دفتر رصد النقاط السريع (نمط Excel)
            </h1>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-200">
              كيبورد مباشر ⚡
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-bold truncate">
            الأستاذ محمد عدايكة — متوسطة المجاهد باهي علي
          </p>
        </div>

        {/* زر الحفظ */}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition active:scale-95 ${
            isDirty
              ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 animate-pulse"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "جاري الحفظ..." : isDirty ? "حفظ التغييرات *" : "محفوظ سحابياً"}</span>
        </button>
      </div>

      {/* بنر إرشادي لطريقة استخدام الكيبورد */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 p-3.5 rounded-2xl border border-emerald-200/80 text-xs font-bold text-slate-700 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            اكتب النقطة مباشرة (بدون أسهم): تنقل بزر <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono">Enter</kbd> أو الأسهم <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono">↓ ↑ → ←</kbd> للنزول والصعود السلس بين التلاميذ.
          </span>
        </div>
        <div className="text-[11px] text-emerald-800 font-black shrink-0 hidden sm:block">
          الحساب فوري للمعدل 🎯
        </div>
      </div>

      {/* شريط اختيار القسم والفصل */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* اختيار الفوج */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-black text-slate-700 shrink-0">الفوج:</span>
          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
            {CLASSES.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition border shrink-0 ${
                  selectedClass === cls
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* اختيار الفصل */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-black text-slate-700 shrink-0">الفصل:</span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((t) => (
              <button
                key={t}
                onClick={() => setTrimester(t as 1 | 2 | 3)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition border ${
                  trimester === t
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                الفصل {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 fade-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* جدول إدخال النقاط السريع (Excel Table) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center border-l border-slate-200">#</th>
                <th className="py-3 px-3 min-w-[160px] border-l border-slate-200">اسم ولقب التلميذ</th>
                <th className="py-3 px-2 w-28 text-center bg-emerald-50/50 border-l border-slate-200">
                  <div className="text-emerald-900">التقويم المستمر</div>
                  <div className="text-[10px] text-emerald-600 font-normal">من 20</div>
                </th>
                <th className="py-3 px-2 w-28 text-center bg-blue-50/50 border-l border-slate-200">
                  <div className="text-blue-900">الفرض المحروس 1</div>
                  <div className="text-[10px] text-blue-600 font-normal">من 20</div>
                </th>
                <th className="py-3 px-2 w-28 text-center bg-sky-50/30 border-l border-slate-200">
                  <div className="text-sky-900">الفرض 2 (اختياري)</div>
                  <div className="text-[10px] text-sky-600 font-normal">من 20</div>
                </th>
                <th className="py-3 px-2 w-32 text-center bg-amber-50/50 border-l border-slate-200">
                  <div className="text-amber-900">الاختبار الفصلي</div>
                  <div className="text-[10px] text-amber-600 font-normal">من 20 (معامل 2)</div>
                </th>
                <th className="py-3 px-3 w-28 text-center bg-slate-100 border-l border-slate-200">
                  <div className="text-slate-900">المعدل الفصلي</div>
                  <div className="text-[10px] text-slate-500 font-normal">حساب فوري ⚡</div>
                </th>
                <th className="py-3 px-3 min-w-[150px]">ملاحظة الأستاذ التوجيهية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    جاري جلب قائمة نقاط {selectedClass}...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    لا يوجد تلاميذ في هذا القسم حالياً. يمكنك إضافتهم من صفحة «إدارة الأفواج».
                  </td>
                </tr>
              ) : (
                students.map((s, rowIdx) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/60 transition group">
                    {/* الرقم */}
                    <td className="py-2 px-2 text-center font-bold text-slate-400 border-l border-slate-100">
                      {rowIdx + 1}
                    </td>

                    {/* اسم التلميذ */}
                    <td className="py-2 px-3 font-black text-slate-900 border-l border-slate-100 truncate">
                      {s.studentName}
                    </td>

                    {/* خانة التقويم المستمر */}
                    <td className="p-1 border-l border-slate-100 bg-emerald-50/20">
                      <input
                        ref={(el) => { inputRefs.current[`${rowIdx}_0`] = el; }}
                        type="text"
                        inputMode="decimal"
                        value={s.continuousScore ?? ""}
                        onChange={(e) => handleCellChange(rowIdx, "continuousScore", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIdx, 0)}
                        placeholder="—"
                        className="w-full h-9 px-2 text-center font-mono font-black text-sm bg-transparent rounded-lg border border-transparent hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                      />
                    </td>

                    {/* خانة الفرض 1 */}
                    <td className="p-1 border-l border-slate-100 bg-blue-50/20">
                      <input
                        ref={(el) => { inputRefs.current[`${rowIdx}_1`] = el; }}
                        type="text"
                        inputMode="decimal"
                        value={s.test1Score ?? ""}
                        onChange={(e) => handleCellChange(rowIdx, "test1Score", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIdx, 1)}
                        placeholder="—"
                        className="w-full h-9 px-2 text-center font-mono font-black text-sm bg-transparent rounded-lg border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                      />
                    </td>

                    {/* خانة الفرض 2 */}
                    <td className="p-1 border-l border-slate-100 bg-sky-50/10">
                      <input
                        ref={(el) => { inputRefs.current[`${rowIdx}_2`] = el; }}
                        type="text"
                        inputMode="decimal"
                        value={s.test2Score ?? ""}
                        onChange={(e) => handleCellChange(rowIdx, "test2Score", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIdx, 2)}
                        placeholder="—"
                        className="w-full h-9 px-2 text-center font-mono font-black text-sm bg-transparent rounded-lg border border-transparent hover:border-slate-300 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                      />
                    </td>

                    {/* خانة الاختبار */}
                    <td className="p-1 border-l border-slate-100 bg-amber-50/20">
                      <input
                        ref={(el) => { inputRefs.current[`${rowIdx}_3`] = el; }}
                        type="text"
                        inputMode="decimal"
                        value={s.examScore ?? ""}
                        onChange={(e) => handleCellChange(rowIdx, "examScore", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIdx, 3)}
                        placeholder="مؤجل ⏳"
                        className="w-full h-9 px-2 text-center font-mono font-black text-sm bg-transparent rounded-lg border border-transparent hover:border-slate-300 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                      />
                    </td>

                    {/* خانة المعدل الفصلي المحسوب تلقائياً */}
                    <td className="py-2 px-3 text-center font-mono font-black text-sm bg-slate-50 border-l border-slate-100">
                      {s.termAverage ? (
                        <span
                          className={
                            Number(s.termAverage) >= 10
                              ? "text-emerald-700 font-extrabold"
                              : "text-amber-700 font-extrabold"
                          }
                        >
                          {s.termAverage}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal text-xs">—</span>
                      )}
                    </td>

                    {/* ملاحظة الأستاذ */}
                    <td className="py-2 px-3 font-bold text-slate-600 text-[11px] truncate">
                      {s.appreciation || (
                        <span className="text-slate-300 font-normal">تتولد تلقائياً حسب المعدل</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
