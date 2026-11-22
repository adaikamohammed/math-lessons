import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData, uploadRewardProofFile } from "@/lib/storage";
import { RewardProofSubmission, RewardChallengeTierId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const studentName = formData.get("studentName") as string;
    const className = formData.get("className") as string;
    const tierId = formData.get("tierId") as RewardChallengeTierId;
    const parentPhone = (formData.get("parentPhone") as string) || "";
    const notes = (formData.get("notes") as string) || "";
    const file = formData.get("file") as File | null;

    if (!studentName || !studentName.trim()) {
      return NextResponse.json({ error: "يرجى تحديد اسم التلميذ" }, { status: 400 });
    }

    if (!className || !className.trim()) {
      return NextResponse.json({ error: "يرجى تحديد القسم" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json(
        { error: "يرجى إرفاق صورة واضحة لكشف النقاط أو ورقة الاختبار" },
        { status: 400 }
      );
    }

    // رفع صورة كشف النقاط
    const { url } = await uploadRewardProofFile(file, file.name || "bulletin.jpg");

    const data = await getLessonsData();
    data.rewardSubmissions = data.rewardSubmissions || [];

    const newSubmission: RewardProofSubmission = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentName: studentName.trim(),
      className: className.trim(),
      tierId: tierId || "tier1_remontada",
      parentPhone: parentPhone.trim(),
      proofImageUrl: url,
      notes: notes.trim(),
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    data.rewardSubmissions.unshift(newSubmission);
    await saveLessonsData(data);

    return NextResponse.json({
      success: true,
      message: "تم إرسال صورة كشف النقاط بنجاح للأستاذ محمد عدايكة، وسيتم مراجعتها وتأكيد التكريم قريباً بإذن الله",
      submission: newSubmission,
    });
  } catch (error: any) {
    console.error("Error in /api/rewards/claim:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء رفع صورة كشف النقاط" },
      { status: 500 }
    );
  }
}
