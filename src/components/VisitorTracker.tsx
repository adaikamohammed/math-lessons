"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analyticsClient";

export default function VisitorTracker() {
  useEffect(() => {
    try {
      // تفادي تكرار تسجيل الزيارة العامة لنفس الجلسة التصفحية
      const sessionKey = "dz_math_visited_session";
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        trackAnalyticsEvent({
          type: "visit",
          path: typeof window !== "undefined" ? window.location.pathname : "/",
        });
      }
    } catch {
      // ignore
    }
  }, []);

  return null;
}
