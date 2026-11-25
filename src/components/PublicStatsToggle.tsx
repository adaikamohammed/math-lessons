"use client";

import { useState } from "react";
import {
  Eye,
  Smartphone,
  Globe,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

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
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs transition-all duration-200 overflow-hidden">
      {/* سطر واحد مضغوط تماماً بدون التفاف مهما كانت الشاشة صغيرة */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition select-none"
        title={isOpen ? "طي بطاقات الإحصائيات" : "عرض الإحصائيات بالتفصيل"}
      >
        {/* الجانب الأيمن: نقطة البث المباشر والأرقام في سطر أفقي واحد */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-nowrap overflow-hidden text-[11px] sm:text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>

          {/* عدد مشاهدات الدروس */}
          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md font-black border border-purple-200/70 shrink-0">
            <Eye className="w-3 h-3 text-purple-600" />
            <span>+{totalViews} مشاهدة</span>
          </span>

          <span className="text-slate-300 shrink-0">•</span>

          {/* الأجهزة الفريدة */}
          <span className="inline-flex items-center gap-1 text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded-md font-black border border-cyan-200/70 shrink-0">
            <Smartphone className="w-3 h-3 text-cyan-600" />
            <span>{uniqueDevices} جهاز فريد</span>
          </span>

          {/* الزيارات التراكمية تظهر على الشاشات المتوسطة والكبيرة */}
          <span className="text-slate-300 shrink-0 hidden sm:inline">•</span>
          <span className="items-center gap-1 text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md font-black border border-emerald-200/70 shrink-0 hidden sm:inline-flex">
            <Globe className="w-3 h-3 text-emerald-600" />
            <span>+{totalVisits} زيارة</span>
          </span>
        </div>

        {/* الجانب الأيسر: مؤشر التوسيع الصغير في نفس السطر */}
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-slate-500 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 shrink-0 transition">
          <span>{isOpen ? "طي" : "التفاصيل"}</span>
          {isOpen ? (
            <ChevronUp className="w-3 h-3 text-emerald-600" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-500" />
          )}
        </div>
      </div>

      {/* المحتوى التفصيلي يظهر فقط عند الضغط على الشريط */}
      {isOpen && (
        <div className="p-3 pt-2.5 border-t border-slate-100 bg-slate-50/50 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-0.5">
            <span className="flex items-center gap-1 text-emerald-800 font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>إحصائيات تفاعل حقيقية ومحدثة لحظياً للمنصة</span>
            </span>
            {todayVisits !== undefined && todayVisits > 0 && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                اليوم: {todayVisits} زيارة
              </span>
            )}
          </div>

          {/* شبكة البطاقات الأربع */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. مشاهدات الدروس */}
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-purple-100 shadow-2xs text-right">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span className="font-bold text-slate-700">مشاهدات الدروس</span>
                <Eye className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-base sm:text-lg font-black text-purple-950">
                +{totalViews}
              </div>
              <div className="text-[10px] text-purple-700/80 font-medium mt-0.5 truncate">
                مراجعات الدروس والواجبات
              </div>
            </div>

            {/* 2. أجهزة فريدة */}
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-cyan-100 shadow-2xs text-right">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span className="font-bold text-slate-700">أجهزة فريدة 📱</span>
                <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
              </div>
              <div className="text-base sm:text-lg font-black text-cyan-950">
                {uniqueDevices} جهاز
              </div>
              <div className="text-[10px] text-cyan-700/80 font-medium mt-0.5 truncate">
                تلاميذ وزوار فريدون
              </div>
            </div>

            {/* 3. إجمالي زيارات الموقع */}
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-emerald-100 shadow-2xs text-right">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span className="font-bold text-slate-700">زيارات الموقع 🌐</span>
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-950">
                +{totalVisits}
              </div>
              <div className="text-[10px] text-emerald-700/80 font-medium mt-0.5 truncate">
                المجموع التراكمي للتصفح
              </div>
            </div>

            {/* 4. الموارد والدروس */}
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-amber-100 shadow-2xs text-right">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span className="font-bold text-slate-700">الموارد المنشورة</span>
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-base sm:text-lg font-black text-amber-950">
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
