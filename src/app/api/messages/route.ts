import { NextRequest, NextResponse } from "next/server";
import { getLessonsData, saveLessonsData } from "@/lib/storage";
import { verifyAdminSession } from "@/lib/auth";
import { AnonymousMessage, MessageCategory } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// توليد رمز تتبع فريد وسهل الحفظ للمرسل (مثلاً: M-4821)
function generateTrackingCode(existingMessages: AnonymousMessage[]): string {
  const existingCodes = new Set(existingMessages.map((m) => m.trackingCode).filter(Boolean));
  for (let i = 0; i < 50; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const code = `M-${num}`;
    if (!existingCodes.has(code)) return code;
  }
  return `M-${Date.now().toString().slice(-5)}`;
}

// إرسال رسالة (مفتوح للجميع: تلميذ، ولي أمر... مع خيار إبقاء الهوية مجهولة أو وضع بيانات اختيارية)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      category = "other",
      targetLevel,
      studentName,
      senderName,
      senderPhone,
      className,
    } = body;

    const trimmedContent = (content || "").trim();
    if (!trimmedContent || trimmedContent.length < 3) {
      return NextResponse.json(
        { error: "يرجى كتابة نص الرسالة (3 أحرف على الأقل)" },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 3000) {
      return NextResponse.json(
        { error: "الرسالة طويلة جداً (الحد الأقصى 3000 حرف)" },
        { status: 400 }
      );
    }

    const data = await getLessonsData();
    data.anonymousMessages = data.anonymousMessages || [];

    const trackingCode = generateTrackingCode(data.anonymousMessages);

    const newMessage: AnonymousMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: (category as MessageCategory) || "other",
      targetLevel: targetLevel ? String(targetLevel).trim() : undefined,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      read: false,
      trackingCode,
      // الحقول الاختيارية (إذا تم إدخالها من طرف الولي أو التلميذ)
      studentName: studentName ? String(studentName).trim().slice(0, 80) : undefined,
      senderName: senderName ? String(senderName).trim().slice(0, 80) : undefined,
      senderPhone: senderPhone ? String(senderPhone).trim().slice(0, 30) : undefined,
      className: className ? String(className).trim().slice(0, 40) : undefined,
    };

    data.anonymousMessages.unshift(newMessage);
    await saveLessonsData(data);

    return NextResponse.json({
      success: true,
      trackingCode,
      message: "تم إرسال رسالتك بنجاح! احتفظ برمز المتابعة لمراجعة رد الأستاذ لاحقاً.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً" },
      { status: 500 }
    );
  }
}

// قراءة الرسائل:
// 1. برمز التتبع (مفتوح لصاحب الرسالة لمتابعة الرد)
// 2. الأسئلة العامة المنشورة (مفتوح للعموم)
// 3. كل الرسائل (للأستاذ فقط بعد تسجيل الدخول)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackingCode = searchParams.get("trackingCode");
  const isPublicOnly = searchParams.get("public") === "true";

  const data = await getLessonsData();
  const list = (data.anonymousMessages || []).slice();

  // حالة 1: تتبع رسالة محددة برمز التتبع الخاص بالمرسل
  if (trackingCode) {
    const cleanCode = trackingCode.trim().toUpperCase();
    const found = list.find(
      (m) => (m.trackingCode || "").toUpperCase() === cleanCode
    );

    if (!found) {
      return NextResponse.json(
        { error: "لم يتم العثور على أي رسالة بهذا الرمز. تأكد من كتابته بدقة." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: {
        id: found.id,
        category: found.category,
        targetLevel: found.targetLevel,
        studentName: found.studentName,
        className: found.className,
        content: found.content,
        createdAt: found.createdAt,
        trackingCode: found.trackingCode,
        hasReply: Boolean(found.reply?.content),
        reply: found.reply,
      },
    });
  }

  // حالة 2: عرض الاستفسارات والإجابات العامة المنشورة
  if (isPublicOnly) {
    const publicList = list
      .filter((m) => m.reply && m.reply.isPublic && m.reply.content)
      .map((m) => ({
        id: m.id,
        category: m.category,
        targetLevel: m.targetLevel,
        className: m.className,
        content: m.content,
        createdAt: m.createdAt,
        reply: m.reply,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ messages: publicList });
  }

  // حالة 3: قراءة كافة الرسائل (للأستاذ المشرف فقط)
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "غير مصرح لك - هذه الرسائل سرية للأستاذ فقط" },
      { status: 401 }
    );
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(
    { messages: list },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

// تحديث حالة الرسالة أو إضافة رد الأستاذ (للأستاذ فقط)
export async function PATCH(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, read, replyContent, isPublic } = body;

    if (!id) {
      return NextResponse.json({ error: "معرّف الرسالة مطلوب" }, { status: 400 });
    }

    const data = await getLessonsData();
    data.anonymousMessages = data.anonymousMessages || [];

    const msg = data.anonymousMessages.find((m) => m.id === id);
    if (!msg) {
      return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 });
    }

    // إذا تم تمرير رد الأستاذ
    if (replyContent !== undefined) {
      const trimmedReply = String(replyContent || "").trim();
      if (trimmedReply) {
        msg.reply = {
          content: trimmedReply,
          repliedAt: new Date().toISOString(),
          isPublic: Boolean(isPublic),
        };
        msg.read = true; // تعتبر مقروءة تلقائياً عند الرد
      } else {
        delete msg.reply; // إمكانية إزالة الرد
      }
    }

    // إذا تم تمرير حالة القراءة فقط
    if (read !== undefined) {
      msg.read = Boolean(read);
    }

    await saveLessonsData(data);

    return NextResponse.json({ success: true, message: msg });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "حدث خطأ" }, { status: 500 });
  }
}

// حذف رسالة (للأستاذ فقط)
export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرّف الرسالة مطلوب" }, { status: 400 });
    }

    const data = await getLessonsData();
    data.anonymousMessages = (data.anonymousMessages || []).filter((m) => m.id !== id);

    await saveLessonsData(data);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}
