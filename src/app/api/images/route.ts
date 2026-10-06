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
