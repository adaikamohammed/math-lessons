"use client";

import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    try {
      // تفادي تكرار تسجيل الزيارة في نفس الجلسة التصفحية
      const sessionKey = "dz_math_visited_session";
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "visit" }),
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  return null;
}
