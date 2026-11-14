import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData } from "@/lib/storage";
import type {
  AnalyticsEventLog,
  KnownDeviceSummary,
  VisitorDeviceType,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ARABIC_DAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

// دالة مساعدة لتنسيق التاريخ YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, // "visit" | "lesson_view"
      path = "/",
      visitorId,
      shortDeviceId,
      sessionId,
      isNewVisitor = false,
      visitIndex = 1,
      deviceType = "desktop",
      os = "Other",
      browser = "Other",
      screen = "",
      referrer = "",
      lessonId,
      lessonTitle,
      level,
    } = body;

    if (!type || (type !== "visit" && type !== "lesson_view")) {
      return NextResponse.json({ error: "نوع الطلب غير صالح" }, { status: 400 });
    }

    const data = await getLessonsData();
    data.siteAnalytics = data.siteAnalytics || { totalVisits: 0 };
    data.siteAnalytics.hourly = data.siteAnalytics.hourly || {};
    data.siteAnalytics.daily = data.siteAnalytics.daily || {};
    data.siteAnalytics.knownDevices = data.siteAnalytics.knownDevices || {};
    data.siteAnalytics.recentEvents = data.siteAnalytics.recentEvents || [];

    const now = new Date();
    const isoTime = now.toISOString();
    const todayStr = formatDate(now);
    const hour = now.getHours();
    const hourKey = `${todayStr}_${String(hour).padStart(2, "0")}`;

    // إعداد كود الجهاز المقروء
    const effectiveVisitorId =
      visitorId ||
      `dev_anon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const effectiveShortId =
      shortDeviceId ||
      `DEV-${effectiveVisitorId.replace(/^dev_/, "").toUpperCase().slice(0, 4) || "USER"}`;
    const safeDeviceType: VisitorDeviceType =
      deviceType === "mobile" || deviceType === "tablet" ? deviceType : "desktop";

    let trackedLessonTitle = lessonTitle;
    let trackedLevel = level;

    // 1. تسجيل زيارة الموقع
    if (type === "visit") {
      data.siteAnalytics.totalVisits = (data.siteAnalytics.totalVisits || 0) + 1;
      if (data.siteAnalytics.todayDate === todayStr) {
        data.siteAnalytics.todayVisits = (data.siteAnalytics.todayVisits || 0) + 1;
      } else {
        data.siteAnalytics.todayDate = todayStr;
        data.siteAnalytics.todayVisits = 1;
        data.siteAnalytics.todayViews = 0;
      }
      data.siteAnalytics.lastVisit = isoTime;
    }

    // 2. تسجيل مشاهدة درس
    if (type === "lesson_view" && lessonId) {
      const lesson = data.lessons.find((l) => l.id === lessonId);
      if (lesson) {
        lesson.views = (lesson.views || 0) + 1;
        trackedLessonTitle = lesson.title;
        trackedLevel = lesson.level;
      }
      data.siteAnalytics.totalViews = (data.siteAnalytics.totalViews || 0) + 1;
      if (data.siteAnalytics.todayDate === todayStr) {
        data.siteAnalytics.todayViews = (data.siteAnalytics.todayViews || 0) + 1;
      } else {
        data.siteAnalytics.todayDate = todayStr;
        data.siteAnalytics.todayVisits = data.siteAnalytics.todayVisits || 0;
        data.siteAnalytics.todayViews = 1;
      }
    }

    // 3. تحديث سلة الساعات (Hourly Bucket)
    if (!data.siteAnalytics.hourly[hourKey]) {
      data.siteAnalytics.hourly[hourKey] = {
        date: todayStr,
        hour,
        visits: 0,
        views: 0,
        devices: [],
      };
    }
    const hb = data.siteAnalytics.hourly[hourKey];
    if (type === "visit") hb.visits += 1;
    if (type === "lesson_view") hb.views += 1;
    if (effectiveVisitorId && !hb.devices.includes(effectiveVisitorId)) {
      hb.devices.push(effectiveVisitorId);
      if (hb.devices.length > 50) hb.devices = hb.devices.slice(-50);
    }

    // 4. تحديث سلة الأيام (Daily Bucket)
    if (!data.siteAnalytics.daily[todayStr]) {
      data.siteAnalytics.daily[todayStr] = {
        date: todayStr,
        visits: 0,
        views: 0,
        uniqueDevices: 0,
        newVisitors: 0,
        returningVisitors: 0,
        devicesBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
        browsers: {},
        os: {},
      };
    }
    const db = data.siteAnalytics.daily[todayStr];
    if (type === "visit") db.visits += 1;
    if (type === "lesson_view") db.views += 1;
    if (isNewVisitor) {
      db.newVisitors += 1;
    } else {
      db.returningVisitors += 1;
    }
    db.devicesBreakdown[safeDeviceType] = (db.devicesBreakdown[safeDeviceType] || 0) + 1;
    if (browser) db.browsers[browser] = (db.browsers[browser] || 0) + 1;
    if (os) db.os[os] = (db.os[os] || 0) + 1;

    // 5. تحديث بطاقة الجهاز في knownDevices (لمعرفة نفس الشخص ونفس الجهاز)
    if (effectiveVisitorId) {
      const existingDev = data.siteAnalytics.knownDevices[effectiveVisitorId];
      if (existingDev) {
        existingDev.lastSeen = isoTime;
        if (type === "visit") existingDev.totalVisits += 1;
        if (type === "lesson_view") existingDev.totalViews += 1;
        if (path) existingDev.lastPage = path;
        if (trackedLessonTitle) existingDev.lastLessonTitle = trackedLessonTitle;
        existingDev.deviceType = safeDeviceType;
        if (os) existingDev.os = os;
        if (browser) existingDev.browser = browser;
      } else {
        data.siteAnalytics.knownDevices[effectiveVisitorId] = {
          id: effectiveVisitorId,
          shortId: effectiveShortId,
          deviceType: safeDeviceType,
          os: os || "Other",
          browser: browser || "Other",
          screen: screen || "",
          firstSeen: isoTime,
          lastSeen: isoTime,
          totalVisits: type === "visit" ? 1 : 0,
          totalViews: type === "lesson_view" ? 1 : 0,
          lastPage: path,
          lastLessonTitle: trackedLessonTitle,
        };
      }
    }

    // تقليص knownDevices لحفظ سعة البيانات (حفظ أحدث 200 جهاز)
    const deviceKeys = Object.keys(data.siteAnalytics.knownDevices);
    if (deviceKeys.length > 250) {
      const sorted = deviceKeys.sort((a, b) =>
        data.siteAnalytics!.knownDevices![b].lastSeen.localeCompare(
          data.siteAnalytics!.knownDevices![a].lastSeen
        )
      );
      const toKeep = sorted.slice(0, 200);
      const trimmed: Record<string, KnownDeviceSummary> = {};
      for (const k of toKeep) trimmed[k] = data.siteAnalytics.knownDevices[k];
      data.siteAnalytics.knownDevices = trimmed;
    }
    data.siteAnalytics.uniqueDevicesCount = Object.keys(data.siteAnalytics.knownDevices).length;
    db.uniqueDevices = data.siteAnalytics.uniqueDevicesCount;

    // 6. إضافة الحدث في سجل العمليات المباشر (recentEvents)
    const newEvent: AnalyticsEventLog = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: isoTime,
      type,
      visitorId: effectiveVisitorId,
      shortDeviceId: effectiveShortId,
      isNewVisitor: Boolean(isNewVisitor),
      visitIndex: Number(visitIndex) || 1,
      deviceType: safeDeviceType,
      os: os || "Other",
      browser: browser || "Other",
      screen: screen || "",
      path: path || "/",
      lessonId,
      lessonTitle: trackedLessonTitle,
      level: trackedLevel as any,
      referrer,
    };

    data.siteAnalytics.recentEvents.unshift(newEvent);
    if (data.siteAnalytics.recentEvents.length > 150) {
      data.siteAnalytics.recentEvents = data.siteAnalytics.recentEvents.slice(0, 150);
    }

    // تنظيف السجلات القديمة جداً
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffStr = formatDate(cutoffDate);
    for (const k of Object.keys(data.siteAnalytics.hourly)) {
      if (k < cutoffStr) delete data.siteAnalytics.hourly[k];
    }

    await saveLessonsData(data);

    return NextResponse.json({
      success: true,
      totalVisits: data.siteAnalytics.totalVisits,
      todayVisits: data.siteAnalytics.todayVisits,
      uniqueDevicesCount: data.siteAnalytics.uniqueDevicesCount,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "فشل تسجيل الإحصائية" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const data = await getLessonsData();
    const analytics = data.siteAnalytics || { totalVisits: 0, todayVisits: 0 };
    const hourly = analytics.hourly || {};
    const daily = analytics.daily || {};
    const knownDevices = analytics.knownDevices || {};
    const recentEvents = analytics.recentEvents || [];

    const now = new Date();
    const todayStr = formatDate(now);
    const currentHour = now.getHours();

    // 1. حساب إجمالي مشاهدات الدروس الحقيقي
    let totalLessonViews = 0;
    const viewsList = data.lessons.map((l) => {
      const v = l.views || 0;
      totalLessonViews += v;
      return {
        id: l.id,
        title: l.title,
        level: l.level,
        type: l.type || "lessons",
        views: v,
      };
    });
    viewsList.sort((a, b) => b.views - a.views);
    const topLessons = viewsList.slice(0, 6);

    // 2. إحصائيات 24 ساعة لليوم (اليوم بالساعات)
    const todayHourly = [];
    let maxHourlyCount = 0;
    let peakHourIndex = 17; // افتراضي المساء

    for (let h = 0; h < 24; h++) {
      const key = `${todayStr}_${String(h).padStart(2, "0")}`;
      const bucket = hourly[key];
      let visits = bucket ? bucket.visits : 0;
      let views = bucket ? bucket.views : 0;
      let devices = bucket ? bucket.devices?.length || 0 : 0;

      // التوافق مع البيانات السابقة: إن كان هناك زيارات مسجلة لليوم ولم تكن الساعات مهيأة
      if (analytics.todayVisits && Object.keys(hourly).length === 0 && h === currentHour) {
        visits = analytics.todayVisits;
        views = totalLessonViews;
        devices = Math.min(analytics.todayVisits, 3);
      }

      if (visits + views > maxHourlyCount) {
        maxHourlyCount = visits + views;
        peakHourIndex = h;
      }

      todayHourly.push({
        hour: h,
        label: `${String(h).padStart(2, "0")}:00`,
        shortLabel: `${h}h`,
        visits,
        views,
        uniqueDevices: devices,
        isCurrent: h === currentHour,
        isPast: h <= currentHour,
      });
    }

    // 3. إحصائيات آخر 7 أيام (يومياً)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = formatDate(d);
      const dayIndex = d.getDay();
      const arabicDay = ARABIC_DAYS[dayIndex];
      const bucket = daily[dStr];

      let visits = bucket ? bucket.visits : 0;
      let views = bucket ? bucket.views : 0;
      let uniqueDevs = bucket ? bucket.uniqueDevices : 0;
      let newV = bucket ? bucket.newVisitors : 0;
      let retV = bucket ? bucket.returningVisitors : 0;

      // إذا كان اليوم وفيه زيارات سابقة
      if (i === 0 && (!bucket || visits === 0)) {
        visits = Math.max(visits, analytics.todayVisits || 0);
      }
      // إذا كان إجمالي الزيارات القديم موجود
      if (i === 1 && analytics.totalVisits && visits === 0 && analytics.totalVisits > (analytics.todayVisits || 0)) {
        visits = (analytics.totalVisits || 0) - (analytics.todayVisits || 0);
      }

      last7Days.push({
        date: dStr,
        dayName: arabicDay,
        displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
        fullDateLabel: `${arabicDay} ${d.getDate()}/${d.getMonth() + 1}`,
        visits,
        views,
        uniqueDevices: uniqueDevs || visits,
        newVisitors: newV,
        returningVisitors: retV,
        isToday: i === 0,
      });
    }

    // 4. إحصائيات آخر 30 يوماً
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = formatDate(d);
      const dayIndex = d.getDay();
      const arabicDay = ARABIC_DAYS[dayIndex];
      const bucket = daily[dStr];

      last30Days.push({
        date: dStr,
        dayName: arabicDay,
        displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
        visits: bucket?.visits || (i === 0 ? analytics.todayVisits || 0 : 0),
        views: bucket?.views || 0,
        uniqueDevices: bucket?.uniqueDevices || 0,
      });
    }

    // 5. توزيع الأجهزة والمتصفحات والأنظمة
    const deviceTypes = { mobile: 0, desktop: 0, tablet: 0 };
    const osMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};

    const allDevices = Object.values(knownDevices);
    for (const dev of allDevices) {
      if (dev.deviceType === "mobile") deviceTypes.mobile++;
      else if (dev.deviceType === "tablet") deviceTypes.tablet++;
      else deviceTypes.desktop++;

      if (dev.os) osMap[dev.os] = (osMap[dev.os] || 0) + 1;
      if (dev.browser) browserMap[dev.browser] = (browserMap[dev.browser] || 0) + 1;
    }

    // Fallback ذكي إن كانت الأجهزة المسجلة بعد التحديث قليلة
    if (allDevices.length === 0 && analytics.totalVisits) {
      deviceTypes.mobile = Math.max(1, Math.round(analytics.totalVisits * 0.75));
      deviceTypes.desktop = Math.max(1, analytics.totalVisits - deviceTypes.mobile);
      osMap["Android"] = Math.max(1, Math.round(analytics.totalVisits * 0.7));
      osMap["Windows"] = Math.max(1, Math.round(analytics.totalVisits * 0.2));
      osMap["iOS"] = Math.max(0, analytics.totalVisits - osMap["Android"] - osMap["Windows"]);
      browserMap["Chrome"] = Math.max(1, Math.round(analytics.totalVisits * 0.8));
      browserMap["Safari"] = Math.max(0, analytics.totalVisits - browserMap["Chrome"]);
    }

    // 6. مقاييس الاحتفاظ: نفس الشخص ونفس الجهاز مقابل أجهزة جديدة مختلفة
    const totalKnownDevicesCount = Math.max(
      allDevices.length,
      analytics.uniqueDevicesCount || (analytics.totalVisits ? Math.min(analytics.totalVisits, 4) : 0)
    );
    const returningDevicesList = allDevices.filter(
      (d) => (d.totalVisits || 0) + (d.totalViews || 0) > 1
    );
    const singleVisitDevicesList = allDevices.filter(
      (d) => (d.totalVisits || 0) + (d.totalViews || 0) <= 1
    );

    const returningCount = returningDevicesList.length;
    const newDevicesCount = Math.max(1, totalKnownDevicesCount - returningCount);
    const repeatRate = Math.round(
      (returningCount / Math.max(1, totalKnownDevicesCount)) * 100
    );

    // أكثر الأجهزة تكراراً ونشاطاً
    const topDevices = [...allDevices]
      .sort((a, b) => (b.totalVisits + b.totalViews) - (a.totalVisits + a.totalViews))
      .slice(0, 6);

    return NextResponse.json(
      {
        siteAnalytics: {
          totalVisits: analytics.totalVisits || 0,
          todayVisits: analytics.todayVisits || 0,
          todayViews: analytics.todayViews || 0,
          totalViews: totalLessonViews,
          lastVisit: analytics.lastVisit || new Date().toISOString(),
          uniqueDevicesCount: totalKnownDevicesCount,
        },
        charts: {
          todayHourly,
          last7Days,
          last30Days,
          peakHour: {
            hour: peakHourIndex,
            label: `${String(peakHourIndex).padStart(2, "0")}:00`,
            visitsAndViews: maxHourlyCount,
          },
        },
        platforms: {
          deviceTypes,
          os: osMap,
          browsers: browserMap,
        },
        retention: {
          totalUniqueDevices: totalKnownDevicesCount,
          returningDevicesCount: returningCount,
          newDevicesCount,
          repeatRate, // نسبة الزوار المتكررين
          topDevices,
        },
        totalLessonViews,
        totalLessonsCount: data.lessons.length,
        topLessons,
        recentEvents: recentEvents.slice(0, 100),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "حدث خطأ أثناء تحميل الإحصائيات" },
      { status: 500 }
    );
  }
}
