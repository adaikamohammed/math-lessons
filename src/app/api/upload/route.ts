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

    const isHomework = formData.get("isHomework") === "true" || formData.get("type") === "homework";

    const { url, downloadUrl } = await uploadImageFile(
      file,
      file.name || (isHomework ? "homework-solution.jpg" : "lesson-image.jpg"),
      lessonId,
      lesson.level
    );

    const newImage: LessonImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url,
      downloadUrl,
      name: file.name || (isHomework ? "حل الواجب المنزلي" : "صورة الدرس"),
      createdAt: new Date().toISOString(),
    };

    if (isHomework) {
      if (!Array.isArray(lesson.homeworkImages)) lesson.homeworkImages = [];
      lesson.homeworkImages.push(newImage);
    } else {
      lesson.images.push(newImage);
    }
    await saveLessonsData(data);

    return NextResponse.json({ image: newImage, lesson, isHomework });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "فشل رفع الصورة" }, { status: 500 });
  }
}
