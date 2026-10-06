"use client";

import { useEffect, useState } from "react";
import { Download, X, Maximize2 } from "lucide-react";
import { supabase, imageUrl, downloadUrl, LEVELS, type Lesson, type LessonImage } from "@/lib/supabase";
import { BackHeader, Loading, Empty } from "@/components/ui";

export function LessonView({ id }: { id: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [images, setImages] = useState<LessonImage[] | null>(null);
  const [open, setOpen] = useState<LessonImage | null>(null);

  useEffect(() => {
    supabase.from("lessons").select("*").eq("id", id).single().then(({ data }) => setLesson(data as Lesson));
    supabase
      .from("lesson_images")
      .select("*")
      .eq("lesson_id", id)
      .order("position", { ascending: true })
      .then(({ data }) => setImages((data as LessonImage[]) ?? []));
  }, [id]);

  const fileName = (i: number) => `درس-${lesson?.number ?? ""}-صورة-${i + 1}.jpg`;

  return (
    <div>
      <BackHeader
        href={lesson ? `/year/${lesson.level}` : "/"}
        title={lesson ? `الدرس ${lesson.number}: ${lesson.title}` : "..."}
        subtitle={lesson ? LEVELS[lesson.level].label : undefined}
      />

      {!images ? (
        <Loading />
      ) : images.length === 0 ? (
        <Empty text="لا توجد صور لهذا الدرس بعد" />
      ) : (
        <div className="space-y-5 mt-2">
          {images.map((img, i) => (
            <figure key={img.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden fade-up">
              <button onClick={() => setOpen(img)} className="block w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(img.path)} alt={`صورة ${i + 1}`} loading="lazy" className="w-full h-auto" />
              </button>
              <div className="flex gap-2 p-3 border-t border-slate-100">
                <button
                  onClick={() => setOpen(img)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold active:scale-95 transition"
                >
                  <Maximize2 className="w-4 h-4" /> فتح
                </button>
                <a
                  href={downloadUrl(img.path, fileName(i))}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold active:scale-95 transition"
                >
                  <Download className="w-4 h-4" /> تحميل
                </a>
              </div>
            </figure>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setOpen(null)}>
          <div className="flex justify-between p-3">
            <a
              href={downloadUrl(open.path, fileName(images?.indexOf(open) ?? 0))}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold"
            >
              <Download className="w-4 h-4" /> تحميل
            </a>
            <button className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center" aria-label="إغلاق">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(open.path)} alt="" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
}
