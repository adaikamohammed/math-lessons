"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  AlertTriangle,
  BookOpen,
  Bell,
  Pin,
  Calendar,
  Eye,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Announcement, AnnouncementCategory } from "@/lib/types";
import { getOrCreateClientIdentity } from "@/lib/analyticsClient";

const CATEGORY_STYLES: Record<
  AnnouncementCategory,
  {
    badge: string;
    badgeBg: string;
    border: string;
    bg: string;
    hoverBorder: string;
    icon: any;
    iconColor: string;
    iconBg: string;
  }
> = {
  absence: {
    badge: "تنبيه غياب ⚠️",
    badgeBg: "bg-red-100 text-red-800 border-red-200",
    border: "border-red-300",
    hoverBorder: "hover:border-red-400",
    bg: "bg-gradient-to-r from-red-50/90 via-rose-50/70 to-white",
    icon: AlertTriangle,
    iconColor: "text-red-600",
    iconBg: "bg-red-100/80",
  },
  urgent: {
    badge: "عاجل وهام 🚨",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    border: "border-rose-400",
    hoverBorder: "hover:border-rose-500",
    bg: "bg-gradient-to-r from-rose-50/90 via-red-50/70 to-white",
    icon: AlertTriangle,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-100/80",
  },
  lesson: {
    badge: "دروس وواجبات 📚",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    border: "border-emerald-300",
    hoverBorder: "hover:border-emerald-400",
    bg: "bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-white",
    icon: BookOpen,
    iconColor: "text-emerald-700",
    iconBg: "bg-emerald-100/80",
  },
  update: {
    badge: "تحديث الموقع 🔔",
    badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
    border: "border-sky-300",
    hoverBorder: "hover:border-sky-400",
    bg: "bg-gradient-to-r from-sky-50/90 via-blue-50/70 to-white",
    icon: Bell,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-100/80",
  },
  general: {
    badge: "إعلان وتنبيه 📢",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-200",
    border: "border-amber-300",
    hoverBorder: "hover:border-amber-400",
    bg: "bg-gradient-to-r from-amber-50/90 via-yellow-50/60 to-white",
    icon: Megaphone,
    iconColor: "text-amber-700",
    iconBg: "bg-amber-100/80",
  },
};

export default function HomeAnnouncements({
  announcements = [],
}: {
  announcements: Announcement[];
}) {
  const activeItems = announcements.filter((a) => a.active !== false);

  // الفهرس النشط في حال وجود عدة إعلانات
  const [currentIndex, setCurrentIndex] = useState(0);

  // حالة فتح نافذة القراءة السريعة (Modal)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // إحصائيات محلية محدثة لحظياً عند القراءة
  const [statsMap, setStatsMap] = useState<
    Record<string, { views: number; uniqueDevicesCount: number }>
  >({});

  // تتبع المشاهدات مسجلة في الجلسة لتفادي التكرار المفرط
  const [trackedInSession, setTrackedInSession] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // ملء الإحصائيات الأولية
    const initial: Record<string, { views: number; uniqueDevicesCount: number }> = {};
    activeItems.forEach((a) => {
      initial[a.id] = {
        views: a.views || 0,
        uniqueDevicesCount: a.uniqueDevicesCount || (a.views ? Math.min(a.views, 1) : 0),
      };
    });
    setStatsMap(initial);
  }, [announcements]);

  if (activeItems.length === 0) return null;

  const currentItem = activeItems[currentIndex] || activeItems[0];
  const style = CATEGORY_STYLES[currentItem.category] || CATEGORY_STYLES.general;
  const Icon = style.icon;

  const currentStats = statsMap[currentItem.id] || {
    views: currentItem.views || 0,
    uniqueDevicesCount: currentItem.uniqueDevicesCount || 0,
  };

  // فتح الإعلان وتسجيل المشاهدة
  const handleOpenAnnouncement = (ann: Announcement) => {
    setSelectedAnnouncement(ann);

    // تسجيل المشاهدة للجهاز
    if (!trackedInSession[ann.id]) {
      setTrackedInSession((prev) => ({ ...prev, [ann.id]: true }));

      // استدعاء بصمة الجهاز
      let visitorId = "";
      try {
        const identity = getOrCreateClientIdentity();
        visitorId = identity.visitorId;
      } catch {
        // ignore
      }

      // تحديث واجهة المستخدم بشكل متفائل (Optimistic Update)
      setStatsMap((prev) => {
        const prevStats = prev[ann.id] || { views: ann.views || 0, uniqueDevicesCount: ann.uniqueDevicesCount || 0 };
        return {
          ...prev,
          [ann.id]: {
            views: prevStats.views + 1,
            uniqueDevicesCount: Math.max(1, prevStats.uniqueDevicesCount || 1),
          },
        };
      });

      // إرسال التتبع للخادم
      fetch("/api/announcements/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ann.id, visitorId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.views !== undefined) {
            setStatsMap((prev) => ({
              ...prev,
              [ann.id]: {
                views: data.views,
                uniqueDevicesCount: data.uniqueDevicesCount || data.views,
              },
            }));
          }
        })
        .catch(() => {
          // ignore error
        });
    }
  };

  return (
    <div className="space-y-2">
      {/* 1. بطاقة الإعلان المدمجة الذكية على الصفحة الرئيسية */}
      <div
        className={`rounded-2xl p-3 sm:p-3.5 border-2 shadow-2xs transition-all duration-200 cursor-pointer ${style.border} ${style.hoverBorder} ${style.bg} hover:shadow-xs active:scale-[0.99] group`}
        onClick={() => handleOpenAnnouncement(currentItem)}
      >
        <div className="flex items-center gap-3">
          {/* أيقونة الفئة المميزة */}
          <div
            className={`w-10 h-10 rounded-xl ${style.iconBg} ${style.iconColor} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
          >
            <Icon className="w-5 h-5" />
          </div>

          {/* محتوى البطاقة الموجز (عنوان + شارة + مشاهدات) */}
          <div className="flex-1 min-w-0">
            {/* السطر العلوي: الشارة + التاريخ + عدد الإعلانات */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs ${style.badgeBg}`}
              >
                {style.badge}
              </span>

              {currentItem.pinned && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">
                  <Pin className="w-2.5 h-2.5 fill-amber-700 text-amber-700" /> مثبت
                </span>
              )}

              {/* عدد المشاهدات بالعين للعامة */}
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200/70">
                <Eye className="w-3 h-3 text-purple-600" />
                <span>{currentStats.views}</span>
              </span>

              {/* عداد الإعلانات إن كان هناك أكثر من إعلان */}
              {activeItems.length > 1 && (
                <span className="text-[10px] font-black text-slate-500 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-200 mr-auto">
                  {currentIndex + 1} من {activeItems.length}
                </span>
              )}
            </div>

            {/* سطر العنوان الرئيسي البارز بنقرة واحدة */}
            <div className="flex items-center justify-between gap-2 mt-1">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate leading-snug group-hover:text-emerald-800 transition">
                {currentItem.title}
              </h3>

              <span className="text-[10px] sm:text-[11px] font-black text-emerald-700 group-hover:text-emerald-900 shrink-0 flex items-center gap-0.5">
                <span>قراءة الإعلان</span>
                <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* أزرار التبديل السريعة إذا كان هناك أكثر من إعلان */}
        {activeItems.length > 1 && (
          <div
            className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-bold"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-medium">توجد إعلانات أخرى:</span>
              <div className="flex gap-1">
                {activeItems.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentIndex === idx ? "w-5 bg-emerald-600" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                    title={`الإعلان ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeItems.length - 1))}
                className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                title="الإعلان السابق"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev < activeItems.length - 1 ? prev + 1 : 0))}
                className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                title="الإعلان التالي"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. نافذة القراءة والتصفح السريعة المنبثقة (Announcement Reader Modal) */}
      {selectedAnnouncement && (() => {
        const modalStyle = CATEGORY_STYLES[selectedAnnouncement.category] || CATEGORY_STYLES.general;
        const ModalIcon = modalStyle.icon;
        const modalStats = statsMap[selectedAnnouncement.id] || {
          views: selectedAnnouncement.views || 1,
          uniqueDevicesCount: selectedAnnouncement.uniqueDevicesCount || 1,
        };

        const otherAnnouncements = activeItems.filter((a) => a.id !== selectedAnnouncement.id);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedAnnouncement(null)}
            dir="rtl"
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* رأس النافذة */}
              <div className={`p-4 sm:p-5 border-b border-slate-100 ${modalStyle.bg} relative`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${modalStyle.badgeBg}`}
                    >
                      {modalStyle.badge}
                    </span>

                    {selectedAnnouncement.pinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                        <Pin className="w-3 h-3 fill-amber-700 text-amber-700" /> مثبت في الصدارة
                      </span>
                    )}

                    {selectedAnnouncement.date && (
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {selectedAnnouncement.date}
                      </span>
                    )}
                  </div>

                  {/* زر الإغلاق */}
                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(null)}
                    className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                    title="إغلاق النافذة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* عنوان الإعلان في النافذة */}
                <h2 className="text-base sm:text-lg font-black text-slate-900 mt-2.5 leading-snug">
                  {selectedAnnouncement.title}
                </h2>

                {/* شريط الإحصائيات بالعين والأجهزة */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/50 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1 text-purple-700 bg-white/80 px-2 py-0.5 rounded-md border border-purple-200 shadow-2xs font-black">
                    <Eye className="w-3.5 h-3.5 text-purple-600" />
                    <span>+{modalStats.views} مشاهدة</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-cyan-800 bg-white/80 px-2 py-0.5 rounded-md border border-cyan-200 shadow-2xs font-black">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{modalStats.uniqueDevicesCount} جهاز فريد</span>
                  </span>
                </div>
              </div>

              {/* نص ومحتوى الإعلان كاملاً مع إمكانية التمرير المريح */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-right flex-1">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line select-text">
                  {selectedAnnouncement.content}
                </div>

                {/* تصفح بقية الإعلانات الأخرى مباشرة دون إغلاق النافذة */}
                {otherAnnouncements.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>إعلانات أخرى مهمة ({otherAnnouncements.length}):</span>
                    </div>

                    <div className="space-y-1.5">
                      {otherAnnouncements.map((other) => {
                        const otherStyle = CATEGORY_STYLES[other.category] || CATEGORY_STYLES.general;
                        const otherStats = statsMap[other.id] || { views: other.views || 0, uniqueDevicesCount: 0 };

                        return (
                          <div
                            key={other.id}
                            onClick={() => handleOpenAnnouncement(other)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${otherStyle.badgeBg} shrink-0`}>
                                {otherStyle.badge}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700">
                                {other.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                              <span className="flex items-center gap-0.5 text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-black">
                                <Eye className="w-2.5 h-2.5" />
                                <span>{otherStats.views}</span>
                              </span>
                              <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* أسفل النافذة */}
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                <Link
                  href="/announcements"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>أرشيف جميع الإعلانات</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-black transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
