"use client";

import { useMemo } from "react";
import { Printer, X, Download, Award, FileSpreadsheet, Sparkles } from "lucide-react";

export interface StudentMinistryRow {
  studentId: string;
  studentName: string;
  className: string;
  groupName: string;
  behaviorScore: string | number;
  quiz1Score: string | number;
  homework1Score: string | number;
  quiz2Score: string | number;
  homework2Score: string | number;
  notebook1Score: string | number;
  notebook2Score: string | number;
  bonusScore: string | number;
  continuousScore: string | number;
  test1Score: string | number;
  continuousMonitoring: string | number;
  examScore: string | number;
  termAverage: string | number;
  appreciation: string;
  rank?: number;
}

interface OfficialMinistryPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  trimester: 1 | 2 | 3;
  students: StudentMinistryRow[];
}

export default function OfficialMinistryPdfModal({
  isOpen,
  onClose,
  classNameTitle,
  trimester,
  students,
}: OfficialMinistryPdfModalProps) {
  // حساب الإحصائيات الرسمية للفوج
  const stats = useMemo(() => {
    const total = students.length;
    let present = 0;
    let absent = 0;
    let sumAverage = 0;
    let countGradedAverage = 0;
    let countPassing = 0;
    let highest = -1;
    let lowest = 999;

    students.forEach((s) => {
      const avgStr = String(s.termAverage ?? "").trim();
      if (avgStr === "غ" || avgStr === "غياب") {
        absent++;
      } else {
        present++;
        const num = parseFloat(avgStr);
        if (!isNaN(num)) {
          sumAverage += num;
          countGradedAverage++;
          if (num >= 10) countPassing++;
          if (num > highest) highest = num;
          if (num < lowest) lowest = num;
        }
      }
    });

    const classAverage = countGradedAverage > 0 ? (sumAverage / countGradedAverage).toFixed(2) : "—";
    const passRate = countGradedAverage > 0 ? ((countPassing / countGradedAverage) * 100).toFixed(1) : "0.0";

    return {
      total,
      present,
      absent,
      classAverage,
      passRate,
      countPassing,
      highest: highest >= 0 ? highest.toFixed(2) : "—",
      lowest: lowest <= 100 && lowest >= 0 ? lowest.toFixed(2) : "—",
    };
  }, [students]);

  // فرز التلاميذ ترتيباً أبجدياً أو بالترتيب المسجل
  const sortedStudents = useMemo(() => {
    return [...students];
  }, [students]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed-none">
      {/* ─── الحاوية الرئيسية ─── */}
      <div className="bg-white rounded-3xl w-full max-w-[1300px] border border-slate-200 shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* شريط التحكم العلوي (يخفى عند الطباعة) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900" style={{ fontFamily: "'Cairo', sans-serif" }}>
                كشف نقاط مادة الرياضيات الرسمي للوزارة (A4 عرضي Landscape)
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                قسم: {classNameTitle} • الفصل الدراسي {trimester} • الأستاذ: محمد عدايكة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الوزارة الآن (PDF)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── وثيقة كشف النقاط الرسمية (قابلة للطباعة بدقة عالية A4 Landscape) ─── */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-4 print:p-0 print:overflow-visible text-slate-900" dir="rtl">
          {/* الترويسة الوزارية الرسمية للجمهورية الجزائرية */}
          <div className="text-center space-y-1 border-b-2 border-slate-800 pb-3">
            <h1 className="text-sm sm:text-base font-black tracking-wide" style={{ fontFamily: "'Cairo', sans-serif" }}>
              الجمهورية الجزائرية الديمقراطية الشعبية
            </h1>
            <h2 className="text-xs sm:text-sm font-bold text-slate-700" style={{ fontFamily: "'Cairo', sans-serif" }}>
              وزارة التربية الوطنية — مديرية التربية لولاية الوادي
            </h2>
            <div className="flex flex-wrap items-center justify-between text-xs font-bold pt-1.5 px-2">
              <span>المؤسسة: <strong>متوسطة المجاهد باهي علي — قمار</strong></span>
              <span>السنة الدراسية: <strong>2026 / 2027</strong></span>
              <span>المادة: <strong>الرياضيات</strong></span>
              <span>أستاذ المادة: <strong>محمد عدايكة</strong></span>
              <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300 font-black">
                القسم: {classNameTitle}
              </span>
              <span className="bg-emerald-100 text-emerald-950 px-2.5 py-0.5 rounded border border-emerald-300 font-black">
                الفصل الدراسي: {trimester === 1 ? "الأول" : trimester === 2 ? "الثاني" : "الثالث"}
              </span>
            </div>
          </div>

          {/* عنوان الكشف */}
          <div className="text-center py-1 bg-slate-100 rounded-lg border border-slate-300">
            <span className="text-sm font-black tracking-wider" style={{ fontFamily: "'Cairo', sans-serif" }}>
              دفتر التنقيط والتقويم البيداغوجي الفصلي الرسمي
            </span>
          </div>

          {/* ─── جدول العلامات الشامل ─── */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-center text-[10px] border-collapse border border-slate-800">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-black border-b border-slate-800">
                  <th rowSpan={2} className="border border-slate-800 py-1 px-1 w-6">#</th>
                  <th rowSpan={2} className="border border-slate-800 py-1 px-2 min-w-[140px] text-right">
                    اللقب والاسم
                  </th>
                  <th rowSpan={2} className="border border-slate-800 py-1 px-1 w-10">الفوج</th>
                  <th colSpan={8} className="border border-slate-800 py-1 px-1 bg-emerald-50">
                    عناصر التقويم المستمر المفصلة
                  </th>
                  <th rowSpan={2} className="border border-slate-800 py-1 px-1.5 bg-emerald-100 font-black w-12">
                    مجموع التقويم /20
                  </th>
                  <th rowSpan={2} className="border border-slate-800 py-1 px-1.5 bg-blue-50 font-black w-12">
                    الفرض محروس /20
                  </th>
                  <th rowSpan={2} className="border border-slate-800 py-1 px-1.5 bg-blue-100 font-black w-12">
                    المراقبة (ف+ت)/2
                  </th>
                  <th rowSpan={2} className="border border-slate-800 py-1 px-1.5 bg-indigo-50 font-black w-12">
                    الاختبار /20
                  </th>
                  <th rowSpan={2} className="border border-slate-800 py-1 px-1.5 bg-amber-100 font-black w-14">
                    المعدل الفصلي /20
                  </th>
                  <th rowSpan={2} className="border border-slate-800 py-1 px-1 w-8">
                    الرتبة
                  </th>
                  <th rowSpan={2} className="border border-slate-800 py-1 px-2 min-w-[150px] text-right">
                    ملاحظات وتوجيهات الأستاذ
                  </th>
                </tr>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-800 text-[9px]">
                  <th className="border border-slate-800 py-0.5 px-0.5">مشاركة (4)</th>
                  <th className="border border-slate-800 py-0.5 px-0.5">استجواب 1 (4)</th>
                  <th className="border border-slate-800 py-0.5 px-0.5">وظيفة 1 (2)</th>
                  <th className="border border-slate-800 py-0.5 px-0.5">استجواب 2 (4)</th>
                  <th className="border border-slate-800 py-0.5 px-0.5">وظيفة 2 (2)</th>
                  <th className="border border-slate-800 py-0.5 px-0.5">كراس 1 (2)</th>
                  <th className="border border-slate-800 py-0.5 px-0.5">كراس 2 (2)</th>
                  <th className="border border-slate-800 py-0.5 px-0.5">بونص (+)</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((s, idx) => {
                  const isAverageAbsent = s.termAverage === "غ" || s.termAverage === "غياب";
                  const avgNum = typeof s.termAverage === "number" ? s.termAverage : parseFloat(String(s.termAverage));
                  const isPassing = !isNaN(avgNum) && avgNum >= 10;

                  return (
                    <tr
                      key={s.studentId}
                      className={`border-b border-slate-400 ${
                        idx % 2 === 1 ? "bg-slate-50/70" : "bg-white"
                      }`}
                    >
                      <td className="border border-slate-800 py-0.5 px-1 font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-800 py-0.5 px-2 text-right font-black text-slate-900 whitespace-nowrap" style={{ fontFamily: "'Cairo', sans-serif" }}>
                        {s.studentName}
                      </td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-bold text-slate-600 text-[9px]">
                        {s.groupName || "—"}
                      </td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-mono">{s.behaviorScore ?? "—"}</td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-mono">{s.quiz1Score ?? "—"}</td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-mono">{s.homework1Score ?? "—"}</td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-mono">{s.quiz2Score ?? "—"}</td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-mono">{s.homework2Score ?? "—"}</td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-mono">{s.notebook1Score ?? "—"}</td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-mono">{s.notebook2Score ?? "—"}</td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-mono">{s.bonusScore ? `+${s.bonusScore}` : "—"}</td>
                      <td className="border border-slate-800 py-0.5 px-1 font-mono font-black bg-emerald-50 text-emerald-950">
                        {s.continuousScore !== "" && s.continuousScore !== undefined ? s.continuousScore : "—"}
                      </td>
                      <td className={`border border-slate-800 py-0.5 px-1 font-mono font-black ${s.test1Score === "غ" ? "text-red-700 font-sans" : "text-blue-950"}`}>
                        {s.test1Score ?? "—"}
                      </td>
                      <td className={`border border-slate-800 py-0.5 px-1 font-mono font-black ${s.continuousMonitoring === "غ" ? "text-red-700 font-sans" : "text-blue-950"}`}>
                        {s.continuousMonitoring !== "" && s.continuousMonitoring !== undefined ? s.continuousMonitoring : "—"}
                      </td>
                      <td className={`border border-slate-800 py-0.5 px-1 font-mono font-black ${s.examScore === "غ" ? "text-red-700 font-sans" : "text-indigo-950"}`}>
                        {s.examScore ?? "—"}
                      </td>
                      <td className={`border border-slate-800 py-0.5 px-1 font-mono font-black text-xs ${
                        isAverageAbsent
                          ? "bg-red-50 text-red-700 font-sans"
                          : isPassing
                          ? "bg-amber-100 text-amber-950"
                          : "text-slate-900"
                      }`}>
                        {s.termAverage !== "" && s.termAverage !== undefined ? s.termAverage : "—"}
                      </td>
                      <td className="border border-slate-800 py-0.5 px-0.5 font-mono font-bold">
                        {s.rank ? `#${s.rank}` : "—"}
                      </td>
                      <td className="border border-slate-800 py-0.5 px-2 text-right text-[9px] font-bold text-slate-700 truncate max-w-[180px]">
                        {s.appreciation || (isPassing ? "نتائج طيبة واصل" : "يحتاج للمزيد من المتابعة والتركيز")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ─── ملخص الإحصائيات الرسمية للفوج ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 text-center text-xs font-bold pt-1">
            <div className="p-2 border border-slate-800 rounded bg-slate-100">
              <span className="block text-[10px] text-slate-600">عدد المسجلين</span>
              <strong className="text-sm font-mono">{stats.total}</strong>
            </div>
            <div className="p-2 border border-slate-800 rounded bg-slate-100">
              <span className="block text-[10px] text-slate-600">عدد الحاضرين</span>
              <strong className="text-sm font-mono text-emerald-800">{stats.present}</strong>
            </div>
            <div className="p-2 border border-slate-800 rounded bg-slate-100">
              <span className="block text-[10px] text-slate-600">عدد الغائبين</span>
              <strong className="text-sm font-mono text-red-700">{stats.absent}</strong>
            </div>
            <div className="p-2 border border-slate-800 rounded bg-slate-100">
              <span className="block text-[10px] text-slate-600">أعلى معدل</span>
              <strong className="text-sm font-mono text-emerald-700">{stats.highest}</strong>
            </div>
            <div className="p-2 border border-slate-800 rounded bg-slate-100">
              <span className="block text-[10px] text-slate-600">أدنى معدل</span>
              <strong className="text-sm font-mono text-rose-700">{stats.lowest}</strong>
            </div>
            <div className="p-2 border border-slate-800 rounded bg-amber-50 border-amber-800">
              <span className="block text-[10px] text-amber-900 font-bold">معدل الفوج العام</span>
              <strong className="text-sm font-mono text-amber-950">{stats.classAverage} / 20</strong>
            </div>
            <div className="p-2 border border-slate-800 rounded bg-emerald-50 border-emerald-800">
              <span className="block text-[10px] text-emerald-900 font-bold">الحاصلون على المعدل</span>
              <strong className="text-sm font-mono text-emerald-900">{stats.countPassing} تلميذ</strong>
            </div>
            <div className="p-2 border border-slate-800 rounded bg-emerald-100 border-emerald-800">
              <span className="block text-[10px] text-emerald-950 font-bold">نسبة النجاح</span>
              <strong className="text-sm font-mono text-emerald-950">{stats.passRate}%</strong>
            </div>
          </div>

          {/* ─── خانة الإمضاءات الرسمية ─── */}
          <div className="grid grid-cols-2 gap-8 pt-4 pb-2 text-center text-xs font-black">
            <div className="border border-slate-800 rounded-lg p-4 space-y-8 bg-slate-50/50">
              <span>إمضاء وختم أستاذ المادة: <strong>محمد عدايكة</strong></span>
              <div className="text-[10px] text-slate-400 font-normal">حرر بـ: قمار، ولاية الوادي في ..............................</div>
            </div>
            <div className="border border-slate-800 rounded-lg p-4 space-y-8 bg-slate-50/50">
              <span>إمضاء وختم السيد مدير المؤسسة:</span>
              <div className="text-[10px] text-slate-400 font-normal">المصادقة والتأشيرة ..............................</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ستايل مخصص للطباعة A4 Landscape ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 10px !important;
          }
          header, footer, nav, aside, .print\\:hidden {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
