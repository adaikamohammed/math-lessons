"use client";

import { useCallback, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { Plus, Trash2, Upload, LogOut, ChevronDown, Loader2, Pencil, Check, X, ExternalLink, Lock } from "lucide-react";
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
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lessons?level=${level}`);
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
    if (!title.trim()) return;

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
      if (!res.ok) throw new Error(data.error);

      setTitle("");
      setNumber("");
      await load();
      setOpenId(data.lesson.id);
    } catch (e: any) {
      alert("خطأ: " + e.message);
    }
  };

  return (
    <div className="pt-4 space-y-4 fade-up">
      <style>{inputCss}</style>
      
      {/* الشريط العلوي */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-base font-extrabold text-slate-800">لوحة إدارة الدروس</h1>
          <p className="text-[11px] text-emerald-600 font-bold">الأستاذ محمد عدايكة</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl border border-slate-100 transition">
          <LogOut className="w-3.5 h-3.5" /> خروج
        </button>
      </div>

      {/* اختيار المستوى */}
      <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xs">
        {([1, 2] as const).map((lv) => (
          <button
            key={lv}
            onClick={() => { setLevel(lv); setOpenId(null); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition ${
              level === lv ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {LEVELS[lv].label}
          </button>
        ))}
      </div>

      {/* نموذج إضافة درس */}
      <form onSubmit={addLesson} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5">
        <div className="text-xs font-bold text-slate-700">إضافة درس جديد لـ {LEVELS[level].short}:</div>
        <div className="flex gap-2">
          <input
            className="input w-16 text-center text-xs font-bold"
            inputMode="numeric"
            placeholder={String(nextNumber)}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <input
            className="input flex-1 text-xs"
            placeholder="عنوان الدرس (مثال: قراءة وكتابة عدد طبيعي)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <button className="btn-primary w-full py-2.5 text-xs">
          <Plus className="w-4 h-4" /> إضافة الدرس
        </button>
      </form>

      {/* قائمة الدروس */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-500 px-1">الدروس الحالية ({lessons.length}):</div>
        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">جاري جلب الدروس...</div>
        ) : lessons.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-8 bg-white rounded-2xl border border-dashed border-slate-200">
            لا توجد دروس بعد لـ {LEVELS[level].short}. أضف أول درس أعلاه!
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

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);

    for (let k = 0; k < list.length; k++) {
      setUploading(`جاري ضغط ورفع الصورة ${k + 1} من ${list.length}...`);
      try {
        const compressed = await imageCompression(list[k], {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1800,
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
        alert("فشل رفع الصورة: " + e.message);
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      <div className="flex items-center gap-2.5 p-3">
        {editing ? (
          <>
            <input className="input w-12 text-center text-xs font-bold !py-1.5" value={n} onChange={(e) => setN(e.target.value)} />
            <input className="input flex-1 text-xs !py-1.5" value={t} onChange={(e) => setT(e.target.value)} />
            <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"><X className="w-4 h-4" /></button>
          </>
        ) : (
          <>
            <button onClick={onToggle} className="flex-1 flex items-center gap-2.5 text-right">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                {lesson.number}
              </span>
              <span className="font-bold text-xs text-slate-800 flex-1 truncate">
                {lesson.title}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                {lesson.images?.length || 0} صور
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {open && !editing && (
        <div className="border-t border-slate-100 p-3 space-y-3 bg-slate-50/50">
          
          {/* معرض الصور الحالي للدرس */}
          <div className="grid grid-cols-3 gap-2">
            {lesson.images?.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 left-1 w-6 h-6 rounded-lg bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 shadow-sm"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* زر رفع صور جديدة */}
          <label className={`btn-primary w-full py-2.5 text-xs cursor-pointer ${uploading ? "opacity-70 pointer-events-none" : ""}`}>
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {uploading}</>
            ) : (
              <><Upload className="w-4 h-4" /> رفع صور للدرس (صورة، 2 أو أكثر)</>
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

          {/* روابط سريعة */}
          <div className="flex justify-between items-center text-[11px] pt-1">
            <a
              href={`/lesson/${lesson.id}`}
              target="_blank"
              className="flex items-center gap-1 text-slate-600 hover:text-emerald-600 font-bold"
            >
              <ExternalLink className="w-3 h-3" /> معاينة كما يراها التلميذ
            </a>
            <button
              onClick={removeLesson}
              className="flex items-center gap-1 text-red-600 hover:underline"
            >
              <Trash2 className="w-3 h-3" /> حذف الدرس بالكامل
            </button>
          </div>

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
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
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
  gap: 0.4rem;
  background: #059669;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.65rem;
  border-radius: 0.75rem;
  transition: all 0.15s;
}
.btn-primary:active {
  transform: scale(0.98);
}
`;
