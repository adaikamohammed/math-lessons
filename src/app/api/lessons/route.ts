import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData, deleteImageFile } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";
import { Lesson } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// جلب الدروس (عام للتلاميذ والأستاذ)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const levelParam = searchParams.get("level");
  const data = await getLessonsData();

  let lessons = data.lessons;
  if (levelParam) {
    const levelNum = Number(levelParam);
    lessons = lessons.filter((l) => l.level === levelNum);
  }

  // ترتيب الدروس تصاعدياً حسب رقم الدرس
  lessons.sort((a, b) => a.number - b.number);

  return NextResponse.json(
    { lessons },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

// إضافة درس جديد (للأستاذ فقط)
export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك - يرجى تسجيل الدخول" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let { level, number, title } = body;

    if (!title || !level) {
      return NextResponse.json({ error: "يرجى كتابة عنوان الدرس" }, { status: 400 });
    }

    title = String(title).trim();

    // إذا كتب الأستاذ "الدرس 1 : عنوان" ولم يدخل الرقم يدوياً، نستخرجه تلقائياً
    const match = title.match(/^(?:الدرس\s*)?0*(\d+)\s*[:\-–]\s*(.+)$/i);
    let lessonNum = Number(number);
    if (!lessonNum && match) {
      lessonNum = parseInt(match[1], 10);
    }

    const data = await getLessonsData();
    const existingForLevel = data.lessons.filter((l) => l.level === Number(level));
    if (!lessonNum) {
      lessonNum = existingForLevel.length ? Math.max(...existingForLevel.map((l) => l.number)) + 1 : 1;
    }

    const newLesson: Lesson = {
      id: `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      level: Number(level) as 1 | 2,
      number: lessonNum,
      title: title,
      createdAt: new Date().toISOString(),
      images: [],
    };

    data.lessons.push(newLesson);
    await saveLessonsData(data);

    return NextResponse.json({ lesson: newLesson });
  } catch (err: any) {
    console.error("POST /api/lessons error:", err);
    return NextResponse.json({ error: err?.message || "حدث خطأ أثناء الحفظ" }, { status: 500 });
  }
}

// تعديل درس (للأستاذ فقط)
export async function PUT(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, number } = body;

    const data = await getLessonsData();
    const lesson = data.lessons.find((l) => l.id === id);
    if (!lesson) {
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
    }

    if (title) lesson.title = title.trim();
    if (number !== undefined) lesson.number = Number(number);

    await saveLessonsData(data);
    return NextResponse.json({ lesson });
  } catch {
    return NextResponse.json({ error: "فشل التعديل" }, { status: 500 });
  }
}

// حذف درس وصوره (للأستاذ فقط)
export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "معرّف الدرس مطلوب" }, { status: 400 });
  }

  const data = await getLessonsData();
  const index = data.lessons.findIndex((l) => l.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
  }

  const [removed] = data.lessons.splice(index, 1);

  // حذف صور الدرس من التخزين
  for (const img of removed.images) {
    await deleteImageFile(img.url);
  }

  await saveLessonsData(data);
  return NextResponse.json({ success: true });
}
