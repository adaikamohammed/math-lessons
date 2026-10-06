"use client";

import { useCallback, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import type { Session } from "@supabase/supabase-js";
import { Plus, Trash2, Upload, LogOut, ChevronDown, Loader2, Pencil, Check, X, ExternalLink } from "lucide-react";
import { supabase, isConfigured, BUCKET, imageUrl, LEVELS, type Lesson, type LessonImage } from "@/lib/supabase";

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured)
    return <p className="pt-10 text-center text-red-600">⚠️ لم يتم ضبط مفاتيح Supabase في ملف ‎.env.local</p>;
  if (!ready) return null;
  return session ? <Dashboard /> : <Login />;
}

/* ---------------- تسجيل الدخول ---------------- */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr("البريد أو كلمة المرور غير صحيحة");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="pt-16 space-y-4 fade-up">
      <h1 className="text-2xl font-extrabold text-center">لوحة الأستاذ</h1>
      <input className="input" type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
      <input className="input" type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={busy} className="btn-primary w-full">{busy ? "..." : "دخول"}</button>
      <style>{inputCss}</style>
    </form>
  );
}

/* ---------------- لوحة التحكم ---------------- */
function Dashboard() {
  const [level, setLevel] = useState<1 | 2>(1);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("lessons").select("*").eq("level", level).order("number");
    setLessons((data as Lesson[]) ?? []);
  }, [level]);

  useEffect(() => {
    load();
  }, [load]);

  const nextNumber = lessons.length ? Math.max(...lessons.map((l) => l.number)) + 1 : 1;

  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const { data, error } = await supabase
      .from("lessons")
      .insert({ level, title: title.trim(), number: Number(number) || nextNumber })
      .select()
      .single();
    if (error) return alert("خطأ: " + error.message);
    setTitle("");
    setNumber("");
    await load();
    setOpenId((data as Lesson).id);
  };

  return (
    <div className="pt-6 space-y-5 fade-up">
      <style>{inputCss}</style>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">لوحة الأستاذ</h1>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-sm text-slate-500">
          <LogOut className="w-4 h-4" /> خروج
        </button>
      </div>

      {/* اختيار السنة */}
      <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-2xl border border-slate-100">
        {([1, 2] as const).map((lv) => (
          <button
            key={lv}
            onClick={() => { setLevel(lv); setOpenId(null); }}
            className={`py-2.5 rounded-xl text-sm font-bold transition ${level === lv ? "bg-emerald-600 text-white" : "text-slate-600"}`}
          >
            {LEVELS[lv].label}
          </button>
        ))}
      </div>

      {/* إضافة درس */}
      <form onSubmit={addLesson} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
        <div className="text-sm font-bold">إضافة درس جديد</div>
        <div className="flex gap-2">
          <input className="input w-20 text-center" inputMode="numeric" placeholder={String(nextNumber)} value={number} onChange={(e) => setNumber(e.target.value)} />
          <input className="input flex-1" placeholder="مثال: قراءة وكتابة عدد طبيعي" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <button className="btn-primary w-full"><Plus className="w-4 h-4" /> إضافة الدرس</button>
      </form>

      {/* قائمة الدروس */}
      <div className="space-y-3">
        {lessons.map((l) => (
          <LessonAdmin key={l.id} lesson={l} open={openId === l.id} onToggle={() => setOpenId(openId === l.id ? null : l.id)} onChanged={load} />
        ))}
        {lessons.length === 0 && <p className="text-center text-sm text-slate-400 py-6">لا توجد دروس بعد لهذه السنة</p>}
      </div>
    </div>
  );
}

/* ---------------- درس واحد ---------------- */
function LessonAdmin({ lesson, open, onToggle, onChanged }: { lesson: Lesson; open: boolean; onToggle: () => void; onChanged: () => void }) {
  const [images, setImages] = useState<LessonImage[]>([]);
  const [uploading, setUploading] = useState("");
  const [editing, setEditing] = useState(false);
  const [t, setT] = useState(lesson.title);
  const [n, setN] = useState(String(lesson.number));

  const loadImages = useCallback(async () => {
    const { data } = await supabase.from("lesson_images").select("*").eq("lesson_id", lesson.id).order("position");
    setImages((data as LessonImage[]) ?? []);
  }, [lesson.id]);

  useEffect(() => {
    if (open) loadImages();
  }, [open, loadImages]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    let pos = images.length ? Math.max(...images.map((i) => i.position)) + 1 : 0;
    const list = Array.from(files);
    for (let k = 0; k < list.length; k++) {
      setUploading(`جاري رفع ${k + 1} / ${list.length} ...`);
      try {
        const compressed = await imageCompression(list[k], { maxSizeMB: 0.6, maxWidthOrHeight: 1800, useWebWorker: true, fileType: "image/jpeg" });
        const path = `${lesson.level}/${lesson.id}/${Date.now()}-${k}.jpg`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, compressed, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("lesson_images").insert({ lesson_id: lesson.id, path, position: pos++ });
        if (dbErr) throw dbErr;
      } catch (e) {
        alert("فشل رفع صورة: " + (e as Error).message);
      }
    }
    setUploading("");
    loadImages();
  };

  const removeImage = async (img: LessonImage) => {
    if (!confirm("حذف هذه الصورة؟")) return;
    await supabase.storage.from(BUCKET).remove([img.path]);
    await supabase.from("lesson_images").delete().eq("id", img.id);
    loadImages();
  };

  const removeLesson = async () => {
    if (!confirm(`حذف الدرس "${lesson.title}" وكل صوره؟`)) return;
    const { data } = await supabase.from("lesson_images").select("path").eq("lesson_id", lesson.id);
    const paths = (data ?? []).map((d: { path: string }) => d.path);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from("lessons").delete().eq("id", lesson.id);
    onChanged();
  };

  const save = async () => {
    await supabase.from("lessons").update({ title: t.trim(), number: Number(n) || lesson.number }).eq("id", lesson.id);
    setEditing(false);
    onChanged();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {editing ? (
          <>
            <input className="input w-14 text-center !py-2" value={n} onChange={(e) => setN(e.target.value)} />
            <input className="input flex-1 !py-2" value={t} onChange={(e) => setT(e.target.value)} />
            <button onClick={save} className="p-2 text-emerald-600"><Check className="w-5 h-5" /></button>
            <button onClick={() => setEditing(false)} className="p-2 text-slate-400"><X className="w-5 h-5" /></button>
          </>
        ) : (
          <>
            <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-right">
              <span className="w-9 h-9 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-sm">{lesson.number}</span>
              <span className="font-bold text-sm flex-1">{lesson.title}</span>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
            </button>
            <button onClick={() => setEditing(true)} className="p-2 text-slate-400"><Pencil className="w-4 h-4" /></button>
          </>
        )}
      </div>

      {open && !editing && (
        <div className="border-t border-slate-100 p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(img.path)} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(img)} className="absolute top-1 left-1 w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <label className={`btn-primary w-full cursor-pointer ${uploading ? "opacity-70 pointer-events-none" : ""}`}>
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploading}</> : <><Upload className="w-4 h-4" /> رفع صور الدرس</>}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          </label>

          <div className="flex justify-between text-xs">
            <a href={`/lesson/${lesson.id}`} target="_blank" className="flex items-center gap-1 text-slate-500"><ExternalLink className="w-3.5 h-3.5" /> معاينة كما يراها التلميذ</a>
            <button onClick={removeLesson} className="flex items-center gap-1 text-red-600"><Trash2 className="w-3.5 h-3.5" /> حذف الدرس</button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCss = `
.input{background:#fff;border:1px solid #e2e8f0;border-radius:.75rem;padding:.7rem .9rem;font-size:.9rem;outline:none;width:100%}
.input:focus{border-color:#059669;box-shadow:0 0 0 3px rgba(5,150,105,.15)}
.btn-primary{display:flex;align-items:center;justify-content:center;gap:.5rem;background:#059669;color:#fff;font-weight:700;font-size:.9rem;padding:.75rem;border-radius:.75rem}
.btn-primary:active{transform:scale(.98)}
`;
