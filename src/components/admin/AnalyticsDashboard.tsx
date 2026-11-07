"use client";

import { useState, useMemo } from "react";
import {
  Globe,
  Clock,
  Eye,
  Smartphone,
  Laptop,
  Tablet,
  Users,
  UserCheck,
  RefreshCw,
  Trophy,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Layers,
  Flame,
  ChevronRight,
  Info,
} from "lucide-react";
import type { AnalyticsEventLog, KnownDeviceSummary } from "@/lib/types";

export interface AnalyticsApiResponse {
  siteAnalytics: {
    totalVisits: number;
    todayVisits: number;
    todayViews: number;
    totalViews: number;
    lastVisit: string;
    uniqueDevicesCount: number;
  };
  charts: {
    todayHourly: {
      hour: number;
      label: string;
      shortLabel: string;
      visits: number;
      views: number;
      uniqueDevices: number;
      isCurrent: boolean;
      isPast: boolean;
    }[];
    last7Days: {
      date: string;
      dayName: string;
      displayDate: string;
      fullDateLabel: string;
      visits: number;
      views: number;
      uniqueDevices: number;
      newVisitors: number;
      returningVisitors: number;
      isToday: boolean;
    }[];
    last30Days: {
      date: string;
      dayName: string;
      displayDate: string;
      visits: number;
      views: number;
      uniqueDevices: number;
    }[];
    peakHour: {
      hour: number;
      label: string;
      visitsAndViews: number;
    };
  };
  platforms: {
    deviceTypes: { mobile: number; desktop: number; tablet: number };
    os: Record<string, number>;
    browsers: Record<string, number>;
  };
  retention: {
    totalUniqueDevices: number;
    returningDevicesCount: number;
    newDevicesCount: number;
    repeatRate: number;
    topDevices: KnownDeviceSummary[];
  };
  totalLessonViews: number;
  totalLessonsCount: number;
  topLessons: {
    id: string;
    title: string;
    level: number;
    type: string;
    views: number;
  }[];
  recentEvents: AnalyticsEventLog[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsApiResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

type TimeFilter = "today_hours" | "last_7_days" | "last_30_days" | "platforms";
type MetricFilter = "both" | "visits" | "views" | "devices";

export default function AnalyticsDashboard({
  data,
  loading,
  onRefresh,
}: AnalyticsDashboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today_hours");
  const [metricFilter, setMetricFilter] = useState<MetricFilter>("both");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<"all" | "lessons" | "returning" | "new">("all");
  const [showAllLogs, setShowAllLogs] = useState(false);

  // حساب أقصى قيمة للأعمدة لضبط مقياس الارتفاع
  const currentChartData = useMemo(() => {
    if (!data) return [];
    if (timeFilter === "today_hours") {
      return data.charts.todayHourly.map((h) => ({
        key: h.label,
        label: h.label,
        subLabel: h.isCurrent ? "الآن" : "",
        visits: h.visits,
        views: h.views,
        devices: h.uniqueDevices,
        total: h.visits + h.views,
        isHighlight: h.isCurrent,
        raw: h,
      }));
    }
    if (timeFilter === "last_7_days") {
      return data.charts.last7Days.map((d) => ({
        key: d.date,
        label: d.dayName,
        subLabel: d.displayDate,
        visits: d.visits,
        views: d.views,
        devices: d.uniqueDevices,
        total: d.visits + d.views,
        isHighlight: d.isToday,
        raw: d,
      }));
    }
    if (timeFilter === "last_30_days") {
      return data.charts.last30Days.map((d) => ({
        key: d.date,
        label: d.displayDate,
        subLabel: d.dayName,
        visits: d.visits,
        views: d.views,
        devices: d.uniqueDevices,
        total: d.visits + d.views,
        isHighlight: false,
        raw: d,
      }));
    }
    return [];
  }, [data, timeFilter]);

  const maxVal = useMemo(() => {
    if (currentChartData.length === 0) return 10;
    let highest = 0;
    for (const item of currentChartData) {
      if (metricFilter === "visits") highest = Math.max(highest, item.visits);
      else if (metricFilter === "views") highest = Math.max(highest, item.views);
      else if (metricFilter === "devices") highest = Math.max(highest, item.devices);
      else highest = Math.max(highest, item.visits, item.views, item.total);
    }
    return Math.max(highest, 5); // حد أدنى 5 لتناسق الرسم
  }, [currentChartData, metricFilter]);

  // تصفية سجل الأحداث المباشر
  const filteredEvents = useMemo(() => {
    if (!data?.recentEvents) return [];
    return data.recentEvents.filter((evt) => {
      // فلتر النوع
      if (logFilter === "lessons" && evt.type !== "lesson_view") return false;
      if (logFilter === "returning" && evt.isNewVisitor) return false;
      if (logFilter === "new" && !evt.isNewVisitor) return false;

      // فلتر البحث
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase().trim();
        const inDev = evt.shortDeviceId?.toLowerCase().includes(q);
        const inLesson = evt.lessonTitle?.toLowerCase().includes(q);
        const inOs = evt.os?.toLowerCase().includes(q);
        const inBrowser = evt.browser?.toLowerCase().includes(q);
        const inPath = evt.path?.toLowerCase().includes(q);
        if (!inDev && !inLesson && !inOs && !inBrowser && !inPath) return false;
      }
      return true;
    });
  }, [data?.recentEvents, logFilter, logSearch]);

  const displayedEvents = showAllLogs ? filteredEvents : filteredEvents.slice(0, 15);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHour / 24);

      if (diffSec < 45) return "الآن";
      if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
      if (diffHour < 24) return `منذ ${diffHour} ساعة`;
      return `منذ ${diffDays} يوم`;
    } catch {
      return "";
    }
  };

  const getDeviceIcon = (devType: string) => {
    if (devType === "mobile") return <Smartphone className="w-3.5 h-3.5 text-blue-600" />;
    if (devType === "tablet") return <Tablet className="w-3.5 h-3.5 text-indigo-600" />;
    return <Laptop className="w-3.5 h-3.5 text-slate-700" />;
  };

  const peakHourInfo = data?.charts?.peakHour;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-5">
      {/* ================= 1. شريط العنوان والتحكم الرئيسي ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                لوحة إحصائيات تفاعل التلاميذ والزوار والمشاهدات
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                مباشر
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              أعمدة بيانية مفصلة بالساعات والأيام، مع مراقبة دقيقة للأجهزة وهوية الزوار
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-slate-700 hover:text-emerald-700 flex items-center gap-1.5 font-bold bg-slate-50 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 transition shadow-2xs"
          title="تحديث البيانات فوراً"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span>تحديث الأرقام</span>
        </button>
      </div>

      {/* ================= 2. بطاقات المؤشرات الأساسية (KPIs) ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* إجمالي زيارات الموقع */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-3 rounded-xl border border-emerald-100/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">زيارات الموقع</span>
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950">
            {data?.siteAnalytics?.totalVisits ?? 0}
            <span className="text-[10px] font-normal text-slate-500 mr-1">زيارة</span>
          </div>
          <div className="text-[10px] text-emerald-700/80 font-medium mt-0.5 truncate">
            المجموع التراكمي
          </div>
        </div>

        {/* زيارات اليوم */}
        <div className="bg-gradient-to-br from-blue-50/50 to-sky-50/30 p-3 rounded-xl border border-blue-100/90">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">زيارات اليوم 📅</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-950">
            {data?.siteAnalytics?.todayVisits ?? 0}
            <span className="text-[10px] font-normal text-slate-500 mr-1">زيارة</span>
          </div>
          <div className="text-[10px] text-blue-700/80 font-medium mt-0.5 truncate">
            منذ منتصف الليل
          </div>
        </div>

        {/* إجمالي مشاهدات الدروس */}
        <div className="bg-gradient-to-br from-purple-50/50 to-fuchsia-50/30 p-3 rounded-xl border border-purple-100/90">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">مشاهدات الدروس</span>
            <Eye className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950">
            {data?.totalLessonViews ?? 0}
            <span className="text-[10px] font-normal text-slate-500 mr-1">مشاهدة</span>
          </div>
          <div className="text-[10px] text-purple-700/80 font-medium mt-0.5 truncate">
            {data?.totalLessonsCount ?? 0} درس منشور
          </div>
        </div>

        {/* الأجهزة الفريدة (أجهزة مختلفة) */}
        <div className="bg-gradient-to-br from-cyan-50/50 to-teal-50/30 p-3 rounded-xl border border-cyan-100/90">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">أجهزة مختلفة 📱</span>
            <Users className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-950">
            {data?.retention?.totalUniqueDevices ?? 0}
            <span className="text-[10px] font-normal text-slate-500 mr-1">جهاز</span>
          </div>
          <div className="text-[10px] text-cyan-700/80 font-medium mt-0.5 truncate">
            زوار وتلاميذ فريدين
          </div>
        </div>

        {/* نفس الجهاز (زيارات متكررة) */}
        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-3 rounded-xl border border-amber-100/90">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">نفس الجهاز 🔁</span>
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950">
            {data?.retention?.returningDevicesCount ?? 0}
            <span className="text-[10px] font-normal text-slate-500 mr-1">مكرر</span>
          </div>
          <div className="text-[10px] text-amber-700/80 font-medium mt-0.5 truncate">
            يعودون للمراجعة
          </div>
        </div>

        {/* نسبة الولاء والتكرار */}
        <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/30 p-3 rounded-xl border border-rose-100/90">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">معدل التكرار 📈</span>
            <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-950">
            {data?.retention?.repeatRate ?? 0}%
          </div>
          <div className="text-[10px] text-rose-700/80 font-medium mt-0.5 truncate">
            نسبة نفس التلاميذ
          </div>
        </div>
      </div>

      {/* ================= 3. قسم الأعمدة البيانية التفاعلية ================= */}
      <div className="border border-slate-200/90 rounded-2xl p-4 bg-gradient-to-b from-slate-50/50 to-white space-y-4">
        {/* أزرار الفلترة بالساعات / بالأيام / بالأشهر */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          {/* فلتر الفترات الزمنية */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setTimeFilter("today_hours")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                timeFilter === "today_hours"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>اليوم بالساعات (24h)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter("last_7_days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                timeFilter === "last_7_days"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>آخر 7 أيام (أسبوعياً)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter("last_30_days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                timeFilter === "last_30_days"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>آخر 30 يوماً</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter("platforms")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                timeFilter === "platforms"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span>الأجهزة والأنظمة</span>
            </button>
          </div>

          {/* فلتر المؤشر المعروض (الزيارات vs المشاهدات vs الأجهزة) */}
          {timeFilter !== "platforms" && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="text-[11px] text-slate-400 font-semibold ml-1">عرض:</span>
              <button
                type="button"
                onClick={() => setMetricFilter("both")}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                  metricFilter === "both"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                الكل (مقارنة)
              </button>
              <button
                type="button"
                onClick={() => setMetricFilter("visits")}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 ${
                  metricFilter === "visits"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                الزيارات
              </button>
              <button
                type="button"
                onClick={() => setMetricFilter("views")}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 ${
                  metricFilter === "views"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                مشاهدات الدروس
              </button>
              <button
                type="button"
                onClick={() => setMetricFilter("devices")}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 ${
                  metricFilter === "devices"
                    ? "bg-cyan-600 text-white"
                    : "bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                الأجهزة
              </button>
            </div>
          )}
        </div>

        {/* عرض الأعمدة البيانية (Column Chart) */}
        {timeFilter !== "platforms" ? (
          <div className="space-y-3">
            {/* دليل الألوان ومعلومات الذروة */}
            <div className="flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                  <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                  <span>زيارات الموقع</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                  <span className="w-3 h-3 rounded-md bg-purple-500"></span>
                  <span>مشاهدات الدروس</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                  <span className="w-3 h-3 rounded-md bg-cyan-500"></span>
                  <span>أجهزة فريدة</span>
                </div>
              </div>

              {peakHourInfo && (
                <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    ساعة الذروة المسجلة: {peakHourInfo.label} ({peakHourInfo.visitsAndViews} حركة)
                  </span>
                </div>
              )}
            </div>

            {/* الحاوية الرسومية للأعمدة */}
            <div className="relative pt-6 pb-2 px-1 bg-white border border-slate-100 rounded-xl overflow-x-auto">
              <div
                className="flex items-end gap-1.5 sm:gap-2 h-44 sm:h-52 min-w-[580px] pb-6 px-2 relative"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* خطوط الشبكة المساعدة (Grid Lines) */}
                <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-200/60 pointer-events-none flex justify-between text-[9px] text-slate-400 px-2">
                  <span>{maxVal}</span>
                </div>
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200/60 pointer-events-none flex justify-between text-[9px] text-slate-400 px-2">
                  <span>{Math.round(maxVal / 2)}</span>
                </div>

                {/* رسم الأعمدة */}
                {currentChartData.map((item, idx) => {
                  const visitHeightPct = Math.min(100, Math.max(0, (item.visits / maxVal) * 100));
                  const viewHeightPct = Math.min(100, Math.max(0, (item.views / maxVal) * 100));
                  const devHeightPct = Math.min(100, Math.max(0, (item.devices / maxVal) * 100));
                  const isHovered = hoveredIndex === idx;

                  return (
                    <div
                      key={item.key}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onClick={() => setHoveredIndex(idx)}
                      className={`flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group transition-all duration-200 ${
                        item.isHighlight ? "bg-emerald-50/40 rounded-t-lg" : ""
                      }`}
                    >
                      {/* Tooltip تفصيلي عند التحويم فوق العمود */}
                      {isHovered && (
                        <div className="absolute -top-24 z-30 bg-slate-900 text-white rounded-xl p-2.5 shadow-xl text-[11px] whitespace-nowrap min-w-[140px] pointer-events-none border border-slate-700 animate-in fade-in zoom-in-95">
                          <div className="font-black text-amber-400 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.subLabel && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                {item.subLabel}
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between gap-3 text-emerald-400">
                              <span>زيارات الموقع:</span>
                              <span className="font-black">{item.visits}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-purple-400">
                              <span>مشاهدات الدروس:</span>
                              <span className="font-black">{item.views}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-cyan-400">
                              <span>أجهزة فريدة:</span>
                              <span className="font-black">{item.devices}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* قيمة العمود في الأعلى إذا كانت نشطة */}
                      {(item.visits > 0 || item.views > 0) && (
                        <span className="text-[9px] font-black text-slate-700 mb-1 group-hover:scale-110 transition">
                          {metricFilter === "visits"
                            ? item.visits
                            : metricFilter === "views"
                            ? item.views
                            : metricFilter === "devices"
                            ? item.devices
                            : item.visits + item.views}
                        </span>
                      )}

                      {/* قضبان الأعمدة (Bars) */}
                      <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 max-w-[28px] h-full">
                        {/* عمود الزيارات */}
                        {(metricFilter === "both" || metricFilter === "visits") && (
                          <div
                            style={{ height: `${Math.max(visitHeightPct, item.visits > 0 ? 6 : 2)}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              item.visits > 0
                                ? "bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-700 group-hover:to-emerald-300 shadow-xs"
                                : "bg-slate-100"
                            }`}
                          />
                        )}

                        {/* عمود مشاهدات الدروس */}
                        {(metricFilter === "both" || metricFilter === "views") && (
                          <div
                            style={{ height: `${Math.max(viewHeightPct, item.views > 0 ? 6 : 2)}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              item.views > 0
                                ? "bg-gradient-to-t from-purple-600 to-purple-400 group-hover:from-purple-700 group-hover:to-purple-300 shadow-xs"
                                : "bg-slate-100"
                            }`}
                          />
                        )}

                        {/* عمود الأجهزة إذا كان منفرداً */}
                        {metricFilter === "devices" && (
                          <div
                            style={{ height: `${Math.max(devHeightPct, item.devices > 0 ? 6 : 2)}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              item.devices > 0
                                ? "bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-700 group-hover:to-cyan-300 shadow-xs"
                                : "bg-slate-100"
                            }`}
                          />
                        )}
                      </div>

                      {/* عنوان أسفل العمود (الوقت / اليوم) */}
                      <div className="absolute bottom-0 text-[10px] font-bold text-slate-500 truncate max-w-[36px] text-center">
                        <span className={item.isHighlight ? "text-emerald-700 font-black" : ""}>
                          {item.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ================= عرض توزيع المنصات والأجهزة ================= */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* 1. أنواع الأجهزة */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  نوع الجهاز
                </span>
                <span className="text-[10px] text-slate-400">هواتف vs حواسيب</span>
              </div>

              {(() => {
                const devs = data?.platforms?.deviceTypes || { mobile: 0, desktop: 0, tablet: 0 };
                const total = Math.max(1, devs.mobile + devs.desktop + devs.tablet);
                const mobPct = Math.round((devs.mobile / total) * 100);
                const deskPct = Math.round((devs.desktop / total) * 100);
                const tabPct = Math.round((devs.tablet / total) * 100);

                return (
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="flex items-center gap-1 text-slate-700">
                          📱 هواتف ذكية (Mobile)
                        </span>
                        <span className="text-emerald-700 font-black">{mobPct}% ({devs.mobile})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${mobPct}%` }}
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="flex items-center gap-1 text-slate-700">
                          💻 حواسيب (Desktop)
                        </span>
                        <span className="text-blue-700 font-black">{deskPct}% ({devs.desktop})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${deskPct}%` }}
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="flex items-center gap-1 text-slate-700">
                          📱 أجهزة لوحية (Tablets)
                        </span>
                        <span className="text-indigo-700 font-black">{tabPct}% ({devs.tablet})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${tabPct}%` }}
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 2. أنظمة التشغيل */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  أنظمة التشغيل (OS)
                </span>
                <span className="text-[10px] text-slate-400">Android, Windows, iOS</span>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(data?.platforms?.os || { Android: 1 }).map(([osName, count]) => {
                  const total = Math.max(
                    1,
                    Object.values(data?.platforms?.os || {}).reduce((a, b) => a + b, 0)
                  );
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={osName}>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-700">
                          {osName === "Android" ? "🤖 Android" : osName === "iOS" ? "🍏 iOS" : osName === "Windows" ? "🪟 Windows" : osName}
                        </span>
                        <span className="text-slate-900 font-black">{pct}% ({count})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. المتصفحات */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-purple-600" />
                  المتصفحات (Browsers)
                </span>
                <span className="text-[10px] text-slate-400">Chrome, Safari, Edge</span>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(data?.platforms?.browsers || { Chrome: 1 }).map(([browserName, count]) => {
                  const total = Math.max(
                    1,
                    Object.values(data?.platforms?.browsers || {}).reduce((a, b) => a + b, 0)
                  );
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={browserName}>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-700">🌐 {browserName}</span>
                        <span className="text-purple-700 font-black">{pct}% ({count})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. بطاقة: "هل نفس الشخص نفس الجهاز أو أجهزة مختلفة؟" ================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-black">
              🔍
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-300">
                تحليل هوية الزوار: هل نفس الشخص نفس الجهاز أم أجهزة مختلفة؟
              </h4>
              <p className="text-[11px] text-slate-300">
                تتبع دقيق عبر معرّف الجهاز الثابت (Device Fingerprint) لمعرفة وتيرة مراجعة التلاميذ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              {data?.retention?.returningDevicesCount ?? 0} جهاز متكرر مواظب 🔁
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
              {data?.retention?.newDevicesCount ?? 0} جهاز جديد لأول مرة ✨
            </span>
          </div>
        </div>

        {/* عرض أكثر الأجهزة متابعة للدروس ومراجعة */}
        <div>
          <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>الأجهزة الأكثر متابعة وتكراراً لزيارة الموقع وحل الدروس:</span>
          </div>

          {data?.retention?.topDevices && data.retention.topDevices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.retention.topDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-amber-300 bg-slate-900/90 px-2 py-0.5 rounded text-[11px] border border-amber-400/20">
                      {dev.shortId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      آخر ظهور: {formatRelativeTime(dev.lastSeen)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1">
                      {dev.deviceType === "mobile" ? "📱 هاتف" : "💻 حاسوب"} • {dev.os} • {dev.browser}
                    </span>
                    <span className="font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                      {dev.totalVisits} زيارة / {dev.totalViews} مشاهدة
                    </span>
                  </div>

                  {dev.lastLessonTitle && (
                    <div className="text-[10px] text-slate-400 truncate bg-slate-900/40 p-1 rounded">
                      آخر درس تصفحه: <span className="text-slate-200 font-bold">{dev.lastLessonTitle}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-3 text-center bg-slate-800/40 rounded-xl">
              يتم جمع بيانات الأجهزة تلقائياً عند أول زيارة للتلاميذ...
            </div>
          )}
        </div>
      </div>

      {/* ================= 5. أكثر الدروس مشاهدة من طرف التلاميذ ================= */}
      {data?.topLessons && data.topLessons.length > 0 && (
        <div className="pt-1">
          <div className="text-xs font-black text-slate-800 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              الدروس والمحاور الأكثر مشاهدة من طرف التلاميذ:
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              مرتبة حسب عدد المشاهدات
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.topLessons.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs hover:border-emerald-300 transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                      i === 0
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : i === 1
                        ? "bg-slate-200 text-slate-800"
                        : i === 2
                        ? "bg-orange-100 text-orange-900"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 truncate block text-[11px]" title={item.title}>
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      السنة {item.level} متوسط
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200">
                  {item.views} 👁️
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 6. سجل الزيارات والنشاط المباشر واللحظي (Live Activity Stream) ================= */}
      <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              سجل الزيارات والنشاط المباشر واللحظي (راقب كل حركة بالتفصيل)
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {filteredEvents.length} حدث
            </span>
          </div>

          {/* فلاتر السجل */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setLogFilter("all")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                logFilter === "all"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setLogFilter("lessons")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                logFilter === "lessons"
                  ? "bg-purple-700 text-white"
                  : "bg-white text-purple-700 border border-purple-200 hover:bg-purple-50"
              }`}
            >
              مشاهدات الدروس فقط 👁️
            </button>
            <button
              type="button"
              onClick={() => setLogFilter("returning")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                logFilter === "returning"
                  ? "bg-amber-600 text-white"
                  : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
              }`}
            >
              نفس الجهاز 🔁
            </button>
            <button
              type="button"
              onClick={() => setLogFilter("new")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                logFilter === "new"
                  ? "bg-cyan-700 text-white"
                  : "bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-50"
              }`}
            >
              أجهزة جديدة ✨
            </button>
          </div>
        </div>

        {/* حقل البحث السريع في السجل */}
        <div className="relative">
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="ابحث برمز الجهاز (DEV-xxxx)، عنوان الدرس، نظام التشغيل، أو المتصفح..."
            className="w-full bg-white text-xs rounded-xl px-3 py-2 pr-9 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          {logSearch && (
            <button
              type="button"
              onClick={() => setLogSearch("")}
              className="absolute left-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              إلغاء
            </button>
          )}
        </div>

        {/* قائمة الأحداث */}
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
          {displayedEvents.length > 0 ? (
            displayedEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 text-xs hover:border-emerald-300 transition"
              >
                {/* 1. التوقيت ونوع الحدث */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      evt.type === "lesson_view"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {evt.type === "lesson_view" ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {evt.type === "lesson_view" ? (
                        <span>
                          مشاهدة درس:{" "}
                          <strong className="text-purple-900 font-black">
                            {evt.lessonTitle || "درس رياضيات"}
                          </strong>
                          {evt.level && (
                            <span className="text-[10px] text-slate-500 mr-1.5 font-normal">
                              ({evt.level} متوسط)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>
                          زيارة الموقع:{" "}
                          <span className="font-mono text-slate-600 text-[11px]">
                            {evt.path || "/"}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString("ar-DZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}{" "}
                      • {formatRelativeTime(evt.timestamp)}
                    </div>
                  </div>
                </div>

                {/* 2. هوية الجهاز: هل نفس الجهاز أم جديد؟ */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* شارة التكرار */}
                  {evt.isNewVisitor ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200">
                      ✨ جهاز جديد
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      🔁 نفس الجهاز (#{evt.visitIndex || 2})
                    </span>
                  )}

                  {/* مواصفات العتاد */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    {getDeviceIcon(evt.deviceType)}
                    <span className="font-medium">{evt.os}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{evt.browser}</span>
                    {evt.screen && (
                      <>
                        <span className="text-slate-300 hidden md:inline">•</span>
                        <span className="text-[10px] text-slate-400 hidden md:inline font-mono">
                          {evt.screen}
                        </span>
                      </>
                    )}
                  </div>

                  {/* كود الجهاز الثابت */}
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                    {evt.shortDeviceId}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-xl border border-slate-200/80">
              لا توجد أحداث مسجلة تطابق شروط الفلتر الحالية
            </div>
          )}
        </div>

        {/* زر إظهار المزيد */}
        {filteredEvents.length > 15 && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setShowAllLogs(!showAllLogs)}
              className="text-xs text-slate-600 hover:text-emerald-700 font-bold bg-white hover:bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-200 transition shadow-2xs"
            >
              {showAllLogs
                ? "طي السجل وعرض أحدث 15 حدث فقط"
                : `عرض بقية السجل (${filteredEvents.length - 15} حدث إضافي)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
