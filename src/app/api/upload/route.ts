import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData, uploadImageFile } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";
import { LessonImage } from "@/lib/types";

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const lessonId = formData.get("lessonId") as string;
    const file = formData.get("file") as File;

    if (!lessonId || !file) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const data = await getLessonsData();
    const lesson = data.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
    }

    const { url, downloadUrl } = await uploadImageFile(
      file,
      file.name || "lesson-image.jpg",
      lessonId,
      lesson.level
    );

    const newImage: LessonImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url,
      downloadUrl,
      name: file.name || "صورة الدرس",
      createdAt: new Date().toISOString(),
    };

    lesson.images.push(newImage);
    await saveLessonsData(data);

    return NextResponse.json({ image: newImage, lesson });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "فشل رفع الصورة" }, { status: 500 });
  }
}
