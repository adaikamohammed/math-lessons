import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";
import { StudentGradeRecord } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeClass(cls?: string): string {
  if (!cls) return "";
  return cls.replace(/\s+/g, "").trim();
}

function calculateTermAverage(continuous?: number, test1?: number, test2?: number, exam?: number): { termAvg?: number; isPendingExam: boolean } {
  const hasContinuous = typeof continuous === "number" && !isNaN(continuous);
  const hasTest1 = typeof test1 === "number" && !isNaN(test1);
  const hasTest2 = typeof test2 === "number" && !isNaN(test2);
  const hasExam = typeof exam === "number" && !isNaN(exam);

  // حساب معدل الفروض
  let testAvg: number | null = null;
  if (hasTest1 && hasTest2) {
    testAvg = (test1 + test2) / 2;
  } else if (hasTest1) {
    testAvg = test1;
  }

  // حساب معدل المراقبة المستمرة والفروض: (تقويم + فرض) / 2
  let continuousAndTest: number | null = null;
  if (hasContinuous && testAvg !== null) {
    continuousAndTest = (continuous + testAvg) / 2;
  } else if (hasContinuous) {
    continuousAndTest = continuous;
  } else if (testAvg !== null) {
    continuousAndTest = testAvg;
  }

  if (continuousAndTest === null) {
    return { isPendingExam: !hasExam };
  }

  // إذا تم رصد الاختبار: (المراقبة المستمرة + الفرض + الاختبار * 2) / 3 (أو المنشور 272: (تقويم_وفرض + اختبار*2) / 3)
  if (hasExam) {
    const finalAvg = (continuousAndTest + exam * 2) / 3;
    return { termAvg: Number(finalAvg.toFixed(2)), isPendingExam: false };
  }

  // في حال عدم رصد الاختبار بعد: يكون المعدل الحالي هو معدل المراقبة المستمرة والفرض
  return { termAvg: Number(continuousAndTest.toFixed(2)), isPendingExam: true };
}

// جلب قائمة التلاميذ ونقاطهم لقسم معين (للأستاذ فقط)
export async function GET(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "غير مصرح لك - يرجى تسجيل الدخول كأستاذ" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get("className") || "";
    const trimester = Number(searchParams.get("trimester") || 1) as 1 | 2 | 3;

    const data = await getLessonsData();
    const allRoster = data.studentRoster || [];
    const allGrades = data.gradebookRecords || [];

    const normCls = normalizeClass(className);

    // فلترة التلاميذ حسب القسم (إذا حُدد)
    const students = normCls
      ? allRoster.filter((s) => normalizeClass(s.className) === normCls)
      : allRoster;

    // مطابقة نقاط كل تلميذ
    const result = students.map((s, index) => {
      const g = allGrades.find(
        (rec) =>
          rec.studentId === s.id && rec.trimester === trimester
      ) || allGrades.find(
        (rec) =>
          rec.studentName === s.studentName &&
          normalizeClass(rec.className) === normalizeClass(s.className) &&
          rec.trimester === trimester
      );

      return {
        studentId: s.id,
        studentName: s.studentName,
        className: s.className,
        groupName: s.groupName || "فوج 1",
        birthDate: s.birthDate || "",
        gender: s.gender || "M",
        continuousScore: g?.continuousScore ?? "",
        test1Score: g?.test1Score ?? "",
        test2Score: g?.test2Score ?? "",
        examScore: g?.examScore ?? "",
        termAverage: g?.termAverage ?? "",
        appreciation: g?.appreciation || "",
        rank: g?.rank,
      };
    });

    return NextResponse.json({
      success: true,
      students: result,
      totalStudents: result.length,
      className,
      trimester,
    });
  } catch (err: any) {
    console.error("Fetch grades error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب قائمة النقاط: " + (err.message || "") },
      { status: 500 }
    );
  }
}

// حفظ النقاط المرصودة سريعاً كملف إكسل
export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "غير مصرح لك - يرجى تسجيل الدخول كأستاذ" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { updates, trimester = 1 } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "لا توجد تعديلات لحفظها" },
        { status: 400 }
      );
    }

    const data = await getLessonsData();
    const allGrades = [...(data.gradebookRecords || [])];
    const triNum = Number(trimester) as 1 | 2 | 3;

    for (const item of updates) {
      const studentId = item.studentId;
      const studentName = item.studentName;
      const className = item.className;
      if (!studentId && !studentName) continue;

      const recordKey = `${studentId}_T${triNum}`;
      const existingIdx = allGrades.findIndex(
        (g) =>
          g.id === recordKey ||
          (g.studentId === studentId && g.trimester === triNum) ||
          (g.studentName === studentName && normalizeClass(g.className) === normalizeClass(className) && g.trimester === triNum)
      );

      const cont = item.continuousScore === "" || item.continuousScore === null ? undefined : Number(item.continuousScore);
      const t1 = item.test1Score === "" || item.test1Score === null ? undefined : Number(item.test1Score);
      const t2 = item.test2Score === "" || item.test2Score === null ? undefined : Number(item.test2Score);
      const exam = item.examScore === "" || item.examScore === null ? undefined : Number(item.examScore);

      const { termAvg, isPendingExam } = calculateTermAverage(cont, t1, t2, exam);

      let apprec = item.appreciation;
      if (!apprec) {
        if (isPendingExam) {
          apprec = "قيد المتابعة والتقويم (في انتظار الاختبار الفصلي) ⏳";
        } else if (typeof termAvg === "number") {
          if (termAvg >= 18) apprec = "ممتاز جداً 🌟 واصل التألق";
          else if (termAvg >= 15) apprec = "جيد جداً 👏 نتائج مشجعة";
          else if (termAvg >= 12) apprec = "مقبول إلى جيد 👍 بالإمكان أفضل";
          else if (termAvg >= 10) apprec = "مقبول، يحتاج لمضاعفة الجهد 📖";
          else apprec = "دون المتوسط، يحتاج مرافقة ودعم جاد ⚠️";
        }
      }

      const updatedRecord: StudentGradeRecord = {
        id: recordKey,
        studentId: studentId || `sid_${studentName}`,
        studentName,
        className,
        academicYear: "2026/2027",
        trimester: triNum,
        continuousScore: cont,
        test1Score: t1,
        test2Score: t2,
        examScore: exam,
        termAverage: termAvg,
        appreciation: apprec,
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        allGrades[existingIdx] = {
          ...allGrades[existingIdx],
          ...updatedRecord,
        };
      } else {
        allGrades.push(updatedRecord);
      }
    }

    // حساب الترتيب لجميع تلاميذ كل قسم تلقائياً
    const classesSet = new Set(allGrades.map((g) => normalizeClass(g.className)));
    for (const cls of classesSet) {
      const clsGrades = allGrades
        .filter((g) => normalizeClass(g.className) === cls && g.trimester === triNum && typeof g.termAverage === "number")
        .sort((a, b) => (b.termAverage || 0) - (a.termAverage || 0));

      clsGrades.forEach((g, idx) => {
        g.rank = idx + 1;
        g.totalStudents = clsGrades.length;
      });
    }

    data.gradebookRecords = allGrades;
    await saveLessonsData(data);

    return NextResponse.json({
      success: true,
      message: `تم حفظ وتحديث ${updates.length} علامة بنجاح ومزامنتها سحابياً.`,
    });
  } catch (err: any) {
    console.error("Save grades error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ النقاط: " + (err.message || "") },
      { status: 500 }
    );
  }
}
