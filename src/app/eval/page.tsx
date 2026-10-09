"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Calculator,
  Users,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  ChevronDown,
  ChevronUp,
  Pencil,
  RotateCcw,
  Check,
  Scale,
  LogOut,
  Loader2,
} from "lucide-react";
import {
  HONOR_CLASSES,
  type InspectionSession,
  type InspectionRecord,
  type StudentRosterItem,
} from "@/lib/types";

export default function FastEvaluationPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      setAuthenticated(Boolean(data.authenticated));
    } catch {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (authenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return authenticated ? (
    <EvaluationDashboard onLogout={() => setAuthenticated(false)} />
  ) : (
    <FastLogin onLogin={() => setAuthenticated(true)} />
  );
}

/* ---------------- 1. تسجيل الدخول السريع ---------------- */
function FastLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLogin();
      } else {
        setErr(data.error || "كلمة المرور غير صحيحة");
      }
    } catch {
      setErr("تعذر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-16 max-w-sm mx-auto space-y-4 px-4 fade-up">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
        <ClipboardCheck className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-black text-center text-slate-800">
        دفتر التقييم الميداني السريع
      </h1>
      <p className="text-xs text-center text-slate-500">
        خاص بالأستاذ محمد عدايكة لتفقد الكراريس والواجبات في حصة الأعمال الموجهة
      </p>

      <form onSubmit={submit} className="space-y-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <input
          className="w-full text-center py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="password"
          placeholder="كلمة المرور (adaika2026)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          dir="ltr"
          autoFocus
        />
        {err && <p className="text-xs text-center text-red-600 font-bold">{err}</p>}

        <button
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-sm"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "دخول إلى دفتر التقييم"}
        </button>
      </form>
    </div>
  );
}

/* ---------------- 2. لوحة التقييم الميداني المتكاملة ---------------- */
function EvaluationDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"sessions" | "averages" | "roster">("sessions");
  const [selectedClass, setSelectedClass] = useState<string>("1 م 1");
  const [selectedGroup, setSelectedGroup] = useState<"فوج 1" | "فوج 2">("فوج 1");
  const [searchStudent, setSearchStudent] = useState("");

  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // حالات نافذة إنشاء جلسة جديدة
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [sessionTitleInput, setSessionTitleInput] = useState("");
  const [sessionDateInput, setSessionDateInput] = useState("");
  const [sessionRangeInput, setSessionRangeInput] = useState("من 1 إلى 8");
  const [sessionLessonsCount, setSessionLessonsCount] = useState<number>(8);
  const [sessionHomeworksCount, setSessionHomeworksCount] = useState<number>(8);

  // حالات نافذة استيراد أسماء التلاميذ
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterBatchNames, setRosterBatchNames] = useState("");
  const [singleStudentName, setSingleStudentName] = useState("");

  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg((cur) => (cur?.text === text ? null : cur));
    }, 3500);
  };

  // جلب البيانات من الخادم
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/inspections?class=${encodeURIComponent(selectedClass)}&group=${encodeURIComponent(
          selectedGroup
        )}&_t=${Date.now()}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      const loadedSessions: InspectionSession[] = data.sessions || [];
      const loadedRoster: StudentRosterItem[] = data.roster || [];

      setSessions(loadedSessions);
      setRoster(loadedRoster);

      // تحديد آخر جلسة تلقائياً إذا لم تكن محددة
      if (loadedSessions.length > 0) {
        setActiveSessionId((prev) => {
          if (prev && loadedSessions.some((s) => s.id === prev)) return prev;
          return loadedSessions[loadedSessions.length - 1].id;
        });
      } else {
        setActiveSessionId(null);
      }
    } catch {
      showToast("error", "تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedGroup]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // الجلسة الحالية المعروضة
  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // قائمة أسماء تلاميذ الفوج الحالي
  const currentStudentsList = useMemo(() => {
    const list = roster.filter(
      (r) =>
        (r.className || "").replace(/\s+/g, "") === selectedClass.replace(/\s+/g, "") &&
        (r.groupName === selectedGroup || r.groupName === "القسم كامل")
    );
    // ترتيب أبجدي
    return list.sort((a, b) => a.studentName.localeCompare(b.studentName, "ar"));
  }, [roster, selectedClass, selectedGroup]);

  // إنشاء جلسة مراقبة جديدة
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nowFormatted =
        sessionDateInput.trim() ||
        new Date().toLocaleDateString("ar-DZ", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: selectedClass,
          groupName: selectedGroup,
          title: sessionTitleInput.trim() || undefined,
          date: nowFormatted,
          lessonRange: sessionRangeInput.trim() || "من 1 إلى 8",
          totalLessons: Number(sessionLessonsCount) || 8,
          totalHomeworks: Number(sessionHomeworksCount) || 8,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("success", `✓ تم إنشاء جلسة المراقبة بنجاح! جاهز للتفقد 📱`);
      setIsNewSessionModalOpen(false);
      setSessionTitleInput("");
      setSessionDateInput("");
      await loadData();
      if (data.session) setActiveSessionId(data.session.id);
    } catch (err: any) {
      showToast("error", err.message || "فشل إنشاء الجلسة");
    }
  };

  // استيراد دفعة تلاميذ للفوج
  const handleImportRoster = async () => {
    if (!rosterBatchNames.trim()) return;
    const names = rosterBatchNames
      .split(/[\n,،]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "roster",
          className: selectedClass,
          groupName: selectedGroup,
          students: names,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("success", `✓ تم استيراد (${data.addedCount}) تلاميذ بنجاح إلى ${selectedClass} (${selectedGroup})`);
      setIsRosterModalOpen(false);
      setRosterBatchNames("");
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "فشل الاستيراد");
    }
  };

  // إضافة تلميذ فردي للفوج
  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudentName.trim()) return;
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "roster",
          className: selectedClass,
          groupName: selectedGroup,
          students: [singleStudentName.trim()],
        }),
      });
      if (res.ok) {
        showToast("success", `✓ تمت إضافة التلميذ "${singleStudentName}"`);
        setSingleStudentName("");
        loadData();
      }
    } catch {
      showToast("error", "فشل إضافة التلميذ");
    }
  };

  // حذف جلسة مراقبة
  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف جلسة المراقبة هذه؟")) return;
    try {
      const res = await fetch(`/api/inspections?sessionId=${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "✓ تم حذف جلسة المراقبة");
        loadData();
      }
    } catch {
      showToast("error", "فشل الحذف");
    }
  };

  // حذف تلميذ من الفوج
  const handleDeleteStudent = async (studentName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف التلميذ "${studentName}" من هذا القسم؟`)) return;
    try {
      const res = await fetch(
        `/api/inspections?studentName=${encodeURIComponent(studentName)}&class=${encodeURIComponent(
          selectedClass
        )}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        showToast("success", `✓ تم حذف التلميذ "${studentName}"`);
        loadData();
      }
    } catch {
      showToast("error", "فشل الحذف");
    }
  };

  // تحديث سجل تلميذ في الجلسة الحالية (تحديث تفاؤلي فوري في المتصفح ثم إرسال للخادم)
  const handleUpdateRecord = async (
    studentName: string,
    updates: Partial<InspectionRecord>
  ) => {
    if (!currentSession) return;

    const existing = currentSession.records?.[studentName] || {
      studentName,
      lessonsDone: currentSession.totalLessons,
      homeworksDone: currentSession.totalHomeworks,
      behaviorScore: 5,
      activityScore: 5,
      score: 20,
    };

    const updatedRec: InspectionRecord = {
      ...existing,
      ...updates,
    };

    // إعادة حساب العلامة بدقة
    const tL = currentSession.totalLessons > 0 ? currentSession.totalLessons : 1;
    const tH = currentSession.totalHomeworks > 0 ? currentSession.totalHomeworks : 1;
    const nbPts = (updatedRec.lessonsDone / tL) * 5;
    const hwPts = (updatedRec.homeworksDone / tH) * 5;
    const total = nbPts + hwPts + updatedRec.behaviorScore + updatedRec.activityScore;
    updatedRec.score = Math.min(20, Math.max(0, Math.round(total * 10) / 10));

    // تحديث الواجهة فورياً بدون أي تأخير
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        return {
          ...s,
          records: {
            ...s.records,
            [studentName]: updatedRec,
          },
        };
      })
    );

    // إرسال للخادم في الخلفية
    try {
      await fetch("/api/inspections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.id,
          studentName,
          ...updates,
        }),
      });
    } catch {
      showToast("error", "تعذر حفظ التقييم في الخادم");
    }
  };

  // زر لمسة واحدة: تعيين كل شيء كامل (20/20)
  const handleSetFullScore = (studentName: string) => {
    if (!currentSession) return;
    handleUpdateRecord(studentName, {
      lessonsDone: currentSession.totalLessons,
      homeworksDone: currentSession.totalHomeworks,
      behaviorScore: 5,
      activityScore: 5,
    });
  };

  return (
    <div className="pb-16 pt-3 px-3 max-w-xl mx-auto space-y-3.5 fade-up">
      {/* إشعار عائم */}
      {toastMsg && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-3.5 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-bold transition-all border ${
            toastMsg.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30"
              : "bg-red-600 text-white border-red-500 shadow-red-600/30"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="flex-1">{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* الشريط العلوي المدمج للهاتف */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              📱
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-900">دفتر التقييم الميداني السريع</h1>
              <p className="text-[10px] text-emerald-700 font-bold">الأستاذ محمد عدايكة — مادة الرياضيات</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/admin"
              className="px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition"
            >
              لوحة التحكم
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth", { method: "DELETE" });
                onLogout();
              }}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* التبويب العلوي الرئيسي: الجلسات أو جدول المعدلات أو قائمة الفوج */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl text-center">
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`py-1.5 px-1 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 ${
              activeTab === "sessions"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>جلسات التفقد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("averages")}
            className={`py-1.5 px-1 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 ${
              activeTab === "averages"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>المعدل العام</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("roster")}
            className={`py-1.5 px-1 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 ${
              activeTab === "roster"
                ? "bg-sky-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>قائمة الفوج ({currentStudentsList.length})</span>
          </button>
        </div>
      </div>

      {/* محدد القسم والفوج السريع */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>القسم:</span>
          <span>الفوج (حصة التفويج):</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* اختيار القسم */}
          <div className="grid grid-cols-4 gap-1 flex-1">
            {HONOR_CLASSES.map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`py-1.5 rounded-xl text-xs font-black transition ${
                  selectedClass === cls
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* اختيار الفوج */}
          <div className="grid grid-cols-2 gap-1 w-32">
            {(["فوج 1", "فوج 2"] as const).map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`py-1.5 rounded-xl text-xs font-black transition ${
                  selectedGroup === grp
                    ? "bg-slate-800 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. تبويب جلسات التفقد الميداني (حصة المراقبة) */}
      {/* ======================================================== */}
      {activeTab === "sessions" && (
        <div className="space-y-3">
          {/* شريط اختيار الجلسة أو إنشاء جلسة جديدة */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>جلسة المراقبة المعنية:</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setSessionDateInput(
                    new Date().toLocaleDateString("ar-DZ", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  );
                  setIsNewSessionModalOpen(true);
                }}
                className="py-1 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 shadow-2xs transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>بدء مراقبة جديدة</span>
              </button>
            </div>

            {/* أزرار التبديل بين الجلسات المسجلة */}
            {sessions.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-1">
                <div>لا توجد جلسات مراقبة مسجلة لهذا الفوج حتى الآن.</div>
                <div className="text-[11px] text-emerald-700 font-bold">
                  اضغط على زر "بدء مراقبة جديدة" أعلاه لبدء تفقد كراريس وواجبات الفوج.
                </div>
              </div>
            ) : (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition flex flex-col items-start gap-0.5 border ${
                      activeSessionId === sess.id
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-2xs ring-2 ring-emerald-300"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{sess.title || `المراقبة ${sess.sessionNumber}`}</span>
                    <span
                      className={`text-[10px] ${
                        activeSessionId === sess.id ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      {sess.lessonRange}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* تفاصيل الجلسة الحالية وتفقد التلاميذ */}
          {currentSession && (
            <div className="space-y-3">
              {/* شريط معلومات الجلسة النشطة */}
              <div className="bg-emerald-850 text-white p-3.5 rounded-2xl shadow-sm space-y-1.5 border border-emerald-700">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">
                      #{currentSession.sessionNumber}
                    </span>
                    <span className="font-black text-sm">{currentSession.title}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSession(currentSession.id)}
                    className="text-white/60 hover:text-red-300 p-1 rounded-lg text-xs transition"
                    title="حذف هذه الجلسة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-emerald-100 flex-wrap gap-2 pt-1 border-t border-white/10">
                  <span>📅 {currentSession.date}</span>
                  <span className="font-bold bg-white/15 px-2 py-0.5 rounded-md">
                    المقرر للتفقد: {currentSession.totalLessons} دروس و {currentSession.totalHomeworks} واجبات
                  </span>
                </div>
              </div>

              {/* حقل البحث عن تلميذ في الجلسة */}
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-white py-2 pr-3 pl-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="ابحث عن اسم تلميذ في هذا الفوج..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* قائمة بطاقات التلاميذ للتفقد السريع في الحصة */}
              {(() => {
                const studentsToDisplay = currentStudentsList.filter((st) =>
                  !searchStudent.trim() ||
                  st.studentName.toLowerCase().includes(searchStudent.trim().toLowerCase())
                );

                if (studentsToDisplay.length === 0) {
                  return (
                    <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-2">
                      <div>لا يوجد تلاميذ في قائمة هذا الفوج ({selectedClass} - {selectedGroup}).</div>
                      <button
                        type="button"
                        onClick={() => setIsRosterModalOpen(true)}
                        className="py-1.5 px-3 rounded-xl bg-sky-600 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>استيراد أسماء تلاميذ الفوج الآن</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {studentsToDisplay.map((student) => {
                      const rec: InspectionRecord = currentSession.records?.[student.studentName] || {
                        studentName: student.studentName,
                        lessonsDone: currentSession.totalLessons,
                        homeworksDone: currentSession.totalHomeworks,
                        behaviorScore: 5,
                        activityScore: 5,
                        score: 20,
                      };

                      const isFull =
                        rec.lessonsDone === currentSession.totalLessons &&
                        rec.homeworksDone === currentSession.totalHomeworks &&
                        rec.behaviorScore === 5 &&
                        rec.activityScore === 5;

                      const isWeak = rec.score < 10;
                      const isMed = rec.score >= 10 && rec.score < 15;
                      const isGood = rec.score >= 15 && rec.score < 18;
                      const isExc = rec.score >= 18;

                      return (
                        <div
                          key={student.studentName}
                          className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5 hover:border-emerald-300 transition"
                        >
                          {/* سطر الاسم والعلامة الإجمالية */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-sm text-slate-900 break-words">
                              {student.studentName}
                            </span>

                            {/* شارة العلامة */}
                            <div
                              className={`px-3 py-1 rounded-xl font-black text-xs shadow-2xs flex items-center gap-1 ${
                                isExc
                                  ? "bg-emerald-600 text-white"
                                  : isGood
                                  ? "bg-teal-600 text-white"
                                  : isMed
                                  ? "bg-amber-500 text-white"
                                  : "bg-rose-600 text-white"
                              }`}
                            >
                              <span>{rec.score} / 20</span>
                              <span className="text-[10px] opacity-80">
                                {isExc ? "🟢" : isGood ? "🔵" : isMed ? "🟡" : "🔴"}
                              </span>
                            </div>
                          </div>

                          {/* زر لمسة واحدة: مكتمل بالكامل 20/20 */}
                          <button
                            type="button"
                            onClick={() => handleSetFullScore(student.studentName)}
                            className={`w-full py-1.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                              isFull
                                ? "bg-emerald-50 text-emerald-800 border-2 border-emerald-400 shadow-2xs"
                                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {isFull ? "✓ كل شيء كامل ومتقن (20 / 20)" : "تعيين مكتمل بالكامل (20 / 20)"}
                            </span>
                          </button>

                          {/* معايير التفقد الأربعة التفصيلية */}
                          <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                            {/* 1. كراس الدروس */}
                            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200 space-y-1">
                              <div className="flex justify-between items-center text-[11px] font-black text-slate-700">
                                <span>📘 كراس الدروس:</span>
                                <span className="text-emerald-700 font-extrabold">
                                  {rec.lessonsDone} من {currentSession.totalLessons}
                                </span>
                              </div>
                              {/* أزرار سريعة لاختيار عدد الدروس المكتوبة */}
                              <div className="flex flex-wrap gap-1">
                                {Array.from({ length: currentSession.totalLessons + 1 }, (_, i) => i)
                                  .reverse()
                                  .slice(0, 6)
                                  .map((n) => (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() =>
                                        handleUpdateRecord(student.studentName, { lessonsDone: n })
                                      }
                                      className={`flex-1 py-1 rounded text-[10px] font-black transition ${
                                        rec.lessonsDone === n
                                          ? "bg-emerald-600 text-white shadow-2xs"
                                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                                      }`}
                                    >
                                      {n}
                                    </button>
                                  ))}
                              </div>
                            </div>

                            {/* 2. حل الواجبات */}
                            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200 space-y-1">
                              <div className="flex justify-between items-center text-[11px] font-black text-slate-700">
                                <span>📝 حل الواجبات:</span>
                                <span className="text-sky-700 font-extrabold">
                                  {rec.homeworksDone} من {currentSession.totalHomeworks}
                                </span>
                              </div>
                              {/* أزرار سريعة لاختيار عدد الواجبات المنجزة */}
                              <div className="flex flex-wrap gap-1">
                                {Array.from({ length: currentSession.totalHomeworks + 1 }, (_, i) => i)
                                  .reverse()
                                  .slice(0, 6)
                                  .map((n) => (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() =>
                                        handleUpdateRecord(student.studentName, { homeworksDone: n })
                                      }
                                      className={`flex-1 py-1 rounded text-[10px] font-black transition ${
                                        rec.homeworksDone === n
                                          ? "bg-sky-600 text-white shadow-2xs"
                                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                                      }`}
                                    >
                                      {n}
                                    </button>
                                  ))}
                              </div>
                            </div>

                            {/* 3. علامة السلوك والأدوات */}
                            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200 space-y-1">
                              <div className="flex justify-between items-center text-[11px] font-black text-slate-700">
                                <span>⚖️ السلوك والأدوات:</span>
                                <span className="text-amber-700 font-extrabold">{rec.behaviorScore}/5</span>
                              </div>
                              <div className="grid grid-cols-6 gap-0.5">
                                {[5, 4, 3, 2, 1, 0].map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateRecord(student.studentName, { behaviorScore: s })
                                    }
                                    className={`py-1 rounded text-[10px] font-black transition ${
                                      rec.behaviorScore === s
                                        ? "bg-amber-600 text-white shadow-2xs"
                                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 4. علامة حل النشاط والمشاركة */}
                            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200 space-y-1">
                              <div className="flex justify-between items-center text-[11px] font-black text-slate-700">
                                <span>💡 حل النشاط:</span>
                                <span className="text-purple-700 font-extrabold">{rec.activityScore}/5</span>
                              </div>
                              <div className="grid grid-cols-6 gap-0.5">
                                {[5, 4, 3, 2, 1, 0].map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateRecord(student.studentName, { activityScore: s })
                                    }
                                    className={`py-1 rounded text-[10px] font-black transition ${
                                      rec.activityScore === s
                                        ? "bg-purple-600 text-white shadow-2xs"
                                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* ملخص احتساب العلامة الصفي */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>
                              كراس: {((rec.lessonsDone / currentSession.totalLessons) * 5).toFixed(1)}ن • واجب:{" "}
                              {((rec.homeworksDone / currentSession.totalHomeworks) * 5).toFixed(1)}ن • سلوك:{" "}
                              {rec.behaviorScore}ن • نشاط: {rec.activityScore}ن
                            </span>
                            <span className="font-bold text-slate-700">{rec.score} / 20</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. تبويب جدول المعدل العام (المتوسط الحسابي للمراقبات) */}
      {/* ======================================================== */}
      {activeTab === "averages" && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                جدول معدلات التقويم المستمر — {selectedClass} ({selectedGroup})
              </h2>
              <p className="text-[11px] text-slate-400">
                المتوسط الحسابي التلقائي لجميع جلسات المراقبة الدورية المنجزة حتى الآن
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="py-1 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-bold flex items-center gap-1 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 space-y-1">
              <div>لم تسجل أي جلسات مراقبة لهذا الفوج بعد.</div>
              <div className="text-emerald-700 font-bold">ابدأ أول جلسة مراقبة ليتم احتساب المعدل تلقائياً!</div>
            </div>
          ) : currentStudentsList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              لا توجد أسماء مسجلة في هذا الفوج.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px]">
                    <th className="py-2 px-2 font-black">#</th>
                    <th className="py-2 px-2 font-black">اسم ولقب التلميذ</th>
                    {sessions.map((s) => (
                      <th key={s.id} className="py-2 px-2 font-black text-center whitespace-nowrap">
                        {s.title || `مراقبة ${s.sessionNumber}`}
                        <span className="block text-[9px] text-slate-400 font-normal">
                          {s.lessonRange}
                        </span>
                      </th>
                    ))}
                    <th className="py-2 px-2 font-black text-center bg-emerald-50 text-emerald-900">
                      معدل التقويم المستمر
                    </th>
                    <th className="py-2 px-2 font-black text-center">التقدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentStudentsList.map((st, idx) => {
                    const studentScores: number[] = [];
                    for (const s of sessions) {
                      const rec = s.records?.[st.studentName];
                      if (rec && typeof rec.score === "number") {
                        studentScores.push(rec.score);
                      }
                    }

                    const avg =
                      studentScores.length > 0
                        ? (studentScores.reduce((a, b) => a + b, 0) / studentScores.length).toFixed(2)
                        : "-";

                    const numAvg = parseFloat(avg);
                    const isExc = numAvg >= 18;
                    const isGood = numAvg >= 14 && numAvg < 18;
                    const isMed = numAvg >= 10 && numAvg < 14;
                    const isWeak = numAvg < 10;

                    return (
                      <tr key={st.studentName} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-2 text-slate-400 font-bold text-[11px]">{idx + 1}</td>
                        <td className="py-2.5 px-2 font-black text-slate-900">{st.studentName}</td>
                        {sessions.map((s) => {
                          const sc = s.records?.[st.studentName]?.score;
                          return (
                            <td key={s.id} className="py-2.5 px-2 text-center font-bold text-slate-700">
                              {sc !== undefined ? `${sc}` : "-"}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-2 text-center font-black bg-emerald-50/60 text-emerald-900 text-sm">
                          {avg !== "-" ? `${avg} / 20` : "-"}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {avg !== "-" ? (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                isExc
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isGood
                                  ? "bg-teal-100 text-teal-800"
                                  : isMed
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {isExc ? "ممتاز 🟢" : isGood ? "جيد 🔵" : isMed ? "متوسط 🟡" : "ضعيف 🔴"}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. تبويب إدارة قائمة تلاميذ الفوج */}
      {/* ======================================================== */}
      {activeTab === "roster" && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-black text-slate-900">
                قائمة تلاميذ {selectedClass} ({selectedGroup})
              </h2>
              <p className="text-[10px] text-slate-400">إجمالي المسجلين: {currentStudentsList.length} تلميذ</p>
            </div>

            <button
              type="button"
              onClick={() => setIsRosterModalOpen(true)}
              className="py-1 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>استيراد دفعة أسماء</span>
            </button>
          </div>

          {/* إضافة تلميذ فردي */}
          <form onSubmit={handleAddSingleStudent} className="flex gap-1.5">
            <input
              className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="اسم ولقب تلميذ جديد..."
              value={singleStudentName}
              onChange={(e) => setSingleStudentName(e.target.value)}
            />
            <button
              type="submit"
              className="py-1.5 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              إضافة
            </button>
          </form>

          {/* عرض أسماء التلاميذ */}
          {currentStudentsList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              لا توجد أسماء مسجلة في هذا الفوج. اضغط "استيراد دفعة أسماء" لإضافتهم دفعة واحدة.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {currentStudentsList.map((st, idx) => (
                <div key={st.studentName} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{st.studentName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(st.studentName)}
                    className="p-1 text-slate-300 hover:text-red-600 transition"
                    title="حذف هذا التلميذ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* نافذة منبثقة: بدء جلسة مراقبة جديدة */}
      {/* ======================================================== */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSession}
            className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-xl border border-slate-100 fade-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">بدء جلسة مراقبة جديدة</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSessionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center justify-between">
              <span>القسم: {selectedClass}</span>
              <span>الفوج: {selectedGroup}</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                تاريخ ويوم الحصة:
              </label>
              <input
                className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="مثال: الأربعاء 09 أكتوبر 2026"
                value={sessionDateInput}
                onChange={(e) => setSessionDateInput(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                مجال الدروس المعنية بالمراقبة:
              </label>
              <input
                className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="مثال: من 1 إلى 8 (أو من 9 إلى 15)"
                value={sessionRangeInput}
                onChange={(e) => setSessionRangeInput(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  عدد الدروس المقررة:
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={sessionLessonsCount}
                  onChange={(e) => setSessionLessonsCount(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  عدد الواجبات المقررة:
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={sessionHomeworksCount}
                  onChange={(e) => setSessionHomeworksCount(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
              >
                حفظ وبدء التفقد الميداني
              </button>
              <button
                type="button"
                onClick={() => setIsNewSessionModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* نافذة منبثقة: استيراد دفعة تلاميذ */}
      {/* ======================================================== */}
      {isRosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-xl border border-slate-100 fade-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  استيراد تلاميذ {selectedClass} ({selectedGroup})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                الصق الأسماء هنا (كل اسم في سطر):
              </label>
              <textarea
                className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-mono min-h-[140px] focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder={"أحمد بوخالفة\nسارة لعريبي\nيونس بلحاج\nمحمد زياني..."}
                value={rosterBatchNames}
                onChange={(e) => setRosterBatchNames(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                انسخ العمود مباشرة من ملف إكسل أو وورد والصقه هنا.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleImportRoster}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition"
              >
                استيراد القائمة مباشرة
              </button>
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
