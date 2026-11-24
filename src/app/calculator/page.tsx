"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Scale,
  Target,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function MathGradeCalculatorPage() {
  // المستوى الدراسي: 1 متوسط (المعامل 2) أو 2 متوسط (المعامل 3)
  const [level, setLevel] = useState<1 | 2>(1);

  // وضع إدخال التقويم: مباشر أو تفصيلي بمعايير الميثاق (4 × 5ن)
  const [evalMode, setEvalMode] = useState<"direct" | "detailed">("direct");

  // علامة التقويم المباشرة
  const [directEvalScore, setDirectEvalScore] = useState<number>(16);

  // معايير التقويم التفصيلية الأربعة (5ن لكل معيار = 20ن)
  const [notebookScore, setNotebookScore] = useState<number>(4.5);
  const [homeworkScore, setHomeworkScore] = useState<number>(4.5);
  const [disciplineScore, setDisciplineScore] = useState<number>(4.5);
  const [participationScore, setParticipationScore] = useState<number>(4.0);

  // علامة الفرض الأول المحروس (من 20)
  const [quizScore, setQuizScore] = useState<number>(14);

  // علامة الاختبار المتوقعة (من 20)
  const [examScore, setExamScore] = useState<number>(16);

  // إظهار شرح القانون الوزاري
  const [showFormulaInfo, setShowFormulaInfo] = useState<boolean>(false);

  // حساب علامة التقويم المستمر النهائية من 20
  const finalEvalScore = useMemo(() => {
    if (evalMode === "direct") {
      return Math.min(20, Math.max(0, directEvalScore));
    }
    const sum =
      Math.min(5, Math.max(0, notebookScore)) +
      Math.min(5, Math.max(0, homeworkScore)) +
      Math.min(5, Math.max(0, disciplineScore)) +
      Math.min(5, Math.max(0, participationScore));
    return Number(sum.toFixed(2));
  }, [evalMode, directEvalScore, notebookScore, homeworkScore, disciplineScore, participationScore]);

  // معامل المادة حسب المستوى: 1م = 2 ، 2م = 3
  const coefficient = level === 1 ? 2 : 3;

  // حساب معدل مادة الرياضيات الفصلي وفق المنشور الوزاري:
  // معدل المادة = (التقويم المستمر + الفرض + الاختبار × 2) / 4
  const termSubjectAverage = useMemo(() => {
    const ev = finalEvalScore;
    const qz = Math.min(20, Math.max(0, quizScore));
    const ex = Math.min(20, Math.max(0, examScore));
    const raw = (ev + qz + ex * 2) / 4;
    return Number(raw.toFixed(2));
  }, [finalEvalScore, quizScore, examScore]);

  // حساب مجموع النقاط بالمعامل (معدل المادة × المعامل)
  const totalWeightedPoints = useMemo(() => {
    return Number((termSubjectAverage * coefficient).toFixed(2));
  }, [termSubjectAverage, coefficient]);

  // أقصى مجموع نقاط بالمعامل (40 في 1م، 60 في 2م)
  const maxWeightedPoints = coefficient * 20;

  // التقدير البيداغوجي وفق السلم الرسمي
  const rating = useMemo(() => {
    const avg = termSubjectAverage;
    if (avg >= 18) {
      return {
        label: "ممتاز 🌟",
        color: "text-emerald-700 bg-emerald-50 border-emerald-300",
        badge: "bg-emerald-600 text-white",
        message: "أداء استثنائي وعلامة ناصعة تضمن لك الصدارة ولوحة الشرف!",
      };
    }
    if (avg >= 16) {
      return {
        label: "جيد جداً 🥇",
        color: "text-teal-700 bg-teal-50 border-teal-300",
        badge: "bg-teal-600 text-white",
        message: "مستوى رائع جداً، استمر على هذا المنوال لتتوج بمرتبة الامتياز.",
      };
    }
    if (avg >= 14) {
      return {
        label: "جيد 🥈",
        color: "text-blue-700 bg-blue-50 border-blue-300",
        badge: "bg-blue-600 text-white",
        message: "نتيجة جيدة ومطمئنة، وبالتركيز في الاختبار يمكنك الارتقاء أكثر.",
      };
    }
    if (avg >= 12) {
      return {
        label: "قريب من الجيد 🥉",
        color: "text-indigo-700 bg-indigo-50 border-indigo-300",
        badge: "bg-indigo-600 text-white",
        message: "مستوى متوسط إيجابي، مراجعة بضع دروس سترفع معدلك إلى المراتب المتقدمة.",
      };
    }
    if (avg >= 10) {
      return {
        label: "مقبول 📈",
        color: "text-amber-700 bg-amber-50 border-amber-300",
        badge: "bg-amber-600 text-white",
        message: "أنت فوق عتبة النجاح، احرص على حل التمارين لتأمين علامتك.",
      };
    }
    return {
      label: "دون المتوسط ⚠️",
      color: "text-rose-700 bg-rose-50 border-rose-300",
      badge: "bg-rose-600 text-white",
      message: "تحتاج إلى معالجة واستدراك فوري من خلال مراجعة دروس السبورة وحلول التمارين.",
    };
  }, [termSubjectAverage]);

  // حاسبة الهدف العكسي: كم نقطة تحتاج في الاختبار للوصول إلى معدلات معينة؟
  // القانون: الاختبار = (المعدل المطلوب × 4 - التقويم - الفرض) / 2
  const targetAverages = [10, 12, 14, 16, 18, 20];
  const targetPredictions = useMemo(() => {
    const ev = finalEvalScore;
    const qz = Math.min(20, Math.max(0, quizScore));

    return targetAverages.map((target) => {
      const neededExam = (target * 4 - ev - qz) / 2;
      return {
        target,
        neededExam: Number(neededExam.toFixed(2)),
        isPossible: neededExam <= 20,
        alreadyAchieved: neededExam <= 0,
      };
    });
  }, [finalEvalScore, quizScore]);

  // إعادة ضبط القيم الافتراضية
  const resetDefaults = () => {
    setDirectEvalScore(16);
    setNotebookScore(4.5);
    setHomeworkScore(4.5);
    setDisciplineScore(4.5);
    setParticipationScore(4.0);
    setQuizScore(14);
    setExamScore(16);
  };

  return (
    <div className="pb-16 pt-3 space-y-5 fade-up">
      {/* رأس الصفحة وزر العودة */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition group"
        >
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <span>الرئيسية</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-black text-slate-800">
            محاكي معدل مادة الرياضيات الفصلي
          </span>
        </div>
        <button
          type="button"
          onClick={resetDefaults}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
          title="إعادة ضبط القيم"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">إعادة ضبط</span>
        </button>
      </div>

      {/* بطاقة الواجهة الترحيبية والتعريف بالمعاملات */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-850 via-teal-900 to-slate-900 text-white p-5 sm:p-7 shadow-xl border border-emerald-700/40">
        <div className="absolute top-0 left-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 text-center sm:text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-black text-amber-300">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>حساب وزاري دقيق 100% لمعدل مادة الرياضيات</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              محاكي معدل الفصل الأول لمادة الرياضيات 🧮
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
              جرّب علامة الاختبار المتوقعة واكتشف فوراً معدل مادتك بدقة متناهية، ومجموع نقاطك وفق
              المعامل الرسمي، مع معرفة النقاط المطلوبة لبلوغ معدلك المنشود.
            </p>
          </div>

          {/* تبديل المستوى الدراسي وتحديد المعامل */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span className="text-xs font-bold text-white/80 ml-1">اختر مستواك الدراسي:</span>
            <button
              type="button"
              onClick={() => setLevel(1)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                level === 1
                  ? "bg-white text-emerald-900 shadow-md ring-2 ring-emerald-400"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>السنة الأولى متوسط (1م)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">
                المعامل: 2
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLevel(2)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                level === 2
                  ? "bg-white text-teal-900 shadow-md ring-2 ring-teal-400"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>السنة الثانية متوسط (2م)</span>
              <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-black">
                المعامل: 3
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 1. بطاقة النتيجة الحية الكبرى (Instant Live Result) ================= */}
      <div className="bg-white border-2 border-emerald-500/80 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
              📊
            </span>
            <div>
              <div className="text-xs font-black text-slate-800">
                النتيجة التقديرية الحالية لمادة الرياضيات
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                تتحدث لحظياً عند تغيير أي علامة أدناه
              </div>
            </div>
          </div>

          {/* شارة التقدير البيداغوجي */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black shadow-2xs ${rating.color}`}
          >
            <span>التقدير:</span>
            <span>{rating.label}</span>
          </div>
        </div>

        {/* شبكة الأرقام الكبرى */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. معدل المادة الفصلي من 20 */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-200 text-center relative overflow-hidden">
            <div className="text-[11px] font-bold text-emerald-800">معدل مادة الرياضيات الفصلي</div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950 mt-1">
              {termSubjectAverage.toFixed(2)}
              <span className="text-xs font-bold text-slate-500 mr-1.5">/ 20</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-700 mt-1">
              وفق المنشور الوزاري المحين
            </div>
          </div>

          {/* 2. مجموع نقاط المادة بالمعامل */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50/50 p-4 rounded-2xl border border-teal-200 text-center">
            <div className="text-[11px] font-bold text-teal-800">
              النقاط بالمُعامل ({level === 1 ? "معامل 2" : "معامل 3"})
            </div>
            <div className="text-3xl sm:text-4xl font-black text-teal-950 mt-1">
              {totalWeightedPoints.toFixed(2)}
              <span className="text-xs font-bold text-slate-500 mr-1.5">/ {maxWeightedPoints}</span>
            </div>
            <div className="text-[10px] font-bold text-teal-700 mt-1">
              تُحسب في المجموع العام لكشف النقاط
            </div>
          </div>

          {/* 3. تفكيك العناصر الداخلة في الحساب */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-center text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-600 font-bold">
              <span>التقويم المستمر:</span>
              <span className="font-black text-slate-900">{finalEvalScore.toFixed(2)} / 20</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-bold">
              <span>الفرض المحروس:</span>
              <span className="font-black text-slate-900">{quizScore.toFixed(2)} / 20</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-bold">
              <span>الاختبار الفصلي (مضاعف ×2):</span>
              <span className="font-black text-purple-700">{(examScore * 2).toFixed(2)} / 40</span>
            </div>
          </div>
        </div>

        {/* رسالة التقييم التوجيهية */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200/70">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-bold">{rating.message}</span>
        </div>
      </div>

      {/* ================= 2. مدخلات العلامات (التقويم، الفرض، الاختبار) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* أ) علامة التقويم المستمر */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                1
              </span>
              <div>
                <h3 className="font-black text-xs text-slate-800">علامة التقويم المستمر</h3>
                <div className="text-[10px] text-slate-400 font-semibold">من 20 نقطة</div>
              </div>
            </div>
            <div className="text-base font-black text-emerald-700">
              {finalEvalScore.toFixed(2)} / 20
            </div>
          </div>

          {/* تبديل وضع الإدخال */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setEvalMode("direct")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                evalMode === "direct"
                  ? "bg-white text-emerald-800 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              إدخال مباشر
            </button>
            <button
              type="button"
              onClick={() => setEvalMode("detailed")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                evalMode === "detailed"
                  ? "bg-white text-emerald-800 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              معايير الميثاق (4×5ن)
            </button>
          </div>

          {evalMode === "direct" ? (
            <div className="space-y-2 pt-1">
              <label className="text-xs text-slate-600 font-bold block">
                أدخل علامة التقويم المستمر:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={directEvalScore}
                  onChange={(e) => setDirectEvalScore(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-center"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[14, 16, 18, 20].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDirectEvalScore(v)}
                    className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 transition cursor-pointer"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>تنظيم الكراريس ونظافتها:</span>
                  <span className="font-black text-emerald-700">{notebookScore} / 5</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.25"
                  value={notebookScore}
                  onChange={(e) => setNotebookScore(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>إنجاز الواجبات والتمارين:</span>
                  <span className="font-black text-emerald-700">{homeworkScore} / 5</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.25"
                  value={homeworkScore}
                  onChange={(e) => setHomeworkScore(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>الانضباط والمواظبة:</span>
                  <span className="font-black text-emerald-700">{disciplineScore} / 5</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.25"
                  value={disciplineScore}
                  onChange={(e) => setDisciplineScore(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>المشاركة والتفاعل الصفي:</span>
                  <span className="font-black text-emerald-700">{participationScore} / 5</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.25"
                  value={participationScore}
                  onChange={(e) => setParticipationScore(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* ب) علامة الفرض الأول */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs">
                2
              </span>
              <div>
                <h3 className="font-black text-xs text-slate-800">علامة الفرض الأول</h3>
                <div className="text-[10px] text-slate-400 font-semibold">من 20 نقطة</div>
              </div>
            </div>
            <div className="text-base font-black text-teal-700">
              {quizScore.toFixed(2)} / 20
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-xs text-slate-600 font-bold block">
              أدخل علامة الفرض التي نلتها:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="20"
                step="0.25"
                value={quizScore}
                onChange={(e) => setQuizScore(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-sm text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-center"
              />
            </div>

            {/* شريط تمرير سريع */}
            <input
              type="range"
              min="0"
              max="20"
              step="0.25"
              value={quizScore}
              onChange={(e) => setQuizScore(parseFloat(e.target.value))}
              className="w-full accent-teal-600 pt-1"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[8, 10, 12, 14, 16, 18, 20].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setQuizScore(v)}
                  className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-slate-100 hover:bg-teal-100 text-slate-700 transition cursor-pointer"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ج) علامة اختبار الفصل المتوقعة (المتغير الأساسي) */}
        <div className="bg-gradient-to-br from-purple-50/50 via-white to-white p-4 sm:p-5 rounded-2xl border-2 border-purple-300 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                3
              </span>
              <div>
                <h3 className="font-black text-xs text-purple-950">علامة الاختبار المتوقعة</h3>
                <div className="text-[10px] text-purple-700 font-semibold">مضروبة في 2 (المعامل 2)</div>
              </div>
            </div>
            <div className="text-lg font-black text-purple-800">
              {examScore.toFixed(2)} / 20
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-xs text-slate-700 font-black block">
              حرك الشريط لتجربة علامتك المتوقعة:
            </label>

            {/* شريط تمرير الاختبار البارز */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="20"
                step="0.25"
                value={examScore}
                onChange={(e) => setExamScore(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                <span>0</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span className="text-purple-700 font-black">20 كاملة</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="0"
                max="20"
                step="0.25"
                value={examScore}
                onChange={(e) => setExamScore(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-purple-300 font-black text-base text-purple-950 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none text-center bg-purple-50/30"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[10, 12, 15, 17, 18.5, 20].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setExamScore(v)}
                  className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer ${
                    examScore === v
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-purple-50 hover:bg-purple-100 text-purple-800"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. حاسبة الهدف العكسي: كم تحتاج في الاختبار؟ ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                حاسبة الهدف: كم يجب أن تنال في الاختبار لتحقيق معدلك المنشود؟
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                بناءً على نقطتي التقويم والفرض اللتين أدخلتهما أعلاه
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {targetPredictions.map((pred) => {
            const isTargetReached = termSubjectAverage >= pred.target;

            return (
              <div
                key={pred.target}
                className={`p-3 rounded-xl border text-center transition ${
                  isTargetReached
                    ? "bg-emerald-50/70 border-emerald-300 shadow-2xs"
                    : pred.isPossible
                    ? "bg-slate-50 border-slate-200"
                    : "bg-rose-50/50 border-rose-200"
                }`}
              >
                <div className="text-[11px] font-bold text-slate-600">
                  معدل <span className="font-black text-slate-900">{pred.target} / 20</span>
                </div>

                <div className="mt-1">
                  {pred.alreadyAchieved ? (
                    <div className="text-xs font-black text-emerald-700 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>مضمون بالفعل ✓</span>
                    </div>
                  ) : pred.isPossible ? (
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        {pred.neededExam.toFixed(2)}
                      </div>
                      <div className="text-[9px] font-bold text-slate-500">في الاختبار</div>
                    </div>
                  ) : (
                    <div className="text-[10px] font-black text-rose-700 py-1">
                      غير ممكن حسابياً
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 4. شرح الصيغة والقانون الوزاري ================= */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 text-xs space-y-2">
        <button
          type="button"
          onClick={() => setShowFormulaInfo(!showFormulaInfo)}
          className="w-full flex items-center justify-between text-slate-800 font-black cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>كيف يتم حساب معدل مادة الرياضيات رسمياً في التعليم المتوسط؟</span>
          </span>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            {showFormulaInfo ? "إخفاء التفاصيل" : "عرض القانون الوزاري"}
            {showFormulaInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showFormulaInfo && (
          <div className="pt-2 text-slate-600 space-y-2 border-t border-slate-200/60 animate-in fade-in duration-200">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center font-bold text-slate-800 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm">
              <span className="text-emerald-800 font-black">معدل مادة الرياضيات الفصلي =</span>
              <span className="inline-flex items-center gap-1 font-black">
                <span>[ التقويم المستمر + الفرض الأول + (الاختبار × 2) ]</span>
                <span className="text-slate-400">÷</span>
                <span className="text-purple-700 font-black">4</span>
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
              <li>
                <strong>التقويم المستمر (معامل 1):</strong> يُحسب من 20 نقطة، ويشمل تنظيم الكراس (5ن)، الواجبات (5ن)، الانضباط (5ن)، والمشاركة (5ن).
              </li>
              <li>
                <strong>الفرض الأول (معامل 1):</strong> علامة الفرض المحروس من 20 نقطة.
              </li>
              <li>
                <strong>اختبار الفصل الأول (معامل 2):</strong> تُضاعف علامة الاختبار (تُضرب في 2) لتصبح على 40 نقطة.
              </li>
              <li>
                <strong>المجموع يُقسم على 4:</strong> للحصول على معدل المادة الصافي من 20.
              </li>
              <li>
                <strong>المعاملات الرسمية في التعليم المتوسط:</strong> مادة الرياضيات معاملها <strong>2</strong> في السنة الأولى متوسط، ومعاملها <strong>3</strong> في السنة الثانية متوسط.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
