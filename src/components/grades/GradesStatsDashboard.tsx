"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Trophy,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Printer,
  Camera,
  Share2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  Sparkles,
  Download,
  X,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
  Check,
  RefreshCw,
} from "lucide-react";

export type AssessmentType = "termAverage" | "test1Score" | "continuousMonitoring" | "examScore";

export interface StudentStatsRow {
  studentId?: string;
  studentName: string;
  className: string;
  groupName?: string;
  continuousMonitoring?: number | string | null;
  test1Score?: number | string | null;
  examScore?: number | string | null;
  termAverage?: number | string | null;
  behaviorScore?: number | string | null;
}

export interface GradesStatsDashboardProps {
  currentClass?: string;
  currentTrimester?: 1 | 2 | 3;
  students?: StudentStatsRow[];
  availableClasses?: string[];
  onClassChange?: (cls: string) => void;
  onTrimesterChange?: (tri: 1 | 2 | 3) => void;
  onBackToGradebook?: () => void;
}

const DEFAULT_CLASSES = ["1م1", "1م2", "1م3", "2م3"];

const ASSESSMENT_OPTIONS: { id: AssessmentType; label: string; short: string; maxScore: number }[] = [
  { id: "termAverage", label: "المعدل الفصلي", short: "المعدل", maxScore: 20 },
  { id: "test1Score", label: "الفرض الأول", short: "الفرض 1", maxScore: 20 },
  { id: "continuousMonitoring", label: "التقويم المستمر", short: "التقويم", maxScore: 20 },
  { id: "examScore", label: "الاختبار الفصلي", short: "الاختبار", maxScore: 20 },
];

export default function GradesStatsDashboard({
  currentClass = "1م1",
  currentTrimester = 1,
  students: initialStudents = [],
  availableClasses = DEFAULT_CLASSES,
  onClassChange,
  onTrimesterChange,
  onBackToGradebook,
}: GradesStatsDashboardProps) {
  // --- حالة التحكم والتصفية ---
  const [mode, setMode] = useState<"single" | "compare" | "all">("single");
  const [selectedClass, setSelectedClass] = useState<string>(currentClass);
  const [trimester, setTrimester] = useState<1 | 2 | 3>(currentTrimester);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("termAverage");

  // المقارنة بين فوجين
  const [compareClassA, setCompareClassA] = useState<string>(currentClass || availableClasses[0] || "1م1");
  const [compareClassB, setCompareClassB] = useState<string>(
    availableClasses.find((c) => c !== currentClass) || availableClasses[1] || "1م2"
  );

  // حالة جلب جميع بيانات الأقسام (لأنماط المقارنة وكل الأقسام)
  const [allStudentsData, setAllStudentsData] = useState<StudentStatsRow[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  // نافذة تصدير صورة الأولياء
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // مزامنة المتغيرات الخارجية
  useEffect(() => {
    if (currentClass && currentClass !== selectedClass) {
      setSelectedClass(currentClass);
    }
  }, [currentClass]);

  useEffect(() => {
    if (currentTrimester && currentTrimester !== trimester) {
      setTrimester(currentTrimester);
    }
  }, [currentTrimester]);

  // جلب كافة التلاميذ عند الحاجة (للمقارنة أو لجميع الأقسام)
  useEffect(() => {
    let isMounted = true;
    async function fetchAllStudents() {
      try {
        setLoadingAll(true);
        const res = await fetch(`/api/grades?className=&trimester=${trimester}&_t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (isMounted && data.students) {
          setAllStudentsData(data.students);
        }
      } catch (err) {
        console.error("فشل جلب بيانات جميع الأقسام للإحصائيات", err);
      } finally {
        if (isMounted) setLoadingAll(false);
      }
    }

    fetchAllStudents();
    return () => {
      isMounted = false;
    };
  }, [trimester]);

  // قائمة الأقسام الفعلية المتاحة
  const classesList = useMemo(() => {
    const fromData = Array.from(new Set(allStudentsData.map((s) => s.className).filter(Boolean)));
    const merged = Array.from(new Set([...availableClasses, ...fromData]));
    return merged.length > 0 ? merged : DEFAULT_CLASSES;
  }, [availableClasses, allStudentsData]);

  // التلاميذ النشطون للفوج المختار
  const currentClassStudents = useMemo(() => {
    if (initialStudents.length > 0 && initialStudents[0]?.className === selectedClass) {
      return initialStudents;
    }
    return allStudentsData.filter((s) => s.className === selectedClass);
  }, [initialStudents, allStudentsData, selectedClass]);

  // دالة حساب المؤشرات الإحصائية لمجموعة تلاميذ وتقييم محدد
  const computeStats = (studentsList: StudentStatsRow[], evalField: AssessmentType) => {
    const total = studentsList.length;

    // استخراج العلامات الصالحة كأرقام
    const validScores: { name: string; score: number }[] = [];
    studentsList.forEach((s) => {
      const raw = s[evalField];
      if (raw !== undefined && raw !== null && raw !== "") {
        const num = typeof raw === "number" ? raw : parseFloat(String(raw));
        if (!isNaN(num) && num >= 0 && num <= 20) {
          validScores.push({ name: s.studentName, score: num });
        }
      }
    });

    const graded = validScores.length;
    if (graded === 0) {
      return {
        total,
        graded: 0,
        average: 0,
        passingCount: 0,
        passingRate: 0,
        highest: 0,
        lowest: 0,
        delta: 0,
        brackets: {
          excellent: { count: 0, pct: 0 },
          good: { count: 0, pct: 0 },
          struggling: { count: 0, pct: 0 },
          weak: { count: 0, pct: 0 },
        },
        topStudents: [],
      };
    }

    const scoresOnly = validScores.map((v) => v.score);
    const sum = scoresOnly.reduce((acc, curr) => acc + curr, 0);
    const average = Number((sum / graded).toFixed(2));
    const highest = Math.max(...scoresOnly);
    const lowest = Math.min(...scoresOnly);
    const delta = Number((highest - lowest).toFixed(1));

    const passingCount = scoresOnly.filter((s) => s >= 10).length;
    const passingRate = Number(((passingCount / graded) * 100).toFixed(1));

    // الفئات والشرائح:
    // ممتاز: >= 15
    // متوسط إلى جيد: 10 - 14.99
    // متعثر: 5 - 9.99
    // ضعيف جداً: < 5
    const excCount = scoresOnly.filter((s) => s >= 15).length;
    const goodCount = scoresOnly.filter((s) => s >= 10 && s < 15).length;
    const strugCount = scoresOnly.filter((s) => s >= 5 && s < 10).length;
    const weakCount = scoresOnly.filter((s) => s < 5).length;

    const brackets = {
      excellent: { count: excCount, pct: Number(((excCount / graded) * 100).toFixed(0)) },
      good: { count: goodCount, pct: Number(((goodCount / graded) * 100).toFixed(0)) },
      struggling: { count: strugCount, pct: Number(((strugCount / graded) * 100).toFixed(0)) },
      weak: { count: weakCount, pct: Number(((weakCount / graded) * 100).toFixed(0)) },
    };

    // أوائل الفوج
    const topStudents = [...validScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      total,
      graded,
      average,
      passingCount,
      passingRate,
      highest,
      lowest,
      delta,
      brackets,
      topStudents,
    };
  };

  // إحصائيات الفوج الحالي
  const singleStats = useMemo(() => {
    return computeStats(currentClassStudents, assessmentType);
  }, [currentClassStudents, assessmentType]);

  // إحصائيات المقارنة بين فوجين
  const statsClassA = useMemo(() => {
    const list = allStudentsData.filter((s) => s.className === compareClassA);
    return computeStats(list, assessmentType);
  }, [allStudentsData, compareClassA, assessmentType]);

  const statsClassB = useMemo(() => {
    const list = allStudentsData.filter((s) => s.className === compareClassB);
    return computeStats(list, assessmentType);
  }, [allStudentsData, compareClassB, assessmentType]);

  // إحصائيات جميع الأقسام
  const allClassStatsList = useMemo(() => {
    return classesList.map((cls) => {
      const list = allStudentsData.filter((s) => s.className === cls);
      const st = computeStats(list, assessmentType);
      return {
        className: cls,
        ...st,
      };
    }).sort((a, b) => b.average - a.average);
  }, [classesList, allStudentsData, assessmentType]);

  const currentEvalMeta = ASSESSMENT_OPTIONS.find((a) => a.id === assessmentType) || ASSESSMENT_OPTIONS[0];

  // رسم الدائرة النسبية (Donut Chart) بـ SVG دقيق متجاوب
  const renderDonutChart = (st: typeof singleStats) => {
    const radius = 64;
    const strokeWidth = 22;
    const circumference = 2 * Math.PI * radius; // ~402.12

    const { excellent, good, struggling, weak } = st.brackets;
    const totalCount = st.graded || 1;

    const pExc = (excellent.count / totalCount) * circumference;
    const pGood = (good.count / totalCount) * circumference;
    const pStrug = (struggling.count / totalCount) * circumference;
    const pWeak = (weak.count / totalCount) * circumference;

    const offsetExc = 0;
    const offsetGood = -pExc;
    const offsetStrug = -(pExc + pGood);
    const offsetWeak = -(pExc + pGood + pStrug);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        {/* الدائرة البيانية */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* دائرة الخلفية الرمادية */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {st.graded > 0 ? (
              <>
                {/* شريحة ممتاز - زمردي */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#059669"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${pExc} ${circumference}`}
                  strokeDashoffset={offsetExc}
                  fill="transparent"
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                {/* شريحة متوسط إلى جيد - أزرق */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#2563eb"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${pGood} ${circumference}`}
                  strokeDashoffset={offsetGood}
                  fill="transparent"
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                {/* شريحة متعثر - برتقالي */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#d97706"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${pStrug} ${circumference}`}
                  strokeDashoffset={offsetStrug}
                  fill="transparent"
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                {/* شريحة ضعيف جداً - وردي/أحمر */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#e11d48"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${pWeak} ${circumference}`}
                  strokeDashoffset={offsetWeak}
                  fill="transparent"
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </>
            ) : null}
          </svg>

          {/* الرقم المركزي داخل الدائرة */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {st.graded > 0 ? `${st.passingRate}%` : "—"}
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              نسبة النجاح
            </span>
          </div>
        </div>

        {/* دليل الألوان والنسب */}
        <div className="flex-1 w-full space-y-2.5">
          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
              <span className="text-emerald-950 dark:text-emerald-200">ممتاز (≥ 15)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
              <span className="font-mono font-black">{excellent.count} تلميذ</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-800/40 font-mono">
                {excellent.pct}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
              <span className="text-blue-950 dark:text-blue-200">متوسط إلى جيد (10 - 14.99)</span>
            </div>
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <span className="font-mono font-black">{good.count} تلميذ</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-200/60 dark:bg-blue-800/40 font-mono">
                {good.pct}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-600 shrink-0"></span>
              <span className="text-amber-950 dark:text-amber-200">تحت المعدل (5 - 9.99)</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <span className="font-mono font-black">{struggling.count} تلميذ</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-800/40 font-mono">
                {struggling.pct}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0"></span>
              <span className="text-rose-950 dark:text-rose-200">ضعيف جداً (&lt; 5)</span>
            </div>
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-100">
              <span className="font-mono font-black">{weak.count} تلميذ</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-rose-200/60 dark:bg-rose-800/40 font-mono">
                {weak.pct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // رسم الأعمدة البيانية الأفقية (Distribution Bars)
  const renderDistributionBars = (st: typeof singleStats) => {
    const { excellent, good, struggling, weak } = st.brackets;
    const total = st.graded || 1;

    const bars = [
      {
        title: "الممتازون (≥ 15/20)",
        count: excellent.count,
        pct: excellent.pct,
        color: "bg-emerald-600",
        barBg: "bg-emerald-500",
        textClr: "text-emerald-700 dark:text-emerald-300",
        bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
      },
      {
        title: "المقبولون (10 إلى 14.99)",
        count: good.count,
        pct: good.pct,
        color: "bg-blue-600",
        barBg: "bg-blue-500",
        textClr: "text-blue-700 dark:text-blue-300",
        bgLight: "bg-blue-50 dark:bg-blue-950/20",
      },
      {
        title: "المتعثرون (5 إلى 9.99)",
        count: struggling.count,
        pct: struggling.pct,
        color: "bg-amber-600",
        barBg: "bg-amber-500",
        textClr: "text-amber-700 dark:text-amber-300",
        bgLight: "bg-amber-50 dark:bg-amber-950/20",
      },
      {
        title: "دون المعدل (أقل من 5)",
        count: weak.count,
        pct: weak.pct,
        color: "bg-rose-600",
        barBg: "bg-rose-500",
        textClr: "text-rose-700 dark:text-rose-300",
        bgLight: "bg-rose-50 dark:bg-rose-950/20",
      },
    ];

    return (
      <div className="space-y-4 py-2">
        {bars.map((b, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">{b.title}</span>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-black ${b.textClr}`}>
                  {b.count} تلميذ
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({b.pct}%)
                </span>
              </div>
            </div>
            {/* شريط التقدم */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${b.barBg}`}
                style={{ width: `${Math.min(100, Math.max(0, b.pct))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // توليد صورة بطاقة الأولياء وحفظها مباشرة كصورة PNG للواتساب
  const handleGenerateParentCardImage = () => {
    try {
      setExportingImage(true);
      const canvas = exportCanvasRef.current || document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1150;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // خلفية متدرجة زمردية فاخرة
      const gradBg = ctx.createLinearGradient(0, 0, 0, 1150);
      gradBg.addColorStop(0, "#064e3b");
      gradBg.addColorStop(0.3, "#076653");
      gradBg.addColorStop(1, "#022c22");
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, 900, 1150);

      // بطاقة داخلية بيضاء ناصعة
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(40, 40, 820, 1070, 28);
      ctx.fill();
      ctx.restore();

      // ترويسة البطاقة
      const headerGrad = ctx.createLinearGradient(40, 40, 860, 40);
      headerGrad.addColorStop(0, "#076653");
      headerGrad.addColorStop(1, "#0d9488");
      ctx.fillStyle = headerGrad;
      ctx.beginPath();
      ctx.roundRect(40, 40, 820, 180, [28, 28, 0, 0]);
      ctx.fill();

      // نصوص الترويسة
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 34px 'Cairo', sans-serif, system-ui";
      ctx.fillText("سجل التقييم والتحصيل البيداغوجي", 450, 105);

      ctx.font = "bold 22px 'Cairo', sans-serif, system-ui";
      ctx.fillStyle = "#a7f3d0";
      ctx.fillText(`ملخص نتائج: فوج ${selectedClass} • ${currentEvalMeta.label}`, 450, 145);

      ctx.font = "bold 17px 'Cairo', sans-serif, system-ui";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`الفصل الدراسي ${trimester} • مادة الرياضيات`, 450, 185);

      // رسم 4 بطاقات KPIs رئيسية داخل الصورة
      const kpis = [
        { label: "إجمالي المرصودين", val: `${singleStats.graded} / ${singleStats.total}`, sub: `تلميذ في ${selectedClass}` },
        { label: "معدل الفوج الحسابي", val: `${singleStats.average} / 20`, sub: `في ${currentEvalMeta.short}` },
        { label: "نسبة النجاح العامة", val: `${singleStats.passingRate}%`, sub: `${singleStats.passingCount} تلميذ ناجح` },
        { label: "أعلى / أدنى علامة", val: `${singleStats.highest} / ${singleStats.lowest}`, sub: `الفارق: ${singleStats.delta} ن` },
      ];

      const cardW = 370;
      const cardH = 135;
      const startX = 65;
      const startY = 255;
      const gapX = 30;
      const gapY = 25;

      kpis.forEach((k, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        ctx.fillStyle = "#f8fafc";
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 18);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#475569";
        ctx.font = "bold 16px 'Cairo', sans-serif";
        ctx.fillText(k.label, x + cardW / 2, y + 36);

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 32px 'Cairo', monospace, sans-serif";
        ctx.fillText(k.val, x + cardW / 2, y + 82);

        ctx.fillStyle = "#059669";
        ctx.font = "bold 14px 'Cairo', sans-serif";
        ctx.fillText(k.sub, x + cardW / 2, y + 115);
      });

      // قسم توزيع الفئات
      const distY = 590;
      ctx.textAlign = "right";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 22px 'Cairo', sans-serif";
      ctx.fillText("📊 التوزيع الإحصائي للشرائح والعلامات:", 835, distY);

      const bracketsList = [
        { label: "الممتازون (العلامة ≥ 15/20)", count: singleStats.brackets.excellent.count, pct: singleStats.brackets.excellent.pct, clr: "#059669" },
        { label: "المقبولون (من 10 إلى 14.99)", count: singleStats.brackets.good.count, pct: singleStats.brackets.good.pct, clr: "#2563eb" },
        { label: "المتعثرون (من 5 إلى 9.99)", count: singleStats.brackets.struggling.count, pct: singleStats.brackets.struggling.pct, clr: "#d97706" },
        { label: "دون المعدل (أقل من 5 نقاط)", count: singleStats.brackets.weak.count, pct: singleStats.brackets.weak.pct, clr: "#e11d48" },
      ];

      bracketsList.forEach((b, i) => {
        const by = distY + 45 + i * 85;

        // خلفية الفئة
        ctx.fillStyle = "#f8fafc";
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(65, by, 770, 70, 14);
        ctx.fill();
        ctx.stroke();

        // مؤشر لوني
        ctx.fillStyle = b.clr;
        ctx.beginPath();
        ctx.roundRect(815, by + 16, 8, 38, 4);
        ctx.fill();

        // اسم الفئة
        ctx.textAlign = "right";
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 17px 'Cairo', sans-serif";
        ctx.fillText(b.label, 800, by + 42);

        // عدد التلاميذ والنسبة
        ctx.textAlign = "left";
        ctx.fillStyle = b.clr;
        ctx.font = "bold 19px 'Cairo', monospace, sans-serif";
        ctx.fillText(`${b.count} تلميذ (${b.pct}%)`, 85, by + 42);
      });

      // تذييل البطاقة
      const footY = 1045;
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.font = "bold 15px 'Cairo', sans-serif";
      ctx.fillText("تم استخراج هذا التقرير آلياً من موقع الرياضيات الرسمي • مخصص لأولياء التلاميذ", 450, footY);

      // تحويل الكانفاس لصورة وتحميلها
      const imgData = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = imgData;
      a.download = `تقرير_نتائج_فوج_${selectedClass}_الفصل_${trimester}.png`;
      a.click();
    } catch (err) {
      console.error("فشل تصدير البطاقة:", err);
    } finally {
      setExportingImage(false);
      setShowExportModal(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 print:p-0 print:space-y-4 print:pb-0" dir="rtl">
      {/* ─── الرأس وشريط العمليات السريعة ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* العنوان والشارة */}
          <div className="flex items-center gap-3">
            {onBackToGradebook && (
              <button
                type="button"
                onClick={onBackToGradebook}
                className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition shrink-0 print:hidden cursor-pointer"
                title="الرجوع لدفتر الرصد"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <span>مركز الإحصائيات والتحليل البياني</span>
                </h1>
                <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-black px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700">
                  رسمي
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                تحليل دقيق للفروض والاختبارات، نسب النجاح والشرائح، ومقارنة فورية بين الأفواج
              </p>
            </div>
          </div>

          {/* أزرار العمليات (حفظ صورة للأولياء + طباعة) */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handleGenerateParentCardImage}
              disabled={exportingImage}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>{exportingImage ? "جاري التوليد..." : "حفظ كصورة للأولياء"}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* ─── أشرطة التصفية والاختيار ─── */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 print:hidden">
          {/* السطر الأول: نمط العرض + الفصل الدراسي */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* أنماط العرض الثلاثة */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  mode === "single"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-black shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>فوج واحد</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("compare")}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  mode === "compare"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-black shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>مقارنة بين فوجين</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("all")}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  mode === "all"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-black shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>جميع الأقسام</span>
              </button>
            </div>

            {/* اختيار الفصل الدراسي */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold">
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    const tri = t as 1 | 2 | 3;
                    setTrimester(tri);
                    onTrimesterChange?.(tri);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-black ${
                    trimester === t
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  الفصل {t}
                </button>
              ))}
            </div>
          </div>

          {/* السطر الثاني: اختيار الفوج ونوع التقييم */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* اختيار الفوج (في نمط الفوج الواحد) */}
            {mode === "single" && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">اختر الفوج:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {classesList.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setSelectedClass(cls);
                        onClassChange?.(cls);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                        selectedClass === cls
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* اختيار الفوجين في نمط المقارنة */}
            {mode === "compare" && (
              <div className="flex items-center gap-3 flex-wrap text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">الفوج الأول:</span>
                  <select
                    value={compareClassA}
                    onChange={(e) => setCompareClassA(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-900 dark:text-white font-black"
                  >
                    {classesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-400 font-bold">ضد</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">الفوج الثاني:</span>
                  <select
                    value={compareClassB}
                    onChange={(e) => setCompareClassB(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-900 dark:text-white font-black"
                  >
                    {classesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* في نمط جميع الأقسام */}
            {mode === "all" && (
              <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <span>المعاينة لجميع الأفواج المسجلة ({classesList.length} أفواج)</span>
              </div>
            )}

            {/* نوع التقييم (Pills) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نوع التقييم:</span>
              {ASSESSMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAssessmentType(opt.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                    assessmentType === opt.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ─── نمط 1: معاينة فوج واحد (SINGLE CLASS VIEW) ─── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mode === "single" && (
        <div className="space-y-5">
          {/* بطاقات المؤشرات الأربعة الرئيسية (KPIs) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: إجمالي المرصودين */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المرصودين</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {singleStats.graded}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">/ {singleStats.total}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                تلميذ في فوج {selectedClass}
              </p>
            </div>

            {/* KPI 2: معدل الفوج الحسابي */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">معدل الفوج</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {singleStats.graded > 0 ? singleStats.average : "—"}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">/ 20</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                في {currentEvalMeta.label}
              </p>
            </div>

            {/* KPI 3: نسبة النجاح العامة */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نسبة النجاح (≥ 10)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {singleStats.graded > 0 ? `${singleStats.passingRate}%` : "—"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                {singleStats.passingCount} تلميذ ناجح
              </p>
            </div>

            {/* KPI 4: أعلى وأدنى علامة */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">أعلى وأدنى علامة</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                  {singleStats.graded > 0 ? singleStats.highest : "—"}
                </span>
                <span className="text-slate-300 font-black">/</span>
                <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
                  {singleStats.graded > 0 ? singleStats.lowest : "—"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                الفارق: {singleStats.delta} ن
              </p>
            </div>
          </div>

          {/* لوحتا التحليل البياني التفاعلي جنباً إلى جنب */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* اللوحة اليمنى: الدائرة النسبية لتوزيع العلامات */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    الدائرة النسبية لتوزيع العلامات
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400">فوج {selectedClass}</span>
              </div>

              {renderDonutChart(singleStats)}
            </div>

            {/* اللوحة اليسرى: الأعمدة البيانية لتوزيع الفئات */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    الأعمدة البيانية لتوزيع الفئات
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400">{currentEvalMeta.label}</span>
              </div>

              {renderDistributionBars(singleStats)}
            </div>
          </div>

          {/* لوحة شرف أوائل الفوج */}
          {singleStats.topStudents.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    لوحة شرف الأوائل في فوج {selectedClass}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  أفضل 5 علامات
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                {singleStats.topStudents.map((s, idx) => {
                  const medals = ["🥇", "🥈", "🥉", "🏅", "🎖️"];
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{medals[idx] || "⭐"}</span>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[110px]">
                            {s.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-bold">المرتبة {idx + 1}</span>
                        </div>
                      </div>
                      <span className="text-sm font-black font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg">
                        {s.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ─── نمط 2: مقارنة بين فوجين (COMPARE TWO CLASSES) ─── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mode === "compare" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* بطاقة الفوج الأول */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-emerald-500/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    الفوج أ: {compareClassA}
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {statsClassA.graded} / {statsClassA.total} تلميذ
                </span>
              </div>

              {/* المؤشرات السريعة للفوج أ */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">المعدل</span>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                    {statsClassA.average}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">نسبة النجاح</span>
                  <p className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono mt-0.5">
                    {statsClassA.passingRate}%
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">أعلى علامة</span>
                  <p className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono mt-0.5">
                    {statsClassA.highest}
                  </p>
                </div>
              </div>

              {/* أشرطة التوزيع للفوج أ */}
              {renderDistributionBars(statsClassA)}
            </div>

            {/* بطاقة الفوج الثاني */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-teal-500/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    الفوج ب: {compareClassB}
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {statsClassB.graded} / {statsClassB.total} تلميذ
                </span>
              </div>

              {/* المؤشرات السريعة للفوج ب */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">المعدل</span>
                  <p className="text-xl font-black text-teal-700 dark:text-teal-400 font-mono mt-0.5">
                    {statsClassB.average}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">نسبة النجاح</span>
                  <p className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono mt-0.5">
                    {statsClassB.passingRate}%
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">أعلى علامة</span>
                  <p className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono mt-0.5">
                    {statsClassB.highest}
                  </p>
                </div>
              </div>

              {/* أشرطة التوزيع للفوج ب */}
              {renderDistributionBars(statsClassB)}
            </div>
          </div>

          {/* ملخص الفارق التنافسي بين الفوجين */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">
              📊 الفارق الحسابي بين الفوجين في {currentEvalMeta.label}:
            </span>
            <div className="flex items-center gap-4">
              <span>
                فارق المعدل:{" "}
                <strong className="text-emerald-700 font-mono font-black">
                  {Math.abs(statsClassA.average - statsClassB.average).toFixed(2)} ن
                </strong>{" "}
                (لصالح {statsClassA.average >= statsClassB.average ? compareClassA : compareClassB})
              </span>
              <span>
                فارق نسبة النجاح:{" "}
                <strong className="text-blue-700 font-mono font-black">
                  {Math.abs(statsClassA.passingRate - statsClassB.passingRate).toFixed(1)}%
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ─── نمط 3: جميع الأقسام (ALL CLASSES OVERVIEW) ─── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mode === "all" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  جدول الترتيب والمقارنة الشاملة لجميع الأفواج
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  مرتبة تنازلياً حسب معدل الفوج في {currentEvalMeta.label} • الفصل {trimester}
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800">
                {allClassStatsList.length} أفواج
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black">
                    <th className="py-3 px-4">المرتبة</th>
                    <th className="py-3 px-4">الفوج</th>
                    <th className="py-3 px-4">المرصودون</th>
                    <th className="py-3 px-4 text-emerald-700 dark:text-emerald-400">معدل الفوج</th>
                    <th className="py-3 px-4">نسبة النجاح</th>
                    <th className="py-3 px-4">أعلى علامة</th>
                    <th className="py-3 px-4">أدنى علامة</th>
                    <th className="py-3 px-4">فئة الممتازين</th>
                    <th className="py-3 px-4 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allClassStatsList.map((item, idx) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    return (
                      <tr
                        key={item.className}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                          idx === 0 ? "bg-emerald-50/30 dark:bg-emerald-950/10" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-black">
                          <span className="text-base">{medals[idx] || `${idx + 1}`}</span>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                          فوج {item.className}
                          {idx === 0 && (
                            <span className="mr-1.5 text-[10px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                              الأول 🏆
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">
                          {item.graded} / {item.total}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">
                          {item.average} / 20
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-slate-800 dark:text-slate-200">
                            {item.passingRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-600">{item.highest}</td>
                        <td className="py-3 px-4 font-mono font-black text-rose-600">{item.lowest}</td>
                        <td className="py-3 px-4 font-bold text-slate-600">
                          {item.brackets.excellent.count} تلميذ ({item.brackets.excellent.pct}%)
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClass(item.className);
                              setMode("single");
                              onClassChange?.(item.className);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                          >
                            معاينة مفصلة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
