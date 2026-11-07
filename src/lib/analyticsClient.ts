"use client";

import type { VisitorDeviceType } from "./types";

export interface ClientDeviceInfo {
  visitorId: string;
  shortDeviceId: string;
  sessionId: string;
  isNewVisitor: boolean;
  visitIndex: number;
  deviceType: VisitorDeviceType;
  os: string;
  browser: string;
  screen: string;
  referrer: string;
}

// مفاتيح التخزين المحلي والجلسات
const STORAGE_KEYS = {
  DEVICE_ID: "dz_math_device_id",
  DEVICE_FIRST_SEEN: "dz_math_device_first_seen",
  VISIT_COUNT: "dz_math_device_visit_count",
  SESSION_ID: "dz_math_session_id",
  SESSION_STARTED: "dz_math_session_started",
} as const;

/**
 * فك شفرة معلومات المتصفح والنظام ونوع الجهاز من البيئة الحالية
 */
export function detectDeviceInfo(): {
  deviceType: VisitorDeviceType;
  os: string;
  browser: string;
  screen: string;
  referrer: string;
} {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      deviceType: "desktop",
      os: "Unknown",
      browser: "Unknown",
      screen: "",
      referrer: "",
    };
  }

  const ua = navigator.userAgent || "";
  let deviceType: VisitorDeviceType = "desktop";
  let os = "Other";
  let browser = "Other";

  // 1. نوع الجهاز
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const isMobile = /(mobi|iphone|ipod|android|blackberry|opera mini|iemobile|mobile)/i.test(ua);

  if (isTablet) {
    deviceType = "tablet";
  } else if (isMobile) {
    deviceType = "mobile";
  } else {
    deviceType = "desktop";
  }

  // 2. نظام التشغيل
  if (/android/i.test(ua)) {
    os = "Android";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
  } else if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  // 3. المتصفح
  if (/samsungbrowser/i.test(ua)) {
    browser = "Samsung Internet";
  } else if (/edg([ea]|ios)?/i.test(ua)) {
    browser = "Edge";
  } else if (/chrome|crios/i.test(ua) && !/opr\//i.test(ua)) {
    browser = "Chrome";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = "Safari";
  } else if (/opr\//i.test(ua)) {
    browser = "Opera";
  }

  // 4. دقة الشاشة والمصدر
  const screen = window.screen ? `${window.screen.width}x${window.screen.height}` : "";
  const referrer = typeof document !== "undefined" ? document.referrer || "" : "";

  return { deviceType, os, browser, screen, referrer };
}

/**
 * الحصول على معرف الجهاز الثابت والجلسة الحالية
 */
export function getOrCreateClientIdentity(): ClientDeviceInfo {
  const hardware = detectDeviceInfo();

  if (typeof window === "undefined") {
    return {
      visitorId: "server_visitor",
      shortDeviceId: "SRV-0000",
      sessionId: "server_sess",
      isNewVisitor: false,
      visitIndex: 1,
      ...hardware,
    };
  }

  try {
    // 1. المعرف الدائم للجهاز (يدوم في localStorage حتى لو أغلقت المتصفح لأسابيع)
    let visitorId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    let isNewVisitor = false;

    if (!visitorId) {
      isNewVisitor = true;
      const randPart = Math.random().toString(36).substring(2, 8);
      const timePart = Date.now().toString(36);
      visitorId = `dev_${randPart}${timePart}`;
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, visitorId);
      localStorage.setItem(STORAGE_KEYS.DEVICE_FIRST_SEEN, new Date().toISOString());
      localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, "1");
    }

    // 2. كود مختصر أنيق ومقروء للأستاذ (مثل DEV-8A2F)
    const cleanHash = visitorId.replace(/^dev_/, "").toUpperCase().slice(0, 4);
    const shortDeviceId = `DEV-${cleanHash || "USER"}`;

    // 3. إدارة الجلسة الحالية وتعداد الزيارات
    let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
    let visitIndex = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || "1", 10);

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);

      if (!isNewVisitor) {
        visitIndex = (isNaN(visitIndex) ? 1 : visitIndex) + 1;
        localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, String(visitIndex));
      }
    }

    return {
      visitorId,
      shortDeviceId,
      sessionId,
      isNewVisitor,
      visitIndex,
      ...hardware,
    };
  } catch {
    // Fallback في حال منع الكوكيز أو التصفح الخفي الصارم
    const fallbackId = `dev_tmp_${Math.random().toString(36).substring(2, 6)}`;
    return {
      visitorId: fallbackId,
      shortDeviceId: "DEV-PRIV",
      sessionId: `sess_${Date.now()}`,
      isNewVisitor: true,
      visitIndex: 1,
      ...hardware,
    };
  }
}

export type TrackEventOptions = {
  type: "visit" | "lesson_view";
  path?: string;
  lessonId?: string;
  lessonTitle?: string;
  level?: 1 | 2;
};

/**
 * إرسال حدث التتبع إلى خادم الإحصائيات بأمان تام وبدون أي تأثير على تجربة المستخدم
 */
export async function trackAnalyticsEvent(options: TrackEventOptions): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const identity = getOrCreateClientIdentity();
    const currentPath = options.path || window.location.pathname;

    const payload = {
      type: options.type,
      path: currentPath,
      visitorId: identity.visitorId,
      shortDeviceId: identity.shortDeviceId,
      sessionId: identity.sessionId,
      isNewVisitor: identity.isNewVisitor,
      visitIndex: identity.visitIndex,
      deviceType: identity.deviceType,
      os: identity.os,
      browser: identity.browser,
      screen: identity.screen,
      referrer: identity.referrer,
      lessonId: options.lessonId,
      lessonTitle: options.lessonTitle,
      level: options.level,
      clientTimestamp: new Date().toISOString(),
    };

    // استخدام sendBeacon إن وُجد لضمان وصول التتبع حتى لو أغلق الزائر الصفحة فوراً
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const sent = navigator.sendBeacon("/api/analytics/track", blob);
      if (sent) return;
    }

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silent fail - التتبع لا يجب أن يظهر أي خطأ في واجهة المستخدم
  }
}
