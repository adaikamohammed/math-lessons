"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Image as ImageIcon } from "lucide-react";
import { LEVELS, type Lesson } from "@/lib/types";
import { BackHeader, Loading, Empty } from "@/components/ui";

export function YearLessons({ level }: { level: 1 | 2 }) {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/lessons?level=${level}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.lessons) {
          setLessons(data.lessons);
        } else {
          setError("تعذر تحميل الدروس");
        }
      })
      .catch(() => setError("تعذر الاتصال بالخادم"));
  }, [level]);

  return (
    <div>
      <BackHeader href="/" title={LEVELS[level].label} subtitle="اختر الدرس" />

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {!lessons ? (
        <Loading />
      ) : lessons.length === 0 ? (
        <Empty text="لم تُضف دروس بعد لهذه السنة" />
      ) : (
        <ul className="space-y-3 mt-2">
          {lessons.map((l, i) => {
            const count = l.images?.length || 0;
            return (
              <li key={l.id} className="fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                <Link
                  href={`/lesson/${l.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm active:scale-[0.98] transition"
                >
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-sm">
                    {l.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-400">الدرس {l.number}</div>
                    <div className="font-bold text-sm leading-snug truncate">{l.title}</div>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{count}</span>
                  </span>
                  <ChevronLeft className="w-5 h-5 text-slate-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
