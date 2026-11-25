"use client";

import { useEffect } from "react";
import { Eye, Smartphone } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analyticsClient";

export interface FeatureViewBadgeProps {
  views: number;
  uniqueDevices: number;
  featureKey?: string;
  trackOnMount?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "purple" | "teal" | "emerald" | "amber" | "sky" | "slate";
  className?: string;
  viewsLabel?: string;
  devicesLabel?: string;
  compactDevices?: boolean; // يعرض "جهاز" بدلاً من "جهاز فريد"
}

export default function FeatureViewBadge({
  views,
  uniqueDevices,
  featureKey,
  trackOnMount = false,
  size = "sm",
  variant = "purple",
  className = "",
  viewsLabel = "مشاهدة",
  devicesLabel,
  compactDevices = false,
}: FeatureViewBadgeProps) {
  useEffect(() => {
    if (!trackOnMount || !featureKey || typeof window === "undefined") return;
    try {
      const sessionKey = `dz_math_feature_view_${featureKey}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        trackAnalyticsEvent({
          type: "feature_view",
          featureKey,
          path: window.location.pathname,
        });
      }
    } catch {
      // ignore
    }
  }, [trackOnMount, featureKey]);

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 rounded-md gap-1",
    sm: "text-[11px] px-2 py-0.5 rounded-md gap-1.5",
    md: "text-xs px-2.5 py-1 rounded-xl gap-2",
    lg: "text-xs sm:text-sm px-3 py-1.5 rounded-xl gap-2 sm:gap-2.5",
  }[size];

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  const variantClasses = {
    purple: "bg-purple-50 text-purple-900 border-purple-200/80",
    teal: "bg-teal-50 text-teal-900 border-teal-200/80",
    emerald: "bg-emerald-50 text-emerald-900 border-emerald-200/80",
    amber: "bg-amber-50 text-amber-950 border-amber-200/80",
    sky: "bg-sky-50 text-sky-900 border-sky-200/80",
    slate: "bg-slate-50 text-slate-800 border-slate-200/80",
  }[variant];

  const resolvedDevicesLabel =
    devicesLabel || (compactDevices ? "جهاز" : "جهاز فريد");

  return (
    <div
      className={`inline-flex items-center border shadow-2xs font-black select-none whitespace-nowrap ${variantClasses} ${sizeClasses} ${className}`}
      dir="rtl"
    >
      <span className="inline-flex items-center gap-1" title="إجمالي المشاهدات">
        <Eye className={`${iconSizes} opacity-85 shrink-0`} />
        <span>+{views} {viewsLabel}</span>
      </span>

      <span className="opacity-35 shrink-0">•</span>

      <span className="inline-flex items-center gap-1" title="عدد الأجهزة والتلاميذ الفريدين">
        <Smartphone className={`${iconSizes} opacity-85 shrink-0`} />
        <span>{uniqueDevices} {resolvedDevicesLabel}</span>
      </span>
    </div>
  );
}
