"use client";

import { useCallback, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  Plus,
  Trash2,
  Upload,
  LogOut,
  ChevronDown,
  Loader2,
  Pencil,
  Check,
  X,
  ExternalLink,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { LEVELS, type Lesson, type LessonImage } from "@/lib/types";

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

/* ---------------- تسجيل الدخول ---------------- */
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

/* ---------------- لوحة التحكم الرئيسية ---------------- */
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [level, setLevel] = useState<1 | 2>(1);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lessons?level=${level}&_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setLessons(data.lessons || []);
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  };

  const nextNumber = lessons.length ? Math.max(...lessons.map((l) => l.number)) + 1 : 1;

  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrMsg("يرجى كتابة عنوان الدرس أولاً");
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg("");
    setErrMsg("");

    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          number: Number(number) || nextNumber,
          title: title.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ الدرس");

      setTitle("");
      setNumber("");
      setSuccessMsg(`✓ تم إضافة "${data.lesson.title}" بنجاح! يمكنك الآن رفع صوره بالأسفل.`);
      await load();
      setOpenId(data.lesson.id);
    } catch (e: any) {
      setErrMsg("خطأ: " + (e.message || "تعذر إضافة الدرس"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-4 space-y-4 fade-up">
      <style>{inputCss}</style>

      {/* الشريط العلوي */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-base font-extrabold text-slate-800">لوحة إدارة الدروس</h1>
          <p className="text-[11px] text-emerald-600 font-bold">الأستاذ محمد عدايكة — متوسطة باهي علي</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl border border-slate-100 transition"
        >
          <LogOut className="w-3.5 h-3.5" /> خروج
        </button>
      </div>

      {/* اختيار المستوى */}
      <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xs">
        {([1, 2] as const).map((lv) => (
          <button
            key={lv}
            onClick={() => {
              setLevel(lv);
              setOpenId(null);
              setSuccessMsg("");
              setErrMsg("");
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition ${
              level === lv ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {LEVELS[lv].label}
          </button>
        ))}
      </div>

      {/* نموذج إضافة درس */}
      <form onSubmit={addLesson} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            ➕ إضافة درس جديد لـ <span className="text-emerald-700 font-black">{LEVELS[level].short}</span>:
          </span>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-800 text-xs font-bold border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errMsg}</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 shrink-0">رقم الدرس:</label>
            <input
              className="input w-24 text-center text-sm font-extrabold text-emerald-700 bg-emerald-50/40 border-emerald-200"
              inputMode="numeric"
              placeholder={String(nextNumber)}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
            <span className="text-[11px] text-slate-400">
              (تلقائياً: <span className="font-bold text-slate-600">{nextNumber}</span>)
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">عنوان الدرس:</label>
            <input
              className="input text-sm font-semibold"
              placeholder="مثال: قراءة وكتابة عدد طبيعي (أو: الدرس 01 : قراءة وكتابة عدد طبيعي)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <button disabled={isSubmitting} className="btn-primary w-full py-3 text-sm">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>إضافة الدرس والبدء برفع الصور</span>
            </>
          )}
        </button>
      </form>

      {/* قائمة الدروس */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>قائمة دروس {LEVELS[level].label}:</span>
          <span className="text-[11px] text-slate-400 font-normal">عدد الدروس: {lessons.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
            جاري جلب الدروس...
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-10 bg-white rounded-2xl border border-dashed border-slate-200">
            لا توجد دروس بعد لـ {LEVELS[level].short}. اكتب عنوان الدرس أعلاه واضغط على زر الإضافة!
          </div>
        ) : (
          lessons.map((l) => (
            <LessonCard
              key={l.id}
              lesson={l}
              open={openId === l.id}
              onToggle={() => setOpenId(openId === l.id ? null : l.id)}
              onChanged={load}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- بطاقة درس واحد مع إدارة صوره ---------------- */
function LessonCard({
  lesson,
  open,
  onToggle,
  onChanged,
}: {
  lesson: Lesson;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const [uploading, setUploading] = useState("");
  const [editing, setEditing] = useState(false);
  const [t, setT] = useState(lesson.title);
  const [n, setN] = useState(String(lesson.number));
  const [previewImg, setPreviewImg] = useState<string | null>(null);

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
        alert("فشل رفع الصورة: " + (e.message || "خطأ غير معروف"));
      }
    }

    setUploading("");
    onChanged();
  };

  const removeImage = async (imageId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
    try {
      const res = await fetch(`/api/images?lessonId=${lesson.id}&imageId=${imageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onChanged();
      }
    } catch {
      alert("تعذر حذف الصورة");
    }
  };

  const moveImage = async (index: number, direction: "prev" | "next") => {
    const images = [...lesson.images];
    const targetIndex = direction === "prev" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    // تبديل المكان
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
      alert("فشل تغيير ترتيب الصور");
    }
  };

  const removeLesson = async () => {
    if (!confirm(`هل أنت متأكد من حذف الدرس "${lesson.title}" وكافة صوره؟`)) return;
    try {
      const res = await fetch(`/api/lessons?id=${lesson.id}`, { method: "DELETE" });
      if (res.ok) {
        onChanged();
      }
    } catch {
      alert("فشل حذف الدرس");
    }
  };

  const saveEdit = async () => {
    await fetch("/api/lessons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: lesson.id,
        title: t.trim(),
        number: Number(n) || lesson.number,
      }),
    });
    setEditing(false);
    onChanged();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden transition">
      {/* رأس بطاقة الدرس */}
      <div className="flex items-center gap-2.5 p-3">
        {editing ? (
          <>
            <input
              className="input w-14 text-center text-xs font-bold !py-1.5"
              value={n}
              onChange={(e) => setN(e.target.value)}
            />
            <input
              className="input flex-1 text-xs !py-1.5"
              value={t}
              onChange={(e) => setT(e.target.value)}
            />
            <button
              onClick={saveEdit}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
              title="حفظ التعديل"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"
              title="إلغاء"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button onClick={onToggle} className="flex-1 flex items-center gap-2.5 text-right">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                {lesson.number}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-slate-800 truncate">{lesson.title}</div>
                <div className="text-[10px] text-slate-400">الدرس رقم {lesson.number}</div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                  lesson.images?.length > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {lesson.images?.length || 0} صور
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              title="تعديل العنوان والرقم"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* قسم رفع وإدارة صور الدرس */}
      {open && !editing && (
        <div className="border-t border-slate-100 p-3.5 space-y-3.5 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>صور السبورة لهذا الدرس ({lesson.images?.length || 0}):</span>
            <span className="text-[11px] text-slate-400 font-normal">
              مرتبة حسب التسلسل الذي يراه التلميذ
            </span>
          </div>

          {/* قائمة الصور الحالية مع الترتيب والحذف */}
          {lesson.images && lesson.images.length > 0 ? (
            <div className="space-y-2">
              {lesson.images.map((img, idx) => (
                <div
                  key={img.id}
                  className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-slate-100 shadow-2xs"
                >
                  {/* شارة رقم الصورة */}
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>

                  {/* صورة مصغرة */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    onClick={() => setPreviewImg(img.url)}
                    className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-700 truncate">
                      الصورة رقم {idx + 1}
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
                    onClick={() => removeImage(img.id)}
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
                <span>📷 رفع صور جديدة للدرس (يمكن اختيار صورة أو عدة صور معاً)</span>
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

          {/* روابط سريعة للدرس */}
          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
            <a
              href={`/lesson/${lesson.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5" /> صفحة الدرس كما يراها التلميذ
            </a>
            <button
              onClick={removeLesson}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> حذف الدرس
            </button>
          </div>
        </div>
      )}

      {/* نافذة معاينة الصورة للأستاذ */}
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
