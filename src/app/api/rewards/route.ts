import { NextRequest, NextResponse } from "next/server";
import { getLessonsData } from "@/lib/storage";
import {
  REWARD_TIERS,
  REWARD_REGULATION_NOTICE,
  RewardChallengeTierId,
} from "@/lib/types";
import { verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeClass(raw?: string): string {
  if (!raw) return "1م1";
  const s = raw.replace(/\s+/g, "").trim();
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

function determineStudentTier(test1Score: any): RewardChallengeTierId {
  const num = typeof test1Score === "number" ? test1Score : parseFloat(test1Score);
  if (isNaN(num)) {
    return "tier1_remontada";
  }
  if (num < 5) return "tier1_remontada";
  if (num < 10) return "tier2_full_mark";
  if (num < 15) return "tier3_excellence";
  return "tier4_elite";
}

export async function GET(req: NextRequest) {
  try {
    const data = await getLessonsData();
    const roster = data.studentRoster || [];
    const gradeRecords = data.gradebookRecords || [];
    const submissions = data.rewardSubmissions || [];

    // استخراج التلاميذ وتحديد فئاتهم بدون كشف أي نقاط حقيقية
    const studentsMap = new Map<string, { studentName: string; className: string; tierId: RewardChallengeTierId; studentId?: string }>();

    // 1. من سجل النقاط
    for (const g of gradeRecords) {
      const name = (g.studentName || "").trim();
      const cls = normalizeClass(g.className);
      if (!name) continue;
      const key = `${name}_${cls}`;
      const tierId = determineStudentTier(g.test1Score);
      studentsMap.set(key, {
        studentId: g.studentId || g.id,
        studentName: name,
        className: cls,
        tierId,
      });
    }

    // 2. من قائمة التلاميذ المتبقين إن لم يكونوا في سجل النقاط
    for (const r of roster) {
      const name = (r.studentName || "").trim();
      const cls = normalizeClass(r.className);
      if (!name) continue;
      const key = `${name}_${cls}`;
      if (!studentsMap.has(key)) {
        studentsMap.set(key, {
          studentId: r.id,
          studentName: name,
          className: cls,
          tierId: "tier1_remontada",
        });
      }
    }

    const students = Array.from(studentsMap.values()).sort((a, b) =>
      a.studentName.localeCompare(b.studentName, "ar")
    );

    const classes = ["1م1", "1م2", "1م3", "2م3"];

    // إحصائيات التوزيع
    const stats: Record<string, { total: number; [key: string]: number }> = {};
    for (const c of classes) {
      stats[c] = { total: 0, tier1_remontada: 0, tier2_full_mark: 0, tier3_excellence: 0, tier4_elite: 0 };
    }
    for (const s of students) {
      if (stats[s.className]) {
        stats[s.className].total++;
        stats[s.className][s.tierId] = (stats[s.className][s.tierId] || 0) + 1;
      }
    }

    // التحقق هل الأستاذ مسجل دخوله لعرض معلومات إضافية
    const isAdmin = await verifyAdminSession();

    return NextResponse.json({
      classes,
      tiers: REWARD_TIERS,
      notice: REWARD_REGULATION_NOTICE,
      students,
      stats,
      totalStudents: students.length,
      // بيانات إضافية للأستاذ فقط
      ...(isAdmin
        ? {
            submissions,
            pendingSubmissionsCount: submissions.filter((s) => s.status === "pending").length,
            approvedSubmissionsCount: submissions.filter((s) => s.status === "approved").length,
          }
        : {
            submissionsCount: submissions.length,
            approvedSubmissionsCount: submissions.filter((s) => s.status === "approved").length,
          }),
    });
  } catch (error: any) {
    console.error("Error in /api/rewards:", error);
    return NextResponse.json(
      { error: error.message || "تعذر جلب بيانات التحدي" },
      { status: 500 }
    );
  }
}
