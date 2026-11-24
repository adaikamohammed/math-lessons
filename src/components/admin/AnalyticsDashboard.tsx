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
  LineChart,
  AreaChart,
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
  periodSummaries?: {
    today: {
      visits: number;
      views: number;
      uniqueDevices: number;
      returningDevices: number;
      repeatRate: number;
      peak: string;
    };
    week: {
      visits: number;
      views: number;
      uniqueDevices: number;
      returningDevices: number;
      repeatRate: number;
      peak: string;
    };
    month: {
      visits: number;
      views: number;
      uniqueDevices: number;
      returningDevices: number;
      repeatRate: number;
      peak: string;
    };
    all: {
      visits: number;
      views: number;
      uniqueDevices: number;
      returningDevices: number;
      repeatRate: number;
      peak: string;
    };
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

type TimeFilter = "today_hours" | "last_7_days" | "last_30_days" | "all_time" | "platforms";
type MetricFilter = "both" | "visits" | "views" | "devices";

// خوارزمية رسم المنحنيات البيانية الانسيابية (Clamped Catmull-Rom Cubic Spline)
function buildSmoothSpline(
  points: { x: number; y: number }[],
  baseY: number,
  topY: number
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    let cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;
    let cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    // تثبيت القاعدة لمنع الانحناء تحت خط الصفر في المناطق الصامتة
    if (Math.abs(p1.y - baseY) < 0.8 && Math.abs(p2.y - baseY) < 0.8) {
      cp1y = baseY;
      cp2y = baseY;
    } else {
      cp1y = Math.min(baseY, Math.max(topY, cp1y));
      cp2y = Math.min(baseY, Math.max(topY, cp2y));
    }

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

function buildAreaSpline(
  points: { x: number; y: number }[],
  baseY: number,
  topY: number
): string {
  if (points.length === 0) return "";
  const linePath = buildSmoothSpline(points, baseY, topY);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(1)} ${baseY.toFixed(1)} L ${first.x.toFixed(1)} ${baseY.toFixed(1)} Z`;
}

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

  // إحصائيات المؤشرات الرقمية متجاوبة ديناميكياً مع الفلتر الزمني المختار (اليوم / الأسبوع / الشهر / الكل)
  const activePeriodStats = useMemo(() => {
    if (!data) {
      return {
        label: "الكل",
        suffix: "التراكمي",
        visits: 0,
        views: 0,
        uniqueDevices: 0,
        returningDevices: 0,
        repeatRate: 0,
        peak: "-",
        visitsSub: "المجموع التراكمي",
        viewsSub: "كل الدروس",
        devicesSub: "أجهزة فريدة",
        returningSub: "زيارات مكررة",
        peakLabel: "ساعة الذروة",
      };
    }

    const summaries = data.periodSummaries;

    if (timeFilter === "today_hours") {
      const today = summaries?.today;
      const v = today?.visits ?? data.siteAnalytics?.todayVisits ?? 0;
      const w = today?.views ?? data.siteAnalytics?.todayViews ?? 0;
      const u = today?.uniqueDevices ?? Math.min(v || 1, data.retention?.totalUniqueDevices || 1);
      const r = today?.returningDevices ?? 0;
      const rep = today?.repeatRate ?? 0;
      const pk = today?.peak ?? (data.charts?.peakHour?.label || "-");
      return {
        label: "اليوم بالساعات (24h)",
        suffix: "اليوم",
        visits: v,
        views: w,
        uniqueDevices: u,
        returningDevices: r,
        repeatRate: rep,
        peak: pk,
        visitsSub: "منذ منتصف الليل (24h)",
        viewsSub: "مشاهدات دروس اليوم",
        devicesSub: "أجهزة تصفحت اليوم",
        returningSub: "عادوا للمراجعة اليوم",
        peakLabel: "ساعة ذروة اليوم",
      };
    }

    if (timeFilter === "last_7_days") {
      const week = summaries?.week;
      const v = week?.visits ?? 0;
      const w = week?.views ?? 0;
      const u = week?.uniqueDevices ?? 0;
      const r = week?.returningDevices ?? 0;
      const rep = week?.repeatRate ?? data.retention?.repeatRate ?? 0;
      const pk = week?.peak ?? "-";
      return {
        label: "آخر 7 أيام (أسبوعياً)",
        suffix: "الأسبوع",
        visits: v,
        views: w,
        uniqueDevices: u,
        returningDevices: r,
        repeatRate: rep,
        peak: pk,
        visitsSub: "خلال آخر 7 أيام",
        viewsSub: "مشاهدات الأسبوع الحالي",
        devicesSub: "أجهزة الأسبوع",
        returningSub: "تلاميذ مكررون",
        peakLabel: "أنشط يوم أسبوعياً",
      };
    }

    if (timeFilter === "last_30_days") {
      const month = summaries?.month;
      const v = month?.visits ?? 0;
      const w = month?.views ?? 0;
      const u = month?.uniqueDevices ?? 0;
      const r = month?.returningDevices ?? 0;
      const rep = month?.repeatRate ?? data.retention?.repeatRate ?? 0;
      const pk = month?.peak ?? "-";
      return {
        label: "آخر 30 يوماً (شهرياً)",
        suffix: "الشهر",
        visits: v,
        views: w,
        uniqueDevices: u,
        returningDevices: r,
        repeatRate: rep,
        peak: pk,
        visitsSub: "خلال آخر 30 يوماً",
        viewsSub: "مشاهدات الشهر الحالي",
        devicesSub: "أجهزة الشهر",
        returningSub: "تلاميذ أوفياء",
        peakLabel: "أنشط يوم شهرياً",
      };
    }

    // "all_time" or "platforms"
    const all = summaries?.all;
    const v = all?.visits ?? data.siteAnalytics?.totalVisits ?? 0;
    const w = all?.views ?? data.totalLessonViews ?? 0;
    const u = all?.uniqueDevices ?? data.retention?.totalUniqueDevices ?? 0;
    const r = all?.returningDevices ?? data.retention?.returningDevicesCount ?? 0;
    const rep = all?.repeatRate ?? data.retention?.repeatRate ?? 0;
    const pk = all?.peak ?? (data.charts?.peakHour?.label || "-");
    return {
      label: timeFilter === "platforms" ? "الأجهزة والأنظمة" : "المجموع التراكمي (الكل)",
      suffix: "التراكمي",
      visits: v,
      views: w,
      uniqueDevices: u,
      returningDevices: r,
      repeatRate: rep,
      peak: pk,
      visitsSub: "المجموع الكلي التراكمي",
      viewsSub: `${data.totalLessonsCount ?? 0} درس منشور`,
      devicesSub: "إجمالي الأجهزة المسجلة",
      returningSub: "يعودون للمراجعة دائماً",
      peakLabel: "ساعة الذروة الكبرى",
    };
  }, [data, timeFilter]);

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
    if (timeFilter === "last_30_days" || timeFilter === "all_time") {
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
      else highest = Math.max(highest, item.visits, item.views, item.devices);
    }
    const base = Math.max(highest, 4);
    if (base <= 5) return 5;
    if (base <= 10) return 10;
    if (base <= 20) return 20;
    if (base <= 50) return Math.ceil(base / 5) * 5;
    return Math.ceil(base / 10) * 10;
  }, [currentChartData, metricFilter]);

  // حساب إحداثيات النقاط للرسم البياني المنحني (SVG Spline Coordinates)
  const chartPoints = useMemo(() => {
    const N = currentChartData.length;
    if (N === 0) {
      return {
        visitsPoints: [],
        viewsPoints: [],
        devicesPoints: [],
        allCoords: [],
        baseY: 270,
        topY: 30,
        paddingLeft: 55,
        paddingRight: 40,
        innerWidth: 905,
        innerHeight: 240,
      };
    }

    const paddingLeft = 55;
    const paddingRight = 40;
    const paddingTop = 30;
    const innerWidth = 1000 - paddingLeft - paddingRight; // 905
    const innerHeight = 240;
    const baseY = paddingTop + innerHeight; // 270
    const topY = paddingTop; // 30

    const visitsPoints: { x: number; y: number }[] = [];
    const viewsPoints: { x: number; y: number }[] = [];
    const devicesPoints: { x: number; y: number }[] = [];
    const allCoords: {
      x: number;
      yVisits: number;
      yViews: number;
      yDevices: number;
      item: (typeof currentChartData)[0];
      index: number;
    }[] = [];

    for (let i = 0; i < N; i++) {
      const item = currentChartData[i];
      const x = paddingLeft + (N > 1 ? (i / (N - 1)) * innerWidth : innerWidth / 2);
      const vRatio = Math.min(1, Math.max(0, item.visits / maxVal));
      const wRatio = Math.min(1, Math.max(0, item.views / maxVal));
      const dRatio = Math.min(1, Math.max(0, item.devices / maxVal));

      const yVisits = baseY - vRatio * innerHeight;
      const yViews = baseY - wRatio * innerHeight;
      const yDevices = baseY - dRatio * innerHeight;

      visitsPoints.push({ x, y: yVisits });
      viewsPoints.push({ x, y: yViews });
      devicesPoints.push({ x, y: yDevices });

      allCoords.push({
        x,
        yVisits,
        yViews,
        yDevices,
        item,
        index: i,
      });
    }

    return {
      visitsPoints,
      viewsPoints,
      devicesPoints,
      allCoords,
      baseY,
      topY,
      paddingLeft,
      paddingRight,
      innerWidth,
      innerHeight,
    };
  }, [currentChartData, maxVal]);

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

      {/* ================= 2. شريط فلترة المؤشرات بالأزمنة (اليوم / الأسبوع / الشهر / الكل) ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 ml-1">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>تصفية الإحصائيات:</span>
          </span>

          <div className="flex flex-wrap items-center bg-white p-1 rounded-xl gap-1 border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeFilter("today_hours")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                timeFilter === "today_hours"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>اليوم بالساعات (24h)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter("last_7_days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                timeFilter === "last_7_days"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>آخر 7 أيام (أسبوعياً)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter("last_30_days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                timeFilter === "last_30_days"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>آخر 30 يوماً (شهرياً)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter("all_time")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                timeFilter === "all_time"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>المجموع التراكمي (الكل)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter("platforms")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                timeFilter === "platforms"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>الأجهزة والأنظمة</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
          عرض أرقام: <span className="text-emerald-800 font-black">{activePeriodStats.label}</span>
        </div>
      </div>

      {/* ================= 3. بطاقات المؤشرات الأساسية (KPIs) متجاوبة مع الفلتر ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* إجمالي زيارات الموقع */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-3 rounded-xl border border-emerald-100/90 relative overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">زيارات {activePeriodStats.suffix}</span>
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950">
            {activePeriodStats.visits}
            <span className="text-[10px] font-normal text-slate-500 mr-1">زيارة</span>
          </div>
          <div className="text-[10px] text-emerald-700/80 font-medium mt-0.5 truncate">
            {activePeriodStats.visitsSub}
          </div>
        </div>

        {/* مشاهدات الدروس */}
        <div className="bg-gradient-to-br from-purple-50/50 to-fuchsia-50/30 p-3 rounded-xl border border-purple-100/90 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">مشاهدات {activePeriodStats.suffix}</span>
            <Eye className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950">
            {activePeriodStats.views}
            <span className="text-[10px] font-normal text-slate-500 mr-1">مشاهدة</span>
          </div>
          <div className="text-[10px] text-purple-700/80 font-medium mt-0.5 truncate">
            {activePeriodStats.viewsSub}
          </div>
        </div>

        {/* الأجهزة الفريدة (أجهزة مختلفة) */}
        <div className="bg-gradient-to-br from-cyan-50/50 to-teal-50/30 p-3 rounded-xl border border-cyan-100/90 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">أجهزة مختلفة 📱</span>
            <Users className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-950">
            {activePeriodStats.uniqueDevices}
            <span className="text-[10px] font-normal text-slate-500 mr-1">جهاز</span>
          </div>
          <div className="text-[10px] text-cyan-700/80 font-medium mt-0.5 truncate">
            {activePeriodStats.devicesSub}
          </div>
        </div>

        {/* نفس الجهاز (زيارات متكررة) */}
        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-3 rounded-xl border border-amber-100/90 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">نفس الجهاز 🔁</span>
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950">
            {activePeriodStats.returningDevices}
            <span className="text-[10px] font-normal text-slate-500 mr-1">مكرر</span>
          </div>
          <div className="text-[10px] text-amber-700/80 font-medium mt-0.5 truncate">
            {activePeriodStats.returningSub}
          </div>
        </div>

        {/* نسبة الولاء والتكرار */}
        <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/30 p-3 rounded-xl border border-rose-100/90 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600">معدل التكرار 📈</span>
            <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-950">
            {activePeriodStats.repeatRate}%
          </div>
          <div className="text-[10px] text-rose-700/80 font-medium mt-0.5 truncate">
            نسبة عودة نفس التلاميذ
          </div>
        </div>

        {/* ذروة التفاعل / أنشط نقطة */}
        <div className="bg-gradient-to-br from-indigo-50/50 to-violet-50/30 p-3 rounded-xl border border-indigo-100/90 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="font-bold text-slate-600 truncate">{activePeriodStats.peakLabel}</span>
            <Flame className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-950 truncate">
            {activePeriodStats.peak}
          </div>
          <div className="text-[10px] text-indigo-700/80 font-medium mt-0.5 truncate">
            أعلى نقطة تفاعل
          </div>
        </div>
      </div>

      {/* ================= 4. قسم المنحنى البياني التفاعلي (SVG Spline Area Chart) ================= */}
      <div className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-slate-50/50 to-white space-y-4 shadow-xs">
        {/* شريط التحكم والتنقل المباشر: أزرار الفترات الزمنية + أزرار اختيار المنحنيات */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          {/* عنوان المنحنى البياني مع مؤشر الأيقونة */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>
                  {timeFilter === "today_hours"
                    ? "المنحنى البياني لتفاعل اليوم بالساعات (24 ساعة)"
                    : timeFilter === "last_7_days"
                    ? "المنحنى البياني للتفاعل خلال آخر 7 أيام (أسبوعياً)"
                    : timeFilter === "last_30_days"
                    ? "المنحنى البياني للتفاعل خلال آخر 30 يوماً (شهرياً)"
                    : timeFilter === "all_time"
                    ? "نظرة منحنى النشاط التراكمي الشامل"
                    : "توزيع أنواع الأجهزة والأنظمة المتصلة"}
                </span>
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                انسيابية بيانية دقيقة لحركة الزوار، مشاهدات الدروس والأجهزة الفريدة
              </p>
            </div>
          </div>

          {/* أزرار التنقل السريع بين الفترات (اليوم / الأسبوع / الشهر / الأجهزة) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setTimeFilter("today_hours");
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                timeFilter === "today_hours"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>اليوم (24h)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeFilter("last_7_days");
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                timeFilter === "last_7_days"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>آخر 7 أيام</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeFilter("last_30_days");
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                timeFilter === "last_30_days"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>آخر 30 يوماً</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeFilter("platforms");
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                timeFilter === "platforms"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>الأجهزة</span>
            </button>
          </div>
        </div>

        {/* عرض المنحنى البياني التفاعلي (Spline Line Chart) */}
        {timeFilter !== "platforms" ? (
          <div className="space-y-3">
            {/* أزرار تحديد المنحنيات ومؤشر الذروة ودليل الألوان */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              {/* اختيار المنحنى المعروض */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="text-[11px] text-slate-400 font-semibold ml-1">المنحنيات:</span>
                <button
                  type="button"
                  onClick={() => setMetricFilter("both")}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    metricFilter === "both"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  الكل (مقارنة 3 خطوط)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricFilter("visits")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    metricFilter === "visits"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
                  <span>الزيارات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetricFilter("views")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    metricFilter === "views"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-white"></span>
                  <span>مشاهدات الدروس</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetricFilter("devices")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    metricFilter === "devices"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white"></span>
                  <span>الأجهزة الفريدة</span>
                </button>
              </div>

              {/* شارة ساعة أو يوم الذروة */}
              {peakHourInfo && (
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    ساعة الذروة المسجلة: {peakHourInfo.label} ({peakHourInfo.visitsAndViews} حركة)
                  </span>
                </div>
              )}
            </div>

            {/* شريط الفحص المباشر للنقطة النشطة (Active Point Live Inspector) */}
            {(() => {
              const activeIdx = hoveredIndex !== null ? hoveredIndex : chartPoints.allCoords.length > 0 ? (timeFilter === "today_hours" ? new Date().getHours() : chartPoints.allCoords.length - 1) : null;
              const activeCoord = activeIdx !== null ? chartPoints.allCoords[activeIdx] : null;
              if (!activeCoord) return null;
              const item = activeCoord.item;

              return (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:px-4 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs sm:text-sm font-black text-amber-300">
                      {item.label}
                    </span>
                    {item.subLabel && (
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({item.subLabel})
                      </span>
                    )}
                    {item.isHighlight && (
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {timeFilter === "today_hours" ? "الساعة الحالية 🔴" : "اليوم 🔴"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>زيارات الموقع:</span>
                      <span className="font-black text-white text-sm">{item.visits}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      <span>مشاهدات الدروس:</span>
                      <span className="font-black text-white text-sm">{item.views}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <span>الأجهزة الفريدة:</span>
                      <span className="font-black text-white text-sm">{item.devices}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* الحاوية الرسومية للمنحنى البياني (SVG Spline Area & Line) */}
            <div className="relative pt-2 pb-2 px-1 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[620px] sm:min-w-full">
                  <svg
                    viewBox="0 0 1000 320"
                    className="w-full h-56 sm:h-64 select-none"
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <defs>
                      {/* تدرج مساحة الزيارات */}
                      <linearGradient id="curve-grad-visits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                      </linearGradient>

                      {/* تدرج مساحة المشاهدات */}
                      <linearGradient id="curve-grad-views" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                        <stop offset="60%" stopColor="#a855f7" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.00" />
                      </linearGradient>

                      {/* تدرج مساحة الأجهزة */}
                      <linearGradient id="curve-grad-devices" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.30" />
                        <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.00" />
                      </linearGradient>

                      {/* تأثير الظل للنقاط النشطة */}
                      <filter id="glow-shadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
                      </filter>
                    </defs>

                    {/* خطوط الشبكة الأفقية والمقاييس الرقمية (Y-Axis Grid Lines) */}
                    {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
                      const y = chartPoints.baseY - ratio * chartPoints.innerHeight;
                      const val = Math.round(maxVal * ratio);
                      return (
                        <g key={`grid_${ratio}`}>
                          <line
                            x1={chartPoints.paddingLeft}
                            y1={y}
                            x2={1000 - chartPoints.paddingRight}
                            y2={y}
                            stroke={ratio === 0 ? "#cbd5e1" : "#f1f5f9"}
                            strokeWidth={ratio === 0 ? "1.5" : "1"}
                            strokeDasharray={ratio === 0 ? undefined : "4 4"}
                          />
                          <text
                            x={chartPoints.paddingLeft - 8}
                            y={y + 3.5}
                            textAnchor="end"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#94a3b8"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* تظليل المساحات تحت المنحنيات (Area Gradients) */}
                    {(metricFilter === "both" || metricFilter === "visits") && (
                      <path
                        d={buildAreaSpline(chartPoints.visitsPoints, chartPoints.baseY, chartPoints.topY)}
                        fill="url(#curve-grad-visits)"
                      />
                    )}

                    {(metricFilter === "both" || metricFilter === "views") && (
                      <path
                        d={buildAreaSpline(chartPoints.viewsPoints, chartPoints.baseY, chartPoints.topY)}
                        fill="url(#curve-grad-views)"
                      />
                    )}

                    {metricFilter === "devices" && (
                      <path
                        d={buildAreaSpline(chartPoints.devicesPoints, chartPoints.baseY, chartPoints.topY)}
                        fill="url(#curve-grad-devices)"
                      />
                    )}

                    {/* خطوط المنحنيات الانسيابية (Spline Stroke Lines) */}
                    {(metricFilter === "both" || metricFilter === "visits") && (
                      <path
                        d={buildSmoothSpline(chartPoints.visitsPoints, chartPoints.baseY, chartPoints.topY)}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {(metricFilter === "both" || metricFilter === "views") && (
                      <path
                        d={buildSmoothSpline(chartPoints.viewsPoints, chartPoints.baseY, chartPoints.topY)}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {(metricFilter === "both" || metricFilter === "devices") && (
                      <path
                        d={buildSmoothSpline(chartPoints.devicesPoints, chartPoints.baseY, chartPoints.topY)}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={metricFilter === "both" ? "4 3" : undefined}
                      />
                    )}

                    {/* نقاط البيانات على طول الخط إذا كانت القيم منفرجة ومحددة */}
                    {chartPoints.allCoords.map((pt) => {
                      const isHovered = hoveredIndex === pt.index;
                      return (
                        <g key={`dots_${pt.index}`}>
                          {(metricFilter === "both" || metricFilter === "visits") && (pt.item.visits > 0 || isHovered) && (
                            <circle
                              cx={pt.x}
                              cy={pt.yVisits}
                              r={isHovered ? 5.5 : 3.5}
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth={isHovered ? 2.5 : 1.5}
                            />
                          )}
                          {(metricFilter === "both" || metricFilter === "views") && (pt.item.views > 0 || isHovered) && (
                            <circle
                              cx={pt.x}
                              cy={pt.yViews}
                              r={isHovered ? 5.5 : 3.5}
                              fill="#a855f7"
                              stroke="#ffffff"
                              strokeWidth={isHovered ? 2.5 : 1.5}
                            />
                          )}
                          {metricFilter === "devices" && (pt.item.devices > 0 || isHovered) && (
                            <circle
                              cx={pt.x}
                              cy={pt.yDevices}
                              r={isHovered ? 5 : 3}
                              fill="#06b6d4"
                              stroke="#ffffff"
                              strokeWidth={isHovered ? 2 : 1.5}
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* خط المؤشر الرأسي التفاعلي عند التحويم (Interactive Crosshair Guide) */}
                    {hoveredIndex !== null && chartPoints.allCoords[hoveredIndex] && (
                      <g>
                        <line
                          x1={chartPoints.allCoords[hoveredIndex].x}
                          y1={chartPoints.topY}
                          x2={chartPoints.allCoords[hoveredIndex].x}
                          y2={chartPoints.baseY}
                          stroke="#059669"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        {/* هالة النقطة النشطة */}
                        {(metricFilter === "both" || metricFilter === "visits") && (
                          <circle
                            cx={chartPoints.allCoords[hoveredIndex].x}
                            cy={chartPoints.allCoords[hoveredIndex].yVisits}
                            r="11"
                            fill="#10b981"
                            opacity="0.25"
                          />
                        )}
                        {(metricFilter === "both" || metricFilter === "views") && (
                          <circle
                            cx={chartPoints.allCoords[hoveredIndex].x}
                            cy={chartPoints.allCoords[hoveredIndex].yViews}
                            r="11"
                            fill="#a855f7"
                            opacity="0.25"
                          />
                        )}
                        {(metricFilter === "both" || metricFilter === "devices") && (
                          <circle
                            cx={chartPoints.allCoords[hoveredIndex].x}
                            cy={chartPoints.allCoords[hoveredIndex].yDevices}
                            r="10"
                            fill="#06b6d4"
                            opacity="0.25"
                          />
                        )}
                      </g>
                    )}

                    {/* تسميات وتدريجات المحور الأفقي (X-Axis Ticks & Labels) */}
                    {chartPoints.allCoords.map((pt) => {
                      const N = chartPoints.allCoords.length;
                      let showLabel = false;
                      if (timeFilter === "today_hours") {
                        showLabel = pt.index % 3 === 0 || pt.item.isHighlight;
                      } else if (timeFilter === "last_7_days") {
                        showLabel = true;
                      } else {
                        showLabel = pt.index % 5 === 0 || pt.index === N - 1;
                      }

                      return (
                        <g key={`label_${pt.index}`}>
                          <line
                            x1={pt.x}
                            y1={chartPoints.baseY}
                            x2={pt.x}
                            y2={chartPoints.baseY + 4}
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                          />
                          {showLabel && (
                            <text
                              x={pt.x}
                              y={chartPoints.baseY + (timeFilter === "last_7_days" ? 17 : 20)}
                              textAnchor="middle"
                              fontSize={timeFilter === "last_7_days" ? "11" : "10"}
                              fontWeight={pt.item.isHighlight ? "900" : "600"}
                              fill={pt.item.isHighlight ? "#047857" : "#64748b"}
                            >
                              {pt.item.label}
                            </text>
                          )}
                          {timeFilter === "last_7_days" && pt.item.subLabel && (
                            <text
                              x={pt.x}
                              y={chartPoints.baseY + 30}
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="bold"
                              fill="#94a3b8"
                            >
                              {pt.item.subLabel}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* شرائح استشعار التحويم التفاعلية (Transparent Touch & Hover Slices) */}
                    {chartPoints.allCoords.map((pt, idx) => {
                      const N = chartPoints.allCoords.length;
                      const sliceWidth = chartPoints.innerWidth / Math.max(1, N);
                      const sliceX = pt.x - sliceWidth / 2;

                      return (
                        <rect
                          key={`slice_${idx}`}
                          x={sliceX}
                          y={chartPoints.topY}
                          width={sliceWidth}
                          height={chartPoints.innerHeight + 25}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onTouchStart={() => setHoveredIndex(idx)}
                          onClick={() => setHoveredIndex(idx)}
                        />
                      );
                    })}
                  </svg>
                </div>
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
