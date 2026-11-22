import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  try {
    const data = await getLessonsData();
    const submissions = data.rewardSubmissions || [];
    return NextResponse.json({ submissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "حدث خطأ" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, teacherFeedback } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الطلب مفقود" }, { status: 400 });
    }

    const data = await getLessonsData();
    data.rewardSubmissions = data.rewardSubmissions || [];
    const item = data.rewardSubmissions.find((s) => s.id === id);

    if (!item) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (status) item.status = status;
    if (teacherFeedback !== undefined) item.teacherFeedback = teacherFeedback;
    item.reviewedAt = new Date().toISOString();

    await saveLessonsData(data);
    return NextResponse.json({ success: true, submission: item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "فشل تعديل حالة الطلب" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الطلب مفقود" }, { status: 400 });
    }

    const data = await getLessonsData();
    data.rewardSubmissions = (data.rewardSubmissions || []).filter((s) => s.id !== id);
    await saveLessonsData(data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "فشل حذف الطلب" }, { status: 500 });
  }
}
