"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Megaphone,
  AlertTriangle,
  BookOpen,
  Bell,
  Pin,
  Calendar,
  Eye,
  Smartphone,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Announcement, AnnouncementCategory } from "@/lib/types";
import { getOrCreateClientIdentity } from "@/lib/analyticsClient";
import FormattedAnnouncementContent from "@/components/FormattedAnnouncementContent";

const CATEGORY_MAP: Record<
  string,
  { label: string; badgeBg: string; border: string; bg: string; icon: any; iconColor: string }
> = {
  all: {
    label: "الكل",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
    border: "border-slate-200",
    bg: "bg-white",
    icon: Megaphone,
    iconColor: "text-slate-700",
  },
  urgent: {
    label: "عاجل وهام 🚨",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    border: "border-rose-300",
    bg: "bg-gradient-to-br from-rose-50/60 to-white",
    icon: AlertTriangle,
    iconColor: "text-rose-600",
  },
  lesson: {
    label: "دروس وواجبات 📚",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    border: "border-emerald-300",
    bg: "bg-gradient-to-br from-emerald-50/60 to-white",
    icon: BookOpen,
    iconColor: "text-emerald-700",
  },
  absence: {
    label: "تنبيه غياب ⚠️",
    badgeBg: "bg-red-100 text-red-800 border-red-200",
    border: "border-red-300",
    bg: "bg-gradient-to-br from-red-50/60 to-white",
    icon: AlertTriangle,
    iconColor: "text-red-600",
  },
  general: {
    label: "إعلانات عامة 📢",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-200",
    border: "border-amber-300",
    bg: "bg-gradient-to-br from-amber-50/60 to-white",
    icon: Megaphone,
    iconColor: "text-amber-700",
  },
  update: {
    label: "تحديثات 🔔",
    badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
    border: "border-sky-300",
    bg: "bg-gradient-to-br from-sky-50/60 to-white",
    icon: Bell,
    iconColor: "text-sky-600",
  },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/announcements?all=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // تتبع المشاهدة عند توسيع أي إعلان
  const toggleExpand = (item: Announcement) => {
    const isCurrentlyExpanded = !!expandedIds[item.id];
    setExpandedIds((prev) => ({ ...prev, [item.id]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded) {
      let visitorId = "";
      try {
        visitorId = getOrCreateClientIdentity().visitorId;
      } catch {}

      fetch("/api/announcements/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, visitorId }),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData?.success) {
            setAnnouncements((prev) =>
              prev.map((a) =>
                a.id === item.id
                  ? {
                      ...a,
                      views: resData.views,
                      uniqueDevicesCount: resData.uniqueDevicesCount || a.uniqueDevicesCount,
                    }
                  : a
              )
            );
          }
        })
        .catch(() => {});
    }
  };

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      if (a.active === false) return false;
      if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = (a.title || "").toLowerCase().includes(q);
        const matchContent = (a.content || "").toLowerCase().includes(q);
        return matchTitle || matchContent;
      }
      return true;
    });
  }, [announcements, selectedCategory, searchQuery]);

  return (
    <div className="pb-16 pt-3 fade-up space-y-4 max-w-3xl mx-auto px-2" dir="rtl">
      {/* 1. الشريط العلوي مع زر العودة */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span>العودة للدروس</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black text-slate-900">
            سجل الإعلانات والتنبيهات المدرسية 📢
          </span>
        </div>

        <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          {filtered.length} إعلان
        </span>
      </div>

      {/* 2. شريط البحث والفلترة حسب الفئة */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* حقل البحث */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الإعلانات، مواعيد الفروض، تصحيح الكراريس..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold placeholder:text-slate-400 outline-none focus:border-emerald-500 bg-slate-50"
          />
        </div>

        {/* أزرار الفئات السريعة */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {Object.entries(CATEGORY_MAP).map(([key, info]) => {
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-xl font-black shrink-0 transition cursor-pointer border ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. قائمة الإعلانات المنشورة */}
      {loading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">جاري تحميل سجل الإعلانات...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-black text-slate-700">لا توجد إعلانات مطابقة حالياً</p>
          <p className="text-xs text-slate-400">تابع هذا الفضاء لمعرفة أحدث المواعيد والتنبيهات المدرسية</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const catStyle = CATEGORY_MAP[item.category] || CATEGORY_MAP.general;
            const CatIcon = catStyle.icon;
            const isExpanded = !!expandedIds[item.id];
            const viewsCount = item.views || 0;
            const devicesCount = item.uniqueDevicesCount || (viewsCount > 0 ? 1 : 0);

            return (
              <div
                key={item.id}
                className={`rounded-2xl border-2 transition-all duration-200 shadow-2xs overflow-hidden ${catStyle.border} ${catStyle.bg}`}
              >
                {/* رأس بطاقة الإعلان */}
                <div
                  onClick={() => toggleExpand(item)}
                  className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50/60 transition select-none flex items-start gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center shrink-0 ${catStyle.iconColor} border border-slate-100 mt-0.5`}>
                    <CatIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${catStyle.badgeBg}`}>
                        {catStyle.label}
                      </span>

                      {item.pinned && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">
                          <Pin className="w-2.5 h-2.5 fill-amber-700 text-amber-700" /> مثبت
                        </span>
                      )}

                      {item.date && (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mr-auto">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-black text-slate-900 mt-1.5 leading-snug">
                      {item.title}
                    </h3>

                    {/* أرقام المشاهدات والأجهزة الفريدة بالعين */}
                    <div className="flex items-center gap-2 mt-2 text-[10px] sm:text-[11px] font-black">
                      <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/70">
                        <Eye className="w-3 h-3 text-purple-600" />
                        <span>+{viewsCount} مشاهدة</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200/70">
                        <Smartphone className="w-3 h-3 text-cyan-600" />
                        <span>{devicesCount} جهاز فريد</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-400 hover:text-slate-700 p-1 rounded-lg bg-white/80 border border-slate-200 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* المحتوى الكامل عند التوسيع */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-200/70 bg-white/90 animate-in fade-in duration-200">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                      <FormattedAnnouncementContent content={item.content} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
