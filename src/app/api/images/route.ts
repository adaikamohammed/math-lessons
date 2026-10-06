import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData, deleteImageFile } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  const imageId = searchParams.get("imageId");

  if (!lessonId || !imageId) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const data = await getLessonsData();
  const lesson = data.lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
  }

  const imgIndex = lesson.images.findIndex((img) => img.id === imageId);
  if (imgIndex === -1) {
    return NextResponse.json({ error: "الصورة غير موجودة" }, { status: 404 });
  }

  const [removed] = lesson.images.splice(imgIndex, 1);
  await deleteImageFile(removed.url);

  await saveLessonsData(data);
  return NextResponse.json({ success: true, lesson });
}

// إعادة ترتيب صور الدرس
export async function PUT(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { lessonId, imageIds } = body;

    if (!lessonId || !Array.isArray(imageIds)) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const data = await getLessonsData();
    const lesson = data.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
    }

    const imgMap = new Map(lesson.images.map((img) => [img.id, img]));
    const reordered: typeof lesson.images = [];
    for (const id of imageIds) {
      const img = imgMap.get(id);
      if (img) reordered.push(img);
    }
    for (const img of lesson.images) {
      if (!imageIds.includes(img.id)) reordered.push(img);
    }

    lesson.images = reordered;
    await saveLessonsData(data);

    return NextResponse.json({ success: true, lesson });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "فشل الترتيب" }, { status: 500 });
  }
}
