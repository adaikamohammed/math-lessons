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
  Target,
  Sliders,
  Flame,
  HelpCircle,
  BookmarkCheck,
  UserCheck,
  HeartHandshake,
  ShieldAlert,
} from "lucide-react";

export type AssessmentType = "termAverage" | "test1Score" | "continuousMonitoring" | "examScore";

export interface StudentStatsRow {
  studentId?: string;
  studentName: string;
  className: string;
  groupName?: string;
  gender?: string;
  birthDate?: string;
  continuousMonitoring?: number | string | null;
  test1Score?: number | string | null;
  examScore?: number | string | null;
  termAverage?: number | string | null;
  behaviorScore?: number | string | null;
  quiz1Score?: number | string | null;
  quiz2Score?: number | string | null;
  homework1Score?: number | string | null;
  homework2Score?: number | string | null;
  notebook1Score?: number | string | null;
  notebook2Score?: number | string | null;
  bonusScore?: number | string | null;
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
  const [mode, setMode] = useState<"single" | "compare" | "all" | "remediation">("single");
  const [singleSubTab, setSingleSubTab] = useState<"distribution" | "components" | "demographics" | "support">("distribution");
  const [selectedClass, setSelectedClass] = useState<string>(currentClass);
  const [trimester, setTrimester] = useState<1 | 2 | 3>(currentTrimester);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("termAverage");

  // المقارنة بين فوجين
  const [compareClassA, setCompareClassA] = useState<string>(currentClass || availableClasses[0] || "1م1");
  const [compareClassB, setCompareClassB] = useState<string>(
    availableClasses.find((c) => c !== currentClass) || availableClasses[1] || "1م2"
  );

  // حالة جلب جميع بيانات الأقسام
  const [allStudentsData, setAllStudentsData] = useState<StudentStatsRow[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  // تصدير الصورة للأولياء
  const [exportingImage, setExportingImage] = useState(false);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // مزامنة المتغيرات
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

  // جلب كافة التلاميذ عند الحاجة
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

  // -------------------------------------------------------------
  // محرك الحسابات الإحصائية الشاملة
  // -------------------------------------------------------------
  const computeDetailedStats = (studentsList: StudentStatsRow[], evalField: AssessmentType) => {
    const total = studentsList.length;

    // استخراج العلامات الصالحة واستبعاد الغائبين (غ) والخانات الفارغة تماماً حتى لا تؤثر على المتوسط
    let absentCount = 0;
    let emptyCount = 0;
    const validRecords: { name: string; score: number; gender: string; groupName: string }[] = [];

    studentsList.forEach((s) => {
      const raw = s[evalField];
      if (raw === undefined || raw === null || raw === "" || raw === "-" || raw === "—" || raw === "ليس الآن") {
        emptyCount++;
        return;
      }
      const str = String(raw).trim();
      if (str === "غ" || str === "غياب") {
        absentCount++;
        return;
      }
      const num = typeof raw === "number" ? raw : parseFloat(str.replace(/[,،]/g, "."));
      if (!isNaN(num) && num >= 0 && num <= 20) {
        validRecords.push({
          name: s.studentName,
          score: num,
          gender: (s.gender || "M").toUpperCase(),
          groupName: s.groupName || "فوج 1",
        });
      } else {
        emptyCount++;
      }
    });

    const graded = validRecords.length;
    if (graded === 0) {
      return {
        total,
        graded: 0,
        absentCount,
        emptyCount,
        average: 0,
        median: 0,
        passingCount: 0,
        passingRate: 0,
        excellenceCount: 0,
        excellenceRate: 0,
        highest: 0,
        lowest: 0,
        delta: 0,
        histogramBands: [],
        officialBrackets: [],
        brackets: {
          excellent: { count: 0, pct: 0 },
          good: { count: 0, pct: 0 },
          struggling: { count: 0, pct: 0 },
          weak: { count: 0, pct: 0 },
        },
        topStudents: [],
        nearPassing: [],
        criticalSupport: [],
        subgroups: { g1: { count: 0, avg: 0, passPct: 0 }, g2: { count: 0, avg: 0, passPct: 0 } },
        genderStats: { males: { count: 0, avg: 0, passPct: 0 }, females: { count: 0, avg: 0, passPct: 0 } },
        componentsAvg: { behavior: 0, quiz1: 0, quiz2: 0, hw1: 0, hw2: 0, note1: 0, note2: 0, bonus: 0 },
      };
    }

    const scoresSorted = validRecords.map((v) => v.score).sort((a, b) => a - b);
    const sum = scoresSorted.reduce((acc, curr) => acc + curr, 0);
    const average = Number((sum / graded).toFixed(2));
    const highest = scoresSorted[scoresSorted.length - 1];
    const lowest = scoresSorted[0];
    const delta = Number((highest - lowest).toFixed(1));

    // حساب الوسيط الحسابي (Median)
    let median = 0;
    const mid = Math.floor(scoresSorted.length / 2);
    if (scoresSorted.length % 2 === 0) {
      median = Number(((scoresSorted[mid - 1] + scoresSorted[mid]) / 2).toFixed(2));
    } else {
      median = scoresSorted[mid];
    }

    // نسب النجاح والامتياز
    const passingCount = scoresSorted.filter((s) => s >= 10).length;
    const passingRate = Number(((passingCount / graded) * 100).toFixed(1));

    const excellenceCount = scoresSorted.filter((s) => s >= 14).length;
    const excellenceRate = Number(((excellenceCount / graded) * 100).toFixed(1));

    // 1. المدرج التكراري: 10 شرائح (من 0 إلى 20)
    // [0-2[, [2-4[, [4-6[, [6-8[, [8-10[, [10-12[, [12-14[, [14-16[, [16-18[, [18-20]
    const histogramBands = [
      { range: "0 - 1.9", min: 0, max: 2, label: "0-2", color: "bg-rose-500", fill: "#f43f5e" },
      { range: "2 - 3.9", min: 2, max: 4, label: "2-4", color: "bg-rose-500", fill: "#f43f5e" },
      { range: "4 - 5.9", min: 4, max: 6, label: "4-6", color: "bg-rose-400", fill: "#fb7185" },
      { range: "6 - 7.9", min: 6, max: 8, label: "6-8", color: "bg-amber-500", fill: "#f59e0b" },
      { range: "8 - 9.9", min: 8, max: 10, label: "8-10", color: "bg-amber-400", fill: "#fbbf24" },
      { range: "10 - 11.9", min: 10, max: 12, label: "10-12", color: "bg-sky-500", fill: "#0ea5e9" },
      { range: "12 - 13.9", min: 12, max: 14, label: "12-14", color: "bg-blue-600", fill: "#2563eb" },
      { range: "14 - 15.9", min: 14, max: 16, label: "14-16", color: "bg-teal-600", fill: "#0d9488" },
      { range: "16 - 17.9", min: 16, max: 18, label: "16-18", color: "bg-emerald-600", fill: "#059669" },
      { range: "18 - 20", min: 18, max: 20.01, label: "18-20", color: "bg-emerald-700", fill: "#047857" },
    ].map((band) => {
      const count = scoresSorted.filter((s) => s >= band.min && s < band.max).length;
      return {
        ...band,
        count,
        pct: Number(((count / graded) * 100).toFixed(1)),
      };
    });

    // 2. التقديرات الرسمية للوزارة
    const officialBrackets = [
      { label: "ممتاز (16 - 20)", min: 16, max: 20.01, color: "bg-emerald-600", text: "text-emerald-700" },
      { label: "جيد جداً (14 - 15.99)", min: 14, max: 16, color: "bg-teal-600", text: "text-teal-700" },
      { label: "جيد (12 - 13.99)", min: 12, max: 14, color: "bg-blue-600", text: "text-blue-700" },
      { label: "مقبول (10 - 11.99)", min: 10, max: 12, color: "bg-sky-600", text: "text-sky-700" },
      { label: "قريب من المعدل (8 - 9.99)", min: 8, max: 10, color: "bg-amber-500", text: "text-amber-700" },
      { label: "دون المستوى (< 8)", min: 0, max: 8, color: "bg-rose-500", text: "text-rose-700" },
    ].map((b) => {
      const count = scoresSorted.filter((s) => s >= b.min && s < b.max).length;
      return {
        ...b,
        count,
        pct: Number(((count / graded) * 100).toFixed(1)),
      };
    });

    // 3. الشرائح الأربعة الكلاسيكية (للدائرة النسبية)
    const excCount = scoresSorted.filter((s) => s >= 15).length;
    const goodCount = scoresSorted.filter((s) => s >= 10 && s < 15).length;
    const strugCount = scoresSorted.filter((s) => s >= 5 && s < 10).length;
    const weakCount = scoresSorted.filter((s) => s < 5).length;

    const brackets = {
      excellent: { count: excCount, pct: Number(((excCount / graded) * 100).toFixed(0)) },
      good: { count: goodCount, pct: Number(((goodCount / graded) * 100).toFixed(0)) },
      struggling: { count: strugCount, pct: Number(((strugCount / graded) * 100).toFixed(0)) },
      weak: { count: weakCount, pct: Number(((weakCount / graded) * 100).toFixed(0)) },
    };

    // 4. أوائل الفوج
    const topStudents = [...validRecords].sort((a, b) => b.score - a.score).slice(0, 5);

    // 5. فئة الإنقاذ والمتابعة البيداغوجية
    const nearPassing = validRecords
      .filter((r) => r.score >= 8 && r.score < 10)
      .sort((a, b) => b.score - a.score);

    const criticalSupport = validRecords
      .filter((r) => r.score < 5)
      .sort((a, b) => a.score - b.score);

    // 6. مقارنة الفوج 1 مقابل الفوج 2
    const calcSubgroup = (grpName: string) => {
      const records = validRecords.filter((r) => r.groupName.includes(grpName));
      if (records.length === 0) return { count: 0, avg: 0, passPct: 0 };
      const s = records.map((r) => r.score);
      const avg = Number((s.reduce((a, b) => a + b, 0) / s.length).toFixed(2));
      const pass = Number(((s.filter((x) => x >= 10).length / s.length) * 100).toFixed(1));
      return { count: s.length, avg, passPct: pass };
    };
    const subgroups = {
      g1: calcSubgroup("1"),
      g2: calcSubgroup("2"),
    };

    // 7. مقارنة الذكور مقابل الإناث
    const calcGender = (gCode: string) => {
      const records = validRecords.filter((r) => r.gender.startsWith(gCode));
      if (records.length === 0) return { count: 0, avg: 0, passPct: 0 };
      const s = records.map((r) => r.score);
      const avg = Number((s.reduce((a, b) => a + b, 0) / s.length).toFixed(2));
      const pass = Number(((s.filter((x) => x >= 10).length / s.length) * 100).toFixed(1));
      return { count: s.length, avg, passPct: pass };
    };
    const genderStats = {
      males: calcGender("M"),
      females: calcGender("F"),
    };

    // 8. متوسطات معايير التقويم الفرعية (تستبعد الغائبين «غ» والخانات الفارغة)
    const calcFieldAvg = (field: keyof StudentStatsRow) => {
      const vals: number[] = [];
      studentsList.forEach((s) => {
        const v = s[field];
        if (v !== undefined && v !== null && v !== "") {
          const str = String(v).trim();
          if (str !== "غ" && str !== "غياب" && str !== "-" && str !== "—" && str !== "ليس الآن") {
            const n = typeof v === "number" ? v : parseFloat(str.replace(/[,،]/g, "."));
            if (!isNaN(n) && n >= 0) vals.push(n);
          }
        }
      });
      return vals.length > 0 ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
    };

    const componentsAvg = {
      behavior: calcFieldAvg("behaviorScore"),
      quiz1: calcFieldAvg("quiz1Score"),
      quiz2: calcFieldAvg("quiz2Score"),
      hw1: calcFieldAvg("homework1Score"),
      hw2: calcFieldAvg("homework2Score"),
      note1: calcFieldAvg("notebook1Score"),
      note2: calcFieldAvg("notebook2Score"),
      bonus: calcFieldAvg("bonusScore"),
    };

    return {
      total,
      graded,
      absentCount,
      emptyCount,
      average,
      median,
      passingCount,
      passingRate,
      excellenceCount,
      excellenceRate,
      highest,
      lowest,
      delta,
      histogramBands,
      officialBrackets,
      brackets,
      topStudents,
      nearPassing,
      criticalSupport,
      subgroups,
      genderStats,
      componentsAvg,
    };
  };

  // إحصائيات الفوج الحالي
  const singleStats = useMemo(() => {
    return computeDetailedStats(currentClassStudents, assessmentType);
  }, [currentClassStudents, assessmentType]);

  // إحصائيات المقارنة بين فوجين
  const statsClassA = useMemo(() => {
    const list = allStudentsData.filter((s) => s.className === compareClassA);
    return computeDetailedStats(list, assessmentType);
  }, [allStudentsData, compareClassA, assessmentType]);

  const statsClassB = useMemo(() => {
    const list = allStudentsData.filter((s) => s.className === compareClassB);
    return computeDetailedStats(list, assessmentType);
  }, [allStudentsData, compareClassB, assessmentType]);

  // إحصائيات جميع الأقسام
  const allClassStatsList = useMemo(() => {
    return classesList
      .map((cls) => {
        const list = allStudentsData.filter((s) => s.className === cls);
        const st = computeDetailedStats(list, assessmentType);
        return {
          className: cls,
          ...st,
        };
      })
      .sort((a, b) => b.average - a.average);
  }, [classesList, allStudentsData, assessmentType]);

  const currentEvalMeta = ASSESSMENT_OPTIONS.find((a) => a.id === assessmentType) || ASSESSMENT_OPTIONS[0];

  // توليد صورة بطاقة الأولياء وحفظها مباشرة كصورة PNG بيضاء أنيقة
  const handleGenerateParentCardImage = () => {
    try {
      setExportingImage(true);
      const canvas = exportCanvasRef.current || document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1180;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // خلفية بيضاء عاجية أنيقة جداً
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, 900, 1180);

      // بطاقة بيضاء داخلية نقية مع ظل خفيف وإطار
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.06)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(35, 35, 830, 1110, 24);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // ترويسة زمردية فاخرة
      const headerGrad = ctx.createLinearGradient(35, 35, 865, 35);
      headerGrad.addColorStop(0, "#065a48");
      headerGrad.addColorStop(1, "#0d9488");
      ctx.fillStyle = headerGrad;
      ctx.beginPath();
      ctx.roundRect(35, 35, 830, 175, [24, 24, 0, 0]);
      ctx.fill();

      // نصوص الترويسة
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 32px 'Cairo', sans-serif, system-ui";
      ctx.fillText("سجل التقييم والتحصيل البيداغوجي", 450, 95);

      ctx.font = "bold 20px 'Cairo', sans-serif, system-ui";
      ctx.fillStyle = "#a7f3d0";
      ctx.fillText(`تقرير نتائج: فوج ${selectedClass} • ${currentEvalMeta.label}`, 450, 135);

      ctx.font = "bold 15px 'Cairo', sans-serif, system-ui";
      ctx.fillStyle = "#e6fffa";
      ctx.fillText(`الفصل الدراسي ${trimester} • مادة الرياضيات`, 450, 170);

      // 4 بطاقات KPIs رئيسية بيضاء
      const kpis = [
        { label: "إجمالي المرصودين", val: `${singleStats.graded} / ${singleStats.total}`, sub: `تلميذ في ${selectedClass}` },
        { label: "معدل الفوج الحسابي", val: `${singleStats.average} / 20`, sub: `الوسيط: ${singleStats.median} ن` },
        { label: "نسبة النجاح العامة", val: `${singleStats.passingRate}%`, sub: `${singleStats.passingCount} تلميذ ناجح` },
        { label: "أعلى وأدنى علامة", val: `${singleStats.highest} / ${singleStats.lowest}`, sub: `الفارق: ${singleStats.delta} ن` },
      ];

      const cardW = 380;
      const cardH = 125;
      const startX = 55;
      const startY = 240;
      const gapX = 30;
      const gapY = 20;

      kpis.forEach((k, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        ctx.fillStyle = "#f8fafc";
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 15px 'Cairo', sans-serif";
        ctx.fillText(k.label, x + cardW / 2, y + 32);

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 30px 'Cairo', monospace, sans-serif";
        ctx.fillText(k.val, x + cardW / 2, y + 76);

        ctx.fillStyle = "#059669";
        ctx.font = "bold 14px 'Cairo', sans-serif";
        ctx.fillText(k.sub, x + cardW / 2, y + 106);
      });

      // توزيع التقديرات الرسمية
      const distY = 560;
      ctx.textAlign = "right";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px 'Cairo', sans-serif";
      ctx.fillText("📊 التوزيع العددي والنسبي للشرائح البيداغوجية:", 845, distY);

      const bracketsList = [
        { label: "الممتازون (العلامة ≥ 16/20)", count: singleStats.officialBrackets[0]?.count || 0, pct: singleStats.officialBrackets[0]?.pct || 0, clr: "#059669" },
        { label: "جيد جداً وجيد (من 12 إلى 15.99)", count: (singleStats.officialBrackets[1]?.count || 0) + (singleStats.officialBrackets[2]?.count || 0), pct: (singleStats.officialBrackets[1]?.pct || 0) + (singleStats.officialBrackets[2]?.pct || 0), clr: "#2563eb" },
        { label: "المقبولون (من 10 إلى 11.99)", count: singleStats.officialBrackets[3]?.count || 0, pct: singleStats.officialBrackets[3]?.pct || 0, clr: "#0284c7" },
        { label: "قريب من المعدل (من 8 إلى 9.99)", count: singleStats.officialBrackets[4]?.count || 0, pct: singleStats.officialBrackets[4]?.pct || 0, clr: "#d97706" },
        { label: "دون المستوى (أقل من 8 نقاط)", count: singleStats.officialBrackets[5]?.count || 0, pct: singleStats.officialBrackets[5]?.pct || 0, clr: "#e11d48" },
      ];

      bracketsList.forEach((b, i) => {
        const by = distY + 30 + i * 82;

        ctx.fillStyle = "#f8fafc";
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(55, by, 790, 68, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = b.clr;
        ctx.beginPath();
        ctx.roundRect(830, by + 14, 8, 40, 4);
        ctx.fill();

        ctx.textAlign = "right";
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 16px 'Cairo', sans-serif";
        ctx.fillText(b.label, 810, by + 40);

        ctx.textAlign = "left";
        ctx.fillStyle = b.clr;
        ctx.font = "bold 18px 'Cairo', monospace, sans-serif";
        ctx.fillText(`${b.count} تلميذ (${b.pct}%)`, 75, by + 40);
      });

      // تذييل البطاقة
      const footY = 1090;
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.font = "bold 14px 'Cairo', sans-serif";
      ctx.fillText("تم استخراج التقرير آلياً من موقع الرياضيات الرسمي • مخصص لأولياء التلاميذ", 450, footY);

      // تنزيل الصورة
      const imgData = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = imgData;
      a.download = `تقرير_نتائج_فوج_${selectedClass}_الفصل_${trimester}.png`;
      a.click();
    } catch (err) {
      console.error("فشل تصدير البطاقة:", err);
    } finally {
      setExportingImage(false);
    }
  };

  return (
    <div className="bg-slate-50/70 text-slate-800 space-y-5 pb-20 print:bg-white print:p-0 print:space-y-4 print:pb-0" dir="rtl">
      {/* ─── الرأس وشريط العمليات السريعة (خلفية بيضاء نقية) ─── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* العنوان والشارة */}
          <div className="flex items-center gap-3">
            {onBackToGradebook && (
              <button
                type="button"
                onClick={onBackToGradebook}
                className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition shrink-0 print:hidden cursor-pointer active:scale-95"
                title="الرجوع لدفتر الرصد"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                  <span>مركز الإحصائيات والتحليل البياني الشامل</span>
                </h1>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                  رسمي • النسخة البيضاء
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                تحليل عميق للفروض والاختبارات، التوزيع التكراري، مقاييس النزعة والتشتت، ودعم المتعثرين
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
              className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* ─── أشرطة التصفية والتحكم (خلفية بيضاء نقية) ─── */}
        <div className="pt-2 border-t border-slate-100 space-y-3 print:hidden">
          {/* السطر الأول: نمط العرض + الفصل الدراسي */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* أنماط العرض */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  mode === "single"
                    ? "bg-white text-emerald-800 font-black shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>فوج واحد (تحليل مفصل)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("compare")}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  mode === "compare"
                    ? "bg-white text-emerald-800 font-black shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
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
                    ? "bg-white text-emerald-800 font-black shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>جميع الأقسام</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("remediation")}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  mode === "remediation"
                    ? "bg-white text-rose-700 font-black shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>المعالجة البيداغوجية والدعم</span>
              </button>
            </div>

            {/* اختيار الفصل الدراسي */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    const tri = t as 1 | 2 | 3;
                    setTrimester(tri);
                    onTrimesterChange?.(tri);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer font-black ${
                    trimester === t
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  الفصل {t}
                </button>
              ))}
            </div>
          </div>

          {/* السطر الثاني: اختيار الفوج ونوع التقييم */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* اختيار الفوج */}
            {(mode === "single" || mode === "remediation") && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500">اختر الفوج:</span>
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
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-slate-900 font-black"
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
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-slate-900 font-black"
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

            {/* نوع التقييم الأساسي */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500">نوع التقييم:</span>
              {ASSESSMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAssessmentType(opt.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                    assessmentType === opt.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
      {/* ─── المؤشرات الستة الرئيسية (6 KPIs - بطاقات بيضاء نقية) ─── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mode !== "all" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* KPI 1: إجمالي المرصودين */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>المرصودون الحاضرون</span>
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {singleStats.graded}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">/ {singleStats.total}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {singleStats.absentCount > 0 && (
                <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded font-black font-sans">
                  {singleStats.absentCount} غائب (غ)
                </span>
              )}
              {singleStats.emptyCount > 0 && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-bold">
                  {singleStats.emptyCount} فارغ
                </span>
              )}
              {singleStats.absentCount === 0 && singleStats.emptyCount === 0 && (
                <span className="text-[10px] text-emerald-700 font-bold">رصد كامل 100%</span>
              )}
            </div>
          </div>

          {/* KPI 2: المعدل الحسابي */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>معدل الفوج الحقيقي</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  {singleStats.graded > 0 ? singleStats.average : "—"}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">/ 20</span>
              </div>
            </div>
            <p className="text-[10px] text-emerald-700 font-bold mt-1 truncate" title="يحسب فقط للعلامات المرصودة فعلياً دون احتساب الغائبين أو الخانات الفارغة">
              {singleStats.graded > 0
                ? `محسوب على ${singleStats.graded} حاضرين (مستبعد منه «غ» والفارغ)`
                : "لا توجد علامات عددية"}
            </p>
          </div>

          {/* KPI 3: الوسيط الحسابي */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>الوسيط الحسابي</span>
              <Target className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-teal-700 font-mono">
                {singleStats.graded > 0 ? singleStats.median : "—"}
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold">/ 20</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              50% فوق هذه العلامة
            </p>
          </div>

          {/* KPI 4: نسبة النجاح العامة */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>نسبة النجاح (≥ 10)</span>
              <Award className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {singleStats.graded > 0 ? `${singleStats.passingRate}%` : "—"}
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
              {singleStats.passingCount} تلميذ ناجح
            </p>
          </div>

          {/* KPI 5: نسبة الامتياز والجودة */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>الجودة (≥ 14)</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-700 font-mono">
                {singleStats.graded > 0 ? `${singleStats.excellenceRate}%` : "—"}
              </span>
            </div>
            <p className="text-[10px] text-indigo-600 font-bold mt-0.5">
              {singleStats.excellenceCount} تلميذ متفوق
            </p>
          </div>

          {/* KPI 6: أعلى وأدنى علامة */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>أعلى / أدنى</span>
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-700 font-mono">
                {singleStats.graded > 0 ? singleStats.highest : "—"}
              </span>
              <span className="text-slate-300 font-black">/</span>
              <span className="text-xl font-black text-rose-600 font-mono">
                {singleStats.graded > 0 ? singleStats.lowest : "—"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              الفارق: {singleStats.delta} ن
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ─── نمط 1: التحليل المفصل للفوج الواحد (SINGLE CLASS VIEW) ─── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mode === "single" && (
        <div className="space-y-4">
          {/* تبويبات التفاصيل الداخلية */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs w-fit text-xs font-bold">
            <button
              type="button"
              onClick={() => setSingleSubTab("distribution")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                singleSubTab === "distribution"
                  ? "bg-slate-900 text-white font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>المدرج البياني والدوائر النسبية</span>
            </button>

            <button
              type="button"
              onClick={() => setSingleSubTab("components")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                singleSubTab === "components"
                  ? "bg-slate-900 text-white font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-teal-500" />
              <span>تحليل معايير التقويم الفرعية</span>
            </button>

            <button
              type="button"
              onClick={() => setSingleSubTab("demographics")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                singleSubTab === "demographics"
                  ? "bg-slate-900 text-white font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>مقارنة الأفواج الفرعية والنوع</span>
            </button>

            <button
              type="button"
              onClick={() => setSingleSubTab("support")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                singleSubTab === "support"
                  ? "bg-slate-900 text-white font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>لوحة الشرف وقائمة الدعم</span>
            </button>
          </div>

          {/* ── 1. تبويب التوزيع والرسوم البيانية ── */}
          {singleSubTab === "distribution" && (
            <div className="space-y-4">
              {/* المدرج التكراري العمودي (Histogram - 10 شرائح) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      <span>المدرج التكراري لتوزيع العلامات (Histogram Curve)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      توزيع علامات تلاميذ الفوج على 10 مجالات متساوية لقياس كثافة المنحنى والتشتت
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                      <span>دون 10</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                      <span>10 فما فوق</span>
                    </span>
                  </div>
                </div>

                {/* رسم المدرج التكراري بالأعمدة الرأسية المتجاوبة */}
                <div className="pt-6 pb-2 px-2">
                  <div className="grid grid-cols-10 gap-1.5 sm:gap-2.5 items-end h-52 border-b-2 border-slate-200">
                    {singleStats.histogramBands.map((band, idx) => {
                      const maxBandCount = Math.max(...singleStats.histogramBands.map((b) => b.count), 1);
                      const heightPct = Math.round((band.count / maxBandCount) * 100);

                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                          {/* التلميح العددي فوق العمود */}
                          <div className="mb-1 text-center">
                            <span className="text-[11px] font-mono font-black text-slate-700 block">
                              {band.count}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                              {band.pct}%
                            </span>
                          </div>

                          {/* العمود الرأسي */}
                          <div className="w-full bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden">
                            <div
                              className={`w-full rounded-t-xl transition-all duration-700 ease-out ${band.color}`}
                              style={{ height: `${Math.max(band.count > 0 ? 12 : 0, heightPct)}%` }}
                            />
                          </div>

                          {/* تسمية الشريحة أسفل المحور */}
                          <div className="mt-2 text-center">
                            <span className="text-[10px] font-mono font-bold text-slate-600 block">
                              {band.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* لوحتا الدائرة النسبية والأشرطة الوزارية جنباً إلى جنب */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* الدائرة النسبية لتوزيع العلامات */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-900">
                        الدائرة النسبية لتوزيع الشرائح
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">فوج {selectedClass}</span>
                  </div>

                  {/* رسم الدائرة البيانية */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
                    <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                        <circle
                          cx="80"
                          cy="80"
                          r="64"
                          className="stroke-slate-100"
                          strokeWidth="22"
                          fill="transparent"
                        />
                        {singleStats.graded > 0 && (
                          <>
                            {/* شريحة ممتاز */}
                            <circle
                              cx="80"
                              cy="80"
                              r="64"
                              stroke="#059669"
                              strokeWidth="22"
                              strokeDasharray={`${(singleStats.brackets.excellent.count / singleStats.graded) * 402.12} 402.12`}
                              strokeDashoffset="0"
                              fill="transparent"
                              className="transition-all duration-700 ease-out"
                            />
                            {/* شريحة متوسط إلى جيد */}
                            <circle
                              cx="80"
                              cy="80"
                              r="64"
                              stroke="#2563eb"
                              strokeWidth="22"
                              strokeDasharray={`${(singleStats.brackets.good.count / singleStats.graded) * 402.12} 402.12`}
                              strokeDashoffset={`${-((singleStats.brackets.excellent.count / singleStats.graded) * 402.12)}`}
                              fill="transparent"
                              className="transition-all duration-700 ease-out"
                            />
                            {/* شريحة متعثر */}
                            <circle
                              cx="80"
                              cy="80"
                              r="64"
                              stroke="#d97706"
                              strokeWidth="22"
                              strokeDasharray={`${(singleStats.brackets.struggling.count / singleStats.graded) * 402.12} 402.12`}
                              strokeDashoffset={`${-(
                                ((singleStats.brackets.excellent.count + singleStats.brackets.good.count) / singleStats.graded) *
                                402.12
                              )}`}
                              fill="transparent"
                              className="transition-all duration-700 ease-out"
                            />
                            {/* شريحة ضعيف جداً */}
                            <circle
                              cx="80"
                              cy="80"
                              r="64"
                              stroke="#e11d48"
                              strokeWidth="22"
                              strokeDasharray={`${(singleStats.brackets.weak.count / singleStats.graded) * 402.12} 402.12`}
                              strokeDashoffset={`${-(
                                ((singleStats.brackets.excellent.count +
                                  singleStats.brackets.good.count +
                                  singleStats.brackets.struggling.count) /
                                  singleStats.graded) *
                                402.12
                              )}`}
                              fill="transparent"
                              className="transition-all duration-700 ease-out"
                            />
                          </>
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                        <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                          {singleStats.graded > 0 ? `${singleStats.passingRate}%` : "—"}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">نسبة النجاح</span>
                      </div>
                    </div>

                    {/* تفاصيل الشرائح */}
                    <div className="flex-1 w-full space-y-2 text-xs font-bold">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                        <span className="text-emerald-900 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                          <span>ممتاز (≥ 15)</span>
                        </span>
                        <span className="font-mono font-black text-emerald-800">
                          {singleStats.brackets.excellent.count} تلميذ ({singleStats.brackets.excellent.pct}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 border border-blue-100">
                        <span className="text-blue-900 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                          <span>متوسط إلى جيد (10 - 14.99)</span>
                        </span>
                        <span className="font-mono font-black text-blue-800">
                          {singleStats.brackets.good.count} تلميذ ({singleStats.brackets.good.pct}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-100">
                        <span className="text-amber-900 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                          <span>تحت المعدل (5 - 9.99)</span>
                        </span>
                        <span className="font-mono font-black text-amber-800">
                          {singleStats.brackets.struggling.count} تلميذ ({singleStats.brackets.struggling.pct}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-100">
                        <span className="text-rose-900 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                          <span>ضعيف جداً (&lt; 5)</span>
                        </span>
                        <span className="font-mono font-black text-rose-800">
                          {singleStats.brackets.weak.count} تلميذ ({singleStats.brackets.weak.pct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* توزيع التقديرات الرسمية للوزارة */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BookmarkCheck className="w-4 h-4 text-teal-600" />
                      <h3 className="text-sm font-black text-slate-900">
                        توزيع التقديرات الرسمية للوزارة
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">6 فئات بيداغوجية</span>
                  </div>

                  <div className="space-y-3">
                    {singleStats.officialBrackets.map((ob, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700">{ob.label}</span>
                          <span className={`font-mono font-black ${ob.text}`}>
                            {ob.count} تلميذ ({ob.pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${ob.color}`}
                            style={{ width: `${Math.min(100, Math.max(0, ob.pct))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. تبويب تحليل معايير التقويم الفرعية ── */}
          {singleSubTab === "components" && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <span>تحليل المعدلات التفصيلية لمعايير التقويم المستمر</span>
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  رصد أداء الفوج في كل معيار فرعي لتحديد نقاط القوة ومواضع الضعف بدقة
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block">المشاركة والسلوك (/4)</span>
                  <span className="text-2xl font-black font-mono text-emerald-700 mt-1 block">
                    {singleStats.componentsAvg.behavior}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">تفاعل داخل القسم</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block">الاستجواب 1 (/4)</span>
                  <span className="text-2xl font-black font-mono text-blue-700 mt-1 block">
                    {singleStats.componentsAvg.quiz1}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">كتابي فجائي</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block">الاستجواب 2 (/4)</span>
                  <span className="text-2xl font-black font-mono text-blue-700 mt-1 block">
                    {singleStats.componentsAvg.quiz2}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">كتابي ثانٍ</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block">الوظائف المنزلية (/4)</span>
                  <span className="text-2xl font-black font-mono text-indigo-700 mt-1 block">
                    {Number((singleStats.componentsAvg.hw1 + singleStats.componentsAvg.hw2).toFixed(2))}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">وظيفة 1 + 2</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block">مراقبة الكراس (/4)</span>
                  <span className="text-2xl font-black font-mono text-teal-700 mt-1 block">
                    {Number((singleStats.componentsAvg.note1 + singleStats.componentsAvg.note2).toFixed(2))}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">العناية والحلول</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block">نقاط المبادرة (بونيس)</span>
                  <span className="text-2xl font-black font-mono text-amber-600 mt-1 block">
                    +{singleStats.componentsAvg.bonus}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">معدل الإضافات</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 sm:col-span-2">
                  <span className="text-xs font-bold text-emerald-800 block">معدل التقويم الإجمالي (/20)</span>
                  <span className="text-2xl font-black font-mono text-emerald-700 mt-1 block">
                    {Number(
                      (
                        singleStats.componentsAvg.behavior +
                        singleStats.componentsAvg.quiz1 +
                        singleStats.componentsAvg.quiz2 +
                        singleStats.componentsAvg.hw1 +
                        singleStats.componentsAvg.hw2 +
                        singleStats.componentsAvg.note1 +
                        singleStats.componentsAvg.note2 +
                        singleStats.componentsAvg.bonus
                      ).toFixed(2)
                    )}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">حساب بيداغوجي شامل</span>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. تبويب مقارنة الأفواج الفرعية والنوع الاجتماعي ── */}
          {singleSubTab === "demographics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* مقارنة فوج 1 ضد فوج 2 */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>مقارنة الفوج 1 ضد الفوج 2 (الأعمال التطبيقية)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <span className="text-xs font-black text-emerald-900 block">فوج 1</span>
                    <div className="text-xl font-black font-mono text-emerald-700">
                      {singleStats.subgroups.g1.avg} <span className="text-xs text-slate-500">/ 20</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-bold space-y-0.5">
                      <p>العدد: {singleStats.subgroups.g1.count} تلميذ</p>
                      <p>نسبة النجاح: {singleStats.subgroups.g1.passPct}%</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
                    <span className="text-xs font-black text-teal-900 block">فوج 2</span>
                    <div className="text-xl font-black font-mono text-teal-700">
                      {singleStats.subgroups.g2.avg} <span className="text-xs text-slate-500">/ 20</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-bold space-y-0.5">
                      <p>العدد: {singleStats.subgroups.g2.count} تلميذ</p>
                      <p>نسبة النجاح: {singleStats.subgroups.g2.passPct}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* مقارنة الذكور ضد الإناث */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>مقارنة التحصيل بين الذكور والإناث</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                    <span className="text-xs font-black text-blue-900 block">الذكور</span>
                    <div className="text-xl font-black font-mono text-blue-700">
                      {singleStats.genderStats.males.avg} <span className="text-xs text-slate-500">/ 20</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-bold space-y-0.5">
                      <p>العدد: {singleStats.genderStats.males.count} تلميذ</p>
                      <p>نسبة النجاح: {singleStats.genderStats.males.passPct}%</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                    <span className="text-xs font-black text-purple-900 block">الإناث</span>
                    <div className="text-xl font-black font-mono text-purple-700">
                      {singleStats.genderStats.females.avg} <span className="text-xs text-slate-500">/ 20</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-bold space-y-0.5">
                      <p>العدد: {singleStats.genderStats.females.count} تلميذة</p>
                      <p>نسبة النجاح: {singleStats.genderStats.females.passPct}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. تبويب لوحة الشرف وقائمة الدعم ── */}
          {singleSubTab === "support" && (
            <div className="space-y-4">
              {/* لوحة الشرف */}
              {singleStats.topStudents.length > 0 && (
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-black text-slate-900">
                        لوحة شرف أوائل فوج {selectedClass}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      أفضل 5 علامات في {currentEvalMeta.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                    {singleStats.topStudents.map((s, idx) => {
                      const medals = ["🥇", "🥈", "🥉", "🏅", "🎖️"];
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{medals[idx] || "⭐"}</span>
                            <div>
                              <p className="text-xs font-black text-slate-900 truncate max-w-[110px]">
                                {s.name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-bold">المرتبة {idx + 1}</span>
                            </div>
                          </div>
                          <span className="text-sm font-black font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                            {s.score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* بطاقتا الإنقاذ السريع والدعم المكثف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* فئة القريبين من المعدل */}
                <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                    <h4 className="text-sm font-black text-amber-900 flex items-center gap-2">
                      <span>🎯 فئة الإنقاذ السريع (العلامة بين 8.00 و 9.99)</span>
                    </h4>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {singleStats.nearPassing.length} تلميذ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold">
                    هؤلاء التلاميذ ينقصهم أقل من نقطتين للنجاح، وهم الأولى بالدعم الفوري
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {singleStats.nearPassing.length > 0 ? (
                      singleStats.nearPassing.map((st, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-slate-800">{st.name}</span>
                          <span className="font-mono font-black text-amber-800">
                            {st.score} <span className="text-[10px] text-slate-500 font-normal">(ينقصه {Number((10 - st.score).toFixed(2))} ن)</span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-3 text-center">لا يوجد تلاميذ في هذا النطاق ✓</p>
                    )}
                  </div>
                </div>

                {/* فئة الصعوبات الكبيرة */}
                <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                    <h4 className="text-sm font-black text-rose-900 flex items-center gap-2">
                      <span>⚠️ فئة المتابعة البيداغوجية المكثفة (&lt; 5 نقاط)</span>
                    </h4>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {singleStats.criticalSupport.length} تلميذ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold">
                    تلاميذ يعانون تعثراً حاداً يستدعي برنامج دعم ومعالجة خاص واستدعاء الولي
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {singleStats.criticalSupport.length > 0 ? (
                      singleStats.criticalSupport.map((st, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl bg-rose-50/60 border border-rose-200 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-slate-800">{st.name}</span>
                          <span className="font-mono font-black text-rose-700">
                            {st.score} / 20
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-3 text-center">ممتاز! لا يوجد أي تلميذ أقل من 5 نقاط 👏</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ─── نمط 2: مقارنة بين فوجين (COMPARE TWO CLASSES) ─── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mode === "compare" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* بطاقة الفوج الأول */}
            <div className="bg-white p-5 rounded-3xl border-2 border-emerald-600/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <h3 className="text-base font-black text-slate-900">
                    الفوج أ: {compareClassA}
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {statsClassA.graded} / {statsClassA.total} تلميذ
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-emerald-50 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">المعدل</span>
                  <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                    {statsClassA.average}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">نسبة النجاح</span>
                  <p className="text-xl font-black text-blue-700 font-mono mt-0.5">
                    {statsClassA.passingRate}%
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">الوسيط</span>
                  <p className="text-xl font-black text-purple-700 font-mono mt-0.5">
                    {statsClassA.median}
                  </p>
                </div>
              </div>

              {/* أشرطة التوزيع */}
              <div className="space-y-2 pt-2">
                {statsClassA.officialBrackets.map((ob, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">{ob.label}</span>
                      <span className="font-mono font-black text-slate-800">{ob.count} ({ob.pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${ob.color}`} style={{ width: `${ob.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* بطاقة الفوج الثاني */}
            <div className="bg-white p-5 rounded-3xl border-2 border-teal-600/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                  <h3 className="text-base font-black text-slate-900">
                    الفوج ب: {compareClassB}
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {statsClassB.graded} / {statsClassB.total} تلميذ
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-teal-50 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">المعدل</span>
                  <p className="text-xl font-black text-teal-700 font-mono mt-0.5">
                    {statsClassB.average}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">نسبة النجاح</span>
                  <p className="text-xl font-black text-blue-700 font-mono mt-0.5">
                    {statsClassB.passingRate}%
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 text-center">
                  <span className="text-[11px] text-slate-500 font-bold">الوسيط</span>
                  <p className="text-xl font-black text-purple-700 font-mono mt-0.5">
                    {statsClassB.median}
                  </p>
                </div>
              </div>

              {/* أشرطة التوزيع */}
              <div className="space-y-2 pt-2">
                {statsClassB.officialBrackets.map((ob, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">{ob.label}</span>
                      <span className="font-mono font-black text-slate-800">{ob.count} ({ob.pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${ob.color}`} style={{ width: `${ob.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* خلاصة الفارق البيداغوجي */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <span className="text-slate-600">
              📊 الفارق المقارن بين الفوجين في {currentEvalMeta.label}:
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
      {/* ─── نمط 3: الترتيب العام لجميع الأقسام (ALL CLASSES OVERVIEW) ─── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mode === "all" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
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
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                    <th className="py-3 px-4">المرتبة</th>
                    <th className="py-3 px-4">الفوج</th>
                    <th className="py-3 px-4">المرصودون</th>
                    <th className="py-3 px-4 text-emerald-700">معدل الفوج</th>
                    <th className="py-3 px-4">الوسيط</th>
                    <th className="py-3 px-4">نسبة النجاح</th>
                    <th className="py-3 px-4">أعلى علامة</th>
                    <th className="py-3 px-4">أدنى علامة</th>
                    <th className="py-3 px-4">الممتازون (≥ 16)</th>
                    <th className="py-3 px-4 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allClassStatsList.map((item, idx) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    return (
                      <tr
                        key={item.className}
                        className={`hover:bg-slate-50/80 transition ${
                          idx === 0 ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-black">
                          <span className="text-base">{medals[idx] || `${idx + 1}`}</span>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
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
                        <td className="py-3 px-4 font-mono font-black text-sm text-emerald-700">
                          {item.average} / 20
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {item.median}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-slate-800">
                            {item.passingRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-600">{item.highest}</td>
                        <td className="py-3 px-4 font-mono font-black text-rose-600">{item.lowest}</td>
                        <td className="py-3 px-4 font-bold text-slate-600">
                          {item.officialBrackets[0]?.count || 0} تلميذ ({item.officialBrackets[0]?.pct || 0}%)
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClass(item.className);
                              setMode("single");
                              onClassChange?.(item.className);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
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

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ─── نمط 4: خطة المعالجة البيداغوجية والدعم ─── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mode === "remediation" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>سجل المعالجة البيداغوجية ومرافقة التلاميذ في فوج {selectedClass}</span>
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  خطة عملية موجهة للتلاميذ المتعثرين في {currentEvalMeta.label} لحصص الاستدراك والمعالجة
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                  {singleStats.nearPassing.length} تلميذ فرصة إنقاذ
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-rose-50 text-rose-900 border border-rose-200">
                  {singleStats.criticalSupport.length} تلميذ دعم مكثف
                </span>
              </div>
            </div>

            {/* جدول خطة التدخل */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                    <th className="py-2.5 px-3">التلميذ</th>
                    <th className="py-2.5 px-3">العلامة الحالية</th>
                    <th className="py-2.5 px-3">المستوى والتشخيص</th>
                    <th className="py-2.5 px-3">الإجراء البيداغوجي المقترح</th>
                    <th className="py-2.5 px-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* القريبون من المعدل */}
                  {singleStats.nearPassing.map((st, i) => (
                    <tr key={`near_${i}`} className="hover:bg-amber-50/40 transition">
                      <td className="py-2.5 px-3 font-black text-slate-900">{st.name}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-amber-700">{st.score} / 20</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          قريب من النجاح (ينقصه {Number((10 - st.score).toFixed(2))} ن)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-bold">
                        تصحيح الأخطاء الشائعة + حل تمرين إضافي منزلي مع المراقبة
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          متابعة مباشرة
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* المتعثرون جداً */}
                  {singleStats.criticalSupport.map((st, i) => (
                    <tr key={`crit_${i}`} className="hover:bg-rose-50/40 transition">
                      <td className="py-2.5 px-3 font-black text-slate-900">{st.name}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-rose-700">{st.score} / 20</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                          تعثر حاد (&lt; 5 نقاط)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-bold">
                        حصة استدراك فردية + مراجعة المكتسبات القبلية + استدعاء الولي
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                          تدخل عاجل
                        </span>
                      </td>
                    </tr>
                  ))}

                  {singleStats.nearPassing.length === 0 && singleStats.criticalSupport.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                        لا يوجد أي تلاميذ بحاجة لمعالجة بيداغوجية مستعجلة في هذا الفوج، جميع النتائج مستقرة 👏
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
