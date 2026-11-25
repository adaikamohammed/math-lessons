"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import FeatureViewBadge from "@/components/FeatureViewBadge";

export default function SimpleMathCalculatorPage() {
  // المستوى الدراسي: 1 متوسط (معامل 2) أو 2 متوسط (معامل 3)
  const [level, setLevel] = useState<1 | 2>(1);

  // العلامات الثلاث الأساسية
  const [evalScore, setEvalScore] = useState<number>(15);
  const [quizScore, setQuizScore] = useState<number>(14);
  const [examScore, setExamScore] = useState<number>(16);

  // المعامل
  const coeff = level === 1 ? 2 : 3;

  // الحساب الرسمي المباشر: (التقويم + الفرض + الاختبار × 2) / 4
  const average = useMemo(() => {
    const ev = Math.min(20, Math.max(0, evalScore || 0));
    const qz = Math.min(20, Math.max(0, quizScore || 0));
    const ex = Math.min(20, Math.max(0, examScore || 0));
    const raw = (ev + qz + ex * 2) / 4;
    return Number(raw.toFixed(2));
  }, [evalScore, quizScore, examScore]);

  // مجموع النقاط بالمعامل
  const totalPoints = useMemo(() => {
    return Number((average * coeff).toFixed(2));
  }, [average, coeff]);

  // التقدير البسيط المشجع
  const rating = useMemo(() => {
    if (average >= 18) return { text: "ممتاز جداً 🌟", color: "bg-emerald-600 text-white" };
    if (average >= 15) return { text: "جيد جداً 👏", color: "bg-teal-600 text-white" };
    if (average >= 12) return { text: "جيد 👍", color: "bg-blue-600 text-white" };
    if (average >= 10) return { text: "مقبول 📈", color: "bg-amber-600 text-white" };
    return { text: "دون المتوسط ⚠️", color: "bg-rose-600 text-white" };
  }, [average]);

  return (
    <div className="pb-16 pt-3 max-w-2xl mx-auto space-y-4 fade-up px-3" dir="rtl">
      {/* شريط علوي بسيط */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span>الدروس</span>
        </Link>
        <span className="text-xs font-black text-slate-800">
          محاكي معدل الرياضيات 🧮
        </span>
        <FeatureViewBadge
          views={412}
          uniqueDevices={84}
          featureKey="calculator"
          trackOnMount={true}
          size="xs"
          variant="teal"
          compactDevices
        />
        <button
          type="button"
          onClick={() => {
            setEvalScore(15);
            setQuizScore(14);
            setExamScore(16);
          }}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة</span>
        </button>
      </div>

      {/* 1. اختيار المستوى الدراسي بلمسة واحدة */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="text-xs font-black text-slate-700 text-center">
          اختر سنتك الدراسية:
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLevel(1)}
            className={`p-3 rounded-xl text-center font-black transition cursor-pointer border ${
              level === 1
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="text-sm">السنة 1 متوسط</div>
            <div className="text-[11px] opacity-90 font-bold">المعامل: 2</div>
          </button>

          <button
            type="button"
            onClick={() => setLevel(2)}
            className={`p-3 rounded-xl text-center font-black transition cursor-pointer border ${
              level === 2
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="text-sm">السنة 2 متوسط</div>
            <div className="text-[11px] opacity-90 font-bold">المعامل: 3</div>
          </button>
        </div>
      </div>

      {/* 2. بطاقة النتيجة الفورية الكبرى المبهجة */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-5 sm:p-6 text-center shadow-lg space-y-3 relative overflow-hidden">
        <div className="text-xs font-bold text-emerald-100">
          معدلك المتوقع في مادة الرياضيات 🎯
        </div>

        <div className="text-4xl sm:text-5xl font-black tracking-tight">
          {average.toFixed(2)}
          <span className="text-sm font-bold text-emerald-200 mr-2">/ 20</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black shadow-xs bg-white text-emerald-900">
          <span>{rating.text}</span>
        </div>

        <div className="text-[11px] text-emerald-100/90 font-bold pt-1">
          مجموع النقاط بالمُعامل:{" "}
          <span className="text-white font-black text-sm">{totalPoints}</span>{" "}
          من أصل {coeff * 20}
        </div>
      </div>

      {/* 3. الخانات الثلاث البسيطة للإدخال */}
      <div className="space-y-3">
        {/* علامة التقويم المستمر */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>📘</span>
              <span>علامة التقويم المستمر:</span>
            </span>
            <span className="text-sm font-black text-emerald-700">{evalScore} / 20</span>
          </div>
          <input
            type="number"
            min="0"
            max="20"
            step="0.5"
            value={evalScore}
            onChange={(e) => setEvalScore(parseFloat(e.target.value) || 0)}
            className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-base text-center outline-none focus:border-emerald-500 bg-slate-50"
          />
          <div className="flex justify-center gap-2 pt-0.5">
            {[12, 14, 16, 18, 20].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setEvalScore(v)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  evalScore === v ? "bg-emerald-600 text-white font-black" : "bg-slate-100 text-slate-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* علامة الفرض */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>📝</span>
              <span>علامة الفرض الأول:</span>
            </span>
            <span className="text-sm font-black text-teal-700">{quizScore} / 20</span>
          </div>
          <input
            type="number"
            min="0"
            max="20"
            step="0.5"
            value={quizScore}
            onChange={(e) => setQuizScore(parseFloat(e.target.value) || 0)}
            className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-base text-center outline-none focus:border-teal-500 bg-slate-50"
          />
          <div className="flex justify-center gap-2 pt-0.5">
            {[8, 10, 12, 14, 16, 18].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setQuizScore(v)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  quizScore === v ? "bg-teal-600 text-white font-black" : "bg-slate-100 text-slate-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* علامة الاختبار المتوقعة (بشريط تمرير كبير وممتع) */}
        <div className="bg-purple-50/60 p-4 rounded-2xl border-2 border-purple-300 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
              <span>🎯</span>
              <span>علامة الاختبار المتوقعة (حرّك لتجرّب):</span>
            </span>
            <span className="text-lg font-black text-purple-800">{examScore} / 20</span>
          </div>

          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={examScore}
            onChange={(e) => setExamScore(parseFloat(e.target.value))}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />

          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
            <span>0</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span className="text-purple-700 font-black">20</span>
          </div>
        </div>
      </div>
    </div>
  );
}
