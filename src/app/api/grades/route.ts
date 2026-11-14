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
        behaviorScore: g?.behaviorScore ?? "",
        quiz1Score: g?.quiz1Score ?? "",
        homework1Score: g?.homework1Score ?? "",
        quiz2Score: g?.quiz2Score ?? "",
        homework2Score: g?.homework2Score ?? "",
        notebook1Score: g?.notebook1Score ?? "",
        notebook2Score: g?.notebook2Score ?? "",
        bonusScore: g?.bonusScore ?? "",
        continuousScore: g?.continuousScore ?? "",
        test1Score: g?.test1Score ?? "",
        test2Score: g?.test2Score ?? "",
        continuousMonitoring: g?.continuousMonitoring ?? "",
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
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
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

      const clamp = (v: any, max: number): any => {
        if (v === "" || v === undefined || v === null || v === "—" || v === "-") return v ?? "";
        if (v === "غ" || v === "غياب") return "غ";
        const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[,،]/g, "."));
        if (isNaN(n)) return v;
        return Math.min(max, Math.max(0, n));
      };

      const beh = clamp(item.behaviorScore, 4);
      const q1 = clamp(item.quiz1Score, 4);
      const hw1 = clamp(item.homework1Score, 2);
      const q2 = clamp(item.quiz2Score, 4);
      const hw2 = clamp(item.homework2Score, 2);
      const nb1 = clamp(item.notebook1Score, 2);
      const nb2 = clamp(item.notebook2Score, 2);
      const bon = clamp(item.bonusScore, 5);

      const contRaw = clamp(item.continuousScore, 20);
      const cont = contRaw === "" || contRaw === undefined ? undefined : contRaw;
      const t1Raw = clamp(item.test1Score, 20);
      const t1 = t1Raw === "" || t1Raw === undefined ? undefined : t1Raw;
      const t2Raw = clamp(item.test2Score, 20);
      const t2 = t2Raw === "" || t2Raw === undefined ? undefined : t2Raw;
      const examRaw = clamp(item.examScore, 20);
      const exam = examRaw === "" || examRaw === undefined ? undefined : examRaw;

      const numCont = typeof cont === "number" ? cont : undefined;
      const numT1 = typeof t1 === "number" ? t1 : undefined;
      const numT2 = typeof t2 === "number" ? t2 : undefined;
      const numExam = typeof exam === "number" ? exam : undefined;

      const { termAvg, isPendingExam } = calculateTermAverage(numCont, numT1, numT2, numExam);

      let continuousMonitoringVal = clamp(item.continuousMonitoring, 20);
      if (continuousMonitoringVal === undefined || continuousMonitoringVal === "" || continuousMonitoringVal === null) {
        if (typeof numCont === "number" && typeof numT1 === "number") {
          continuousMonitoringVal = Number(((numCont + numT1) / 2).toFixed(2));
        } else if (typeof numCont === "number") {
          continuousMonitoringVal = numCont;
        } else if (typeof numT1 === "number") {
          continuousMonitoringVal = numT1;
        }
      }

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
        behaviorScore: beh,
        quiz1Score: q1,
        homework1Score: hw1,
        quiz2Score: q2,
        homework2Score: hw2,
        notebook1Score: nb1,
        notebook2Score: nb2,
        bonusScore: bon,
        continuousScore: cont,
        test1Score: t1,
        test2Score: t2,
        continuousMonitoring: continuousMonitoringVal,
        examScore: exam,
        termAverage: item.termAverage ? Number(clamp(item.termAverage, 20)) : termAvg,
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
        .sort((a, b) => (Number(b.termAverage) || 0) - (Number(a.termAverage) || 0));

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
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err: any) {
    console.error("Save grades error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ النقاط: " + (err.message || "") },
      { status: 500 }
    );
  }
}
