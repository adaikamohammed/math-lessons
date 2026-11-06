import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";
import { Lesson, NotebookType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// إعادة ترتيب الدروس بتصعيدها ⬆️ أو تنزيلها ⬇️
export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك - يرجى تسجيل الدخول" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { lessonId, direction, level, type = "lessons" } = body;

    if (!lessonId || !direction || !level) {
      return NextResponse.json(
        { error: "معرّف الدرس والاتجاه والمستوى مطلوبة" },
        { status: 400 }
      );
    }

    const data = await getLessonsData();
    const targetType: NotebookType = type || "lessons";
    const targetLevel = Number(level);

    // تصفية دروس نفس القسم والمستوى
    const sameCategory = data.lessons
      .filter((l) => {
        const isMatchLevel = l.level === targetLevel;
        const isMatchNotebook =
          targetType === "lessons" ? !l.type || l.type === "lessons" : l.type === targetType;
        return isMatchLevel && isMatchNotebook;
      })
      .sort((a, b) => a.number - b.number);

    const currentIndex = sameCategory.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) {
      return NextResponse.json({ error: "الدرس غير موجود في هذا القسم" }, { status: 404 });
    }

    // تصعيد (تقديم للأعلى = تقليل الترتيب)
    if (direction === "up") {
      if (currentIndex > 0) {
        const temp = sameCategory[currentIndex];
        sameCategory[currentIndex] = sameCategory[currentIndex - 1];
        sameCategory[currentIndex - 1] = temp;
      } else {
        return NextResponse.json({ success: true, message: "الدرس في أعلى القائمة بالفعل" });
      }
    } else if (direction === "down") {
      // تنزيل (تأخير للأسفل = زيادة الترتيب)
      if (currentIndex < sameCategory.length - 1) {
        const temp = sameCategory[currentIndex];
        sameCategory[currentIndex] = sameCategory[currentIndex + 1];
        sameCategory[currentIndex + 1] = temp;
      } else {
        return NextResponse.json({ success: true, message: "الدرس في أسفل القائمة بالفعل" });
      }
    }

    // إعادة ترقيم تسلسلي نقي (1, 2, 3...) لضمان عدم تكرار الأرقام
    for (let i = 0; i < sameCategory.length; i++) {
      sameCategory[i].number = i + 1;
    }

    // تحديث العناصر في القائمة الشاملة
    const updatedMap = new Map(sameCategory.map((l) => [l.id, l]));
    data.lessons = data.lessons.map((l) => (updatedMap.has(l.id) ? updatedMap.get(l.id)! : l));

    await saveLessonsData(data);

    return NextResponse.json({
      success: true,
      lessons: data.lessons.filter((l) => l.level === targetLevel),
      message: direction === "up" ? "تم تصعيد الدرس للأعلى ⬆️" : "تم تنزيل الدرس للأسفل ⬇️",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "حدث خطأ أثناء إعادة الترتيب" }, { status: 500 });
  }
}
