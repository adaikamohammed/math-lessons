"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Upload,
  LogOut,
  ChevronDown,
  Loader2,
  Pencil,
  X,
  ExternalLink,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Megaphone,
  Globe,
  RefreshCw,
  StickyNote,
  BookOpen,
  Users,
  UserPlus,
  Clock,
  Trophy,
  Award,
  Sparkles,
  Star,
  GraduationCap,
  OctagonAlert,
  MinusCircle,
  FileWarning,
  HeartHandshake,
} from "lucide-react";
import {
  LEVELS,
  COMMON_FIELDS,
  HONOR_CLASSES,
  type Lesson,
  type LessonImage,
  type NotebookType,
  type ParentSummons,
  type HonorStudent,
  type Penalty,
} from "@/lib/types";

export default function AdminPage() {
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
      <div className="flex justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return authenticated ? (
    <Dashboard onLogout={() => setAuthenticated(false)} />
  ) : (
    <Login onLogin={() => setAuthenticated(true)} />
  );
}

/* ---------------- 1. تسجيل الدخول ---------------- */
function Login({ onLogin }: { onLogin: () => void }) {
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
    <form onSubmit={submit} className="pt-16 max-w-sm mx-auto space-y-4 fade-up">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
        <Lock className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-black text-center text-slate-800">لوحة تحكم الأستاذ</h1>
      <p className="text-xs text-center text-slate-500">أدخل كلمة المرور لإدارة الدروس ورفع الصور</p>

      <input
        className="input text-center"
        type="password"
        placeholder="كلمة المرور (الافتراضية: adaika2026)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        dir="ltr"
        autoFocus
      />
      {err && <p className="text-xs text-center text-red-600 font-bold">{err}</p>}

      <button disabled={busy} className="btn-primary w-full">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "دخول إلى لوحة التحكم"}
      </button>
      <style>{inputCss}</style>
    </form>
  );
}

/* ---------------- 2. لوحة التحكم الرئيسية ---------------- */
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [mainTab, setMainTab] = useState<"lessons" | "summons" | "honors" | "penalties">("lessons");
  const [level, setLevel] = useState<1 | 2>(1);
  const [notebookTab, setNotebookTab] = useState<NotebookType>("lessons");
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [summonsList, setSummonsList] = useState<ParentSummons[]>([]);
  const [honorsList, setHonorsList] = useState<HonorStudent[]>([]);
  const [penaltiesList, setPenaltiesList] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);

  // حقول إضافة درس
  const [field, setField] = useState("أنشطة عددية");
  const [section, setSection] = useState("المقطع 1 : الأعداد الطبيعية والأعداد العشرية");
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");

  // حقول إضافة استدعاء ولي أمر
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("1م3");
  const [summonsNotes, setSummonsNotes] = useState("");
  const [isExtraSunday, setIsExtraSunday] = useState(false);

  // حقول إضافة تلميذ في لوحة الشرف
  const [honorStudentName, setHonorStudentName] = useState("");
  const [honorClass, setHonorClass] = useState<string>("1 م 1");
  const [honorNotes, setHonorNotes] = useState("");
  const [honorBadge, setHonorBadge] = useState("");
  const [selectedHonorFilter, setSelectedHonorFilter] = useState<string>("all");

  // حقول إضافة عقوبة أو خصم (تلميذ أو مجموعة تلاميذ)
  const [penaltyStudents, setPenaltyStudents] = useState<string[]>([]);
  const [currentStudentName, setCurrentStudentName] = useState("");
  const [penaltyClass, setPenaltyClass] = useState<string>("1 م 1");
  const [penaltyDeduction, setPenaltyDeduction] = useState("ناقص 3 في التقويم المستمر (-3)");
  const [penaltyReason, setPenaltyReason] = useState("");
  const [penaltyDate, setPenaltyDate] = useState("");
  const [penaltyTiming, setPenaltyTiming] = useState("");
  const [penaltyNotes, setPenaltyNotes] = useState("");
  const [selectedPenaltyFilter, setSelectedPenaltyFilter] = useState<string>("all");

  // دوال مساعدة لإضافة وحذف التلاميذ من القائمة دفعة واحدة
  const handleAddStudent = () => {
    if (!currentStudentName.trim()) return;
    const parts = currentStudentName
      .split(/[\n,،]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setPenaltyStudents((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.includes(p)) next.push(p);
      }
      return next;
    });
    setCurrentStudentName("");
  };

  const handleRemoveStudent = (nameToRemove: string) => {
    setPenaltyStudents((prev) => prev.filter((n) => n !== nameToRemove));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // حالات النوافذ المنبثقة
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [editingSummons, setEditingSummons] = useState<ParentSummons | null>(null);
  const [deletingSummons, setDeletingSummons] = useState<ParentSummons | null>(null);
  const [editingHonor, setEditingHonor] = useState<HonorStudent | null>(null);
  const [deletingHonor, setDeletingHonor] = useState<HonorStudent | null>(null);
  const [editingPenalty, setEditingPenalty] = useState<Penalty | null>(null);
  const [deletingPenalty, setDeletingPenalty] = useState<Penalty | null>(null);

  const loadLessons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lessons?level=${level}&_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setAllLessons(data.lessons || []);
    } finally {
      setLoading(false);
    }
  }, [level]);

  const loadSummons = useCallback(async () => {
    try {
      const res = await fetch(`/api/summons?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setSummonsList(data.summons || []);
    } catch {
      setSummonsList([]);
    }
  }, []);

  const loadHonors = useCallback(async () => {
    try {
      const res = await fetch(`/api/honors?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const data = await res.json();
      setHonorsList(data.honors || []);
    } catch {
      setHonorsList([]);
    }
  }, []);

  const loadPenalties = useCallback(async () => {
    try {
      const res = await fetch(`/api/penalties?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const data = await res.json();
      setPenaltiesList(data.penalties || []);
    } catch {
      setPenaltiesList([]);
    }
  }, []);

  useEffect(() => {
    loadLessons();
    loadSummons();
    loadHonors();
    loadPenalties();
  }, [loadLessons, loadSummons, loadHonors, loadPenalties]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg((cur) => (cur?.text === text ? null : cur));
    }, 4000);
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  };

  const currentItems = useMemo(() => {
    return allLessons.filter((l) =>
      notebookTab === "directed_work" ? l.type === "directed_work" : !l.type || l.type === "lessons"
    );
  }, [allLessons, notebookTab]);

  const knownSections = useMemo(() => {
    const set = new Set<string>();
    for (const l of allLessons) {
      if ((!l.type || l.type === "lessons") && l.section) {
        set.add(l.section);
      }
    }
    return Array.from(set);
  }, [allLessons]);

  const nextNumber = currentItems.length ? Math.max(...currentItems.map((l) => l.number)) + 1 : 1;

  // 1. إضافة مورد معرفي أو حصة أعمال موجهة مع تحديث فوري مباشر للواجهة
  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("error", "يرجى كتابة العنوان أولاً");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          type: notebookTab,
          field: notebookTab === "lessons" ? field.trim() : undefined,
          section: notebookTab === "lessons" ? section.trim() : undefined,
          number: Number(number) || nextNumber,
          title: title.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");

      setTitle("");
      setNumber("");
      setNotes("");

      // تحديث فوري للواجهة بدون الحاجة لانتظار أو تحديث المتصفح
      setAllLessons((prev) => [...prev, data.lesson]);
      setOpenId(data.lesson.id);

      showToast(
        "success",
        `✓ تم إضافة "${data.lesson.title}" مباشرة إلى ${
          notebookTab === "lessons" ? "كراس الدروس" : "كراس الأعمال الموجهة"
        }!`
      );
    } catch (e: any) {
      showToast("error", "خطأ: " + (e.message || "تعذر الإضافة"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. إضافة تلميذ إلى قائمة أولياء أود استقبالهم مع تحديث فوري مباشر
  const addSummons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !className.trim()) {
      showToast("error", "يرجى كتابة اسم التلميذ والقسم");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/summons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNames: studentName.trim(),
          className: className.trim(),
          notes: summonsNotes.trim() || undefined,
          isUrgent: isExtraSunday,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التسجيل");

      setStudentName("");
      setSummonsNotes("");
      setIsExtraSunday(false);

      // تحديث فوري مباشر
      const newItems = Array.isArray(data.allSummons) ? data.allSummons : [data.summons];
      setSummonsList((prev) => [...newItems, ...prev]);

      showToast(
        "success",
        `✓ تم إضافة التلميذ إلى قائمة "أولياء أود استقبالهم" بنجاح! 🤝`
      );
    } catch (e: any) {
      showToast("error", "خطأ: " + (e.message || "تعذر تسجيل الموعد"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. إضافة تلميذ إلى لوحة الشرف مع تحديث فوري مباشر للواجهة
  const addHonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!honorStudentName.trim() || !honorClass.trim()) {
      showToast("error", "يرجى كتابة اسم التلميذ واختيار القسم");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/honors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: honorStudentName.trim(),
          className: honorClass.trim(),
          notes: honorNotes.trim() || undefined,
          badge: honorBadge.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تسجيل التلميذ");

      setHonorStudentName("");
      setHonorNotes("");
      setHonorBadge("");

      // تحديث فوري مباشر
      setHonorsList((prev) => [data.honor, ...prev]);

      showToast("success", `✓ تم إضافة التلميذ "${data.honor.studentName}" فورياً إلى لوحة الشرف! 🏆`);
    } catch (e: any) {
      showToast("error", "خطأ: " + (e.message || "تعذر تسجيل التلميذ"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. إضافة عقوبة أو خصم لتلميذ أو مجموعة تلاميذ مع توقيت موحد وحفظ دفعة واحدة
  const addPenalty = async (e: React.FormEvent) => {
    e.preventDefault();

    // نجمع التلاميذ الموجودين في القائمة المحددة + أي اسم مكتوب في حقل الإدخال الحالي
    let finalStudents = [...penaltyStudents];
    if (currentStudentName.trim()) {
      const extraParts = currentStudentName
        .split(/[\n,،]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const p of extraParts) {
        if (!finalStudents.includes(p)) finalStudents.push(p);
      }
    }

    if (finalStudents.length === 0) {
      showToast("error", "يرجى إضافة تلميذ واحد على الأقل للعقوبة");
      return;
    }

    if (!penaltyClass.trim() || !penaltyDeduction.trim() || !penaltyReason.trim()) {
      showToast("error", "يرجى ملء القسم، ومقدار الخصم، وسبب العقوبة");
      return;
    }

    // تجهيز التاريخ والتوقيت الموحد
    let finalDateTime = penaltyDate.trim();
    if (penaltyTiming.trim()) {
      finalDateTime = finalDateTime
        ? `${finalDateTime} (${penaltyTiming.trim()})`
        : penaltyTiming.trim();
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/penalties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNames: finalStudents,
          className: penaltyClass.trim(),
          deduction: penaltyDeduction.trim(),
          reason: penaltyReason.trim(),
          date: finalDateTime || undefined,
          notes: penaltyNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تسجيل العقوبة");

      // تفريغ قائمة التلاميذ وحقل الإدخال لعملية جديدة
      setPenaltyStudents([]);
      setCurrentStudentName("");
      setPenaltyReason("");
      setPenaltyNotes("");
      setPenaltyTiming("");

      // تحديث فوري مباشر
      const newItems = Array.isArray(data.penalties) ? data.penalties : [data.penalty];
      setPenaltiesList((prev) => [...newItems, ...prev]);

      showToast(
        "success",
        `✓ تم حفظ العقوبة بنجاح لـ (${newItems.length}) تلاميذ دفعة واحدة بنفس التوقيت! ⚠️`
      );
    } catch (e: any) {
      showToast("error", "خطأ: " + (e.message || "تعذر تسجيل العقوبة"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. مسح كافة الخصومات نهائياً
  const clearAllPenalties = async () => {
    if (!window.confirm("هل أنت متأكد من رغبتك في مسح كافة الخصومات المسجلة نهائياً؟")) return;
    try {
      const res = await fetch("/api/penalties?all=true", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل مسح الخصومات");
      setPenaltiesList([]);
      showToast("success", "✓ تم مسح كافة سجلات الخصومات بنجاح!");
    } catch (e: any) {
      showToast("error", "خطأ: " + (e.message || "تعذر مسح الخصومات"));
    }
  };

  // تجميع كراس الدروس حسب الميدان والمقطع
  const groupedLessons = useMemo(() => {
    if (notebookTab !== "lessons") return [];

    const fieldMap = new Map<string, Map<string, Lesson[]>>();
    for (const item of currentItems) {
      const f = (item.field || "أنشطة عددية").trim();
      const s = (item.section || "المقطع 1 : الأعداد الطبيعية والأعداد العشرية").trim();

      if (!fieldMap.has(f)) fieldMap.set(f, new Map());
      const sMap = fieldMap.get(f)!;
      if (!sMap.has(s)) sMap.set(s, []);
      sMap.get(s)!.push(item);
    }

    const groups: { field: string; sections: { section: string; items: Lesson[] }[] }[] = [];
    for (const [f, sMap] of fieldMap.entries()) {
      const secs: { section: string; items: Lesson[] }[] = [];
      for (const [s, items] of sMap.entries()) {
        items.sort((a, b) => a.number - b.number);
        secs.push({ section: s, items });
      }
      groups.push({ field: f, sections: secs });
    }
    return groups;
  }, [notebookTab, currentItems]);

  return (
    <div className="pt-3 pb-16 space-y-4 fade-up">
      <style>{inputCss}</style>

      {/* شريط الإشعارات الطافي */}
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

      {/* الشريط العلوي */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-extrabold text-slate-800">لوحة تحكم الأستاذ محمد عدايكة</h1>
            <p className="text-[11px] text-emerald-700 font-bold">متوسطة المجاهد باهي علي — مادة الرياضيات</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl border border-slate-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> خروج
          </button>
        </div>

        {/* أزرار سريعة للمعاينة */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-100 text-xs font-bold">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition text-[11px]"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>الموقع الرئيسي</span>
          </Link>
          <Link
            href="/honor"
            target="_blank"
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/70 hover:bg-amber-100 transition text-[11px]"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>لوحة الشرف</span>
          </Link>
          <Link
            href="/parents"
            target="_blank"
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/70 hover:bg-sky-100 transition text-[11px]"
          >
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span>أولياء أود استقبالهم</span>
          </Link>
          <Link
            href="/penalties"
            target="_blank"
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition text-[11px]"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>الخصومات (خاص 🔒)</span>
          </Link>
          <Link
            href="/announcement"
            target="_blank"
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition text-[11px]"
          >
            <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>الإعلان والتوجيهات</span>
          </Link>
        </div>
      </div>

      {/* التبويب الرئيسي: إدارة الدروس أو أولياء أود استقبالهم أو لوحة الشرف أو الخصومات (سجل خاص) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs">
        <button
          onClick={() => setMainTab("lessons")}
          className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            mainTab === "lessons"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>الدروس</span>
        </button>

        <button
          onClick={() => setMainTab("summons")}
          className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            mainTab === "summons"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>أولياء أود استقبالهم ({summonsList.length})</span>
        </button>

        <button
          onClick={() => setMainTab("honors")}
          className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            mainTab === "honors"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>لوحة الشرف ({honorsList.length})</span>
        </button>

        <button
          onClick={() => setMainTab("penalties")}
          className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            mainTab === "penalties"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <OctagonAlert className="w-3.5 h-3.5 text-slate-500" />
          <span>الخصومات (خاص 🔒) ({penaltiesList.length})</span>
        </button>
      </div>

      {/* ==================== 1. تبويب الدروس والكراريس ==================== */}
      {mainTab === "lessons" ? (
        <div className="space-y-4">
          {/* اختيار المستوى */}
          <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs">
            {([1, 2] as const).map((lv) => (
              <button
                key={lv}
                onClick={() => {
                  setLevel(lv);
                  setOpenId(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  level === lv ? "bg-slate-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{LEVELS[lv].label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                    level === lv ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {LEVELS[lv].short}
                </span>
              </button>
            ))}
          </div>

          {/* اختيار الكراس */}
          <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs">
            <button
              onClick={() => {
                setNotebookTab("lessons");
                setOpenId(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                notebookTab === "lessons"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>📘</span>
              <span>كراس الدروس (192 ص)</span>
            </button>
            <button
              onClick={() => {
                setNotebookTab("directed_work");
                setOpenId(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                notebookTab === "directed_work"
                  ? "bg-sky-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>📗</span>
              <span>الأعمال الموجهة (96 ص)</span>
            </button>
          </div>

          {/* نموذج إضافة مورد أو حصة */}
          <form onSubmit={addItem} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span>{notebookTab === "lessons" ? "➕ إضافة مورد جديد لـ" : "➕ إضافة حصة أعمال موجهة لـ"}</span>
                <span className="text-emerald-700 font-extrabold">{LEVELS[level].short}</span>
              </span>
              <button
                type="button"
                onClick={loadLessons}
                className="text-[11px] text-slate-400 hover:text-emerald-600 flex items-center gap-1"
                title="تحديث"
              >
                <RefreshCw className="w-3 h-3" /> تحديث
              </button>
            </div>

            {notebookTab === "lessons" ? (
              <div className="space-y-3">
                {/* الميدان */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">📐 الميدان:</label>
                  <div className="flex gap-1.5 mb-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {COMMON_FIELDS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setField(f)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition shrink-0 ${
                          field === f
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <input
                    className="input text-xs font-semibold"
                    placeholder="مثال: أنشطة عددية"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    required
                  />
                </div>

                {/* المقطع المعرفي */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">📑 المقطع المعرفي:</label>
                  {knownSections.length > 0 && (
                    <div className="flex gap-1.5 mb-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {knownSections.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSection(s)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition shrink-0 ${
                            section === s
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    className="input text-xs font-semibold"
                    placeholder="مثال: المقطع 1 : الأعداد الطبيعية والأعداد العشرية"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    required
                  />
                </div>

                {/* رقم المورد وعنوانه */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-slate-600 block mb-1">رقم المورد:</label>
                    <input
                      className="input text-center text-sm font-extrabold text-emerald-700 bg-emerald-50/40 border-emerald-200"
                      inputMode="numeric"
                      placeholder={String(nextNumber)}
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-slate-600 block mb-1">عنوان المورد المعرفي:</label>
                    <input
                      className="input text-xs font-semibold"
                      placeholder="مثال: قراءة وكتابة عدد طبيعي"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* ملاحظات الأستاذ */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                    <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                    <span>ملاحظات وتوجيهات الأستاذ لهذا الدرس (اختياري):</span>
                  </label>
                  <textarea
                    className="input text-xs min-h-[60px] resize-y"
                    placeholder="مثال: حل تمرين 5 ص 18 على كراس المحاولات..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              /* حقول كراس الأعمال الموجهة */
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-slate-600 block mb-1">رقم الحصة:</label>
                    <input
                      className="input text-center text-sm font-extrabold text-sky-700 bg-sky-50/40 border-sky-200"
                      inputMode="numeric"
                      placeholder={String(nextNumber)}
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-slate-600 block mb-1">عنوان الحصة / السلسلة:</label>
                    <input
                      className="input text-xs font-semibold"
                      placeholder="مثال: سلسلة تمارين 01 : العمليات على الأعداد الطبيعية"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                    <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                    <span>ملاحظات وتوجيهات الأستاذ للتلاميذ (اختياري):</span>
                  </label>
                  <textarea
                    className="input text-xs min-h-[60px] resize-y"
                    placeholder="مثال: إحضار كراس الأعمال الموجهة 96 صفحة، حل التمارين الفردية فقط..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button disabled={isSubmitting} className="btn-primary w-full py-3 text-sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>
                    {notebookTab === "lessons"
                      ? "إضافة المورد والبدء برفع الصور"
                      : "إضافة حصة الأعمال الموجهة والبدء برفع الصور"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* قائمة الدروس والأعمال الموجهة */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
              <span>
                {notebookTab === "lessons"
                  ? `محتويات كراس الدروس (${currentItems.length} موارد):`
                  : `حصص الأعمال الموجهة (${currentItems.length} حصص):`}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">{LEVELS[level].short}</span>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                جاري جلب القائمة...
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-10 bg-white rounded-2xl border border-dashed border-slate-200 px-4">
                لا توجد عناصر مضافة بعد في هذا الكراس. أضف عنصراً جديداً أعلاه!
              </div>
            ) : notebookTab === "lessons" ? (
              <div className="space-y-4">
                {groupedLessons.map((grp) => (
                  <div key={grp.field} className="space-y-2.5">
                    <div className="bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                      <span>📐 الميدان:</span>
                      <span>{grp.field}</span>
                    </div>

                    {grp.sections.map((sec) => (
                      <div key={sec.section} className="space-y-2 pr-2 border-r-2 border-emerald-200">
                        <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 pt-1">
                          <span>📑</span>
                          <span>{sec.section}</span>
                        </div>

                        <div className="space-y-2">
                          {sec.items.map((item) => (
                            <LessonCard
                              key={item.id}
                              lesson={item}
                              open={openId === item.id}
                              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                              onLessonUpdated={(updated) => {
                                setAllLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
                              }}
                              onEdit={() => setEditingLesson(item)}
                              onDelete={() => setDeletingLesson(item)}
                              showToast={showToast}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentItems.map((item) => (
                  <LessonCard
                    key={item.id}
                    lesson={item}
                    open={openId === item.id}
                    onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                    onLessonUpdated={(updated) => {
                      setAllLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
                    }}
                    onEdit={() => setEditingLesson(item)}
                    onDelete={() => setDeletingLesson(item)}
                    showToast={showToast}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : mainTab === "summons" ? (
        /* ==================== 2. تبويب أولياء أود استقبالهم ==================== */
        <div className="space-y-4">
          {/* نموذج إضافة ولي تلميذ للاستقبال */}
          <form
            onSubmit={addSummons}
            className="bg-white rounded-2xl p-4 border border-sky-100 shadow-sm space-y-3.5"
          >
            <div className="flex items-center justify-between pb-1 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    تسجيل تلميذ أود استقبال وليه (لصالح ابنه 🤝)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    ليس استدعاءً عقابياً، بل للتشاور والاطلاع على كراس ومستوى التلميذ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadSummons}
                className="text-[11px] text-slate-400 hover:text-sky-600 flex items-center gap-1 transition"
                title="تحديث"
              >
                <RefreshCw className="w-3 h-3" /> تحديث
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    اسم التلميذ: <span className="text-sky-600">*</span>
                  </label>
                  <input
                    className="input text-xs font-bold"
                    placeholder="اكتب اسم التلميذ، أو عدة أسماء مفصولة بفواصل..."
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    القسم: <span className="text-sky-600">*</span>
                  </label>
                  <input
                    className="input text-xs text-center font-black text-sky-900 bg-sky-50/40 border-sky-200"
                    placeholder="مثال: 1 م 3"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* أزرار سريعة لأقسام الأستاذ */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  اختيار سريع للقسم:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                  {HONOR_CLASSES.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setClassName(cls)}
                      className={`py-1.5 rounded-xl border transition ${
                        className.replace(/\s+/g, "") === cls.replace(/\s+/g, "")
                          ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* سبب المقابلة وملاحظة الأستاذ لولي الأمر */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                  <StickyNote className="w-3.5 h-3.5 text-sky-600" />
                  <span>ملاحظة وتوجيه لولي الأمر (لصالح ابنه - اختياري):</span>
                </label>
                <textarea
                  className="input text-xs min-h-[55px] resize-y"
                  placeholder="مثال: تشاور حول كراس الدروس وإكماله، معالجة صعوبة في الفهم..."
                  value={summonsNotes}
                  onChange={(e) => setSummonsNotes(e.target.value)}
                />
                {/* ملاحظات وتوجيهات شائعة بنقرة واحدة */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    "تشاور حول كراس الدروس وإكماله",
                    "معالجة صعوبات الفهم في مادة الرياضيات",
                    "الحرص على حل الواجبات وإحضار الأدوات",
                    "تشجيع التلميذ ومتابعة تطور مستواه",
                    "متابعة تنظيم الخط ونظافة الكراس",
                  ].map((presetNote) => (
                    <button
                      key={presetNote}
                      type="button"
                      onClick={() => setSummonsNotes(presetNote)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200/80 hover:bg-sky-100 transition active:scale-95"
                    >
                      {presetNote}
                    </button>
                  ))}
                </div>
              </div>

              {/* خيار التوقيت الإضافي ليوم الأحد */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-50/70 border border-sky-200 cursor-pointer hover:bg-sky-50 transition">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  checked={isExtraSunday}
                  onChange={(e) => setIsExtraSunday(e.target.checked)}
                />
                <div className="text-xs">
                  <span className="font-black text-sky-950 block">
                    ⏰ اقتراح موعد إضافي: الأحد صباحاً (08:00 إلى 09:00)
                  </span>
                  <span className="text-[10px] text-sky-800">
                    مبادرة من الأستاذ لعدم الانتظار أسبوعاً كاملاً (الموعد الرسمي الأساسي: الأربعاء 10:00 إلى 11:00)
                  </span>
                </div>
              </label>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التسجيل...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>تسجيل التلميذ في قائمة الاستقبال 🤝</span>
                </>
              )}
            </button>
          </form>

          {/* قائمة الأولياء المسجلين للاستقبال */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>التلاميذ المسجلين لاستقبال أوليائهم:</span>
              <span className="text-[11px] bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full font-extrabold border border-sky-200">
                {summonsList.length} تلميذ
              </span>
            </div>

            {summonsList.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 p-4 space-y-1">
                <div>👏</div>
                <div>لا توجد مواعيد مقابلة مسجلة حالياً.</div>
                <div className="text-[10px] text-slate-400">ساعة الاستقبال مفتوحة كل أربعاء للجميع.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {summonsList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-2xs space-y-2 hover:border-sky-200 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs text-slate-900">{item.studentName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-50 text-sky-800 border border-sky-200">
                            قسم {item.className}
                          </span>
                          {item.isUrgent ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-100 text-sky-900 border border-sky-200">
                              ⏰ الأحد (08:00 - 09:00)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              🗓️ الأربعاء (10:00 - 11:00)
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-700 mt-1.5 whitespace-pre-line bg-sky-50/50 p-2.5 rounded-xl font-medium border border-sky-100/60">
                            📌 <b>ملاحظة لولي الأمر:</b> {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingSummons(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition"
                          title="تعديل الموعد والملاحظة"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingSummons(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="إلغاء الموعد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : mainTab === "honors" ? (
        /* ==================== 3. تبويب لوحة الشرف ==================== */
        <div className="space-y-4">
          {/* نموذج إضافة تلميذ إلى لوحة الشرف */}
          <form
            onSubmit={addHonor}
            className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm space-y-3.5"
          >
            <div className="flex items-center justify-between pb-1 border-b border-amber-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>إضافة تلميذ إلى لوحة الشرف (نجوم الرياضيات)</span>
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                أقسام الأستاذ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اسم ولقب التلميذ: <span className="text-amber-600">*</span>
                </label>
                <input
                  className="input text-xs"
                  placeholder="مثال: يونس بلحاج..."
                  value={honorStudentName}
                  onChange={(e) => setHonorStudentName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  القسم: <span className="text-amber-600">*</span>
                </label>
                <select
                  className="input text-xs font-black text-amber-900 bg-amber-50/40 border-amber-200"
                  value={honorClass}
                  onChange={(e) => setHonorClass(e.target.value)}
                  required
                >
                  {HONOR_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls} {cls.startsWith("1") ? "(الأولى متوسط)" : "(الثانية متوسط)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* وسام أو لقب تشجيعي اختياري */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                وسام أو لقب تشجيعي (اختياري):
              </label>
              <input
                className="input text-xs"
                placeholder="مثال: ⭐ نجم الرياضيات أو اختر من الأوسمة السريعة أدناه..."
                value={honorBadge}
                onChange={(e) => setHonorBadge(e.target.value)}
              />
              {/* أوسمة جاهزة سريعة بنقرة واحدة */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  "⭐ نجم الرياضيات",
                  "📖 كراس نموذجي (5/5)",
                  "🎖️ فارس الإتقان",
                  "🌟 تميز وانضباط",
                  "✍️ إتقان الواجبات",
                  "🧠 عبقري الحساب",
                ].map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setHonorBadge(bg)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/70 hover:bg-amber-100 transition active:scale-95"
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* ملاحظة تشجيعية اختيارية */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ملاحظة الأستاذ التشجيعية (غير ضرورية واختيارية):
              </label>
              <textarea
                className="input text-xs min-h-[60px]"
                value={honorNotes}
                onChange={(e) => setHonorNotes(e.target.value)}
                placeholder="مثال: تميز كبير في الفرض وحل جميع الواجبات المنزلية بدقة وكراس متقن..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 text-xs bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الإضافة...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  <span>إضافة التلميذ فورياً إلى لوحة الشرف 🏆</span>
                </>
              )}
            </button>
          </form>

          {/* قائمة التلاميذ المكرمين مع فلتر الأقسام */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>قائمة نجوم الرياضيات في لوحة الشرف:</span>
              <span className="text-[11px] bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full font-extrabold border border-amber-200">
                {honorsList.length} متميز
              </span>
            </div>

            {/* فلتر الأقسام الأربعة */}
            <div className="grid grid-cols-5 gap-1 bg-white p-1 rounded-xl border border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setSelectedHonorFilter("all")}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedHonorFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                الكل ({honorsList.length})
              </button>
              {HONOR_CLASSES.map((cls) => {
                const count = honorsList.filter(
                  (h) => (h.className || "").replace(/\s+/g, "") === cls.replace(/\s+/g, "")
                ).length;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedHonorFilter(cls)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedHonorFilter === cls
                        ? "bg-amber-500 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cls} ({count})
                  </button>
                );
              })}
            </div>

            {/* عرض بطاقات التلاميذ */}
            {honorsList.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-amber-200 text-xs text-slate-400 p-4 space-y-1">
                <div className="text-amber-500 text-lg">⭐</div>
                <div>لا يوجد تلاميذ مضافين في لوحة الشرف حالياً.</div>
                <div className="text-[11px] text-slate-400">أضف أفضل تلاميذك وسيتألقون مباشرة أمام زملائهم وأوليائهم!</div>
              </div>
            ) : (
              <div className="space-y-2">
                {honorsList
                  .filter(
                    (h) =>
                      selectedHonorFilter === "all" ||
                      (h.className || "").replace(/\s+/g, "") ===
                        selectedHonorFilter.replace(/\s+/g, "")
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-3 rounded-2xl border border-amber-200/60 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black">
                              ⭐
                            </span>
                            <span className="font-black text-xs text-slate-900">
                              {item.studentName}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200/50">
                              قسم {item.className}
                            </span>
                            {item.badge && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-slate-600 mt-1 whitespace-pre-line bg-amber-50/40 p-2 rounded-lg font-medium border border-amber-100/50">
                              💬 {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingHonor(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                            title="تعديل بيانات التلميذ"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingHonor(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="حذف من لوحة الشرف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== 4. تبويب الخصومات والعقوبات (خاص بالأستاذ) ==================== */
        <div className="space-y-4">
          {/* تنبيه الخصوصية: خاص بالأستاذ ومحجوب عن الجميع */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-start gap-3 shadow-sm border border-slate-800">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
                <span>سجل الخصومات الداخلي (خاص بك كأستاذ فقط 🔒)</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                هذا السجل محجوب ومخفي تماماً عن التلاميذ والأولياء ولا يظهر في الواجهة الرئيسية للموقع حفاظاً على الراحة النفسية. يمكنك تدوين الخصومات لمتابعتها وضبط التقويم المستمر، أو مسحها نهائياً متى شئت.
              </p>
            </div>
          </div>

          {/* نموذج إضافة عقوبة أو خصم لتلميذ أو مجموعة تلاميذ */}
          <form
            onSubmit={addPenalty}
            className="bg-white rounded-2xl p-4 border-2 border-red-200/90 shadow-sm space-y-3.5"
          >
            <div className="flex items-center justify-between pb-1 border-b border-red-100">
              <span className="text-xs font-black text-red-950 flex items-center gap-1.5">
                <OctagonAlert className="w-4 h-4 text-red-600" />
                <span>تسجيل خصم أو عقوبة في التقويم المستمر</span>
              </span>
              <span className="text-[10px] bg-red-50 text-red-700 font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">
                سجل الانضباط ⚠️
              </span>
            </div>

            <div className="space-y-3.5">
              {/* 1. القسم المعني */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  القسم المعني: <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {HONOR_CLASSES.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setPenaltyClass(cls)}
                      className={`py-2 px-1 rounded-xl text-xs font-black transition border ${
                        penaltyClass === cls
                          ? "bg-red-600 text-white border-red-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. إضافة التلاميذ - إمكانية إضافة أكثر من طالب بسهولة تامة */}
              <div className="space-y-2 bg-red-50/40 p-3 rounded-2xl border border-red-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-red-950 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-red-600" />
                    <span>إضافة التلاميذ المعنيين بالعقوبة:</span>
                    <span className="text-red-600">*</span>
                  </label>
                  {penaltyStudents.length > 0 && (
                    <span className="text-[11px] font-black text-red-700 bg-red-100/90 px-2 py-0.5 rounded-lg border border-red-200">
                      تم اختيار ({penaltyStudents.length}) تلاميذ
                    </span>
                  )}
                </div>

                {/* حقل كتابة اسم التلميذ مع زر إضافة أو الضغط على Enter */}
                <div className="flex gap-1.5">
                  <input
                    className="input text-xs font-bold flex-1"
                    placeholder="اكتب اسم التلميذ واضغط Enter أو زر الإضافة..."
                    value={currentStudentName}
                    onChange={(e) => setCurrentStudentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddStudent();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddStudent}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shrink-0 flex items-center gap-1 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة</span>
                  </button>
                </div>

                {/* قائمة شارات التلاميذ المحددين */}
                {penaltyStudents.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-red-900 flex items-center justify-between">
                      <span>التلاميذ المحددين لنفس العقوبة والتوقيت ({penaltyStudents.length}):</span>
                      <button
                        type="button"
                        onClick={() => setPenaltyStudents([])}
                        className="text-[10px] text-red-500 hover:text-red-700 underline font-bold"
                      >
                        مسح الكل
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-red-200 max-h-36 overflow-y-auto">
                      {penaltyStudents.map((stName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-950 font-black text-xs border border-red-200 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          <span>{stName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(stName)}
                            className="text-red-400 hover:text-red-700 font-black text-xs hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center transition"
                            title="إزالة هذا التلميذ"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 font-medium">
                    💡 اكتب اسم التلميذ واضغط <b>Enter</b> أو زر <b>إضافة</b>، أو الصق عدة أسماء مفصولة بفواصل. يمكنك إضافة طالبين أو 5 أو 10 طلاب دفعة واحدة ثم حفظهم معاً بنقرة واحدة.
                  </p>
                )}
              </div>

              {/* 3. مقدار الخصم والعقوبة مع أزرار سريعة */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  مقدار الخصم أو نوع العقوبة: <span className="text-red-600">*</span>
                </label>
                <input
                  className="input text-xs font-bold text-red-700 bg-red-50/30 border-red-200"
                  value={penaltyDeduction}
                  onChange={(e) => setPenaltyDeduction(e.target.value)}
                  placeholder="مثال: ناقص 3 في التقويم المستمر (-3)..."
                  required
                />
                {/* أزرار سريعة لمقدار الخصم بنقرة واحدة */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    "ناقص 3 في التقويم المستمر (-3)",
                    "ناقص 2 في التقويم المستمر (-2)",
                    "ناقص 1 في التقويم المستمر (-1)",
                    "ناقص 5 في التقويم المستمر (-5)",
                    "خصم نقطة السلوك والمواظبة (-2)",
                    "إنذار شفهي مسجل",
                  ].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setPenaltyDeduction(d)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-50 text-red-800 border border-red-200/80 hover:bg-red-100 transition active:scale-95"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. سبب العقوبة مع أزرار سريعة */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  سبب العقوبة: <span className="text-red-600">*</span>
                </label>
                <input
                  className="input text-xs"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  placeholder="مثال: هروب من الحصة، تشويش متكرر، إهمال حل الواجبات..."
                  required
                />
                {/* أسباب شائعة جاهزة */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    "هروب من الحصة",
                    "تشويش متكرر وإخلال بنظام القسم",
                    "عدم إحضار كراس الدروس 192 صفحة",
                    "عدم حل الواجب المنزلي في البيت",
                    "دروس ناقصة في الكراس وإهمال الكتابة",
                    "عدم إحضار الأدوات الهندسية",
                    "رفض المشاركة والمحاولة",
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setPenaltyReason(r)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition active:scale-95"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. تاريخ وتوقيت الحصة الموحد */}
              <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>تاريخ وتوقيت الحصة (موحد لجميع التلاميذ المحددين):</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">التاريخ:</label>
                    <input
                      className="input text-xs"
                      placeholder="مثال: الأربعاء 07 أكتوبر 2026"
                      value={penaltyDate}
                      onChange={(e) => setPenaltyDate(e.target.value)}
                    />
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          setPenaltyDate(
                            now.toLocaleDateString("ar-DZ", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          );
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition active:scale-95"
                      >
                        📅 اليوم تلقائياً
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() - 1);
                          setPenaltyDate(
                            d.toLocaleDateString("ar-DZ", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          );
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition active:scale-95"
                      >
                        📅 يوم أمس
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">توقيت الحصة:</label>
                    <input
                      className="input text-xs"
                      placeholder="مثال: حصة 10:00 - 11:00"
                      value={penaltyTiming}
                      onChange={(e) => setPenaltyTiming(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[
                        "حصة 08:00 - 09:00",
                        "حصة 09:00 - 10:00",
                        "حصة 10:00 - 11:00",
                        "حصة 11:00 - 12:00",
                        "حصة 13:00 - 14:00",
                        "حصة 14:00 - 15:00",
                        "حصة 15:00 - 16:00",
                      ].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPenaltyTiming(t)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border transition ${
                            penaltyTiming === t
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. ملاحظات وتوجيه إضافي لولي الأمر */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ملاحظة وتوجيه إضافي لولي الأمر والتلميذ (اختياري):
                </label>
                <textarea
                  className="input text-xs min-h-[55px]"
                  value={penaltyNotes}
                  onChange={(e) => setPenaltyNotes(e.target.value)}
                  placeholder="مثال: على أولياء الأمور تفقد كراريس أبنائهم ومتابعة انضباطهم فوراً..."
                />
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل العقوبة لجميع التلاميذ...</span>
                </>
              ) : (
                <>
                  <OctagonAlert className="w-4 h-4" />
                  <span>
                    {penaltyStudents.length > 1
                      ? `حفظ وتسجيل العقوبة لجميع الـ (${penaltyStudents.length}) تلاميذ دفعة واحدة بنفس التوقيت ⚠️`
                      : penaltyStudents.length === 1
                      ? `حفظ وتسجيل العقوبة للتلميذ (${penaltyStudents[0]}) ⚠️`
                      : "حفظ وتسجيل العقوبة ⚠️"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* قائمة الخصومات والعقوبات الحالية */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <div className="flex items-center gap-2">
                <span>العقوبات والخصومات المسجلة:</span>
                <span className="text-[11px] bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full font-extrabold border border-red-200">
                  {penaltiesList.length} خصم مسجل
                </span>
              </div>
              {penaltiesList.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllPenalties}
                  className="text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 font-extrabold flex items-center gap-1 transition"
                  title="مسح كافة الخصومات المسجلة نهائياً"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>مسح كافة السجلات</span>
                </button>
              )}
            </div>

            {/* فلتر الأقسام الأربعة */}
            <div className="grid grid-cols-5 gap-1 bg-white p-1 rounded-xl border border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setSelectedPenaltyFilter("all")}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedPenaltyFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                الكل ({penaltiesList.length})
              </button>
              {HONOR_CLASSES.map((cls) => {
                const count = penaltiesList.filter(
                  (p) => (p.className || "").replace(/\s+/g, "") === cls.replace(/\s+/g, "")
                ).length;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedPenaltyFilter(cls)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedPenaltyFilter === cls
                        ? "bg-red-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cls} ({count})
                  </button>
                );
              })}
            </div>

            {/* عرض بطاقات العقوبات */}
            {penaltiesList.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-red-200 text-xs text-slate-400 p-4 space-y-1">
                <div className="text-emerald-500 text-lg">👏</div>
                <div>لا توجد خصومات أو عقوبات مسجلة حالياً.</div>
                <div className="text-[11px] text-slate-400">جميع الأقسام منضبطة والحمد لله!</div>
              </div>
            ) : (
              <div className="space-y-2">
                {penaltiesList
                  .filter(
                    (p) =>
                      selectedPenaltyFilter === "all" ||
                      (p.className || "").replace(/\s+/g, "") === selectedPenaltyFilter.replace(/\s+/g, "")
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-3.5 rounded-2xl border-2 border-red-100 shadow-2xs space-y-2 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-1 bg-red-600" />
                      <div className="flex items-start justify-between gap-2 pr-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-slate-900">{item.studentName}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-50 text-red-800 border border-red-200">
                              قسم {item.className}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white shadow-2xs">
                              {item.deduction}
                            </span>
                          </div>

                          <div className="bg-red-50/60 p-2 rounded-xl border border-red-100 mt-2 text-xs">
                            <span className="font-black text-red-800 ml-1">السبب:</span>
                            <span className="font-bold text-red-950">{item.reason}</span>
                          </div>

                          {item.date && (
                            <div className="text-[11px] text-slate-400 mt-1 font-medium flex items-center gap-1">
                              <span>📅 {item.date}</span>
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-xs text-amber-900 mt-1 bg-amber-50/60 p-2 rounded-lg font-medium border border-amber-200/50">
                              📌 {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingPenalty(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition"
                            title="تعديل بيانات العقوبة"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPenalty(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="إلغاء وحذف العقوبة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة تعديل الدرس */}
      {editingLesson && (
        <EditLessonModal
          lesson={editingLesson}
          knownSections={knownSections}
          onClose={() => setEditingLesson(null)}
          onSuccess={(updated) => {
            setEditingLesson(null);
            // تحديث فوري مباشر للحالة
            setAllLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            showToast("success", "✓ تم تحديث العنصر بنجاح!");
          }}
        />
      )}

      {/* نافذة تأكيد حذف الدرس */}
      {deletingLesson && (
        <DeleteLessonModal
          lesson={deletingLesson}
          onClose={() => setDeletingLesson(null)}
          onSuccess={(deletedId) => {
            setDeletingLesson(null);
            // تحديث فوري مباشر للحالة
            setAllLessons((prev) => prev.filter((l) => l.id !== deletedId));
            showToast("success", "✓ تم الحذف بنجاح!");
          }}
        />
      )}

      {/* نافذة تعديل استدعاء الولي */}
      {editingSummons && (
        <EditSummonsModal
          summons={editingSummons}
          onClose={() => setEditingSummons(null)}
          onSuccess={(updated) => {
            setEditingSummons(null);
            // تحديث فوري مباشر للحالة
            setSummonsList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            showToast("success", "✓ تم تحديث الاستدعاء بنجاح!");
          }}
        />
      )}

      {/* نافذة تأكيد حذف استدعاء الولي */}
      {deletingSummons && (
        <DeleteSummonsModal
          summons={deletingSummons}
          onClose={() => setDeletingSummons(null)}
          onSuccess={(deletedId) => {
            setDeletingSummons(null);
            // تحديث فوري مباشر للحالة
            setSummonsList((prev) => prev.filter((s) => s.id !== deletedId));
            showToast("success", "✓ تم حذف الاستدعاء من القائمة بنجاح!");
          }}
        />
      )}

      {/* نافذة تعديل تلميذ في لوحة الشرف */}
      {editingHonor && (
        <EditHonorModal
          honor={editingHonor}
          onClose={() => setEditingHonor(null)}
          onSuccess={(updated) => {
            setEditingHonor(null);
            // تحديث فوري مباشر للحالة
            setHonorsList((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
            showToast("success", "✓ تم تحديث بيانات التلميذ بنجاح! 🏆");
          }}
        />
      )}

      {/* نافذة تأكيد حذف تلميذ من لوحة الشرف */}
      {deletingHonor && (
        <DeleteHonorModal
          honor={deletingHonor}
          onClose={() => setDeletingHonor(null)}
          onSuccess={(deletedId) => {
            setDeletingHonor(null);
            // تحديث فوري مباشر للحالة
            setHonorsList((prev) => prev.filter((h) => h.id !== deletedId));
            showToast("success", "✓ تم حذف التلميذ من لوحة الشرف!");
          }}
        />
      )}

      {/* نافذة تعديل العقوبة */}
      {editingPenalty && (
        <EditPenaltyModal
          penalty={editingPenalty}
          onClose={() => setEditingPenalty(null)}
          onSuccess={(updated) => {
            setEditingPenalty(null);
            // تحديث فوري مباشر للحالة
            setPenaltiesList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            showToast("success", "✓ تم تحديث بيانات الخصم والعقوبة بنجاح! ⚠️");
          }}
        />
      )}

      {/* نافذة تأكيد حذف العقوبة */}
      {deletingPenalty && (
        <DeletePenaltyModal
          penalty={deletingPenalty}
          onClose={() => setDeletingPenalty(null)}
          onSuccess={(deletedId) => {
            setDeletingPenalty(null);
            // تحديث فوري مباشر للحالة
            setPenaltiesList((prev) => prev.filter((p) => p.id !== deletedId));
            showToast("success", "✓ تم حذف العقوبة وإلغاء الخصم بنجاح!");
          }}
        />
      )}
    </div>
  );
}

/* ---------------- 3. بطاقة درس / حصة ---------------- */
function LessonCard({
  lesson,
  open,
  onToggle,
  onLessonUpdated,
  onEdit,
  onDelete,
  showToast,
}: {
  lesson: Lesson;
  open: boolean;
  onToggle: () => void;
  onLessonUpdated: (updated: Lesson) => void;
  onEdit: () => void;
  onDelete: () => void;
  showToast: (type: "success" | "error", text: string) => void;
}) {
  const [uploading, setUploading] = useState("");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [isDeletingImg, setIsDeletingImg] = useState(false);

  const isDirectedWork = lesson.type === "directed_work";

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);

    for (let k = 0; k < list.length; k++) {
      setUploading(`جاري ضغط ورفع الصورة ${k + 1} من ${list.length}...`);
      try {
        const compressed = await imageCompression(list[k], {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
          fileType: "image/jpeg",
        });

        const formData = new FormData();
        formData.append("lessonId", lesson.id);
        formData.append("file", compressed, list[k].name);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "فشل الرفع");
        }
      } catch (e: any) {
        showToast("error", "فشل رفع إحدى الصور: " + (e.message || "خطأ غير معروف"));
      }
    }

    setUploading("");
    showToast("success", `✓ تم رفع الصور بنجاح إلى "${lesson.title}"`);

    // جلب الدرس المحدث وتحديث الحالة محلياً مباشرة
    const res = await fetch(`/api/lessons/${lesson.id}?_t=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();
    if (data.lesson) onLessonUpdated(data.lesson);
  };

  const confirmDeleteImage = async () => {
    if (!deletingImageId) return;
    setIsDeletingImg(true);
    try {
      const res = await fetch(`/api/images?lessonId=${lesson.id}&imageId=${deletingImageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("success", "✓ تم حذف الصورة بنجاح");
        // تحديث محلي مباشر
        const updated = {
          ...lesson,
          images: lesson.images.filter((img) => img.id !== deletingImageId),
        };
        onLessonUpdated(updated);
        setDeletingImageId(null);
      } else {
        const data = await res.json();
        showToast("error", data.error || "تعذر حذف الصورة");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم لحذف الصورة");
    } finally {
      setIsDeletingImg(false);
    }
  };

  const moveImage = async (index: number, direction: "prev" | "next") => {
    const images = [...lesson.images];
    const targetIndex = direction === "prev" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const temp = images[index];
    images[index] = images[targetIndex];
    images[targetIndex] = temp;

    // تحديث محلي فوري
    onLessonUpdated({ ...lesson, images });

    try {
      const res = await fetch("/api/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          imageIds: images.map((img) => img.id),
        }),
      });
      if (!res.ok) {
        showToast("error", "فشل حفظ ترتيب الصور في الخادم");
      }
    } catch {
      showToast("error", "فشل تغيير ترتيب الصور");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden transition">
      <div className="p-3 flex items-start justify-between gap-2">
        <button onClick={onToggle} className="flex-1 flex items-start gap-2.5 text-right min-w-0">
          <span
            className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-black text-xs mt-0.5 ${
              isDirectedWork
                ? "bg-sky-50 text-sky-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {lesson.number}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-slate-900 leading-snug break-words">
              {lesson.title}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-400">
              <span>{isDirectedWork ? "حصة" : "مورد"} {lesson.number}</span>
              <span>•</span>
              <span className="font-bold text-slate-500">{lesson.images?.length || 0} صور</span>
              {lesson.notes && (
                <>
                  <span>•</span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">📌 ملاحظة</span>
                </>
              )}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform shrink-0 mt-1 ${open ? "rotate-180" : ""}`}
          />
        </button>

        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
            title="تعديل البيانات"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            title="حذف العنصر كاملاً"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 p-3.5 space-y-3.5 bg-slate-50/50">
          {lesson.notes && (
            <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-black text-[11px] flex items-center gap-1">
                <StickyNote className="w-3.5 h-3.5 text-amber-600" /> ملاحظة الأستاذ:
              </span>
              <p className="whitespace-pre-line leading-relaxed font-medium">{lesson.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>صور السبورة لهذا الدرس ({lesson.images?.length || 0}):</span>
            <span className="text-[11px] text-slate-400 font-normal">مرتبة بالتسلسل</span>
          </div>

          {lesson.images && lesson.images.length > 0 ? (
            <div className="space-y-2">
              {lesson.images.map((img, idx) => (
                <div
                  key={img.id}
                  className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-slate-100 shadow-2xs"
                >
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    onClick={() => setPreviewImg(img.url)}
                    className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0 cursor-pointer hover:opacity-90 transition"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-700 truncate">
                      صورة السبورة {idx + 1}
                    </div>
                    <button
                      onClick={() => setPreviewImg(img.url)}
                      className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Eye className="w-3 h-3" /> معاينة كاملة
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, "prev")}
                      className={`w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center transition ${
                        idx === 0
                          ? "opacity-30 cursor-not-allowed text-slate-300"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      title="تقديم لأعلى"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === lesson.images.length - 1}
                      onClick={() => moveImage(idx, "next")}
                      className={`w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center transition ${
                        idx === lesson.images.length - 1
                          ? "opacity-30 cursor-not-allowed text-slate-300"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      title="تأخير لأسفل"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setDeletingImageId(img.id)}
                    className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition"
                    title="حذف هذه الصورة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              لا توجد صور مرفوعة لهذا الدرس بعد. اضغط الزر أدناه لرفع صور السبورة.
            </div>
          )}

          <label
            className={`btn-primary w-full py-3 text-xs cursor-pointer shadow-sm ${
              uploading ? "opacity-70 pointer-events-none" : ""
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploading}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>📷 رفع صور جديدة (يمكن اختيار صورة أو عدة صور معاً)</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
            <a
              href={`/lesson/${lesson.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5" /> فتح صفحة الدرس للتلميذ
            </a>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> حذف العنصر كاملاً
            </button>
          </div>
        </div>
      )}

      {deletingImageId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 text-center fade-up">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">تأكيد حذف صورة السبورة</h3>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من حذف هذه الصورة من "{lesson.title}"؟
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                disabled={isDeletingImg}
                onClick={confirmDeleteImage}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1"
              >
                {isDeletingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : "نعم، حذف الصورة"}
              </button>
              <button
                disabled={isDeletingImg}
                onClick={() => setDeletingImageId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-3"
          onClick={() => setPreviewImg(null)}
        >
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImg}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- 4. نافذة تعديل الدرس ---------------- */
function EditLessonModal({
  lesson,
  knownSections,
  onClose,
  onSuccess,
}: {
  lesson: Lesson;
  knownSections: string[];
  onClose: () => void;
  onSuccess: (updated: Lesson) => void;
}) {
  const [num, setNum] = useState(String(lesson.number));
  const [title, setTitle] = useState(lesson.title);
  const [field, setField] = useState(lesson.field || "أنشطة عددية");
  const [section, setSection] = useState(lesson.section || "المقطع 1 : الأعداد الطبيعية والأعداد العشرية");
  const [notes, setNotes] = useState(lesson.notes || "");
  const [type, setType] = useState<NotebookType>(lesson.type || "lessons");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr("العنوان مطلوب");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      const res = await fetch("/api/lessons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lesson.id,
          type,
          title: title.trim(),
          number: Number(num) || lesson.number,
          field: type === "lessons" ? field.trim() : undefined,
          section: type === "lessons" ? section.trim() : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التعديل");

      onSuccess(data.lesson);
    } catch (e: any) {
      setErr(e.message || "حدث خطأ أثناء التعديل");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={submit}
        className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-xl border border-slate-100 fade-up my-auto max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">تعديل بيانات العنصر</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {err && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1">الكراس التابع له:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("lessons")}
              className={`py-2 text-xs font-bold rounded-xl border transition ${
                type === "lessons"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              📘 كراس الدروس
            </button>
            <button
              type="button"
              onClick={() => setType("directed_work")}
              className={`py-2 text-xs font-bold rounded-xl border transition ${
                type === "directed_work"
                  ? "bg-sky-50 text-sky-800 border-sky-400"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              📗 الأعمال الموجهة
            </button>
          </div>
        </div>

        {type === "lessons" && (
          <>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">الميدان:</label>
              <input
                className="input text-xs font-semibold"
                value={field}
                onChange={(e) => setField(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">المقطع المعرفي:</label>
              <input
                className="input text-xs font-semibold"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-1">
            <label className="text-xs font-bold text-slate-600 block mb-1">الرقم:</label>
            <input
              className="input text-center text-sm font-extrabold text-emerald-700 bg-emerald-50/40"
              inputMode="numeric"
              value={num}
              onChange={(e) => setNum(e.target.value)}
              required
            />
          </div>
          <div className="col-span-3">
            <label className="text-xs font-bold text-slate-600 block mb-1">العنوان:</label>
            <input
              className="input text-xs font-semibold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1">
            ملاحظات وتوجيهات الأستاذ:
          </label>
          <textarea
            className="input text-xs min-h-[60px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظة إن أردت..."
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button disabled={busy} className="btn-primary flex-1 py-2.5 text-xs">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التعديل"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- 5. نافذة تأكيد حذف الدرس ---------------- */
function DeleteLessonModal({
  lesson,
  onClose,
  onSuccess,
}: {
  lesson: Lesson;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submitDelete = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/lessons?id=${encodeURIComponent(lesson.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحذف");
      onSuccess(lesson.id);
    } catch (e: any) {
      setErr(e.message || "حدث خطأ أثناء محاولة الحذف");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 text-center fade-up">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-extrabold text-sm text-slate-900">تأكيد الحذف نهائياً</h3>
          <p className="text-xs font-bold text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-snug break-words">
            {lesson.title}
          </p>
          <p className="text-[11px] text-red-600 mt-2">
            ⚠️ تنبيه: سيتم حذف هذا العنصر وجميع صور السبورة التابعة له ({lesson.images?.length || 0} صورة) بشكل دائم.
          </p>
        </div>

        {err && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold">
            {err}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            disabled={busy}
            onClick={submitDelete}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "نعم، حذف الآن"}
          </button>
          <button
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            إلغاء وتراجع
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 6. نافذة تعديل موعد استقبال الولي ---------------- */
function EditSummonsModal({
  summons,
  onClose,
  onSuccess,
}: {
  summons: ParentSummons;
  onClose: () => void;
  onSuccess: (updated: ParentSummons) => void;
}) {
  const [studentName, setStudentName] = useState(summons.studentName);
  const [className, setClassName] = useState(summons.className);
  const [notes, setNotes] = useState(summons.notes || "");
  const [isExtraSunday, setIsExtraSunday] = useState(Boolean(summons.isUrgent));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !className.trim()) {
      setErr("اسم التلميذ والفوج مطلوبان");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      const res = await fetch("/api/summons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: summons.id,
          studentName: studentName.trim(),
          className: className.trim(),
          notes: notes.trim() || undefined,
          isUrgent: isExtraSunday,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التعديل");

      onSuccess(data.summons);
    } catch (e: any) {
      setErr(e.message || "حدث خطأ أثناء تعديل البيانات");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-xl border border-slate-100 fade-up"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">تعديل موعد استقبال ولي التلميذ 🤝</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {err && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">اسم التلميذ:</label>
              <input
                className="input text-xs font-bold"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">الفوج:</label>
              <input
                className="input text-xs text-center font-black text-sky-700 bg-sky-50/50 border-sky-200"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ملاحظة الأستاذ لولي الأمر:</label>
            <textarea
              className="input text-xs min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب ملاحظة ودية لولي الأمر أو سبب اللقاء..."
            />
          </div>

          <label className="flex items-center gap-2 p-2 rounded-xl bg-sky-50/70 border border-sky-200 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-sky-600 rounded border-slate-300"
              checked={isExtraSunday}
              onChange={(e) => setIsExtraSunday(e.target.checked)}
            />
            <span className="text-xs font-bold text-sky-950">
              توقيت إضافي: الأحد صباحاً (08:00 إلى 09:00)
            </span>
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <button disabled={busy} className="btn-primary flex-1 py-2.5 text-xs bg-sky-600 hover:bg-sky-700">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التعديل"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- 7. نافذة تأكيد إزالة اسم من قائمة الاستقبال ---------------- */
function DeleteSummonsModal({
  summons,
  onClose,
  onSuccess,
}: {
  summons: ParentSummons;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submitDelete = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/summons?id=${encodeURIComponent(summons.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحذف");
      onSuccess(summons.id);
    } catch (e: any) {
      setErr(e.message || "حدث خطأ أثناء محاولة الحذف");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 text-center fade-up">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
          <Users className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-extrabold text-sm text-slate-900">إزالة اسم التلميذ من قائمة الاستقبال</h3>
          <p className="text-xs font-bold text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            التلميذ: {summons.studentName} (فوج {summons.className})
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            هل تم اللقاء مع ولي الأمر أو التواصل وترغب في إزالة اسمه من قائمة الاستقبال؟
          </p>
        </div>

        {err && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold">
            {err}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            disabled={busy}
            onClick={submitDelete}
            className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "نعم، إزالة من القائمة"}
          </button>
          <button
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            إلغاء وتراجع
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 8. نافذة تعديل تلميذ في لوحة الشرف ---------------- */
function EditHonorModal({
  honor,
  onClose,
  onSuccess,
}: {
  honor: HonorStudent;
  onClose: () => void;
  onSuccess: (updated: HonorStudent) => void;
}) {
  const [studentName, setStudentName] = useState(honor.studentName);
  const [className, setClassName] = useState(honor.className);
  const [notes, setNotes] = useState(honor.notes || "");
  const [badge, setBadge] = useState(honor.badge || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !className.trim()) {
      setErr("اسم التلميذ والقسم مطلوبان");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      const res = await fetch("/api/honors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: honor.id,
          studentName: studentName.trim(),
          className: className.trim(),
          notes: notes.trim() || undefined,
          badge: badge.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التعديل");

      onSuccess(data.honor);
    } catch (e: any) {
      setErr(e.message || "حدث خطأ أثناء محاولة التعديل");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-3xl p-5 max-w-md w-full space-y-4 shadow-xl border border-slate-100 text-right fade-up"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
              🏆
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">تعديل بيانات التلميذ في لوحة الشرف</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {err && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold">{err}</div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">اسم التلميذ:</label>
              <input
                className="input text-xs"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">القسم:</label>
              <select
                className="input text-xs font-black text-amber-900 bg-amber-50/40 border-amber-200"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              >
                {HONOR_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">وسام / لقب تشجيعي:</label>
            <input
              className="input text-xs"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="مثال: ⭐ نجم الرياضيات"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ملاحظة تشجيعية (اختيارية):
            </label>
            <textarea
              className="input text-xs min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب ملاحظة إن أردت..."
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button disabled={busy} className="btn-primary flex-1 py-2.5 text-xs bg-amber-500 hover:bg-amber-600">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التعديل"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- 9. نافذة تأكيد حذف تلميذ من لوحة الشرف ---------------- */
function DeleteHonorModal({
  honor,
  onClose,
  onSuccess,
}: {
  honor: HonorStudent;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submitDelete = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/honors?id=${encodeURIComponent(honor.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحذف");
      onSuccess(honor.id);
    } catch (e: any) {
      setErr(e.message || "حدث خطأ أثناء محاولة الحذف");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 text-center fade-up">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl">
          ⭐
        </div>

        <div>
          <h3 className="font-extrabold text-sm text-slate-900">إزالة تلميذ من لوحة الشرف</h3>
          <p className="text-xs font-bold text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            التلميذ: {honor.studentName} (قسم {honor.className})
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            هل أنت متأكد من حذف هذا التلميذ من لوحة الشرف؟
          </p>
        </div>

        {err && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold">
            {err}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            disabled={busy}
            onClick={submitDelete}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "نعم، حذف الآن"}
          </button>
          <button
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 10. نافذة تعديل بيانات عقوبة أو خصم ---------------- */
function EditPenaltyModal({
  penalty,
  onClose,
  onSuccess,
}: {
  penalty: Penalty;
  onClose: () => void;
  onSuccess: (updated: Penalty) => void;
}) {
  const [studentName, setStudentName] = useState(penalty.studentName);
  const [className, setClassName] = useState(penalty.className);
  const [deduction, setDeduction] = useState(penalty.deduction);
  const [reason, setReason] = useState(penalty.reason);
  const [date, setDate] = useState(penalty.date || "");
  const [notes, setNotes] = useState(penalty.notes || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/penalties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: penalty.id,
          studentName,
          className,
          deduction,
          reason,
          date,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التعديل");
      onSuccess(data.penalty);
    } catch (e: any) {
      setErr(e.message || "حدث خطأ أثناء محاولة التعديل");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={submitEdit}
        className="bg-white rounded-3xl p-5 max-w-md w-full space-y-4 shadow-xl border border-red-100 fade-up"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 text-red-700">
              <OctagonAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">تعديل بيانات الخصم / العقوبة</h3>
              <p className="text-[11px] text-slate-400">تحديث خصم التلميذ وسببه</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {err && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
            {err}
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">اسم التلميذ:</label>
              <input
                className="input text-xs font-bold"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">القسم:</label>
              <select
                className="input text-xs font-black text-red-900 bg-red-50/40 border-red-200"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              >
                {HONOR_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block mb-1">مقدار الخصم / العقوبة:</label>
            <input
              className="input text-xs font-bold text-red-700 bg-red-50/40 border-red-200"
              value={deduction}
              onChange={(e) => setDeduction(e.target.value)}
              placeholder="مثال: ناقص 3 في التقويم المستمر (-3)"
              required
            />
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                "ناقص 3 في التقويم المستمر (-3)",
                "ناقص 2 في التقويم المستمر (-2)",
                "ناقص 1 في التقويم المستمر (-1)",
                "ناقص 5 في التقويم المستمر (-5)",
                "خصم نقطة السلوك والمواظبة (-2)",
              ].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeduction(d)}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-800 border border-red-200"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block mb-1">سبب العقوبة:</label>
            <input
              className="input text-xs"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: هروب من الحصة يوم كذا..."
              required
            />
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                "هروب من الحصة",
                "تشويش متكرر وإخلال بنظام القسم",
                "عدم إحضار كراس الدروس 192 صفحة",
                "عدم حل الواجب المنزلي في البيت",
                "دروس ناقصة في الكراس وإهمال الكتابة",
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block mb-1">التاريخ والتوقيت:</label>
            <input
              className="input text-xs"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="مثال: الأربعاء 07 أكتوبر 2026 (حصة 10:00 - 11:00)"
            />
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                "حصة 08:00 - 09:00",
                "حصة 09:00 - 10:00",
                "حصة 10:00 - 11:00",
                "حصة 11:00 - 12:00",
                "حصة 13:00 - 14:00",
                "حصة 14:00 - 15:00",
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    const baseDate = date ? date.split("(")[0].trim() : "الأربعاء 07 أكتوبر 2026";
                    setDate(`${baseDate} (${t})`);
                  }}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ملاحظة للأستاذ أو ولي الأمر (اختيارية):
            </label>
            <textarea
              className="input text-xs min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب ملاحظة إن أردت..."
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button disabled={busy} className="btn-primary flex-1 py-2.5 text-xs bg-red-600 hover:bg-red-700">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التعديل"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- 11. نافذة تأكيد حذف عقوبة أو خصم ---------------- */
function DeletePenaltyModal({
  penalty,
  onClose,
  onSuccess,
}: {
  penalty: Penalty;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submitDelete = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/penalties?id=${encodeURIComponent(penalty.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحذف");
      onSuccess(penalty.id);
    } catch (e: any) {
      setErr(e.message || "حدث خطأ أثناء محاولة الحذف");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-red-100 text-center fade-up">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-xl">
          🛑
        </div>

        <div>
          <h3 className="font-extrabold text-sm text-slate-900">إلغاء وحذف الخصم / العقوبة</h3>
          <p className="text-xs font-bold text-red-800 mt-2 bg-red-50 p-2.5 rounded-xl border border-red-100">
            التلميذ: {penalty.studentName} ({penalty.className})
            <br />
            <span className="text-[11px] font-black">{penalty.deduction}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            هل أنت متأكد من حذف هذه العقوبة وإلغائها نهائياً؟
          </p>
        </div>

        {err && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold">
            {err}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            disabled={busy}
            onClick={submitDelete}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "نعم، حذف العقوبة"}
          </button>
          <button
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCss = `
.input {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.65rem 0.85rem;
  font-size: 0.875rem;
  outline: none;
  width: 100%;
  transition: all 0.2s;
}
.input:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #059669;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.7rem;
  border-radius: 0.75rem;
  transition: all 0.15s;
}
.btn-primary:active {
  transform: scale(0.98);
}
.btn-primary:hover {
  background: #047857;
}
`;
