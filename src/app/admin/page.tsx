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
  Layers,
  BookOpen,
} from "lucide-react";
import {
  LEVELS,
  NOTEBOOKS,
  COMMON_FIELDS,
  type Lesson,
  type LessonImage,
  type NotebookType,
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
  const [level, setLevel] = useState<1 | 2>(1);
  const [notebookTab, setNotebookTab] = useState<NotebookType>("lessons");
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // حقول إضافة عنصر جديد
  const [field, setField] = useState("أنشطة عددية");
  const [section, setSection] = useState("المقطع 1 : الأعداد الطبيعية والأعداد العشرية");
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // حالات النوافذ المنبثقة
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lessons?level=${level}&_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setAllLessons(data.lessons || []);
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg((cur) => (cur?.text === text ? null : cur));
    }, 4500);
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  };

  // تصفية العناصر حسب نوع الكراس المختار
  const currentItems = useMemo(() => {
    return allLessons.filter((l) =>
      notebookTab === "directed_work" ? l.type === "directed_work" : !l.type || l.type === "lessons"
    );
  }, [allLessons, notebookTab]);

  // المقاطع المعرفية المسجلة مسبقاً في هذا المستوى للمساعدة في الاختيار
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

  // إضافة مورد معرفي أو حصة أعمال موجهة
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
      showToast(
        "success",
        `✓ تم إضافة "${data.lesson.title}" إلى ${
          notebookTab === "lessons" ? "كراس الدروس" : "كراس الأعمال الموجهة"
        }!`
      );
      await load();
      setOpenId(data.lesson.id);
    } catch (e: any) {
      showToast("error", "خطأ: " + (e.message || "تعذر الإضافة"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // تنظيم كراس الدروس في مجموعات حسب الميدان والمقطع
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

      {/* شريط الإشعارات الطافي (Toast) */}
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
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
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

        {/* أزرار سريعة للأستاذ */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs font-bold">
          <Link
            href="/announcement"
            target="_blank"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/70 hover:bg-amber-100 transition"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-600" />
            <span>عرض الإعلان والتوجيهات</span>
          </Link>
          <Link
            href={`/year/${level}`}
            target="_blank"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>معاينة صفحة {LEVELS[level].short}</span>
          </Link>
        </div>
      </div>

      {/* اختيار المستوى الدراسي (1 متوسط أو 2 متوسط) */}
      <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs">
        {([1, 2] as const).map((lv) => (
          <button
            key={lv}
            onClick={() => {
              setLevel(lv);
              setOpenId(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              level === lv ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
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

      {/* اختيار الكراس المراد إدارته (كراس الدروس 192ص أو كراس الأعمال الموجهة 96ص) */}
      <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs">
        <button
          onClick={() => {
            setNotebookTab("lessons");
            setOpenId(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
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
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            notebookTab === "directed_work"
              ? "bg-sky-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span>📗</span>
          <span>الأعمال الموجهة (96 ص)</span>
        </button>
      </div>

      {/* نموذج إضافة مورد جديد أو حصة أعمال موجهة */}
      <form onSubmit={addItem} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <span>{notebookTab === "lessons" ? "➕ إضافة مورد معرفي جديد لـ" : "➕ إضافة حصة أعمال موجهة لـ"}</span>
            <span className="text-emerald-700 font-extrabold">{LEVELS[level].short}</span>
          </span>
          <button
            type="button"
            onClick={load}
            className="text-[11px] text-slate-400 hover:text-emerald-600 flex items-center gap-1"
            title="تحديث القائمة"
          >
            <RefreshCw className="w-3 h-3" /> تحديث
          </button>
        </div>

        {notebookTab === "lessons" ? (
          /* حقول كراس الدروس */
          <div className="space-y-3">
            {/* 1. الميدان */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                📐 الميدان:
              </label>
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
                placeholder="أو اكتب ميدان جديد (مثلاً: أنشطة عددية)"
                value={field}
                onChange={(e) => setField(e.target.value)}
                required
              />
            </div>

            {/* 2. المقطع المعرفي */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                📑 المقطع المعرفي:
              </label>
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

            {/* 3. رقم المورد وعنوانه */}
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

            {/* 4. ملاحظات وتوجيهات الأستاذ */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                <span>ملاحظات وتوجيهات الأستاذ لهذا الدرس (اختياري):</span>
              </label>
              <textarea
                className="input text-xs min-h-[65px] resize-y"
                placeholder="مثال: واجب منزلي: حل تمرين 5 ص 18 على كراس المحاولات، تنبيه: إحضار المنقلة والكوس..."
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
                  placeholder="مثال: سلسلة تمارين 01 : الحساب على الأعداد الطبيعية"
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
                className="input text-xs min-h-[65px] resize-y"
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

      {/* قائمة الدروس والأعمال الموجهة المنظمة */}
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
          /* عرض كراس الدروس مقسماً بالميدان والمقطع */
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
                          onChanged={load}
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
          /* عرض كراس الأعمال الموجهة */
          <div className="space-y-2.5">
            {currentItems.map((item) => (
              <LessonCard
                key={item.id}
                lesson={item}
                open={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                onChanged={load}
                onEdit={() => setEditingLesson(item)}
                onDelete={() => setDeletingLesson(item)}
                showToast={showToast}
              />
            ))}
          </div>
        )}
      </div>

      {/* نافذة تعديل الدرس (Edit Lesson Modal) */}
      {editingLesson && (
        <EditLessonModal
          lesson={editingLesson}
          knownSections={knownSections}
          onClose={() => setEditingLesson(null)}
          onSuccess={async () => {
            setEditingLesson(null);
            showToast("success", "✓ تم تحديث العنصر بنجاح!");
            await load();
          }}
        />
      )}

      {/* نافذة تأكيد حذف الدرس (Delete Lesson Modal) */}
      {deletingLesson && (
        <DeleteLessonModal
          lesson={deletingLesson}
          onClose={() => setDeletingLesson(null)}
          onSuccess={async () => {
            setDeletingLesson(null);
            showToast("success", "✓ تم الحذف بنجاح!");
            await load();
          }}
        />
      )}
    </div>
  );
}

/* ---------------- 3. بطاقة درس / حصة مع إدارة الصور ---------------- */
function LessonCard({
  lesson,
  open,
  onToggle,
  onChanged,
  onEdit,
  onDelete,
  showToast,
}: {
  lesson: Lesson;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
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
    onChanged();
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
        setDeletingImageId(null);
        onChanged();
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

    try {
      const res = await fetch("/api/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          imageIds: images.map((img) => img.id),
        }),
      });
      if (res.ok) {
        onChanged();
      }
    } catch {
      showToast("error", "فشل تغيير ترتيب الصور");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden transition">
      {/* رأس بطاقة العنصر */}
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
            {/* العنوان بالكامل بدون أي اقتطاع */}
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

        {/* أزرار الإجراءات السريعة */}
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

      {/* قسم رفع وإدارة صور السبورة عند الفتح */}
      {open && (
        <div className="border-t border-slate-100 p-3.5 space-y-3.5 bg-slate-50/50">
          {/* عرض الملاحظة إن وجدت */}
          {lesson.notes && (
            <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-black text-[11px] flex items-center gap-1">
                <StickyNote className="w-3.5 h-3.5 text-amber-600" /> ملاحظة الأستاذ:
              </span>
              <p className="whitespace-pre-line leading-relaxed">{lesson.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>صور السبورة لهذا الدرس ({lesson.images?.length || 0}):</span>
            <span className="text-[11px] text-slate-400 font-normal">مرتبة بالتسلسل</span>
          </div>

          {/* قائمة الصور الحالية */}
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

                  {/* أزرار الترتيب (تقديم / تأخير) */}
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

                  {/* زر حذف الصورة */}
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

          {/* زر رفع صور جديدة */}
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

          {/* شريط الإجراءات في أسفل البطاقة */}
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

      {/* نافذة تأكيد حذف صورة السبورة */}
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

      {/* نافذة معاينة الصورة بملء الشاشة */}
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

/* ---------------- 4. نافذة تعديل البيانات (Modal) ---------------- */
function EditLessonModal({
  lesson,
  knownSections,
  onClose,
  onSuccess,
}: {
  lesson: Lesson;
  knownSections: string[];
  onClose: () => void;
  onSuccess: () => void;
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

      onSuccess();
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

        {/* نوع الكراس */}
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

/* ---------------- 5. نافذة تأكيد الحذف (Modal) ---------------- */
function DeleteLessonModal({
  lesson,
  onClose,
  onSuccess,
}: {
  lesson: Lesson;
  onClose: () => void;
  onSuccess: () => void;
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
      onSuccess();
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
