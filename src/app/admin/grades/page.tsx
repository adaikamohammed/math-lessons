"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Save,
  SlidersHorizontal,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Settings,
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

export type ColumnMeta = {
  key: string;
  title: string;
  subTitle: string;
  category: "eval" | "test" | "exam" | "calc";
  bgHeader: string;
  textHeader: string;
  description: string;
};

export const DEFAULT_COLUMN_KEYS = [
  "behaviorScore",
  "quiz1Score",
  "homework1Score",
  "quiz2Score",
  "homework2Score",
  "notebook1Score",
  "notebook2Score",
  "bonusScore",
  "continuousScore",
  "test1Score",
  "continuousMonitoring",
  "examScore",
  "termAverage",
] as const;

export const COLUMN_DEFINITIONS: Record<string, ColumnMeta> = {
  behaviorScore: {
    key: "behaviorScore",
    title: "مشاركة",
    subTitle: "/ 4",
    category: "eval",
    bgHeader: "bg-emerald-50/50",
    textHeader: "text-emerald-700",
    description: "المشاركة والسلوك والانضباط داخل القسم (4 نقاط)",
  },
  quiz1Score: {
    key: "quiz1Score",
    title: "استجواب 1",
    subTitle: "/ 4",
    category: "eval",
    bgHeader: "bg-emerald-50/50",
    textHeader: "text-emerald-700",
    description: "الاستجواب الكتابي الأول (4 نقاط)",
  },
  homework1Score: {
    key: "homework1Score",
    title: "وظيفة 1",
    subTitle: "/ 2",
    category: "eval",
    bgHeader: "bg-emerald-50/50",
    textHeader: "text-emerald-700",
    description: "الوظيفة المنزلية الأولى (نقطتان)",
  },
  quiz2Score: {
    key: "quiz2Score",
    title: "استجواب 2",
    subTitle: "/ 4",
    category: "eval",
    bgHeader: "bg-emerald-50/50",
    textHeader: "text-emerald-700",
    description: "الاستجواب الكتابي الثاني (4 نقاط)",
  },
  homework2Score: {
    key: "homework2Score",
    title: "وظيفة 2",
    subTitle: "/ 2",
    category: "eval",
    bgHeader: "bg-emerald-50/50",
    textHeader: "text-emerald-700",
    description: "الوظيفة المنزلية الثانية (نقطتان)",
  },
  notebook1Score: {
    key: "notebook1Score",
    title: "كراس 1",
    subTitle: "/ 2",
    category: "eval",
    bgHeader: "bg-emerald-50/50",
    textHeader: "text-emerald-700",
    description: "مراقبة الكراس الأولى (نقطتان)",
  },
  notebook2Score: {
    key: "notebook2Score",
    title: "كراس 2",
    subTitle: "/ 2",
    category: "eval",
    bgHeader: "bg-emerald-50/50",
    textHeader: "text-emerald-700",
    description: "مراقبة الكراس الثانية (نقطتان)",
  },
  bonusScore: {
    key: "bonusScore",
    title: "إضافي",
    subTitle: "(+)",
    category: "eval",
    bgHeader: "bg-emerald-50/50",
    textHeader: "text-purple-700",
    description: "نقاط إضافية لحل الواجبات والمبادرات",
  },
  continuousScore: {
    key: "continuousScore",
    title: "التقويم",
    subTitle: "/ 20",
    category: "calc",
    bgHeader: "border-l border-emerald-300 bg-emerald-100/90 text-emerald-950 font-black",
    textHeader: "text-emerald-950 font-mono",
    description: "مجموع التقويم المستمر المحسوب آلياً (من 20)",
  },
  test1Score: {
    key: "test1Score",
    title: "الفرض",
    subTitle: "/ 20",
    category: "test",
    bgHeader: "bg-blue-50/40 text-blue-950 font-black",
    textHeader: "text-blue-700",
    description: "علامة الفرض الفصلي (من 20)",
  },
  continuousMonitoring: {
    key: "continuousMonitoring",
    title: "المراقبة",
    subTitle: "(ف+ت)/2",
    category: "calc",
    bgHeader: "bg-blue-100/90 text-blue-950 font-black",
    textHeader: "text-blue-800 font-mono",
    description: "المراقبة المستمرة = (الفرض + التقويم) / 2",
  },
  examScore: {
    key: "examScore",
    title: "الاختبار",
    subTitle: "/ 20",
    category: "exam",
    bgHeader: "bg-indigo-50/40 text-indigo-950 font-black",
    textHeader: "text-indigo-700",
    description: "علامة الاختبار الفصلي (من 20)",
  },
  termAverage: {
    key: "termAverage",
    title: "المعدل",
    subTitle: "الفصلي",
    category: "calc",
    bgHeader: "bg-gradient-to-b from-amber-100 to-amber-200 text-amber-950 font-black",
    textHeader: "text-amber-900 font-mono",
    description: "المعدل الفصلي = (المراقبة + الاختبار * 2) / 3",
  },
};

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

  const clampVal = (v: any, max: number): number | null => {
    const n = parseVal(v);
    if (n === null) return null;
    return Math.min(max, Math.max(0, n));
  };

  const b = clampVal(row.behaviorScore, 4);
  const q1 = clampVal(row.quiz1Score, 4);
  const hw1 = clampVal(row.homework1Score, 2);
  const q2 = clampVal(row.quiz2Score, 4);
  const hw2 = clampVal(row.homework2Score, 2);
  const nb1 = clampVal(row.notebook1Score, 2);
  const nb2 = clampVal(row.notebook2Score, 2);
  const bonus = clampVal(row.bonusScore, 5) || 0;

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
    const c = parseVal(row.continuousScore);
    continuousScore = c !== null ? Math.min(20, Math.max(0, c)) : row.continuousScore;
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
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "unsaved" | "error">("synced");

  // حالة ترتيب الأعمدة القابلة للتخصيص من قبل الأستاذ
  const [columnOrder, setColumnOrder] = useState<string[]>([...DEFAULT_COLUMN_KEYS]);
  const [showColModal, setShowColModal] = useState(false);

  // استرجاع ترتيب الأعمدة المخصص للأستاذ من التخزين المحلي
  useEffect(() => {
    try {
      const saved = localStorage.getItem("math_gradebook_columns_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((k: string) => COLUMN_DEFINITIONS[k]);
          DEFAULT_COLUMN_KEYS.forEach((k) => {
            if (!valid.includes(k)) valid.push(k);
          });
          setColumnOrder(valid);
        }
      }
    } catch {}
  }, []);

  // دالة نقل العمود خطوة لليمين أو اليسار وحفظ الترتيب
  const moveColumn = (colKey: string, direction: "prev" | "next") => {
    setColumnOrder((prev) => {
      const idx = prev.indexOf(colKey);
      if (idx === -1) return prev;
      if (direction === "prev" && idx === 0) return prev;
      if (direction === "next" && idx === prev.length - 1) return prev;

      const targetIdx = direction === "prev" ? idx - 1 : idx + 1;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;

      try {
        localStorage.setItem("math_gradebook_columns_order", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // استعادة الترتيب الافتراضي للأعمدة
  const resetColumnOrder = () => {
    setColumnOrder([...DEFAULT_COLUMN_KEYS]);
    try {
      localStorage.removeItem("math_gradebook_columns_order");
    } catch {}
  };

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestStudentsRef = useRef<StudentGradeRow[]>([]);
  latestStudentsRef.current = students;

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

  // تحذير المستخدم إن حاول إغلاق الصفحة وهناك تعديل قيد الحفظ
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [isDirty]);

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
            maxVal = 5;
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
      latestStudentsRef.current = next;

      // جدولة الحفظ والمزامنة التلقائية فورياً في الخلفية (Debounce 1000ms)
      setIsDirty(true);
      setSyncStatus("unsaved");
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        performSave(next);
      }, 1000);

      return next;
    });
  };

  // عند الخروج من الخلية (Blur)، نحفظ التعديلات فوراً إن وجدت
  const handleCellBlur = () => {
    if (isDirty && latestStudentsRef.current.length > 0) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      performSave(latestStudentsRef.current);
    }
  };

  // تعيين عمود كامل بشرطة «—» (ليس الآن) أو إرجاعه فارغاً بنقرة واحدة لجميع الأعمدة
  const handleBulkSetColumn = (col: EvalColKey) => {
    setStudents((prev) => {
      const isAllPending = prev.length > 0 && prev.every((s) => s[col] === "—" || s[col] === "-");
      const nextVal = isAllPending ? "" : "—";

      const updated = prev.map((s) => {
        const row = { ...s, [col]: nextVal };
        const scores = calculateRowScores(row);
        return {
          ...row,
          continuousScore: scores.continuousScore,
          continuousMonitoring: scores.continuousMonitoring,
          termAverage: scores.termAverage,
        };
      });

      latestStudentsRef.current = updated;
      setIsDirty(true);
      setSyncStatus("unsaved");
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      performSave(updated);

      return updated;
    });
  };

  // التنقل الذكي بالكيبورد (إكسل) متوافق مع ترتيب الأعمدة الديناميكي
  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    const totalRows = filteredStudents.length;
    const totalCols = columnOrder.length;

    let targetRow = rowIdx;
    let targetCol = colIdx;

    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      if (rowIdx < totalRows - 1) targetRow = rowIdx + 1;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIdx > 0) targetRow = rowIdx - 1;
    } else if (e.key === "ArrowLeft") {
      let nextCol = colIdx + 1;
      while (nextCol < totalCols) {
        const meta = COLUMN_DEFINITIONS[columnOrder[nextCol]];
        if (meta && meta.category !== "calc") {
          targetCol = nextCol;
          e.preventDefault();
          break;
        }
        nextCol++;
      }
    } else if (e.key === "ArrowRight") {
      let prevCol = colIdx - 1;
      while (prevCol >= 0) {
        const meta = COLUMN_DEFINITIONS[columnOrder[prevCol]];
        if (meta && meta.category !== "calc") {
          targetCol = prevCol;
          e.preventDefault();
          break;
        }
        prevCol--;
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

  // الدالة المركزية للحفظ والمزامنة السحابية الفورية
  const performSave = useCallback(
    async (rowsToSave: StudentGradeRow[], isManual = false) => {
      if (rowsToSave.length === 0) return;
      setSaving(true);
      setSyncStatus("saving");

      try {
        const res = await fetch("/api/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trimester,
            updates: rowsToSave.map((s) => ({
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

        if (!res.ok) throw new Error("فشل الحفظ في السحابة");

        setIsDirty(false);
        setSyncStatus("synced");
        if (isManual) {
          setFeedback({ type: "ok", text: "تم تأكيد حفظ جميع النقاط بنجاح في السحابة!" });
          setTimeout(() => setFeedback(null), 3500);
        }
      } catch (err: any) {
        console.error("Save error:", err);
        setSyncStatus("error");
        setFeedback({ type: "err", text: err.message || "فشل الحفظ السحابي، تأكد من الإنترنت" });
      } finally {
        setSaving(false);
      }
    },
    [trimester]
  );

  // تبديل الفوج مع حفظ أي تعديلات معلقة فوراً
  const handleSwitchClass = async (newCls: (typeof CLASSES)[number]) => {
    if (newCls === selectedClass) return;
    if (isDirty && latestStudentsRef.current.length > 0) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      await performSave(latestStudentsRef.current);
    }
    setSelectedClass(newCls);
  };

  // تبديل الفصل مع حفظ أي تعديلات معلقة فوراً
  const handleSwitchTrimester = async (newTri: 1 | 2 | 3) => {
    if (newTri === trimester) return;
    if (isDirty && latestStudentsRef.current.length > 0) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      await performSave(latestStudentsRef.current);
    }
    setTrimester(newTri);
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

                {/* شارة حالة المزامنة السحابية الفورية */}
                {syncStatus === "saving" && (
                  <span className="text-[11px] bg-amber-100 text-amber-900 font-black px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
                    <span>جاري الحفظ التلقائي...</span>
                  </span>
                )}
                {syncStatus === "synced" && !isDirty && (
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 font-black px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم الحفظ والمزامنة تلقائياً ✓</span>
                  </span>
                )}
                {syncStatus === "unsaved" && (
                  <span className="text-[11px] bg-blue-50 text-blue-800 font-bold px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>تعديلات جديدة (حفظ تلقائي...)</span>
                  </span>
                )}
                {syncStatus === "error" && (
                  <button
                    type="button"
                    onClick={() => performSave(latestStudentsRef.current, true)}
                    className="text-[11px] bg-red-100 text-red-800 font-black px-2.5 py-0.5 rounded-full border border-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <AlertCircle className="w-3 h-3 text-red-600" />
                    <span>فشل الحفظ - انقر لإعادة المحاولة ↻</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 font-bold">
                حساب تلقائي للتقويم (20) والمراقبة المستمرة والمعدل الفصلي • تنقل بالأسهم والـ Enter كالإكسل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* زر حفظ التعديلات اليدوي أو التأكيدي */}
            <button
              onClick={() => performSave(latestStudentsRef.current, true)}
              disabled={saving}
              type="button"
              className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ${
                saving
                  ? "bg-amber-600 text-white"
                  : isDirty
                  ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white ring-2 ring-emerald-500/30"
                  : "bg-slate-900 hover:bg-black text-white"
              }`}
              title="يتم الحفظ التلقائي في الخلفية دائماً، ويمكنك النقر للحفظ الفوري المؤكد"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                  <span>جاري الحفظ...</span>
                </>
              ) : isDirty ? (
                <>
                  <Save className="w-4 h-4 text-emerald-200" />
                  <span>حفظ فوري 💾</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>محفوظ تلقائياً ✓</span>
                </>
              )}
            </button>

            {/* زر تخصيص وترتيب الأعمدة */}
            <button
              type="button"
              onClick={() => setShowColModal(true)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="إعادة ترتيب أعمدة دفتر التنقيط كما تريد"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>ترتيب الأعمدة ⚙️</span>
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
                onClick={() => handleSwitchClass(cls)}
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
                onClick={() => handleSwitchTrimester(tri)}
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

                {/* الأعمدة المرتبة ديناميكياً بحسب رغبة الأستاذ */}
                {columnOrder.map((colKey, colIdx) => {
                  const meta = COLUMN_DEFINITIONS[colKey];
                  if (!meta) return null;
                  const isInputCol = meta.category === "eval" || meta.category === "test" || meta.category === "exam";

                  return (
                    <th
                      key={colKey}
                      className={`py-2 px-1 w-16 ${meta.bgHeader}`}
                      title={meta.description}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        {/* أزرار تقديم وتأخير العمود */}
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveColumn(colKey, "prev")}
                            disabled={colIdx === 0}
                            className="p-0.5 rounded hover:bg-black/10 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer text-[10px] transition active:scale-90"
                            title="نقل العمود خطوة لليمين ◀"
                          >
                            ◀
                          </button>
                          <span className="leading-tight font-black select-none whitespace-nowrap text-[11px]">
                            {meta.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveColumn(colKey, "next")}
                            disabled={colIdx === columnOrder.length - 1}
                            className="p-0.5 rounded hover:bg-black/10 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer text-[10px] transition active:scale-90"
                            title="نقل العمود خطوة لليسار ▶"
                          >
                            ▶
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] ${meta.textHeader} font-normal`}>
                            {meta.subTitle}
                          </span>
                          {isInputCol && (
                            <button
                              type="button"
                              onClick={() => handleBulkSetColumn(colKey as EvalColKey)}
                              className="px-1 py-0.2 rounded bg-slate-200/80 hover:bg-emerald-200 text-slate-800 hover:text-emerald-950 text-[9px] font-black cursor-pointer transition active:scale-95"
                              title="تعيين (-) للعمود كاملاً أو إرجاعه فارغاً"
                            >
                              - للكل
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
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

                      {/* عرض خلايا السطر بحسب ترتيب الأعمدة المختار من قبل الأستاذ */}
                      {columnOrder.map((colKey, colIdx) => {
                        const meta = COLUMN_DEFINITIONS[colKey];
                        if (!meta) return null;
                        const cellKey = `cell_${rowIdx}_${colIdx}`;

                        // 1. أعمدة التقويم المستمر المفصلة القابلة للإدخال
                        if (meta.category === "eval") {
                          const val = (s as any)[colKey] ?? "";
                          const isAbsent = val === "غ";
                          const isPending = val === "—" || val === "-";

                          return (
                            <td key={colKey} className="p-0.5 bg-emerald-50/20">
                              <input
                                ref={(el) => {
                                  inputRefs.current[cellKey] = el;
                                }}
                                type="text"
                                inputMode="decimal"
                                value={val}
                                onChange={(e) => handleCellChange(rowIdx, colKey as EvalColKey, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                                onBlur={handleCellBlur}
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
                        }

                        // 2. علامة الفرض (20)
                        if (colKey === "test1Score") {
                          return (
                            <td key={colKey} className="p-0.5 bg-blue-50/20">
                              <input
                                ref={(el) => {
                                  inputRefs.current[cellKey] = el;
                                }}
                                type="text"
                                inputMode="decimal"
                                value={s.test1Score ?? ""}
                                onChange={(e) => handleCellChange(rowIdx, "test1Score", e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                                onBlur={handleCellBlur}
                                placeholder="الفرض"
                                className="w-full h-8 text-center text-xs font-mono font-black text-blue-950 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 outline-none"
                              />
                            </td>
                          );
                        }

                        // 3. علامة الاختبار (20)
                        if (colKey === "examScore") {
                          return (
                            <td key={colKey} className="p-0.5 bg-indigo-50/20">
                              <input
                                ref={(el) => {
                                  inputRefs.current[cellKey] = el;
                                }}
                                type="text"
                                inputMode="decimal"
                                value={s.examScore ?? ""}
                                onChange={(e) => handleCellChange(rowIdx, "examScore", e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                                onBlur={handleCellBlur}
                                placeholder="اختبار"
                                className="w-full h-8 text-center text-xs font-mono font-black text-indigo-950 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                              />
                            </td>
                          );
                        }

                        // 4. مجموع التقويم المحسوب آلياً (20)
                        if (colKey === "continuousScore") {
                          return (
                            <td key={colKey} className="py-1.5 px-2 border-l border-emerald-300 bg-emerald-100/70 text-emerald-950 font-black text-xs font-mono">
                              {s.continuousScore !== "" ? s.continuousScore : <span className="text-slate-300">-</span>}
                            </td>
                          );
                        }

                        // 5. المراقبة المستمرة = (الفرض + التقويم) / 2
                        if (colKey === "continuousMonitoring") {
                          return (
                            <td key={colKey} className="py-1.5 px-2 bg-blue-100/70 text-blue-950 font-black text-xs font-mono">
                              {s.continuousMonitoring !== "" ? (
                                s.continuousMonitoring
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        }

                        // 6. المعدل الفصلي المحسوب تلقائياً
                        if (colKey === "termAverage") {
                          return (
                            <td key={colKey} className="py-1.5 px-2 bg-gradient-to-b from-amber-50 to-amber-100 text-amber-950 font-black text-sm font-mono">
                              {s.termAverage !== "" ? s.termAverage : <span className="text-slate-300 text-xs">-</span>}
                            </td>
                          );
                        }

                        return null;
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* ─── نافذة تخصيص وترتيب الأعمدة ─── */}
      {showColModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">تخصيص وترتيب أعمدة دفتر التنقيط</h3>
                  <p className="text-[11px] text-slate-500 font-bold">رتب الأعمدة حسب رغبتك باستخدام أزرار التقديم والتأخير</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowColModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-1.5 flex-1 pr-1">
              {columnOrder.map((colKey, idx) => {
                const meta = COLUMN_DEFINITIONS[colKey];
                if (!meta) return null;
                const isCalc = meta.category === "calc";

                return (
                  <div
                    key={colKey}
                    className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-mono text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">{meta.title}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{meta.subTitle}</span>
                          {isCalc ? (
                            <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">محسوب آلياً</span>
                          ) : (
                            <span className="text-[9px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded">إدخال يدوي</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold line-clamp-1">{meta.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveColumn(colKey, "prev")}
                        disabled={idx === 0}
                        className="px-2 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-20 text-xs font-black cursor-pointer transition active:scale-95"
                        title="تقديم للأعلى"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumn(colKey, "next")}
                        disabled={idx === columnOrder.length - 1}
                        className="px-2 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-20 text-xs font-black cursor-pointer transition active:scale-95"
                        title="تأخير للأسفل"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={resetColumnOrder}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الترتيب الافتراضي</span>
              </button>
              <button
                type="button"
                onClick={() => setShowColModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition cursor-pointer active:scale-95"
              >
                تم واعتماد الترتيب ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}