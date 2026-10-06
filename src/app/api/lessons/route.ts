import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData, deleteImageFile } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";
import { Lesson, NotebookType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// جلب الدروس والأعمال الموجهة
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const levelParam = searchParams.get("level");
  const typeParam = searchParams.get("type"); // "lessons" | "directed_work"
  const data = await getLessonsData();

  let lessons = data.lessons;

  // فلترة حسب المستوى (1 أو 2 متوسط)
  if (levelParam) {
    const levelNum = Number(levelParam);
    lessons = lessons.filter((l) => l.level === levelNum);
  }

  // فلترة حسب نوع الكراس (كراس الدروس أو كراس الأعمال الموجهة)
  if (typeParam === "directed_work") {
    lessons = lessons.filter((l) => l.type === "directed_work");
  } else if (typeParam === "lessons") {
    lessons = lessons.filter((l) => !l.type || l.type === "lessons");
  }

  // ترتيب الدروس تصاعدياً حسب رقم الدرس / الحصة
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

// إضافة درس / حصة أعمال موجهة (للأستاذ فقط)
export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك - يرجى تسجيل الدخول" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let { level, type, field, section, number, title, notes } = body;

    if (!title || !level) {
      return NextResponse.json({ error: "يرجى كتابة عنوان المورد / الحصة" }, { status: 400 });
    }

    title = String(title).trim();
    const notebookType: NotebookType = type === "directed_work" ? "directed_work" : "lessons";

    // استخراج الرقم تلقائياً إذا كان مكتوباً في العنوان ولم يُدخل يدوياً
    const match = title.match(/^(?:(?:الدرس|المورد|الحصة|سلسلة)\s*)?0*(\d+)\s*[:\-–]\s*(.+)$/i);
    let itemNum = Number(number);
    if (!itemNum && match) {
      itemNum = parseInt(match[1], 10);
    }

    const data = await getLessonsData();
    const existingSame = data.lessons.filter(
      (l) => l.level === Number(level) && (notebookType === "directed_work" ? l.type === "directed_work" : (!l.type || l.type === "lessons"))
    );

    if (!itemNum) {
      itemNum = existingSame.length ? Math.max(...existingSame.map((l) => l.number)) + 1 : 1;
    }

    const newLesson: Lesson = {
      id: `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      level: Number(level) as 1 | 2,
      type: notebookType,
      field: notebookType === "lessons" ? (field ? String(field).trim() : "أنشطة عددية") : undefined,
      section: notebookType === "lessons" ? (section ? String(section).trim() : "المقطع 1 : الأعداد الطبيعية والأعداد العشرية") : undefined,
      number: itemNum,
      title: title,
      notes: notes ? String(notes).trim() : undefined,
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

// تعديل بيانات درس / حصة أعمال موجهة (للأستاذ فقط)
export async function PUT(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك - يرجى تسجيل الدخول" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, number, field, section, notes, type } = body;

    if (!id) {
      return NextResponse.json({ error: "معرّف العنصر مطلوب" }, { status: 400 });
    }

    const data = await getLessonsData();
    const lesson = data.lessons.find((l) => l.id === id);
    if (!lesson) {
      return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
    }

    if (title !== undefined) lesson.title = String(title).trim();
    if (number !== undefined) lesson.number = Number(number);
    if (field !== undefined) lesson.field = field ? String(field).trim() : undefined;
    if (section !== undefined) lesson.section = section ? String(section).trim() : undefined;
    if (notes !== undefined) lesson.notes = notes ? String(notes).trim() : undefined;
    if (type !== undefined) lesson.type = type === "directed_work" ? "directed_work" : "lessons";

    await saveLessonsData(data);
    return NextResponse.json({ success: true, lesson });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "فشل التعديل" }, { status: 500 });
  }
}

// حذف عنصر وصوره (للأستاذ فقط)
export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك - يرجى تسجيل الدخول" }, { status: 401 });
  }

  let id = new URL(req.url).searchParams.get("id");
  if (!id) {
    try {
      const body = await req.json();
      id = body?.id;
    } catch {}
  }

  if (!id) {
    return NextResponse.json({ error: "معرّف العنصر مطلوب" }, { status: 400 });
  }

  try {
    const data = await getLessonsData();
    const index = data.lessons.findIndex((l) => l.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
    }

    const [removed] = data.lessons.splice(index, 1);

    // حذف الصور من التخزين
    if (removed.images && Array.isArray(removed.images)) {
      for (const img of removed.images) {
        if (img?.url) {
          await deleteImageFile(img.url);
        }
      }
    }

    await saveLessonsData(data);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error("DELETE lesson error:", err);
    return NextResponse.json({ error: err?.message || "حدث خطأ أثناء حذف العنصر" }, { status: 500 });
  }
}
