import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// تسجيل زيارة الموقع أو مشاهدة درس محدد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, lessonId } = body;

    const data = await getLessonsData();
    data.siteAnalytics = data.siteAnalytics || { totalVisits: 0 };

    const todayStr = new Date().toISOString().split("T")[0];

    // 1. تسجيل زيارة عامة للموقع
    if (type === "visit") {
      data.siteAnalytics.totalVisits = (data.siteAnalytics.totalVisits || 0) + 1;
      if (data.siteAnalytics.todayDate === todayStr) {
        data.siteAnalytics.todayVisits = (data.siteAnalytics.todayVisits || 0) + 1;
      } else {
        data.siteAnalytics.todayDate = todayStr;
        data.siteAnalytics.todayVisits = 1;
      }
      data.siteAnalytics.lastVisit = new Date().toISOString();

      await saveLessonsData(data);

      return NextResponse.json({
        success: true,
        totalVisits: data.siteAnalytics.totalVisits,
        todayVisits: data.siteAnalytics.todayVisits,
      });
    }

    // 2. تسجيل مشاهدة درس محدد
    if (type === "lesson_view" && lessonId) {
      const lesson = data.lessons.find((l) => l.id === lessonId);
      if (lesson) {
        lesson.views = (lesson.views || 0) + 1;
        await saveLessonsData(data);

        return NextResponse.json({
          success: true,
          lessonId,
          views: lesson.views,
        });
      }
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ error: "نوع الطلب غير صالح" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "فشل تسجيل الإحصائية" }, { status: 500 });
  }
}

// قراءة الإحصائيات العامة للموقع والدروس
export async function GET() {
  try {
    const data = await getLessonsData();
    const analytics = data.siteAnalytics || { totalVisits: 0, todayVisits: 0 };

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

    // ترتيب أكثر 5 دروس مشاهدة
    viewsList.sort((a, b) => b.views - a.views);
    const topLessons = viewsList.slice(0, 5);

    return NextResponse.json(
      {
        siteAnalytics: analytics,
        totalLessonViews,
        totalLessonsCount: data.lessons.length,
        topLessons,
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
    return NextResponse.json({ error: e.message || "حدث خطأ" }, { status: 500 });
  }
}
