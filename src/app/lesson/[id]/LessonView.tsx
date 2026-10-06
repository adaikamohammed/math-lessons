"use client";

import { useEffect, useState } from "react";
import { Download, X, Maximize2 } from "lucide-react";
import { LEVELS, type Lesson, type LessonImage } from "@/lib/types";
import { BackHeader, Loading, Empty } from "@/components/ui";

export function LessonView({ id }: { id: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [open, setOpen] = useState<LessonImage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lessons/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.lesson) {
          setLesson(data.lesson);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const fileName = (i: number) => `درس-${lesson?.number ?? ""}-صورة-${i + 1}.jpg`;

  return (
    <div>
      <BackHeader
        href={lesson ? `/year/${lesson.level}` : "/"}
        title={lesson ? `الدرس ${lesson.number}: ${lesson.title}` : "جاري التحميل..."}
        subtitle={lesson ? LEVELS[lesson.level].label : undefined}
      />

      {loading ? (
        <Loading />
      ) : !lesson ? (
        <Empty text="الدرس غير موجود" />
      ) : lesson.images.length === 0 ? (
        <Empty text="لا توجد صور لهذا الدرس بعد" />
      ) : (
        <div className="space-y-4 mt-2">
          {lesson.images.map((img, i) => (
            <figure key={img.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden fade-up">
              <button onClick={() => setOpen(img)} className="block w-full text-center bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`صورة ${i + 1}`} loading="lazy" className="w-full h-auto max-h-[500px] object-contain mx-auto" />
              </button>
              <div className="flex gap-2 p-3 border-t border-slate-100 bg-white">
                <button
                  onClick={() => setOpen(img)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold active:scale-95 transition"
                >
                  <Maximize2 className="w-4 h-4" /> فتح مكبر
                </button>
                <a
                  href={img.downloadUrl || img.url}
                  download={fileName(i)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold active:scale-95 transition"
                >
                  <Download className="w-4 h-4" /> تحميل الصورة
                </a>
              </div>
            </figure>
          ))}
        </div>
      )}

      {/* Fullscreen Viewer Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setOpen(null)}>
          <div className="flex justify-between items-center p-3">
            <a
              href={open.downloadUrl || open.url}
              download={fileName(lesson?.images.indexOf(open) ?? 0)}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              <Download className="w-4 h-4" /> تحميل الصورة
            </a>
            <button className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center" aria-label="إغلاق">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.url} alt="" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
}
