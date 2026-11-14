import { NextRequest, NextResponse } from "next/server";
import { getLessonsData } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// تنظيف وتوحيد تاريخ الميلاد للمقارنة الآمنة (يدعم YYYY-MM-DD و DD/MM/YYYY و DD-MM-YYYY)
function normalizeBirthDate(raw?: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/\s+/g, "");
  
  // صيغة YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const [_, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // صيغة DD/MM/YYYY
  const dmMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmMatch) {
    const [_, d, m, y] = dmMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return cleaned;
}

// تنظيف وتوحيد الأسماء العربية للمقارنة
function normalizeArabic(text?: string): string {
  if (!text) return "";
  return text
    .trim()
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeClass(cls?: string): string {
  if (!cls) return "";
  return cls.replace(/\s+/g, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { className, studentName, studentId, birthDate, trimester = 1 } = body;

    if (!birthDate) {
      return NextResponse.json(
        { error: "يرجى كتابة تاريخ الميلاد الخاص بالتلميذ" },
        { status: 400 }
      );
    }

    if (!className) {
      return NextResponse.json(
        { error: "يرجى اختيار القسم أو الفوج (مثلاً: 1م1، 1م2، 1م3، 2م3)" },
        { status: 400 }
      );
    }

    const data = await getLessonsData();
    const roster = data.studentRoster || [];
    const gradeRecords = data.gradebookRecords || [];

    const normBirth = normalizeBirthDate(birthDate);
    const normCls = normalizeClass(className);
    const normName = normalizeArabic(studentName);

    // البحث عن التلميذ في القائمة
    const student = roster.find((s) => {
      const matchCls = normalizeClass(s.className) === normCls;
      if (!matchCls) return false;

      if (studentId && s.id === studentId) return true;
      if (normName && normalizeArabic(s.studentName) === normName) return true;
      return false;
    });

    if (!student) {
      return NextResponse.json(
        { error: "لم يتم العثور على اسم التلميذ في هذا القسم. يرجى التأكد من اختيار الاسم الصحيح." },
        { status: 404 }
      );
    }

    // التحقق السري من تاريخ الميلاد
    const expectedBirth = normalizeBirthDate(student.birthDate);
    if (!expectedBirth) {
      return NextResponse.json(
        { error: "لم يتم تسجيل تاريخ الميلاد لهذا التلميذ في النظام بعد. يرجى التواصل مع الأستاذ لتسجيله." },
        { status: 403 }
      );
    }

    if (normBirth !== expectedBirth) {
      return NextResponse.json(
        { error: "تاريخ الميلاد المدخل غير مطابق لبيانات التلميذ. يرجى التأكد من اليوم والشهر والسنة بدقة (مثال: 15/03/2013)." },
        { status: 401 }
      );
    }

    // استخراج نقاط التلميذ من سجل التنقيط
    const studentGrades = gradeRecords.filter(
      (g) => g.studentId === student.id || normalizeArabic(g.studentName) === normName
    );

    // البحث عن نقطة الفصل المطلوب
    const currentGrade = studentGrades.find((g) => g.trimester === Number(trimester)) || null;

    // حساب إحصائيات الفوج للمقارنة البناءة (أعلى معدل، معدل الفوج، أدنى معدل)
    const classGrades = gradeRecords.filter(
      (g) => normalizeClass(g.className) === normCls && g.trimester === Number(trimester)
    );

    let highestAvg: number | null = null;
    let lowestAvg: number | null = null;
    let classAvg: number | null = null;

    const validAverages = classGrades
      .map((g) => g.termAverage)
      .filter((avg): avg is number => typeof avg === "number" && !isNaN(avg));

    if (validAverages.length > 0) {
      highestAvg = Math.max(...validAverages);
      lowestAvg = Math.min(...validAverages);
      classAvg = Number((validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(2));
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentName: student.studentName,
        className: student.className,
        groupName: student.groupName,
        gender: student.gender,
      },
      trimester: Number(trimester),
      grade: currentGrade,
      allTrimesters: studentGrades,
      stats: {
        totalStudents: classGrades.length,
        highestAvg,
        lowestAvg,
        classAvg,
      },
      schoolInfo: {
        schoolName: "متوسطة المجاهد باهي علي",
        teacherName: "الأستاذ محمد عدايكة",
        subjectName: "مادة الرياضيات",
      },
    });
  } catch (err: any) {
    console.error("Grades lookup error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة طلب الاستعلام. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}

// جلب قائمة أسماء تلاميذ الفوج للبحث والاقتراح في واجهة الاستعلام (بدون بيانات حساسة)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get("className") || "";
    const normCls = normalizeClass(className);

    const data = await getLessonsData();
    const roster = data.studentRoster || [];

    const students = normCls
      ? roster.filter((s) => normalizeClass(s.className) === normCls)
      : roster;

    const names = students
      .map((s) => s.studentName)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ar"));

    return NextResponse.json(
      {
        success: true,
        students: names,
        count: names.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    console.error("Fetch lookup students error:", err);
    return NextResponse.json(
      { error: "تعذر جلب قائمة الأسماء" },
      { status: 500 }
    );
  }
}
