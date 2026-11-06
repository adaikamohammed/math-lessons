"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Send,
  HelpCircle,
  Lightbulb,
  Scale,
  MessageCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  GraduationCap,
} from "lucide-react";
import { MessageCategory, AnonymousMessage } from "@/lib/types";

const CATEGORIES: {
  id: MessageCategory;
  label: string;
  icon: any;
  color: string;
  desc: string;
}[] = [
  {
    id: "question",
    label: "سؤال حول درس أو تمرين",
    icon: HelpCircle,
    color: "from-blue-600 to-indigo-600",
    desc: "نقطة لم تفهمها في القسم أو صعوبة في حل تمرين",
  },
  {
    id: "suggestion",
    label: "اقتراح أو فكرة تطويرية",
    icon: Lightbulb,
    color: "from-amber-500 to-yellow-600",
    desc: "فكرة لتحسين الحصة، تنظيم التمارين أو الموقع",
  },
  {
    id: "criticism",
    label: "نقد بنّاء أو ملاحظة صريحة",
    icon: Scale,
    color: "from-purple-600 to-pink-600",
    desc: "ملاحظة حول وتيرة الشرح، المعاملة، أو أي استياء لمعالجته",
  },
  {
    id: "other",
    label: "استفسار أو رسالة عامة",
    icon: MessageCircle,
    color: "from-emerald-600 to-teal-600",
    desc: "أي رسالة تود توجيهها للأستاذ بكل صدق وشفافية",
  },
];

const AUDIENCES = [
  { id: "", label: "🔒 بدون تحديد (سري تماماً)" },
  { id: "1 متوسط", label: "1 متوسط" },
  { id: "2 متوسط", label: "2 متوسط" },
  { id: "ولي أمر", label: "ولي أمر تلميذ" },
];

const CLASSES_LIST = ["1 م 1", "1 م 2", "1 م 3", "2 م 3", "أخرى"];

interface LocalStoredMessage {
  code: string;
  date: string;
  snippet: string;
  studentName?: string;
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<"write" | "track" | "public">("write");

  // بيانات النموذج
  const [category, setCategory] = useState<MessageCategory>("question");
  const [targetLevel, setTargetLevel] = useState("");
  const [content, setContent] = useState("");
  const [studentName, setStudentName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [className, setClassName] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // حالات الإرسال
  const [sending, setSending] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // حالات التتبع
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackedMessage, setTrackedMessage] = useState<AnonymousMessage | null>(null);
  const [myStoredCodes, setMyStoredCodes] = useState<LocalStoredMessage[]>([]);

  // الأسئلة العامة
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);

  // استرجاع الأكواد المحفوظة محلياً عند بدء التشغيل
  useEffect(() => {
    try {
      const stored = localStorage.getItem("math_my_message_codes");
      if (stored) {
        setMyStoredCodes(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // جلب الأسئلة العامة
  const loadPublicMessages = async () => {
    try {
      setLoadingPublic(true);
      const res = await fetch("/api/messages?public=true", { cache: "no-store" });
      const data = await res.json();
      setPublicMessages(data.messages || []);
    } catch {
      setPublicMessages([]);
    } finally {
      setLoadingPublic(false);
    }
  };

  const handleTabChange = (tab: "write" | "track" | "public") => {
    setActiveTab(tab);
    if (tab === "public" && publicMessages.length === 0) {
      loadPublicMessages();
    }
  };

  // إرسال الرسالة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg("يرجى كتابة نص رسالتك أولاً");
      return;
    }
    if (content.trim().length < 5) {
      setErrorMsg("يرجى توضيح رسالتك أكثر (5 أحرف على الأقل)");
      return;
    }

    setSending(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          targetLevel: targetLevel || undefined,
          content: content.trim(),
          studentName: studentName.trim() || undefined,
          senderName: senderName.trim() || undefined,
          senderPhone: senderPhone.trim() || undefined,
          className: className.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.trackingCode) {
        setSuccessCode(data.trackingCode);

        // حفظ الكود محلياً
        const newStored: LocalStoredMessage = {
          code: data.trackingCode,
          date: new Date().toLocaleDateString("ar-DZ", { month: "short", day: "numeric" }),
          snippet: content.trim().slice(0, 60),
          studentName: studentName.trim() || undefined,
        };
        const updatedList = [newStored, ...myStoredCodes.filter((c) => c.code !== data.trackingCode)];
        setMyStoredCodes(updatedList);
        try {
          localStorage.setItem("math_my_message_codes", JSON.stringify(updatedList));
        } catch {
          // ignore
        }

        // تفريغ الحقول
        setContent("");
        setStudentName("");
        setSenderName("");
        setSenderPhone("");
        setClassName("");
      } else {
        setErrorMsg(data.error || "حدث خطأ أثناء الإرسال");
      }
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى المحاولة بعد قليل");
    } finally {
      setSending(false);
    }
  };

  // نسخ كود التتبع
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // البحث عن رسالة برمز التتبع
  const handleTrackCode = async (codeToSearch?: string) => {
    const code = (codeToSearch || trackingInput).trim().toUpperCase();
    if (!code) {
      setTrackingError("يرجى إدخال رمز المتابعة (مثلاً: M-4821)");
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");
    setTrackedMessage(null);

    try {
      const res = await fetch(`/api/messages?trackingCode=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok && data.message) {
        setTrackedMessage(data.message);
      } else {
        setTrackingError(data.error || "لم يتم العثور على أي رسالة بهذا الرمز");
      }
    } catch {
      setTrackingError("تعذر الاتصال بالخادم، يرجى إعادة المحاولة");
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="pb-16 pt-3 fade-up space-y-4" dir="rtl">
      {/* رأس الصفحة وزر العودة */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition shrink-0"
          aria-label="الرجوع للرئيسية"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 mb-0.5">
            <Lock className="w-3 h-3 text-emerald-600" /> خصوصية وشفافية 100%
          </div>
          <h1 className="text-base font-extrabold text-slate-900 truncate">
            صندوق الصراحة والتواصل
          </h1>
          <p className="text-[11px] text-slate-500">
            تواصل مباشر وسري مع الأستاذ محمد عدايكة — أستاذ الرياضيات
          </p>
        </div>
      </div>

      {/* شريط التبويبات التفاعلي */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 text-xs font-bold">
        <button
          onClick={() => handleTabChange("write")}
          className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "write"
              ? "bg-white text-slate-900 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>إرسال رسالة</span>
        </button>

        <button
          onClick={() => handleTabChange("track")}
          className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "track"
              ? "bg-white text-slate-900 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>متابعة والردود</span>
          {myStoredCodes.length > 0 && (
            <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
              {myStoredCodes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("public")}
          className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "public"
              ? "bg-white text-slate-900 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>إجابات عامة</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. تبويب كتابة رسالة جديدة */}
      {/* ======================================================== */}
      {activeTab === "write" && (
        <div className="space-y-4">
          {/* ميثاق الأمان والسرية */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 rounded-3xl shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-200 shrink-0" />
              <h2 className="text-xs sm:text-sm font-black text-white">
                سرية كاملة وحرية تعبير مضمونة 🔒
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-50 leading-relaxed font-medium">
              هذا الصندوق مخصص لتعزيز التواصل البنّاء بين الأستاذ وتلاميذه وأوليائهم. يمكنك إرسال
              رسالتك مجهولة الهوية 100% دون ذكر اسمك، أو وضع اسم التلميذ ورقم الهاتف اختيارياً إن
              رغبت في تلقي رد خاص ومباشر من الأستاذ.
            </p>
          </div>

          {successCode ? (
            /* شاشة نجاح الإرسال مع كود التتبع */
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm text-center space-y-4 fade-up">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900">
                  تم إرسال رسالتك بنجاح للأستاذ!
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  شكراً لصراحتك وحرصك. تم حفظ رسالتك وتخصيص رمز متابعة سري خاص بها للاطلاع على رد الأستاذ فور كتابته.
                </p>
              </div>

              {/* بطاقة كود التتبع */}
              <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 max-w-xs mx-auto space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">
                  رمز المتابعة السري الخاص بك:
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-black text-emerald-700 tracking-wider">
                    {successCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(successCode)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                    title="نسخ الرمز"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {copiedCode && (
                  <span className="text-[10px] font-bold text-emerald-600 block animate-fade-in">
                    ✓ تم نسخ الرمز إلى الحافظة!
                  </span>
                )}
                <p className="text-[10px] text-slate-400">
                  تم حفظ الرمز تلقائياً في جهازك لسهولة المتابعة
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => {
                    setActiveTab("track");
                    handleTrackCode(successCode);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>متابعة حالة الرسالة والرد</span>
                </button>
                <button
                  onClick={() => setSuccessCode(null)}
                  className="py-2.5 px-5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-slate-200 transition"
                >
                  كتابة رسالة أخرى
                </button>
              </div>
            </div>
          ) : (
            /* نموذج كتابة الرسالة */
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-4"
            >
              {/* 1. نوع وموضوع الرسالة */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-2">
                  1. ما هو موضوع رسالتك؟:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-right transition flex items-start gap-2.5 ${
                          active
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            active ? "bg-white/20 text-white" : "bg-white text-slate-700 shadow-2xs"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black">{cat.label}</div>
                          <div
                            className={`text-[10px] mt-0.5 leading-snug ${
                              active ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {cat.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. الصف أو الصفة */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-800">
                    2. الصف أو الصفة (اختياري تماماً):
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    لتحديد سياق الملاحظة
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {AUDIENCES.map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setTargetLevel(aud.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                        targetLevel === aud.id
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. صندوق المعلومات الإضافية (اختياري تماماً) */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="w-full p-3 flex items-center justify-between text-right hover:bg-slate-100/80 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        إضافة معلومات التلميذ أو الولي (اختياري ليس إجباري)
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        إذا رغبت في أن يعرف الأستاذ ابنك أو يتواصل معك هاتفياً/واتساب
                      </span>
                    </div>
                  </div>
                  {showOptionalFields ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {showOptionalFields && (
                  <div className="p-3.5 pt-1 space-y-3 border-t border-slate-200/60 bg-white fade-up">
                    <p className="text-[11px] text-slate-500 bg-amber-50/80 border border-amber-200/60 p-2.5 rounded-xl font-medium leading-relaxed">
                      💡 <strong>ملاحظة هامة:</strong> هذه الحقول اختيارية 100%. إذا تركتها فارغة، ستصل رسالتك مجهولة الهوية تماماً ولن يعرف الأستاذ صاحبها.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* اسم التلميذ */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          اسم ولقب التلميذ (اختياري):
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="مثال: محمد بن علي"
                            className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* القسم / الفوج */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          القسم / الفوج (اختياري):
                        </label>
                        <select
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="">-- اختر القسم إن أردت --</option>
                          {CLASSES_LIST.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* اسم الولي أو المرسل */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          اسم الولي أو صلتك بالتلميذ (اختياري):
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="مثال: ولي أمر التلميذ (الأب / الأم)"
                            className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* رقم الهاتف / واتساب */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          رقم الهاتف / واتساب للرد المباشر (اختياري):
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={senderPhone}
                            onChange={(e) => setSenderPhone(e.target.value)}
                            placeholder="06XXXXXXXX أو 07XXXXXXXX"
                            className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. نص الرسالة */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-800">
                    3. اكتب رسالتك وملاحظتك بكل حرية وصراحة: <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {content.length} / 3000
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب هنا ما تشاء بكل صراحة... مثلاً: لم أفهم طريقة حل التمرين الفلاني، أو استفسار حول كراس الدروس أو الواجب، أو اقتراح بيداغوجي..."
                  rows={5}
                  maxLength={3000}
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition leading-relaxed"
                  required
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* زر الإرسال */}
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال الرسالة...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال الرسالة للأستاذ 🔒</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. تبويب متابعة الرسائل وردود الأستاذ */}
      {/* ======================================================== */}
      {activeTab === "track" && (
        <div className="space-y-4 fade-up">
          {/* صندوق البحث بكود التتبع */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
            <div>
              <h2 className="text-xs font-black text-slate-900 block mb-1">
                البحث برمز المتابعة السري:
              </h2>
              <p className="text-[11px] text-slate-500">
                أدخل رمز المتابعة الذي حصلت عليه عند إرسال رسالتك (مثل: M-4821)
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                placeholder="مثال: M-4821"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 px-3.5 text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => handleTrackCode()}
                disabled={trackingLoading || !trackingInput.trim()}
                className="py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {trackingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>بحث</span>
              </button>
            </div>

            {trackingError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{trackingError}</span>
              </div>
            )}
          </div>

          {/* نتيجة البحث عن الرسالة المحددة */}
          {trackedMessage && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 fade-up">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                    {trackedMessage.trackingCode}
                  </span>
                  {trackedMessage.studentName && (
                    <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                      التلميذ: {trackedMessage.studentName}
                    </span>
                  )}
                  {trackedMessage.className && (
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                      {trackedMessage.className}
                    </span>
                  )}
                </div>

                {trackedMessage.reply?.content ? (
                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم رد الأستاذ بنجاح ✓</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    <span>في انتظار مراجعة ورد الأستاذ ⏳</span>
                  </span>
                )}
              </div>

              {/* نص الرسالة الأصلية */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">نص رسالتك:</span>
                <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 whitespace-pre-line font-medium">
                  {trackedMessage.content}
                </p>
                <div className="text-[10px] text-slate-400 pt-1 text-left" dir="ltr">
                  {new Date(trackedMessage.createdAt).toLocaleString("ar-DZ")}
                </div>
              </div>

              {/* رد الأستاذ محمد عدايكة إن وُجد */}
              {trackedMessage.reply?.content ? (
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>رد الأستاذ محمد عدايكة الرسمي:</span>
                    </div>
                    {trackedMessage.reply.repliedAt && (
                      <span className="text-[10px] text-emerald-700 font-bold">
                        {new Date(trackedMessage.reply.repliedAt).toLocaleDateString("ar-DZ", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-line bg-white/80 p-3 rounded-xl border border-emerald-100">
                    {trackedMessage.reply.content}
                  </p>

                  <div className="text-[10px] text-emerald-700 font-bold pt-1">
                    ✓ دمتم في رعاية الله وحفظه، وبالتوفيق والنجاح الدائم لأبنائنا التلاميذ.
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
                  <Clock className="w-5 h-5 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">لم يكتب الأستاذ رداً بعد</p>
                  <p className="text-[11px] text-slate-500">
                    يطلع الأستاذ على الرسائل بانتظام ويقوم بالرد فور اطلاعه. يرجى مراجعة هذه الصفحة لاحقاً.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* قائمة الرسائل المحفوظة في هذا الجهاز */}
          {myStoredCodes.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-800">
                  رسائلك السابقة المسجلة من هذا الجهاز ({myStoredCodes.length}):
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  انقر على أي رمز لعرض الرد
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {myStoredCodes.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setTrackingInput(item.code);
                      handleTrackCode(item.code);
                    }}
                    className="w-full text-right p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50 transition flex items-center justify-between gap-3 shadow-2xs group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-700 group-hover:underline">
                          {item.code}
                        </span>
                        {item.studentName && (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                            {item.studentName}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.date}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-1">
                        {item.snippet}...
                      </p>
                    </div>
                    <div className="shrink-0 text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <span>عرض</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. تبويب الإجابات والاستفسارات العامة */}
      {/* ======================================================== */}
      {activeTab === "public" && (
        <div className="space-y-3 fade-up">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 rounded-3xl shadow-sm space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-200 shrink-0" />
              <h2 className="text-xs sm:text-sm font-black text-white">
                بنك الإجابات والاستفسارات البيداغوجية 💡
              </h2>
            </div>
            <p className="text-[11px] text-blue-100 leading-relaxed font-medium">
              هنا تجدون إجابات وتوضيحات الأستاذ محمد عدايكة على أبرز الأسئلة الرياضية والملاحظات العامة
              التي طرحها زملاؤكم وأولياؤهم لتعميم الفائدة على الجميع.
            </p>
          </div>

          {loadingPublic ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">جاري تحميل الإجابات العامة...</p>
            </div>
          ) : publicMessages.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl">
                💡
              </div>
              <h4 className="text-xs font-black text-slate-800">لا توجد إجابات منشورة حالياً</h4>
              <p className="text-[11px] text-slate-400">
                عندما يجيب الأستاذ على أسئلة عامة مفيدة للقسم ويختار مشاركتها، ستظهر هنا فوراً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {publicMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        {msg.category === "question"
                          ? "❓ سؤال في الرياضيات"
                          : msg.category === "suggestion"
                          ? "💡 اقتراح"
                          : "💬 استفسار"}
                      </span>
                      {msg.targetLevel && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {msg.targetLevel}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(msg.createdAt).toLocaleDateString("ar-DZ", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* نص السؤال المطروح */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 block">السؤال / الملاحظة:</span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl">
                      {msg.content}
                    </p>
                  </div>

                  {/* جواب الأستاذ */}
                  {msg.reply?.content && (
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>توضيح وإجابة الأستاذ محمد عدايكة:</span>
                      </div>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-line">
                        {msg.reply.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
