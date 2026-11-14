import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";
import { StudentRosterItem, StudentGradeRecord } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export function normalizeClass(cls?: string): string {
  if (!cls) return "1م1";
  const s = cls.replace(/\s+/g, "").trim();
  if (s === "1م1" || s === "1-1" || s === "11") return "1م1";
  if (s === "1م2" || s === "2م1" || s === "1-2" || s === "12" || s === "م12") return "1م2";
  if (s === "1م3" || s === "3م1" || s === "1-3" || s === "13" || s === "م13") return "1م3";
  if (s === "2م3" || s === "3م2" || s === "2-3" || s === "23" || s === "م23") return "2م3";
  if (s.startsWith("1م") || s.endsWith("م1")) {
    if (s.includes("1")) return "1م1";
    if (s.includes("2")) return "1م2";
    if (s.includes("3")) return "1م3";
  }
  if (s.startsWith("2م") || s.endsWith("م2")) {
    return "2م3";
  }
  return s;
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "غير مصرح لك - يرجى تسجيل الدخول كأستاذ أولاً" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { rawJson, studentsList, gradesList, mode = "merge" } = body;

    let parsedPayload: any = null;
    if (rawJson) {
      if (typeof rawJson === "string") {
        try {
          parsedPayload = JSON.parse(rawJson);
        } catch {
          return NextResponse.json(
            { error: "صيغة ملف JSON غير صحيحة. يرجى التأكد من نسخ النص كاملاً." },
            { status: 400 }
          );
        }
      } else {
        parsedPayload = rawJson;
      }
    }

    const currentData = await getLessonsData();
    let currentRoster = mode === "replace" ? [] : [...(currentData.studentRoster || [])];
    let currentGrades = [...(currentData.gradebookRecords || [])];

    // استخراج قائمة التلاميذ المحتملة من مختلف الصيغ المعتمدة في جسور
    const incomingStudents: any[] = [];
    if (Array.isArray(studentsList)) {
      incomingStudents.push(...studentsList);
    } else if (parsedPayload) {
      if (Array.isArray(parsedPayload)) {
        incomingStudents.push(...parsedPayload);
      } else if (Array.isArray(parsedPayload.studentRoster)) {
        incomingStudents.push(...parsedPayload.studentRoster);
      } else if (Array.isArray(parsedPayload.students)) {
        incomingStudents.push(...parsedPayload.students);
      } else if (Array.isArray(parsedPayload.data?.students)) {
        incomingStudents.push(...parsedPayload.data.students);
      }
    }

    // استخراج سجلات النقاط المحتملة إن وجدت في الملف
    const incomingGrades: any[] = [];
    if (Array.isArray(gradesList)) {
      incomingGrades.push(...gradesList);
    } else if (parsedPayload) {
      if (Array.isArray(parsedPayload.gradebookRecords)) {
        incomingGrades.push(...parsedPayload.gradebookRecords);
      } else if (Array.isArray(parsedPayload.grades)) {
        incomingGrades.push(...parsedPayload.grades);
      } else if (Array.isArray(parsedPayload.data?.gradebookRecords)) {
        incomingGrades.push(...parsedPayload.data.gradebookRecords);
      }
    }

    let addedStudentsCount = 0;
    let updatedStudentsCount = 0;

    // معالجة وإدراج التلاميذ
    for (const raw of incomingStudents) {
      const name = (raw.studentName || raw.name || raw.fullName || "").trim();
      const cls = (raw.className || raw.class || raw.section || "").trim();
      if (!name || !cls) continue;

      const birthDate = raw.birthDate || raw.dob || raw.dateOfBirth || "";
      const groupName = raw.groupName || raw.group || (raw.subGroup === 2 ? "فوج 2" : "فوج 1");
      const gender = raw.gender || (raw.sex === "F" ? "F" : "M");
      const isRepeater = Boolean(raw.isRepeater || raw.repeater);
      const parentPhone = raw.parentPhone || raw.phone || "";
      const notes = raw.notes || "";

      const normName = normalizeArabic(name);
      const normCls = normalizeClass(cls);

      const existingIndex = currentRoster.findIndex(
        (s) =>
          normalizeArabic(s.studentName) === normName &&
          normalizeClass(s.className) === normCls
      );

      if (existingIndex >= 0) {
        // تحديث البيانات الإضافية كتاريخ الميلاد أو الهاتف
        const existing = currentRoster[existingIndex];
        currentRoster[existingIndex] = {
          ...existing,
          birthDate: birthDate || existing.birthDate,
          groupName: groupName || existing.groupName,
          gender: gender || existing.gender,
          isRepeater: isRepeater ?? existing.isRepeater,
          parentPhone: parentPhone || existing.parentPhone,
          notes: notes || existing.notes,
        };
        updatedStudentsCount++;
      } else {
        // إضافة تلميذ جديد
        const newStudent: StudentRosterItem = {
          id: raw.id || `rst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          studentName: name,
          className: cls,
          groupName: groupName as any,
          birthDate,
          gender,
          isRepeater,
          parentPhone,
          notes,
        };
        currentRoster.push(newStudent);
        addedStudentsCount++;
      }
    }

    // معالجة وإدراج النقاط
    let addedGradesCount = 0;
    for (const rawG of incomingGrades) {
      const gName = (rawG.studentName || rawG.name || "").trim();
      const gCls = (rawG.className || rawG.class || "").trim();
      const trimester = Number(rawG.trimester || 1) as 1 | 2 | 3;

      if (!gName) continue;

      const normGName = normalizeArabic(gName);
      const normGCls = normalizeClass(gCls);

      const targetStudent = currentRoster.find(
        (s) =>
          normalizeArabic(s.studentName) === normGName &&
          (!gCls || normalizeClass(s.className) === normGCls)
      );

      const studentId = targetStudent ? targetStudent.id : rawG.studentId || `sid_${normGName}`;
      const resolvedCls = targetStudent ? targetStudent.className : gCls;

      const recordKey = `${studentId}_T${trimester}`;
      const existingGradeIndex = currentGrades.findIndex(
        (g) =>
          (g.id === recordKey || g.id === rawG.id) ||
          (g.studentId === studentId && g.trimester === trimester)
      );

      const gradeRecord: StudentGradeRecord = {
        id: recordKey,
        studentId,
        studentName: gName,
        className: resolvedCls,
        academicYear: rawG.academicYear || "2026/2027",
        trimester,
        continuousScore: typeof rawG.continuousScore === "number" ? rawG.continuousScore : rawG.monitoringAverage,
        test1Score: typeof rawG.test1Score === "number" ? rawG.test1Score : (typeof rawG.testScore === "number" ? rawG.testScore : undefined),
        test2Score: typeof rawG.test2Score === "number" ? rawG.test2Score : undefined,
        examScore: typeof rawG.examScore === "number" ? rawG.examScore : undefined,
        termAverage: typeof rawG.termAverage === "number" ? rawG.termAverage : undefined,
        rank: rawG.rank,
        appreciation: rawG.appreciation,
        customScores: rawG.customScores,
        evaluatedColumns: rawG.evaluatedColumns,
        updatedAt: new Date().toISOString(),
      };

      if (existingGradeIndex >= 0) {
        currentGrades[existingGradeIndex] = {
          ...currentGrades[existingGradeIndex],
          ...gradeRecord,
        };
      } else {
        currentGrades.push(gradeRecord);
      }
      addedGradesCount++;
    }

    // في حال الاستبدال أو الحذف: حذف أي تقييمات أو نقاط للتلاميذ الذين لم يعودوا في القائمة
    if (mode === "replace") {
      const rosterKeys = new Set(
        currentRoster.map(
          (s) => `${(s.studentName || "").trim().toLowerCase()}_${normalizeClass(s.className)}`
        )
      );
      currentData.evaluations = (currentData.evaluations || []).filter((e) =>
        rosterKeys.has(`${(e.studentName || "").trim().toLowerCase()}_${normalizeClass(e.className)}`)
      );
      currentGrades = currentGrades.filter((g) =>
        rosterKeys.has(`${(g.studentName || "").trim().toLowerCase()}_${normalizeClass(g.className)}`)
      );
    }

    // حفظ التغييرات وتحديث Vercel Blob بعد توحيد أسماء الأفواج بدقة
    currentData.studentRoster = currentRoster.map((s) => ({ ...s, className: normalizeClass(s.className) }));
    currentData.evaluations = (currentData.evaluations || []).map((e) => ({ ...e, className: normalizeClass(e.className) }));
    currentData.gradebookRecords = currentGrades.map((g) => ({ ...g, className: normalizeClass(g.className) }));
    await saveLessonsData(currentData);

    return NextResponse.json({
      success: true,
      message: `تم بنجاح استيراد ${addedStudentsCount} تلميذاً جديداً، وتحديث ${updatedStudentsCount} تلميذاً، ومزامنة ${addedGradesCount} سجلاً للنقاط.`,
      stats: {
        totalRoster: currentRoster.length,
        addedStudentsCount,
        updatedStudentsCount,
        addedGradesCount,
      },
    });
  } catch (err: any) {
    console.error("Import students error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء استيراد البيانات: " + (err.message || "") },
      { status: 500 }
    );
  }
}
