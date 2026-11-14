import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";
import {
  StudentRosterItem,
  OfficialGradeRecord,
  ContinuousEvalConfig,
} from "@/lib/types";
import { buildParentGradebookLookup } from "@/lib/parentLookupHelper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 1. جلب بيانات التلاميذ والتنقيط الكاملة
export async function GET(req: NextRequest) {
  try {
    const data = await getLessonsData();
    return NextResponse.json(
      {
        success: true,
        roster: data.studentRoster || [],
        records: data.gradebookRecords || [],
        customClasses: data.customClasses || [],
        continuousEvalConfig: data.continuousEvalConfig || {},
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "فشل جلب البيانات" },
      { status: 500 }
    );
  }
}

// 2. تحديث بيانات التلاميذ أو دفاتر التنقيط
export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = await getLessonsData();

    if (Array.isArray(body.roster)) {
      data.studentRoster = body.roster;
    }
    if (Array.isArray(body.records)) {
      data.gradebookRecords = body.records;
    }
    if (Array.isArray(body.customClasses)) {
      data.customClasses = body.customClasses;
    }
    if (body.continuousEvalConfig && typeof body.continuousEvalConfig === "object") {
      data.continuousEvalConfig = body.continuousEvalConfig;
    }

    // إعادة بناء وتحديث كشوفات الأولياء تلقائياً
    data.parentGradebookLookup = buildParentGradebookLookup(
      data.studentRoster || [],
      data.gradebookRecords || [],
      {
        teacherName: "الأستاذ محمد عدايكة",
        subjectName: "الرياضيات",
        schoolName: "متوسطة المجاهد باهي علي",
      }
    );

    await saveLessonsData(data);

    return NextResponse.json({
      success: true,
      message: "تم حفظ وتحديث البيانات بنجاح",
      totalStudents: data.studentRoster?.length || 0,
      totalRecords: data.gradebookRecords?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "فشل حفظ البيانات" },
      { status: 500 }
    );
  }
}
