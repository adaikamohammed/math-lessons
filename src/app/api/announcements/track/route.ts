import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, visitorId } = body;

    if (!id) {
      return NextResponse.json({ error: "معرّف الإعلان مطلوب" }, { status: 400 });
    }

    const data = await getLessonsData();
    data.announcements = data.announcements || [];

    const index = data.announcements.findIndex((a) => a.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    const ann = data.announcements[index];
    ann.views = (ann.views || 0) + 1;

    // تتبع الجهاز الفريد
    ann.viewedDevices = ann.viewedDevices || [];
    if (visitorId && typeof visitorId === "string") {
      const cleanId = visitorId.trim().substring(0, 64);
      if (cleanId && !ann.viewedDevices.includes(cleanId)) {
        // حماية الذاكرة من التضخم (الاحتفاظ بآخر 1000 جهاز)
        if (ann.viewedDevices.length >= 1000) {
          ann.viewedDevices.shift();
        }
        ann.viewedDevices.push(cleanId);
        ann.uniqueDevicesCount = (ann.uniqueDevicesCount || 0) + 1;
      }
    }

    if (!ann.uniqueDevicesCount || ann.uniqueDevicesCount < 1) {
      ann.uniqueDevicesCount = Math.max(1, ann.viewedDevices.length || 1);
    }

    data.announcements[index] = ann;
    await saveLessonsData(data);

    return NextResponse.json({
      success: true,
      views: ann.views,
      uniqueDevicesCount: ann.uniqueDevicesCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "فشل تسجيل المشاهدة" }, { status: 500 });
  }
}
