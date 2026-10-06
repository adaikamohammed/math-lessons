"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, X, Maximize2, ChevronRight, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { LEVELS, type Lesson, type LessonImage } from "@/lib/types";
import { BackHeader, Loading, Empty } from "@/components/ui";

export function LessonView({ id }: { id: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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

  const images = lesson?.images || [];
  const activeImage: LessonImage | null =
    selectedIndex !== null && images[selectedIndex] ? images[selectedIndex] : null;

  const nextImage = useCallback(() => {
    if (selectedIndex === null) return;
    if (selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, images.length]);

  const prevImage = useCallback(() => {
    if (selectedIndex === null) return;
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex]);

  // دعم أزرار الكيبورد
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowRight") prevImage();
      if (e.key === "ArrowLeft") nextImage();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, nextImage, prevImage]);

  const fileName = (i: number) =>
    `درس-${lesson?.number ?? ""}-صورة-${i + 1}.jpg`;

  return (
    <div className="pb-10">
      <BackHeader
        href={lesson ? `/year/${lesson.level}` : "/"}
        title={lesson ? `الدرس ${lesson.number}: ${lesson.title}` : "جاري التحميل..."}
        subtitle={
          lesson
            ? `${LEVELS[lesson.level].label} • ${images.length} ${
                images.length === 1 ? "صورة" : "صور"
              }`
            : undefined
        }
      />

      {loading ? (
        <Loading />
      ) : !lesson ? (
        <Empty text="الدرس غير موجود" />
      ) : images.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 mt-3 p-6">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">لا توجد صور لهذا الدرس حالياً</h3>
          <p className="text-xs text-slate-400 mt-1">
            سيقوم الأستاذ برفع صور السبورة والملخصات قريباً.
          </p>
        </div>
      ) : (
        <div className="space-y-5 mt-3">
          {images.map((img, i) => (
            <figure
              key={img.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden fade-up"
            >
              {/* شريط رقم الصورة */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                    {i + 1}
                  </span>
                  <span>الصورة رقم {i + 1} من {images.length}</span>
                </span>
                <span className="text-[11px] text-slate-400">اضغط على الصورة للتكبير</span>
              </div>

              {/* معاينة الصورة */}
              <button
                onClick={() => setSelectedIndex(i)}
                className="block w-full text-center bg-slate-900/5 relative group cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`صورة السبورة رقم ${i + 1}`}
                  loading="lazy"
                  className="w-full h-auto max-h-[550px] object-contain mx-auto transition-transform group-hover:scale-[1.01]"
                />
              </button>

              {/* أزرار الإجراءات السريعة */}
              <div className="flex gap-2 p-3 border-t border-slate-100 bg-white">
                <button
                  onClick={() => setSelectedIndex(i)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold active:scale-95 transition"
                >
                  <Maximize2 className="w-4 h-4 text-emerald-600" />
                  <span>فتح مكبر بملء الشاشة</span>
                </button>
                <a
                  href={img.downloadUrl || img.url}
                  download={fileName(i)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-95 transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الصورة على الهاتف</span>
                </a>
              </div>
            </figure>
          ))}
        </div>
      )}

      {/* نافذة التكبير بملء الشاشة (Fullscreen Viewer Modal) */}
      {activeImage && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col select-none"
          onClick={() => setSelectedIndex(null)}
        >
          {/* الشريط العلوي للشاشة الكاملة */}
          <div
            className="flex justify-between items-center p-3.5 bg-black/60 backdrop-blur-sm z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg">
                صورة {selectedIndex + 1} من {images.length}
              </span>
              <a
                href={activeImage.downloadUrl || activeImage.url}
                download={fileName(selectedIndex)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" /> تحميل الصورة
              </a>
            </div>

            <button
              onClick={() => setSelectedIndex(null)}
              className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* الصورة في الوسط مع أزرار التنقل */}
          <div className="flex-1 relative overflow-auto flex items-center justify-center p-2">
            {/* زر الصورة السابقة */}
            {images.length > 1 && (
              <button
                disabled={selectedIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className={`absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition ${
                  selectedIndex === 0 ? "opacity-20 cursor-not-allowed" : "hover:bg-black/90 active:scale-95"
                }`}
                title="الصورة السابقة"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* الصورة نفسها */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.url}
              alt=""
              className="max-w-full max-h-full object-contain cursor-default"
              onClick={(e) => e.stopPropagation()}
            />

            {/* زر الصورة التالية */}
            {images.length > 1 && (
              <button
                disabled={selectedIndex === images.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className={`absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition ${
                  selectedIndex === images.length - 1 ? "opacity-20 cursor-not-allowed" : "hover:bg-black/90 active:scale-95"
                }`}
                title="الصورة التالية"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
