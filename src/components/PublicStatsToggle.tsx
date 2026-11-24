"use client";

import { useState } from "react";
import { Eye, Smartphone, Globe, BookOpen, ChevronDown, ChevronUp, Sparkles, Activity } from "lucide-react";

interface PublicStatsToggleProps {
  totalViews: number;
  uniqueDevices: number;
  totalVisits: number;
  totalLessons: number;
  todayVisits?: number;
}

export default function PublicStatsToggle({
  totalViews,
  uniqueDevices,
  totalVisits,
  totalLessons,
  todayVisits,
}: PublicStatsToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs transition-all duration-300">
      {/* الشريط المختصر المصغر (يأخذ مساحة صغيرة جداً افتراضياً) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-700 truncate">
            <span className="font-black text-slate-900 hidden sm:inline">إحصائيات تفاعل المنصة:</span>
            <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-black border border-purple-200/70">
              <Eye className="w-3 h-3 text-purple-600" />
              <span>+{totalViews} مشاهدة</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md font-black border border-cyan-200/70">
              <Smartphone className="w-3 h-3 text-cyan-600" />
              <span>{uniqueDevices} جهاز فريد</span>
            </span>
          </div>
        </div>

        {/* زر التوسيع / الإغلاق */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition shrink-0 cursor-pointer shadow-2xs"
          title={isOpen ? "طي بطاقات الإحصائيات" : "عرض الإحصائيات بالتفصيل"}
        >
          <span>{isOpen ? "طي الإحصائيات" : "عرض الإحصائيات"}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
      </div>

      {/* المحتوى التفصيلي يظهر فقط عند الضغط على الزر */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
            <span className="flex items-center gap-1 text-emerald-800 font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>أرقام تفاعل حقيقية ومحدثة لحظياً لمجتمع مادة الرياضيات</span>
            </span>
            {todayVisits !== undefined && todayVisits > 0 && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                اليوم: {todayVisits} زيارة
              </span>
            )}
          </div>

          {/* شبكة البطاقات الأربعة المميزة */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. مشاهدات الدروس */}
            <div className="bg-gradient-to-br from-purple-50/60 to-white p-3 rounded-xl border border-purple-100 shadow-2xs text-right">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span className="font-bold text-slate-700">مشاهدات الدروس</span>
                <Eye className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-lg sm:text-xl font-black text-purple-950">
                +{totalViews}
              </div>
              <div className="text-[10px] text-purple-700/80 font-medium mt-0.5 truncate">
                مراجعات السبورة والواجبات
              </div>
            </div>

            {/* 2. أجهزة فريدة (تلاميذ وزوار) */}
            <div className="bg-gradient-to-br from-cyan-50/60 to-white p-3 rounded-xl border border-cyan-100 shadow-2xs text-right">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span className="font-bold text-slate-700">أجهزة فريدة 📱</span>
                <Smartphone className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-lg sm:text-xl font-black text-cyan-950">
                {uniqueDevices} جهاز
              </div>
              <div className="text-[10px] text-cyan-700/80 font-medium mt-0.5 truncate">
                تلاميذ وزوار فريدون
              </div>
            </div>

            {/* 3. إجمالي زيارات الموقع */}
            <div className="bg-gradient-to-br from-emerald-50/60 to-white p-3 rounded-xl border border-emerald-100 shadow-2xs text-right">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span className="font-bold text-slate-700">زيارات الموقع 🌐</span>
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-950">
                +{totalVisits}
              </div>
              <div className="text-[10px] text-emerald-700/80 font-medium mt-0.5 truncate">
                المجموع التراكمي للتصفح
              </div>
            </div>

            {/* 4. الموارد والدروس المنشورة */}
            <div className="bg-gradient-to-br from-amber-50/60 to-white p-3 rounded-xl border border-amber-100 shadow-2xs text-right">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span className="font-bold text-slate-700">الموارد والدروس</span>
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-950">
                {totalLessons} مورداً
              </div>
              <div className="text-[10px] text-amber-700/80 font-medium mt-0.5 truncate">
                دروس وأعمال وسلاسل
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
