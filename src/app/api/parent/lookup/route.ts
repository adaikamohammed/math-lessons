import { NextRequest, NextResponse } from "next/server";
import { getLessonsData } from "@/lib/storage";
import {
  matchesStudentName,
  buildParentGradebookLookup,
  ParentStudentReport,
} from "@/lib/parentLookupHelper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = (
      searchParams.get("code") ||
      searchParams.get("birthDate") ||
      searchParams.get("birth") ||
      ""
    ).trim();
    const nameQuery = (
      searchParams.get("name") ||
      searchParams.get("studentName") ||
      ""
    ).trim();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال تاريخ ميلاد التلميذ (مثال: 2013-07-10)" },
        { status: 400 }
      );
    }

    let normalizedCode = code.replace(/\//g, "-").trim();
    const dmyMatch = normalizedCode.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, "0");
      const m = dmyMatch[2].padStart(2, "0");
      const y = dmyMatch[3];
      normalizedCode = `${y}-${m}-${d}`;
    }

    const data = await getLessonsData();
    const roster = data.studentRoster || [];
    const records = data.gradebookRecords || [];

    // بناء أو استرجاع فهرس التقارير المفهرس بتاريخ الميلاد
    const lookup = buildParentGradebookLookup(roster, records, {
      teacherName: "الأستاذ محمد عدايكة",
      subjectName: "الرياضيات",
      schoolName: "متوسطة المجاهد باهي علي",
    });

    const matchingReports = lookup[normalizedCode] || [];

    if (matchingReports.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `لم يتم العثور على أي نتائج مسجلة بتاريخ الميلاد (${normalizedCode}). يرجى التأكد من كتابة التاريخ بالشكل الصحيح أو مراجعة الأستاذ.`,
        },
        { status: 404 }
      );
    }

    // مطابقة الاسم إن وُجد
    if (nameQuery) {
      const filtered = matchingReports.filter((rep) =>
        matchesStudentName(rep.studentName, nameQuery)
      );

      if (filtered.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `تم العثور على تلميذ بتاريخ (${normalizedCode})، ولكن الاسم المدخل (${nameQuery}) لا يطابق الاسم المسجل. يرجى التأكد من الاسم.`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, count: filtered.length, reports: filtered },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    return NextResponse.json(
      { success: true, count: matchingReports.length, reports: matchingReports },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "خطأ أثناء البحث عن كشف النقاط" },
      { status: 500 }
    );
  }
}
